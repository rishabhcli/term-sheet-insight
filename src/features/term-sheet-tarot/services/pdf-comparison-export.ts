import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScenarioDefinition, DealSnapshot } from '../domain/types';
import { formatCurrency, formatPercent } from '../domain/formatting';

const COLORS = {
  primary: [194, 141, 50] as [number, number, number],
  dark: [24, 22, 20] as [number, number, number],
  muted: [120, 110, 100] as [number, number, number],
  bg: [250, 248, 244] as [number, number, number],
  danger: [180, 60, 50] as [number, number, number],
  warning: [200, 155, 60] as [number, number, number],
  positive: [60, 150, 80] as [number, number, number],
  divider: [220, 215, 208] as [number, number, number],
};

interface ComparisonSide {
  scenario: ScenarioDefinition;
  snapshot: DealSnapshot;
  activeClauseIds: string[];
  exitValue: number;
}

export function exportComparisonPDF(dealA: ComparisonSide, dealB: ComparisonSide) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const colW = (contentW - 8) / 2;
  let y = margin;

  // === HEADER ===
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Term Sheet Comparison', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dealA.scenario.name} vs ${dealB.scenario.name}`, margin, 22);

  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin, 28
  );
  doc.text('Term Sheet Tarot · For educational purposes only', pageW - margin, 28, { align: 'right' });

  y = 38;

  // === DEAL OVERVIEW — side by side ===
  const leftX = margin;
  const rightX = margin + colW + 8;

  function drawSectionTitle(title: string, x: number, yPos: number) {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x, yPos);
  }

  function drawDealLabel(label: string, x: number, yPos: number, w: number) {
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(x, yPos - 4, w, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + w / 2, yPos, { align: 'center' });
  }

  // Deal labels
  drawDealLabel(`Deal A: ${dealA.scenario.name}`, leftX, y, colW);
  drawDealLabel(`Deal B: ${dealB.scenario.name}`, rightX, y, colW);
  y += 8;

  // Overview tables side by side
  function makeOverviewData(side: ComparisonSide) {
    return [
      ['Round', side.scenario.roundLabel],
      ['Pre-Money', formatCurrency(side.scenario.preMoneyValuation)],
      ['Investment', formatCurrency(side.scenario.investmentAmount)],
      ['Post-Money', formatCurrency(side.scenario.preMoneyValuation + side.scenario.investmentAmount)],
      ['Exit Modeled', formatCurrency(side.exitValue)],
      ['Clauses', side.activeClauseIds.length > 0 ? `${side.activeClauseIds.length} applied` : 'None'],
    ];
  }

  autoTable(doc, {
    startY: y,
    body: makeOverviewData(dealA),
    theme: 'plain',
    margin: { left: leftX, right: pageW - leftX - colW },
    tableWidth: colW,
    styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 }, textColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28, textColor: COLORS.muted },
    },
  });
  const overviewEndA = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    body: makeOverviewData(dealB),
    theme: 'plain',
    margin: { left: rightX, right: margin },
    tableWidth: colW,
    styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 }, textColor: COLORS.dark },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28, textColor: COLORS.muted },
    },
  });
  const overviewEndB = (doc as any).lastAutoTable.finalY;

  y = Math.max(overviewEndA, overviewEndB) + 6;

  // === FOUNDER METRICS COMPARISON ===
  drawSectionTitle('Founder Metrics Comparison', margin, y);
  y += 4;

  const founderA = dealA.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const founderB = dealB.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const payoutA = dealA.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');
  const payoutB = dealB.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');

  function deltaStr(a: number, b: number, fmt: (n: number) => string): string {
    const diff = b - a;
    if (Math.abs(diff) < 0.01) return '—';
    return `${diff > 0 ? '+' : '-'}${fmt(Math.abs(diff))}`;
  }

  function deltaColor(a: number, b: number): [number, number, number] {
    const diff = b - a;
    if (Math.abs(diff) < 0.01) return COLORS.muted;
    return diff > 0 ? COLORS.positive : COLORS.danger;
  }

  const metricsHead = [['Metric', 'Deal A', 'Deal B', 'Delta']];
  const ownershipA = founderA?.percentage ?? 0;
  const ownershipB = founderB?.percentage ?? 0;
  const payA = payoutA?.payout ?? 0;
  const payB = payoutB?.payout ?? 0;
  const ctrlA = dealA.snapshot.control.controlStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const ctrlB = dealB.snapshot.control.controlStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const metricsBody = [
    ['Ownership', formatPercent(ownershipA), formatPercent(ownershipB), deltaStr(ownershipA, ownershipB, formatPercent)],
    ['Payout', formatCurrency(payA), formatCurrency(payB), deltaStr(payA, payB, formatCurrency)],
    ['Control', ctrlA, ctrlB, ctrlA === ctrlB ? '—' : 'Differs'],
  ];

  autoTable(doc, {
    startY: y,
    head: metricsHead,
    body: metricsBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const rowIdx = data.row.index;
        if (rowIdx === 0) data.cell.styles.textColor = deltaColor(ownershipA, ownershipB);
        if (rowIdx === 1) data.cell.styles.textColor = deltaColor(payA, payB);
        if (rowIdx === 2 && ctrlA !== ctrlB) data.cell.styles.textColor = COLORS.warning;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // === CAP TABLE side by side ===
  if (y > pageH - 50) { doc.addPage(); y = margin; }

  drawSectionTitle('Cap Table', leftX, y);
  doc.text('Cap Table', rightX, y);
  y += 4;

  const capHead = [['Shareholder', 'Ownership', 'Class']];

  function makeCapBody(snapshot: DealSnapshot) {
    return snapshot.ownership.holderPercentages.map(h => [
      h.label,
      formatPercent(h.percentage),
      h.classType.charAt(0).toUpperCase() + h.classType.slice(1),
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: capHead,
    body: makeCapBody(dealA.snapshot),
    margin: { left: leftX, right: pageW - leftX - colW },
    tableWidth: colW,
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: { 1: { halign: 'right' } },
  });
  const capEndA = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    head: capHead,
    body: makeCapBody(dealB.snapshot),
    margin: { left: rightX, right: margin },
    tableWidth: colW,
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: { 1: { halign: 'right' } },
  });
  const capEndB = (doc as any).lastAutoTable.finalY;

  y = Math.max(capEndA, capEndB) + 8;

  // === PAYOUT WATERFALL side by side ===
  if (y > pageH - 50) { doc.addPage(); y = margin; }

  drawSectionTitle(`Payout @ ${formatCurrency(dealA.exitValue)}`, leftX, y);
  drawSectionTitle(`Payout @ ${formatCurrency(dealB.exitValue)}`, rightX, y);
  y += 4;

  const waterfallHead = [['Holder', 'Payout', '% of Exit']];

  function makeWaterfallBody(snapshot: DealSnapshot) {
    return snapshot.waterfall.holderPayouts.map(h => [
      h.label,
      formatCurrency(h.payout),
      formatPercent(h.percentage),
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: waterfallHead,
    body: makeWaterfallBody(dealA.snapshot),
    margin: { left: leftX, right: pageW - leftX - colW },
    tableWidth: colW,
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'right' } },
  });
  const wfEndA = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    head: waterfallHead,
    body: makeWaterfallBody(dealB.snapshot),
    margin: { left: rightX, right: margin },
    tableWidth: colW,
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'right' } },
  });
  const wfEndB = (doc as any).lastAutoTable.finalY;

  y = Math.max(wfEndA, wfEndB) + 8;

  // === RISK SIGNALS ===
  if (dealA.snapshot.verdictChips.length > 0 || dealB.snapshot.verdictChips.length > 0) {
    if (y > pageH - 40) { doc.addPage(); y = margin; }

    drawSectionTitle('Risk Signals', leftX, y);
    doc.text('Risk Signals', rightX, y);
    y += 5;

    function drawChips(chips: DealSnapshot['verdictChips'], x: number, startY: number): number {
      let cy = startY;
      if (chips.length === 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.muted);
        doc.text('No risk signals', x + 2, cy);
        return cy + 5;
      }
      chips.forEach(chip => {
        const color = chip.severity === 'danger' ? COLORS.danger : chip.severity === 'warning' ? COLORS.warning : COLORS.muted;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        const icon = chip.severity === 'danger' ? '!' : chip.severity === 'warning' ? '~' : 'i';
        doc.text(`[${icon}] ${chip.label}`, x + 2, cy);
        cy += 5;
      });
      return cy;
    }

    const chipEndA = drawChips(dealA.snapshot.verdictChips, leftX, y);
    const chipEndB = drawChips(dealB.snapshot.verdictChips, rightX, y);
    y = Math.max(chipEndA, chipEndB) + 4;
  }

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    const footerY = pageH - 6;
    doc.text('This document is for educational & illustrative purposes only. Not legal or financial advice.', margin, footerY);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, footerY, { align: 'right' });
  }

  const filename = `comparison-${dealA.scenario.name.toLowerCase().replace(/\s+/g, '-')}-vs-${dealB.scenario.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
