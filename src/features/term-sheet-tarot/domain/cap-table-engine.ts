import Big from 'big.js';
import type { BaseShareholder, DealTerms, OwnershipSnapshot, HolderPercentage } from './types';

export function computeOwnership(
  baseShareholders: BaseShareholder[],
  preMoneyValuation: number,
  investmentAmount: number,
  terms: DealTerms
): OwnershipSnapshot {
  const pmVal = new Big(preMoneyValuation);
  const invest = new Big(investmentAmount);

  // Find pool shareholder
  const poolHolder = baseShareholders.find(h => h.classType === 'pool');
  const existingPoolShares = poolHolder ? new Big(poolHolder.shares) : new Big(0);

  // Total pre-money shares before any top-up
  const totalPreMoneyShares = baseShareholders.reduce(
    (sum, h) => sum.plus(new Big(h.shares)),
    new Big(0)
  );

  let additionalPoolShares = new Big(0);
  let adjustedPreMoneyShares = totalPreMoneyShares;

  // Hidden Pool top-up calculation
  if (terms.optionPoolTiming === 'pre-money-top-up' && terms.optionPoolTargetPostMoneyPct > 0) {
    const t = new Big(terms.optionPoolTargetPostMoneyPct);
    const r = invest.div(pmVal);
    const S = totalPreMoneyShares;
    const E = existingPoolShares;

    // x = (t * (1 + r) * S - E) / (1 - t * (1 + r))
    const oneR = new Big(1).plus(r);
    const tOneR = t.times(oneR);
    const numerator = tOneR.times(S).minus(E);
    const denominator = new Big(1).minus(tOneR);

    if (denominator.gt(0) || denominator.lt(0)) {
      const x = numerator.div(denominator);
      additionalPoolShares = x.gt(0) ? x : new Big(0);
    }

    adjustedPreMoneyShares = totalPreMoneyShares.plus(additionalPoolShares);
  }

  // Price per share based on adjusted pre-money shares
  const pricePerShare = pmVal.div(adjustedPreMoneyShares);

  // Investor shares
  const investorShares = invest.div(pricePerShare);

  // Post-money total
  const postMoneyTotal = adjustedPreMoneyShares.plus(investorShares);

  // Build holder percentages
  const holderPercentages: HolderPercentage[] = baseShareholders.map(h => {
    let shares = new Big(h.shares);
    if (h.classType === 'pool') {
      shares = shares.plus(additionalPoolShares);
    }
    return {
      holderId: h.id,
      label: h.label,
      shares: parseFloat(shares.toFixed(2)),
      percentage: parseFloat(shares.div(postMoneyTotal).times(100).toFixed(2)),
      classType: h.classType,
    };
  });

  // Add investor
  holderPercentages.push({
    holderId: 'investor',
    label: 'Investor',
    shares: parseFloat(investorShares.toFixed(2)),
    percentage: parseFloat(investorShares.div(postMoneyTotal).times(100).toFixed(2)),
    classType: 'preferred',
  });

  return {
    postMoneySharesTotal: parseFloat(postMoneyTotal.toFixed(2)),
    pricePerShare: parseFloat(pricePerShare.toFixed(4)),
    investorShares: parseFloat(investorShares.toFixed(2)),
    additionalPoolShares: parseFloat(additionalPoolShares.toFixed(2)),
    holderPercentages,
  };
}
