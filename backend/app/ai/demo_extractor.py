"""Rule-based lab report extractor for local demos (LLM_PROVIDER=demo).

No AI and no network calls: it reads simple, text-based Certificates of Analysis such as
the one produced by scripts/generate_sample_coa.py:

    Laboratory: Meridian Analytical Laboratories
    Report Date: 2026-01-20
    HEAVY METALS  (ICP-MS)
    Lead (Pb)               0.04          ppm         NMT 0.50        PASS

Result rows are lines whose columns are separated by two or more spaces and that end in a
status (PASS / FAIL / CONFORMS ...). Section headings decide whether a row is an analyte
(potency / assay) or a contaminant (heavy metals, microbiology, pesticides, solvents ...).
"""

from __future__ import annotations

import re
from datetime import date
from typing import Optional

from app.schemas.extraction import Analyte, AnalyteStatus, ExtractionResult, Potency

_COLUMN_SPLIT = re.compile(r"\s{2,}")
_KEY_VALUE = re.compile(r"^(?P<key>[A-Za-z][A-Za-z /.]{1,30}?)\s*:\s*(?P<value>.+)$")

_STATUS = {
    "PASS": AnalyteStatus.PASS,
    "PASSED": AnalyteStatus.PASS,
    "CONFORMS": AnalyteStatus.PASS,
    "COMPLIES": AnalyteStatus.PASS,
    "MEETS": AnalyteStatus.PASS,
    "FAIL": AnalyteStatus.FAIL,
    "FAILED": AnalyteStatus.FAIL,
    "OOS": AnalyteStatus.FAIL,
    "DOES NOT CONFORM": AnalyteStatus.FAIL,
}

_CONTAMINANT_SECTIONS = ("METAL", "MICRO", "CONTAMIN", "PESTICIDE", "SOLVENT", "MYCOTOXIN", "ALLERGEN")
_ANALYTE_SECTIONS = ("POTENCY", "ASSAY", "NUTRI", "ACTIVE", "IDENTITY")

_LAB_KEYS = ("laboratory", "lab", "testing laboratory")
_REPORT_DATE_KEYS = ("report date", "date of report", "issued", "date issued")
_PRODUCT_KEYS = ("product", "sample name", "product name")
_LOT_KEYS = ("lot / batch", "lot/batch", "lot", "batch", "lot number", "batch number")


def _parse_date(value: str) -> Optional[date]:
    try:
        return date.fromisoformat(value.strip()[:10])
    except ValueError:
        return None


def _section_kind(line: str) -> Optional[str]:
    """Return 'analytes' / 'contaminants' if the line is a section heading, else None."""
    if _STATUS.get(line.split()[-1].upper()) is not None or ":" in line:
        return None
    letters = [c for c in line if c.isalpha()]
    if not letters or sum(c.isupper() for c in letters) / len(letters) < 0.8:
        return None
    upper = line.upper()
    if any(word in upper for word in _CONTAMINANT_SECTIONS):
        return "contaminants"
    if any(word in upper for word in _ANALYTE_SECTIONS):
        return "analytes"
    return None


def _parse_row(line: str) -> Optional[Analyte]:
    parts = [p.strip() for p in _COLUMN_SPLIT.split(line.strip()) if p.strip()]
    if len(parts) < 3:
        return None
    status = _STATUS.get(parts[-1].upper())
    if status is None or parts[0].lower() in ("analyte", "test", "parameter"):
        return None
    name, result, *middle = parts[:-1]
    unit = middle[0] if len(middle) >= 2 else None
    limit = middle[-1] if middle else None
    return Analyte(name=name, result=result, unit=unit, limit=limit, status=status)


def extract_demo(text: str) -> ExtractionResult:
    fields: dict[str, str] = {}
    analytes: list[Analyte] = []
    contaminants: list[Analyte] = []
    section = "analytes"

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        kind = _section_kind(line)
        if kind:
            section = kind
            continue

        row = _parse_row(line)
        if row:
            (contaminants if section == "contaminants" else analytes).append(row)
            continue

        match = _KEY_VALUE.match(line)
        if match:
            fields.setdefault(match.group("key").strip().lower(), match.group("value").strip())

    def pick(keys: tuple[str, ...]) -> Optional[str]:
        return next((fields[k] for k in keys if k in fields), None)

    report_date = pick(_REPORT_DATE_KEYS)
    methods = pick(("methods", "method", "test methods"))
    potency = None
    if analytes:
        first = analytes[0]
        potency = Potency(name=first.name, amount=first.result, unit=first.unit)

    found = bool(analytes or contaminants)
    return ExtractionResult(
        lab_name=pick(_LAB_KEYS),
        report_date=_parse_date(report_date) if report_date else None,
        product_or_sample_name=pick(_PRODUCT_KEYS),
        lot_or_batch_in_report=pick(_LOT_KEYS),
        potency=potency,
        analytes=analytes,
        contaminants=contaminants,
        methods=[m.strip() for m in methods.split(";") if m.strip()] if methods else [],
        notes=pick(("notes", "note", "remarks", "conclusion")),
        confidence=0.9 if found else 0.1,
    )
