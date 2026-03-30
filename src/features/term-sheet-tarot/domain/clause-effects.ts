import type { DealTerms, ClauseDefinition } from './types';

/**
 * Apply active clause effects on top of clean terms.
 * Returns a new DealTerms with effects merged.
 */
export function applyClauseEffects(
  cleanTerms: DealTerms,
  activeClauses: ClauseDefinition[]
): DealTerms {
  let terms: DealTerms = { ...cleanTerms, board: { ...cleanTerms.board }, vetoRights: [...cleanTerms.vetoRights] };

  for (const clause of activeClauses) {
    const e = clause.effects;
    if (e.liquidationPreferenceMultiple !== undefined) {
      terms.liquidationPreferenceMultiple = e.liquidationPreferenceMultiple;
    }
    if (e.participationMode !== undefined) {
      terms.participationMode = e.participationMode;
    }
    if (e.optionPoolTargetPostMoneyPct !== undefined) {
      terms.optionPoolTargetPostMoneyPct = e.optionPoolTargetPostMoneyPct;
    }
    if (e.optionPoolTiming !== undefined) {
      terms.optionPoolTiming = e.optionPoolTiming;
    }
    if (e.board !== undefined) {
      terms.board = { ...e.board };
    }
    if (e.vetoRights !== undefined) {
      terms.vetoRights = [...e.vetoRights];
    }
  }

  return terms;
}
