import type { DealTerms, ParticipationMode } from './types';

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m === Math.floor(m) ? `$${m}M` : `$${m.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  if (value === Math.floor(value)) return `${value}%`;
  return `${value.toFixed(2)}%`;
}

export function formatParticipation(mode: ParticipationMode): string {
  return mode === 'participating' ? 'Full participation' : 'Non-participating';
}

export function formatPoolTreatment(terms: DealTerms): string {
  if (terms.optionPoolTiming === 'none' || terms.optionPoolTargetPostMoneyPct === 0) {
    return 'No top-up';
  }
  return `${(terms.optionPoolTargetPostMoneyPct * 100).toFixed(0)}% pre-money top-up`;
}

export function formatBoard(terms: DealTerms): string {
  const parts = [`${terms.board.founderSeats}F`, `${terms.board.investorSeats}I`];
  if (terms.board.independentSeats > 0) parts.push(`${terms.board.independentSeats}Ind`);
  const vetoStr = terms.vetoRights.length > 0 ? ' + veto' : '';
  return parts.join(' / ') + vetoStr;
}

export function formatShareCount(shares: number): string {
  if (shares >= 1_000_000) {
    return `${(shares / 1_000_000).toFixed(2)}M`;
  }
  if (shares >= 1_000) {
    return `${(shares / 1_000).toFixed(0)}K`;
  }
  return shares.toFixed(0);
}
