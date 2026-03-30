import Big from 'big.js';
import type { OwnershipSnapshot, DealTerms, WaterfallSnapshot, HolderPayout } from './types';

export function computeWaterfall(
  ownership: OwnershipSnapshot,
  terms: DealTerms,
  investmentAmount: number,
  exitValue: number
): WaterfallSnapshot {
  const exit = new Big(exitValue);
  const invest = new Big(investmentAmount);

  // Find investor in holder percentages
  const investorHolder = ownership.holderPercentages.find(h => h.holderId === 'investor');
  const investorPct = investorHolder ? new Big(investorHolder.percentage).div(100) : new Big(0);

  // Preference amount
  const preference = invest.times(new Big(terms.liquidationPreferenceMultiple));

  if (terms.participationMode === 'non-participating') {
    // Non-participating: investor gets max(preference, as-converted share)
    const asConverted = exit.times(investorPct);

    if (preference.gte(asConverted)) {
      // Preference wins
      const investorTake = Big.min(preference, exit); // can't take more than exit
      const remaining = exit.minus(investorTake);

      // Distribute remaining among non-investor holders
      const nonInvestorHolders = ownership.holderPercentages.filter(h => h.holderId !== 'investor');
      const totalNonInvestorPct = nonInvestorHolders.reduce((s, h) => s.plus(new Big(h.percentage)), new Big(0));

      const holderPayouts: HolderPayout[] = nonInvestorHolders.map(h => {
        const share = totalNonInvestorPct.gt(0)
          ? remaining.times(new Big(h.percentage).div(totalNonInvestorPct))
          : new Big(0);
        return {
          holderId: h.holderId,
          label: h.label,
          payout: parseFloat(Big.max(share, new Big(0)).toFixed(2)),
          percentage: exit.gt(0) ? parseFloat(Big.max(share, new Big(0)).div(exit).times(100).toFixed(2)) : 0,
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
      // Conversion wins - distribute pro rata to all
      const holderPayouts: HolderPayout[] = ownership.holderPercentages.map(h => {
        const share = exit.times(new Big(h.percentage).div(100));
        return {
          holderId: h.holderId,
          label: h.label,
          payout: parseFloat(share.toFixed(2)),
          percentage: parseFloat(new Big(h.percentage).toFixed(2)),
        };
      });

      const investorTotal = parseFloat(asConverted.toFixed(2));

      return {
        exitValue,
        investorPreferenceTake: 0,
        investorParticipationTake: 0,
        investorTotalPayout: investorTotal,
        holderPayouts,
        distributionMode: 'conversion',
      };
    }
  } else {
    // Participating preferred
    // Step 1: investor takes preference off the top
    const prefTake = Big.min(preference, exit);
    let remaining = exit.minus(prefTake);

    // Step 2: investor participates in remainder based on ownership %
    const participationTake = remaining.gt(0) ? remaining.times(investorPct) : new Big(0);
    const investorTotal = prefTake.plus(participationTake);

    // Cap investor total at exit value
    const cappedInvestorTotal = Big.min(investorTotal, exit);
    const actualParticipation = cappedInvestorTotal.minus(prefTake);

    // Remaining for non-investor holders
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
        payout: parseFloat(Big.max(share, new Big(0)).toFixed(2)),
        percentage: exit.gt(0) ? parseFloat(Big.max(share, new Big(0)).div(exit).times(100).toFixed(2)) : 0,
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
