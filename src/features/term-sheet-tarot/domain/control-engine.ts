import type { DealTerms, ControlSnapshot, ControlStatus } from './types';

export function computeControl(terms: DealTerms): ControlSnapshot {
  const { board, vetoRights } = terms;
  const totalSeats = board.founderSeats + board.investorSeats + board.independentSeats;
  const founderHasMajority = totalSeats > 0 && board.founderSeats > totalSeats / 2;
  const investorHasMajority = totalSeats > 0 && board.investorSeats > totalSeats / 2;

  let controlStatus: ControlStatus;
  let explanation: string;

  if (founderHasMajority && vetoRights.length === 0) {
    controlStatus = 'founder-led';
    explanation = 'Founders hold board majority with no investor veto rights.';
  } else if (investorHasMajority) {
    controlStatus = 'investor-leaning';
    explanation = 'Investor holds board majority.';
  } else {
    // Even split or investor has veto rights
    if (vetoRights.length > 0 || !founderHasMajority) {
      controlStatus = 'shared';
      explanation = vetoRights.length > 0
        ? `Board is split. Investor holds veto rights on: ${vetoRights.join(', ')}.`
        : 'Board is evenly split between founders and investors.';
    } else {
      controlStatus = 'founder-led';
      explanation = 'Founders hold board majority.';
    }
  }

  return {
    founderSeats: board.founderSeats,
    investorSeats: board.investorSeats,
    independentSeats: board.independentSeats,
    founderHasMajority,
    investorBlockingRights: vetoRights,
    controlStatus,
    explanation,
  };
}
