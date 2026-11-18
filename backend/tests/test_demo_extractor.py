from datetime import date
from pathlib import Path

import fitz

from app.ai.demo_extractor import extract_demo
from app.ai.pdf_text import extract_text_from_pdf
from app.chain.client import MockBatchHashRegistryClient
from app.chain.deps import get_chain_client
from app.core import config
from app.schemas.extraction import AnalyteStatus

FIXTURES = Path(__file__).parent / "fixtures"
HEADERS = {"X-API-Key": "test-key"}


def test_demo_extractor_reads_sample_coa():
    text = extract_text_from_pdf((FIXTURES / "sample_coa.pdf").read_bytes())
    result = extract_demo(text)

    assert result.lab_name == "Meridian Analytical Laboratories"
    assert result.report_date == date(2026, 1, 20)
    assert result.product_or_sample_name == "Magnesium Glycinate 400 mg"
    assert result.lot_or_batch_in_report == "TEST-2026-0001"
    assert [a.name for a in result.analytes] == ["Magnesium (elemental)", "Glycine"]
    assert len(result.contaminants) == 8
    lead = next(c for c in result.contaminants if c.name == "Lead (Pb)")
    assert (lead.result, lead.unit, lead.limit, lead.status) == ("0.04", "ppm", "NMT 0.50", AnalyteStatus.PASS)
    assert result.potency is not None and result.potency.amount == "402"
    assert "ICP-MS (USP <2232>)" in result.methods
    assert result.confidence == 0.9


def test_demo_extractor_handles_fail_rows_and_missing_units():
    text = "\n".join(
        [
            "Laboratory: Example Lab",
            "Report Date: not a date",
            "PESTICIDE SCREEN",
            "Analyte  Result  Specification  Status",
            "Chlorpyrifos  0.31 ppm  NMT 0.10  FAIL",
            "Glyphosate  ND  NMT 0.05  CONFORMS",
        ]
    )
    result = extract_demo(text)

    assert result.lab_name == "Example Lab"
    assert result.report_date is None
    assert result.analytes == []
    assert [(c.name, c.unit, c.limit, c.status) for c in result.contaminants] == [
        ("Chlorpyrifos", None, "NMT 0.10", AnalyteStatus.FAIL),
        ("Glyphosate", None, "NMT 0.05", AnalyteStatus.PASS),
    ]


def _one_line_pdf(text: str) -> bytes:
    doc = fitz.open()
    doc.new_page().insert_text((72, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def test_demo_extractor_returns_empty_result_for_unstructured_pdf():
    result = extract_demo(extract_text_from_pdf(_one_line_pdf("Sample Report")))
    assert result.analytes == [] and result.contaminants == []
    assert result.confidence == 0.1


def test_extract_endpoint_with_demo_provider(client):
    config.settings.llm_provider = "demo"
    batch = {
        "batchId": "TEST-2026-0001",
        "productName": "Magnesium Glycinate 400 mg",
        "supplementType": "Mineral",
        "manufacturer": "Northfield Nutrition Labs",
        "productionDate": "2026-01-12",
    }
    assert client.post("/batches", json=batch, headers=HEADERS).status_code == 201
    files = {"file": ("sample_coa.pdf", (FIXTURES / "sample_coa.pdf").read_bytes(), "application/pdf")}
    assert client.post("/batches/TEST-2026-0001/documents", files=files, headers=HEADERS).status_code == 201

    response = client.post("/batches/TEST-2026-0001/extract", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["modelInfo"] == {"modelName": "demo-parser", "version": "1"}
    assert len(data["extractedFields"]["analytes"]) == 2
    assert len(data["extractedFields"]["contaminants"]) == 8

    # A dated, populated extraction must hash, publish, and verify end to end.
    chain = MockBatchHashRegistryClient()
    client.app.dependency_overrides[get_chain_client] = lambda: chain
    attestation = client.get("/batches/TEST-2026-0001/attestation", headers=HEADERS).json()
    assert attestation["canonicalJson"]["extractedFields"]["reportDate"] == "2026-01-20"
    assert client.post("/batches/TEST-2026-0001/publish", headers=HEADERS).status_code == 200

    verify = client.get("/batches/TEST-2026-0001/verify").json()
    assert verify["status"] == "verified"
    assert verify["labReport"]["labName"] == "Meridian Analytical Laboratories"
    assert len(verify["labReport"]["analytes"]) == 2
