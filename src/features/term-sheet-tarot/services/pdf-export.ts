import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScenarioDefinition, DealSnapshot } from '../domain/types';
import { formatCurrency, formatPercent } from '../domain/formatting';

// Brand colors (HSL from design tokens, converted to RGB)
const COLORS = {
  primary: [194, 141, 50] as [number, number, number],      // gold accent
  dark: [24, 22, 20] as [number, number, number],            // near-black
  muted: [120, 110, 100] as [number, number, number],        // warm gray
  bg: [250, 248, 244] as [number, number, number],           // warm off-white
  danger: [180, 60, 50] as [number, number, number],         // red
  warning: [200, 155, 60] as [number, number, number],       // amber
  divider: [220, 215, 208] as [number, number, number],
};

export function exportTermSheetPDF(
  scenario: ScenarioDefinition,
  cleanSnapshot: DealSnapshot,
  currentSnapshot: DealSnapshot,
  activeClauseIds: string[],
  exitValue: number
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // === HEADER ===
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Term Sheet Comparison', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${scenario.name} — ${scenario.roundLabel}`, margin, 24);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 31);
  doc.text('Term Sheet Tarot · For educational purposes only', pageW - margin, 31, { align: 'right' });

  y = 46;

  // === DEAL OVERVIEW ===
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Deal Overview', margin, y);
  y += 7;

  const overviewData = [
    ['Pre-Money Valuation', formatCurrency(scenario.preMoneyValuation)],
    ['Investment Amount', formatCurrency(scenario.investmentAmount)],
    ['Post-Money Valuation', formatCurrency(scenario.preMoneyValuation + scenario.investmentAmount)],
    ['Exit Value Modeled', formatCurrency(exitValue)],
    ['Clauses Active', activeClauseIds.length > 0 ? `${activeClauseIds.length} applied` : 'None (clean deal)'],
  ];

  autoTable(doc, {
    startY: y,
    body: overviewData,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 }, textColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: COLORS.muted },
      1: { cellWidth: contentW - 55 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // === TERM COMPARISON TABLE ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Term Comparison', margin, y);
  y += 3;

  const termTableHead = [['Term', 'Clean Offer', 'Proposed Offer', 'Status']];
  const termTableBody = currentSnapshot.termRows.map(row => [
    row.label,
    row.cleanValue,
    row.proposedValue,
    row.changed ? (row.severity === 'danger' ? '⚠ Changed' : '△ Modified') : '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: termTableHead,
    body: termTableBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 8.5, cellPadding: 3, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      3: { cellWidth: 28, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const row = currentSnapshot.termRows[data.row.index];
        if (row?.changed) {
          data.cell.styles.textColor = row.severity === 'danger' ? COLORS.danger : COLORS.warning;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // === OWNERSHIP TABLE ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cap Table (Post-Money)', margin, y);
  y += 3;

  const ownershipHead = [['Shareholder', 'Shares', 'Ownership %', 'Class']];
  const ownershipBody = currentSnapshot.ownership.holderPercentages.map(h => [
    h.label,
    h.shares.toLocaleString(),
    formatPercent(h.percentage),
    h.classType.charAt(0).toUpperCase() + h.classType.slice(1),
  ]);

  autoTable(doc, {
    startY: y,
    head: ownershipHead,
    body: ownershipBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 8.5, cellPadding: 3, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = margin;
  }

  // === PAYOUT WATERFALL ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Payout Waterfall @ ${formatCurrency(exitValue)} Exit`, margin, y);
  y += 3;

  const waterfallHead = [['Holder', 'Payout', '% of Exit']];
  const waterfallBody = currentSnapshot.waterfall.holderPayouts.map(h => [
    h.label,
    formatCurrency(h.payout),
    formatPercent(h.percentage),
  ]);

  autoTable(doc, {
    startY: y,
    head: waterfallHead,
    body: waterfallBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 8.5, cellPadding: 3, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Waterfall summary
  const wf = currentSnapshot.waterfall;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(`Distribution mode: ${wf.distributionMode} · Investor preference: ${formatCurrency(wf.investorPreferenceTake)} · Participation: ${formatCurrency(wf.investorParticipationTake)}`, margin, y);
  y += 8;

  // Check for new page
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  // === BOARD & CONTROL ===
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Board & Control', margin, y);
  y += 7;

  const ctrl = currentSnapshot.control;
  const controlData = [
    ['Board Composition', `${ctrl.founderSeats} Founder · ${ctrl.investorSeats} Investor · ${ctrl.independentSeats} Independent`],
    ['Control Status', ctrl.controlStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
    ['Investor Veto Rights', ctrl.investorBlockingRights.length > 0 ? ctrl.investorBlockingRights.join(', ') : 'None'],
    ['Founder Majority', ctrl.founderHasMajority ? 'Yes' : 'No'],
  ];

  autoTable(doc, {
    startY: y,
    body: controlData,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 }, textColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: COLORS.muted },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.muted);
  doc.text(ctrl.explanation, margin, y, { maxWidth: contentW });

  // === VERDICT CHIPS ===
  if (currentSnapshot.verdictChips.length > 0) {
    y += 12;
    if (y > 260) { doc.addPage(); y = margin; }

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Signals', margin, y);
    y += 7;

    currentSnapshot.verdictChips.forEach(chip => {
      const color = chip.severity === 'danger' ? COLORS.danger : chip.severity === 'warning' ? COLORS.warning : COLORS.muted;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      const icon = chip.severity === 'danger' ? '⚠' : chip.severity === 'warning' ? '△' : 'ℹ';
      doc.text(`${icon}  ${chip.label}`, margin + 2, y);
      y += 5;
    });
  }

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.text('This document is for educational & illustrative purposes only. Not legal or financial advice.', margin, footerY);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, footerY, { align: 'right' });
  }

  // Save
  const filename = `term-sheet-${scenario.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
