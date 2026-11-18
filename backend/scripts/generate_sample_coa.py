"""Generate a realistic *sample* Certificate of Analysis (COA) PDF for local demos.

The document is clearly marked as a sample: the lab, client and results are fictional.
Tables are rendered in a monospaced font so each row extracts as one line of text, which
is what the `demo` extractor (app/ai/demo_extractor.py) parses.

Usage (from the backend/ directory):
    python scripts/generate_sample_coa.py [output_path ...] [--batch-id TEST-2026-0001]

With no output path it writes the test fixture and the copy served by the frontend.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import fitz  # PyMuPDF

_REPO = Path(__file__).resolve().parents[2]
# Test fixture + a copy served by the frontend (Admin -> "Download the sample COA").
DEFAULT_OUTPUTS = [
    _REPO / "backend" / "tests" / "fixtures" / "sample_coa.pdf",
    _REPO / "frontend" / "public" / "samples" / "sample-coa.pdf",
]

PAGE_W, PAGE_H = 612, 792  # US Letter
MARGIN = 54
INK = (0.05, 0.10, 0.12)
INK2 = (0.26, 0.33, 0.35)
ACCENT = (0.04, 0.42, 0.40)
RED = (0.70, 0.15, 0.12)
RULE = (0.76, 0.80, 0.80)
BAND = (0.89, 0.94, 0.93)

# (section title, [(analyte, result, unit, specification, status), ...])
SECTIONS = [
    (
        "POTENCY / ASSAY  (HPLC-UV, ICP-OES)",
        [
            ("Magnesium (elemental)", "402", "mg/serving", "380 - 440", "PASS"),
            ("Glycine", "1.61", "g/serving", "1.45 - 1.80", "PASS"),
        ],
    ),
    (
        "HEAVY METALS  (ICP-MS, USP <2232>)",
        [
            ("Lead (Pb)", "0.04", "ppm", "NMT 0.50", "PASS"),
            ("Cadmium (Cd)", "<0.01", "ppm", "NMT 0.30", "PASS"),
            ("Arsenic (As)", "0.02", "ppm", "NMT 1.00", "PASS"),
            ("Mercury (Hg)", "<0.005", "ppm", "NMT 0.20", "PASS"),
        ],
    ),
    (
        "MICROBIOLOGY  (USP <2021>, <2022>)",
        [
            ("Total Aerobic Count", "<10", "CFU/g", "NMT 10,000", "PASS"),
            ("Yeast & Mold", "<10", "CFU/g", "NMT 1,000", "PASS"),
            ("E. coli", "Not detected", "per 10 g", "Absent", "PASS"),
            ("Salmonella", "Not detected", "per 25 g", "Absent", "PASS"),
        ],
    ),
]

# Monospaced column widths (characters). Every column is padded so cells are separated
# by at least two spaces in the extracted text.
COLS = [24, 14, 12, 16, 6]
HEADER = ("Analyte", "Result", "Unit", "Specification", "Status")


def _row(cells: tuple[str, ...]) -> str:
    return "".join(cell.ljust(width) for cell, width in zip(cells, COLS)).rstrip()


def build(output: Path, batch_id: str) -> Path:
    doc = fitz.open()
    page = doc.new_page(width=PAGE_W, height=PAGE_H)

    def text(x: float, y: float, value: str, size: float = 9.5, font: str = "helv", color=INK) -> None:
        page.insert_text((x, y), value, fontsize=size, fontname=font, color=color)

    def rule(y: float, color=RULE, width: float = 0.6) -> None:
        page.draw_line((MARGIN, y), (PAGE_W - MARGIN, y), color=color, width=width)

    # Letterhead
    page.draw_circle((MARGIN + 10, 64), 10, color=INK, width=1.2)
    page.draw_circle((MARGIN + 10, 64), 3, color=ACCENT, fill=ACCENT)
    text(MARGIN + 28, 62, "MERIDIAN ANALYTICAL LABORATORIES", 14, "hebo")
    text(MARGIN + 28, 76, "ISO/IEC 17025 accredited testing laboratory  |  Sample letterhead", 8.5, color=INK2)
    text(PAGE_W - MARGIN - 150, 62, "SAMPLE DOCUMENT", 10, "hebo", RED)
    text(PAGE_W - MARGIN - 150, 75, "For demonstration only", 8.5, color=RED)
    rule(90, INK, 1.2)

    # Title band
    page.draw_rect(fitz.Rect(MARGIN, 100, PAGE_W - MARGIN, 128), color=None, fill=BAND)
    text(MARGIN + 12, 119, "CERTIFICATE OF ANALYSIS", 15, "hebo", ACCENT)
    text(PAGE_W - MARGIN - 150, 119, "Report No. MA-55120", 10, "hebo")

    # Report details (each "Label: value" is one line so it extracts cleanly)
    left = [
        ("Laboratory", "Meridian Analytical Laboratories"),
        ("Client", "Northfield Nutrition Labs"),
        ("Product", "Magnesium Glycinate 400 mg"),
        ("Lot / Batch", batch_id),
    ]
    right = [
        ("Report Date", "2026-01-20"),
        ("Sample Received", "2026-01-14"),
        ("Sample Type", "Capsule, 120 count"),
        ("Serving Size", "2 capsules"),
    ]
    y = 150
    for (lk, lv), (rk, rv) in zip(left, right):
        text(MARGIN, y, f"{lk}: {lv}", 9.5)
        text(330, y, f"{rk}: {rv}", 9.5)
        y += 15
    y += 6
    rule(y)

    # Result tables
    y += 22
    for title, rows in SECTIONS:
        text(MARGIN, y, title, 10, "hebo", ACCENT)
        y += 15
        text(MARGIN, y, _row(HEADER), 9, "cobo", INK2)
        y += 4
        rule(y)
        y += 12
        for row in rows:
            text(MARGIN, y, _row(row), 9, "cour")
            y += 14
        y += 12

    rule(y - 6)
    y += 12
    text(MARGIN, y, "CONCLUSION: PASS - the sample meets all listed specifications.", 10, "hebo", ACCENT)
    y += 20
    for line in [
        "Methods: HPLC-UV; ICP-OES; ICP-MS (USP <2232>); USP <2021> enumeration; USP <2022> pathogen screening",
        "Notes: NMT = not more than. Results relate only to the sample as received.",
    ]:
        # Wrap long lines without breaking the "Label:" prefix.
        words, current = line.split(" "), ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if fitz.get_text_length(candidate, fontname="helv", fontsize=8.5) > PAGE_W - 2 * MARGIN:
                text(MARGIN, y, current, 8.5, color=INK2)
                y += 12
                current = word
            else:
                current = candidate
        text(MARGIN, y, current, 8.5, color=INK2)
        y += 16

    # Sign-off
    y += 18
    page.draw_line((MARGIN, y), (MARGIN + 180, y), color=INK2, width=0.6)
    page.draw_line((330, y), (330 + 180, y), color=INK2, width=0.6)
    text(MARGIN, y + 12, "Reviewed by: QA Manager (sample)", 8.5, color=INK2)
    text(330, y + 12, "Approved: 2026-01-20", 8.5, color=INK2)

    # Footer disclaimer
    rule(PAGE_H - 52)
    text(
        MARGIN,
        PAGE_H - 38,
        "SAMPLE DOCUMENT - fictional laboratory and results, generated to demonstrate the Supplement",
        7.5,
        color=RED,
    )
    text(MARGIN, PAGE_H - 28, "Supply Chain Verification Protocol. This is not a real certificate of analysis.", 7.5, color=RED)

    doc.set_metadata(
        {
            "title": "Certificate of Analysis (SAMPLE)",
            "author": "Supplement Supply Chain Verification Protocol - sample generator",
            "subject": "Fictional COA for demos",
            "creator": "scripts/generate_sample_coa.py",
            "producer": "PyMuPDF",
            "creationDate": "D:20260120000000Z",
            "modDate": "D:20260120000000Z",
        }
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output, garbage=4, deflate=True, no_new_id=True)
    doc.close()
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("outputs", nargs="*", type=Path, help="Where to write the PDF (default: fixture + frontend copy)")
    parser.add_argument("--batch-id", default="TEST-2026-0001", help="Lot / batch number printed on the COA")
    args = parser.parse_args()
    for output in args.outputs or DEFAULT_OUTPUTS:
        print(build(output, args.batch_id))


if __name__ == "__main__":
    main()
