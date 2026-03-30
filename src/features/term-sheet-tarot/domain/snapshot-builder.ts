import type { ScenarioDefinition, ClauseDefinition, DealSnapshot, DealTerms, TermRowData } from './types';
import { applyClauseEffects } from './clause-effects';
import { computeOwnership } from './cap-table-engine';
import { computeWaterfall } from './waterfall-engine';
import { computeControl } from './control-engine';
import { computeVerdicts } from './verdict-engine';
import { formatCurrency, formatPercent, formatParticipation, formatPoolTreatment, formatBoard } from './formatting';

export function buildSnapshot(
  scenario: ScenarioDefinition,
  activeClauseIds: string[],
  clauseCatalog: ClauseDefinition[],
  exitValue: number
): DealSnapshot {
  const activeClauses = clauseCatalog.filter(c => activeClauseIds.includes(c.id));
  const proposedTerms = applyClauseEffects(scenario.cleanTerms, activeClauses);
  const cleanTerms = scenario.cleanTerms;

  const ownership = computeOwnership(
    scenario.baseShareholders,
    scenario.preMoneyValuation,
    scenario.investmentAmount,
    proposedTerms
  );

  const waterfall = computeWaterfall(
    ownership,
    proposedTerms,
    scenario.investmentAmount,
    exitValue
  );

  const control = computeControl(proposedTerms);
  const verdictChips = computeVerdicts(cleanTerms, proposedTerms, ownership, control);
  const termRows = buildTermRows(scenario, cleanTerms, proposedTerms);

  return {
    scenarioId: scenario.id,
    activeClauseIds,
    terms: proposedTerms,
    ownership,
    waterfall,
    control,
    verdictChips,
    termRows,
    dirtyLevel: activeClauseIds.length,
    generatedAt: Date.now(),
  };
}

function buildTermRows(
  scenario: ScenarioDefinition,
  clean: DealTerms,
  proposed: DealTerms
): TermRowData[] {
  const rows: TermRowData[] = [];

  rows.push({
    label: 'Pre-money valuation',
    cleanValue: formatCurrency(scenario.preMoneyValuation),
    proposedValue: formatCurrency(scenario.preMoneyValuation),
    changed: false,
    severity: 'neutral',
  });

  rows.push({
    label: 'New investment',
    cleanValue: formatCurrency(scenario.investmentAmount),
    proposedValue: formatCurrency(scenario.investmentAmount),
    changed: false,
    severity: 'neutral',
  });

  const lpChanged = clean.liquidationPreferenceMultiple !== proposed.liquidationPreferenceMultiple;
  rows.push({
    label: 'Liquidation preference',
    cleanValue: `${clean.liquidationPreferenceMultiple}x`,
    proposedValue: `${proposed.liquidationPreferenceMultiple}x`,
    changed: lpChanged,
    severity: lpChanged ? 'danger' : 'neutral',
    category: 'economics',
  });

  const partChanged = clean.participationMode !== proposed.participationMode;
  rows.push({
    label: 'Participation',
    cleanValue: formatParticipation(clean.participationMode),
    proposedValue: formatParticipation(proposed.participationMode),
    changed: partChanged,
    severity: partChanged ? 'danger' : 'neutral',
    category: 'economics',
  });

  const poolChanged = clean.optionPoolTiming !== proposed.optionPoolTiming;
  rows.push({
    label: 'Option pool',
    cleanValue: formatPoolTreatment(clean),
    proposedValue: formatPoolTreatment(proposed),
    changed: poolChanged,
    severity: poolChanged ? 'warning' : 'neutral',
    category: 'dilution',
  });

  const boardChanged = clean.board.founderSeats !== proposed.board.founderSeats ||
    clean.board.investorSeats !== proposed.board.investorSeats ||
    clean.board.independentSeats !== proposed.board.independentSeats ||
    clean.vetoRights.length !== proposed.vetoRights.length;
  rows.push({
    label: 'Board / Control',
    cleanValue: formatBoard(clean),
    proposedValue: formatBoard(proposed),
    changed: boardChanged,
    severity: boardChanged ? 'danger' : 'neutral',
    category: 'control',
  });

  return rows;
}
