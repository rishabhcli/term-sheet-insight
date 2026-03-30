import Big from 'big.js';
import type { OwnershipSnapshot, DealTerms, WaterfallSnapshot, HolderPayout } from './types';

function bigMin(a: Big, b: Big): Big { return a.lt(b) ? a : b; }
function bigMax(a: Big, b: Big): Big { return a.gt(b) ? a : b; }

export function computeWaterfall(
  ownership: OwnershipSnapshot,
  terms: DealTerms,
  investmentAmount: number,
  exitValue: number
): WaterfallSnapshot {
  const exit = new Big(exitValue);
  const invest = new Big(investmentAmount);

  const investorHolder = ownership.holderPercentages.find(h => h.holderId === 'investor');
  const investorPct = investorHolder ? new Big(investorHolder.percentage).div(100) : new Big(0);
  const preference = invest.times(new Big(terms.liquidationPreferenceMultiple));

  if (terms.participationMode === 'non-participating') {
    const asConverted = exit.times(investorPct);

    if (preference.gte(asConverted)) {
      const investorTake = bigMin(preference, exit);
      const remaining = exit.minus(investorTake);
      const nonInvestorHolders = ownership.holderPercentages.filter(h => h.holderId !== 'investor');
      const totalNonInvestorPct = nonInvestorHolders.reduce((s, h) => s.plus(new Big(h.percentage)), new Big(0));

      const holderPayouts: HolderPayout[] = nonInvestorHolders.map(h => {
        const share = totalNonInvestorPct.gt(0)
          ? remaining.times(new Big(h.percentage).div(totalNonInvestorPct))
          : new Big(0);
        return {
          holderId: h.holderId,
          label: h.label,
          payout: parseFloat(bigMax(share, new Big(0)).toFixed(2)),
          percentage: exit.gt(0) ? parseFloat(bigMax(share, new Big(0)).div(exit).times(100).toFixed(2)) : 0,
        };
      });

      holderPayouts.push({
        holderId: 'investor',
        label: 'Investor',
        payout: parseFloat(investorTake.toFixed(2)),
        percentage: exit.gt(0) ? parseFloat(investorTake.div(exit).times(100).toFixed(2)) : 0,
      });

      return {
        exitValue,
        investorPreferenceTake: parseFloat(investorTake.toFixed(2)),
        investorParticipationTake: 0,
        investorTotalPayout: parseFloat(investorTake.toFixed(2)),
        holderPayouts,
        distributionMode: 'preference',
      };
    } else {
      const holderPayouts: HolderPayout[] = ownership.holderPercentages.map(h => {
        const share = exit.times(new Big(h.percentage).div(100));
        return {
          holderId: h.holderId,
          label: h.label,
          payout: parseFloat(share.toFixed(2)),
          percentage: parseFloat(new Big(h.percentage).toFixed(2)),
        };
      });

      return {
        exitValue,
        investorPreferenceTake: 0,
        investorParticipationTake: 0,
        investorTotalPayout: parseFloat(asConverted.toFixed(2)),
        holderPayouts,
        distributionMode: 'conversion',
      };
    }
  } else {
    // Participating preferred
    const prefTake = bigMin(preference, exit);
    const remaining = exit.minus(prefTake);
    const participationTake = remaining.gt(0) ? remaining.times(investorPct) : new Big(0);
    const investorTotal = prefTake.plus(participationTake);
    const cappedInvestorTotal = bigMin(investorTotal, exit);
    const actualParticipation = cappedInvestorTotal.minus(prefTake);

    const nonInvestorRemaining = exit.minus(cappedInvestorTotal);
    const nonInvestorHolders = ownership.holderPercentages.filter(h => h.holderId !== 'investor');
    const totalNonInvestorPct = nonInvestorHolders.reduce((s, h) => s.plus(new Big(h.percentage)), new Big(0));

    const holderPayouts: HolderPayout[] = nonInvestorHolders.map(h => {
      const share = totalNonInvestorPct.gt(0)
        ? nonInvestorRemaining.times(new Big(h.percentage).div(totalNonInvestorPct))
        : new Big(0);
      return {
        holderId: h.holderId,
        label: h.label,
        payout: parseFloat(bigMax(share, new Big(0)).toFixed(2)),
        percentage: exit.gt(0) ? parseFloat(bigMax(share, new Big(0)).div(exit).times(100).toFixed(2)) : 0,
      };
    });

    holderPayouts.push({
      holderId: 'investor',
      label: 'Investor',
      payout: parseFloat(cappedInvestorTotal.toFixed(2)),
      percentage: exit.gt(0) ? parseFloat(cappedInvestorTotal.div(exit).times(100).toFixed(2)) : 0,
    });

    return {
      exitValue,
      investorPreferenceTake: parseFloat(prefTake.toFixed(2)),
      investorParticipationTake: parseFloat(actualParticipation.toFixed(2)),
      investorTotalPayout: parseFloat(cappedInvestorTotal.toFixed(2)),
      holderPayouts,
      distributionMode: 'preference',
    };
  }
}
