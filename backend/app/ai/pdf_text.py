import re
from io import BytesIO

_INLINE_SPACE = re.compile(r"[ \t\u00a0]+")
_WIDE_GAP = re.compile(r"[ \t\u00a0]{2,}")


def _normalize_text(text: str) -> str:
    """Tidy extracted text while keeping its structure.

    Line breaks are kept, and runs of 2+ spaces are kept as a two-space column gap, so
    tabular lab results stay parseable (e.g. by the demo extractor) and readable for an LLM.
    """
    lines = []
    for raw in text.splitlines():
        gaps = _WIDE_GAP.split(raw)
        line = "  ".join(_INLINE_SPACE.sub(" ", part).strip() for part in gaps).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import fitz  # type: ignore

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        parts = [page.get_text("text") for page in doc]
        doc.close()
        return _normalize_text("\n".join(parts))
    except Exception:
        from pdfminer.high_level import extract_text

        text = extract_text(BytesIO(file_bytes))
        return _normalize_text(text)
