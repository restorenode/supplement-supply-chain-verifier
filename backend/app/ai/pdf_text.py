import re
from io import BytesIO


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


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
