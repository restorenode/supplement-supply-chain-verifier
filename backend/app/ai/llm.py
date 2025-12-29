from __future__ import annotations

import json
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.errors import raise_api_error
from app.schemas.extraction import ExtractionResult, ModelInfo


_PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "lab_report_extraction.txt"


def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def get_model_info() -> ModelInfo:
    if settings.llm_provider == "mock":
        return ModelInfo(model_name="mock", version="0")
    return ModelInfo(model_name=settings.llm_model or "openai-compatible", version="v1")


def extract_lab_report(text: str) -> ExtractionResult:
    provider = settings.llm_provider.lower()
    if provider == "mock":
        return ExtractionResult(
            lab_name=None,
            report_date=None,
            product_or_sample_name=None,
            lot_or_batch_in_report=None,
            potency=None,
            analytes=[],
            contaminants=[],
            methods=[],
            notes=None,
            confidence=0.1,
        )

    if provider != "openai":
        raise_api_error(400, "INVALID_LLM_PROVIDER", f"Unsupported LLM_PROVIDER '{settings.llm_provider}'")

    if not settings.llm_api_key or not settings.llm_base_url or not settings.llm_model:
        raise_api_error(400, "INVALID_LLM_CONFIG", "LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL are required")

    schema = ExtractionResult.model_json_schema()
    prompt = _load_prompt()

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": text},
        ],
        "response_format": {"type": "json_schema", "json_schema": {"name": "ExtractionResult", "schema": schema}},
        "temperature": 0,
    }

    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"

    with httpx.Client(timeout=60) as client:
        response = client.post(url, headers=headers, json=payload)
    if response.status_code >= 400:
        raise_api_error(502, "LLM_ERROR", "LLM request failed", response.text)

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return ExtractionResult.model_validate(parsed)
    except Exception as exc:
        raise_api_error(422, "LLM_RESPONSE_INVALID", "LLM response did not match schema", str(exc))
