from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


PAGE_W, PAGE_H = letter
MARGIN = 36

BG = colors.HexColor("#f7f4ee")
PANEL = colors.white
PANEL_ALT = colors.HexColor("#fcfaf6")
INK = colors.HexColor("#1f1d1a")
MUTED = colors.HexColor("#6a6258")
ACCENT = colors.HexColor("#b8872a")
LINE = colors.HexColor("#ddd4c7")


TITLE = "Term Sheet Tarot"
SUBTITLE = "One-page repository summary"

WHAT_IT_IS = (
    "Clause-reveal simulator for startup financing. It lets founders see how "
    "specific deal terms change ownership, exit payouts, and board control immediately."
)

WHO_ITS_FOR = (
    "Primary persona: first-time founders evaluating a venture round. "
    "Also useful for mentors and coaches explaining deal mechanics."
)

FEATURES = [
    "Preset scenario library for seed, Series A, and Series B examples.",
    "Custom scenario builder for company, round, cap table, valuation, raise, and exit range.",
    "Clause cards for hidden pool, double dip, and crown seat terms.",
    "Real-time clean-vs-proposed term comparison with verdict chips.",
    "Exit slider with ownership, payout, and control views.",
    "Side-by-side scenario comparison with shareable compare URLs.",
    "Authenticated save/share workflow with cloud snapshots and PDF export.",
]

ARCHITECTURE = [
    "Frontend: Vite + React + React Router pages for simulator, compare, scenarios, build, share, and explainer views.",
    "State: Zustand store keeps the current scenario, active clause IDs, exit value, clean/current snapshots, and URL-param hydration.",
    "Core pipeline: buildSnapshot() applies clause effects, then computes ownership, waterfall, control, verdict chips, and term rows.",
    "Domain data: preset scenarios and clause definitions live in data/scenarios.ts; finance/control logic is covered by Vitest tests.",
    "Persistence: Supabase auth plus profiles, scenarios, scenario_snapshots, share_links, and event_logs tables accessed through a service layer.",
]

RUN_STEPS = [
    "1. Run `npm install`.",
    "2. Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.",
    "3. Start the app with `npm run dev` and open `http://localhost:8080`.",
]

RUN_NOTES = [
    "Example Supabase values: Not found in repo.",
    "README setup guide: Not found in repo.",
]


def wrap_text(text: str, font_name: str, font_size: int, max_width: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_panel(pdf: canvas.Canvas, x: float, y: float, w: float, h: float, fill_color) -> None:
    pdf.setFillColor(fill_color)
    pdf.setStrokeColor(LINE)
    pdf.roundRect(x, y, w, h, 12, stroke=1, fill=1)


def draw_heading(pdf: canvas.Canvas, text: str, x: float, y: float) -> None:
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(x, y, text.upper())


def draw_paragraph(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y_top: float,
    width: float,
    font_name: str = "Helvetica",
    font_size: int = 10,
    leading: int = 13,
    color=INK,
) -> float:
    pdf.setFillColor(color)
    pdf.setFont(font_name, font_size)
    y = y_top
    for line in wrap_text(text, font_name, font_size, width):
        pdf.drawString(x, y, line)
        y -= leading
    return y


def draw_bullets(
    pdf: canvas.Canvas,
    items: list[str],
    x: float,
    y_top: float,
    width: float,
    font_name: str = "Helvetica",
    font_size: int = 9,
    leading: int = 12,
) -> float:
    bullet_prefix = "- "
    bullet_w = stringWidth(bullet_prefix, font_name, font_size)
    text_w = width - bullet_w
    y = y_top
    pdf.setFont(font_name, font_size)
    pdf.setFillColor(INK)
    for item in items:
        lines = wrap_text(item, font_name, font_size, text_w)
        for idx, line in enumerate(lines):
            prefix = bullet_prefix if idx == 0 else "  "
            pdf.drawString(x, y, prefix + line)
            y -= leading
        y -= 2
    return y


def build_pdf(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output_path), pagesize=letter)
    pdf.setTitle("Term Sheet Tarot - App Summary")

    pdf.setFillColor(BG)
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    header_h = 62
    header_y = PAGE_H - MARGIN - header_h
    draw_panel(pdf, MARGIN, header_y, PAGE_W - (2 * MARGIN), header_h, PANEL_ALT)

    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(MARGIN + 18, header_y + 37, TITLE)
    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(MUTED)
    pdf.drawString(MARGIN + 18, header_y + 20, SUBTITLE)
    pdf.drawRightString(PAGE_W - MARGIN - 18, header_y + 20, "Based on repository evidence only")

    gap = 12
    full_w = PAGE_W - (2 * MARGIN)
    two_col_w = (full_w - gap) / 2
    row1_h = 100
    row2_h = 298
    row3_h = 150

    row1_y = header_y - gap - row1_h
    row2_y = row1_y - gap - row2_h
    row3_y = row2_y - gap - row3_h

    left_x = MARGIN
    right_x = MARGIN + two_col_w + gap

    draw_panel(pdf, left_x, row1_y, two_col_w, row1_h, PANEL)
    draw_panel(pdf, right_x, row1_y, two_col_w, row1_h, PANEL)
    draw_panel(pdf, left_x, row2_y, two_col_w, row2_h, PANEL)
    draw_panel(pdf, right_x, row2_y, two_col_w, row2_h, PANEL)
    draw_panel(pdf, MARGIN, row3_y, full_w, row3_h, PANEL)

    pad = 16

    draw_heading(pdf, "What it is", left_x + pad, row1_y + row1_h - 22)
    draw_paragraph(pdf, WHAT_IT_IS, left_x + pad, row1_y + row1_h - 40, two_col_w - (2 * pad))

    draw_heading(pdf, "Who it's for", right_x + pad, row1_y + row1_h - 22)
    draw_paragraph(pdf, WHO_ITS_FOR, right_x + pad, row1_y + row1_h - 40, two_col_w - (2 * pad))

    draw_heading(pdf, "What it does", left_x + pad, row2_y + row2_h - 22)
    draw_bullets(pdf, FEATURES, left_x + pad, row2_y + row2_h - 42, two_col_w - (2 * pad))

    draw_heading(pdf, "How it works", right_x + pad, row2_y + row2_h - 22)
    draw_bullets(pdf, ARCHITECTURE, right_x + pad, row2_y + row2_h - 42, two_col_w - (2 * pad))

    draw_heading(pdf, "How to run", MARGIN + pad, row3_y + row3_h - 22)
    run_end_y = draw_bullets(pdf, RUN_STEPS, MARGIN + pad, row3_y + row3_h - 42, full_w - (2 * pad), font_size=10, leading=13)

    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 9)
    note_y = run_end_y - 4
    for note in RUN_NOTES:
        pdf.drawString(MARGIN + pad, note_y, note)
        note_y -= 12

    pdf.setStrokeColor(ACCENT)
    pdf.setLineWidth(1)
    pdf.line(MARGIN, MARGIN - 2, PAGE_W - MARGIN, MARGIN - 2)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(MARGIN, MARGIN - 16, "Repo: term-sheet-insight")
    pdf.drawRightString(PAGE_W - MARGIN, MARGIN - 16, "Generated 2026-03-30")

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    build_pdf(Path("output/pdf/term-sheet-tarot-app-summary.pdf"))
