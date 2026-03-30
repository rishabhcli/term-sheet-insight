import { describe, it, expect } from 'vitest';
import { computeOwnership } from '../domain/cap-table-engine';
import { computeWaterfall } from '../domain/waterfall-engine';
import { computeControl } from '../domain/control-engine';
import { applyClauseEffects } from '../domain/clause-effects';
import { buildSnapshot } from '../domain/snapshot-builder';
import { CLAUSE_CATALOG, getCanonicalScenario } from '../data/scenarios';
import type { DealTerms } from '../domain/types';

const scenario = getCanonicalScenario();
const cleanTerms = scenario.cleanTerms;

function getHolder(payouts: { holderId: string; payout: number }[], id: string) {
  return payouts.find(h => h.holderId === id);
}

function getOwnership(snapshot: ReturnType<typeof computeOwnership>, id: string) {
  return snapshot.holderPercentages.find(h => h.holderId === id);
}

describe('Baseline ownership (clean)', () => {
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, cleanTerms);

  it('founder ownership is 68%', () => {
    expect(getOwnership(ownership, 'founders')?.percentage).toBe(68);
  });

  it('investor ownership is 20%', () => {
    expect(getOwnership(ownership, 'investor')?.percentage).toBe(20);
  });

  it('pool ownership is 8%', () => {
    expect(getOwnership(ownership, 'pool')?.percentage).toBe(8);
  });

  it('advisor ownership is 4%', () => {
    expect(getOwnership(ownership, 'advisors')?.percentage).toBe(4);
  });

  it('post-money total is 12,500,000', () => {
    expect(ownership.postMoneySharesTotal).toBe(12500000);
  });

  it('price per share is 2.00', () => {
    expect(ownership.pricePerShare).toBe(2);
  });
});

describe('Hidden Pool ownership', () => {
  const hiddenPoolClause = CLAUSE_CATALOG.find(c => c.id === 'hidden-pool')!;
  const terms = applyClauseEffects(cleanTerms, [hiddenPoolClause]);
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, terms);

  it('additional pool shares ≈ 1,076,923.08', () => {
    expect(ownership.additionalPoolShares).toBeCloseTo(1076923.08, 0);
  });

  it('founder ownership ≈ 61.39%', () => {
    expect(getOwnership(ownership, 'founders')?.percentage).toBeCloseTo(61.39, 1);
  });

  it('pool ownership = 15%', () => {
    expect(getOwnership(ownership, 'pool')?.percentage).toBeCloseTo(15, 0);
  });

  it('investor ownership = 20%', () => {
    expect(getOwnership(ownership, 'investor')?.percentage).toBeCloseTo(20, 0);
  });
});

describe('Clean waterfall at $30M exit', () => {
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, cleanTerms);
  const waterfall = computeWaterfall(ownership, cleanTerms, scenario.investmentAmount, 30_000_000);

  it('investor payout = $6M', () => {
    expect(getHolder(waterfall.holderPayouts, 'investor')?.payout).toBe(6000000);
  });

  it('founder payout = $20.4M', () => {
    expect(getHolder(waterfall.holderPayouts, 'founders')?.payout).toBe(20400000);
  });

  it('pool payout = $2.4M', () => {
    expect(getHolder(waterfall.holderPayouts, 'pool')?.payout).toBe(2400000);
  });

  it('advisor payout = $1.2M', () => {
    expect(getHolder(waterfall.holderPayouts, 'advisors')?.payout).toBe(1200000);
  });

  it('payouts sum to exit value', () => {
    const total = waterfall.holderPayouts.reduce((s, h) => s + h.payout, 0);
    expect(total).toBeCloseTo(30000000, 0);
  });
});

describe('Double Dip waterfall at $30M exit', () => {
  const ddClause = CLAUSE_CATALOG.find(c => c.id === 'double-dip')!;
  const terms = applyClauseEffects(cleanTerms, [ddClause]);
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, terms);
  const waterfall = computeWaterfall(ownership, terms, scenario.investmentAmount, 30_000_000);

  it('investor payout = $14M', () => {
    expect(getHolder(waterfall.holderPayouts, 'investor')?.payout).toBeCloseTo(14000000, 0);
  });

  it('founder payout = $13.6M', () => {
    expect(getHolder(waterfall.holderPayouts, 'founders')?.payout).toBeCloseTo(13600000, 0);
  });

  it('pool payout = $1.6M', () => {
    expect(getHolder(waterfall.holderPayouts, 'pool')?.payout).toBeCloseTo(1600000, 0);
  });

  it('advisor payout = $0.8M', () => {
    expect(getHolder(waterfall.holderPayouts, 'advisors')?.payout).toBeCloseTo(800000, 0);
  });

  it('payouts sum to exit value', () => {
    const total = waterfall.holderPayouts.reduce((s, h) => s + h.payout, 0);
    expect(total).toBeCloseTo(30000000, 0);
  });
});

describe('Clean waterfall at $20M exit', () => {
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, cleanTerms);
  const waterfall = computeWaterfall(ownership, cleanTerms, scenario.investmentAmount, 20_000_000);

  it('investor payout = $5M', () => {
    expect(getHolder(waterfall.holderPayouts, 'investor')?.payout).toBe(5000000);
  });

  it('founder payout = $12.75M', () => {
    expect(getHolder(waterfall.holderPayouts, 'founders')?.payout).toBeCloseTo(12750000, 0);
  });
});

describe('Double Dip at $20M exit', () => {
  const ddClause = CLAUSE_CATALOG.find(c => c.id === 'double-dip')!;
  const terms = applyClauseEffects(cleanTerms, [ddClause]);
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, terms);
  const waterfall = computeWaterfall(ownership, terms, scenario.investmentAmount, 20_000_000);

  it('investor payout = $12M', () => {
    expect(getHolder(waterfall.holderPayouts, 'investor')?.payout).toBeCloseTo(12000000, 0);
  });

  it('founder payout = $6.8M', () => {
    expect(getHolder(waterfall.holderPayouts, 'founders')?.payout).toBeCloseTo(6800000, 0);
  });
});

describe('Crown Seat control', () => {
  const crownClause = CLAUSE_CATALOG.find(c => c.id === 'crown-seat')!;
  const terms = applyClauseEffects(cleanTerms, [crownClause]);
  const control = computeControl(terms);

  it('control status is shared', () => {
    expect(control.controlStatus).toBe('shared');
  });

  it('founder has no majority', () => {
    expect(control.founderHasMajority).toBe(false);
  });

  it('investor has veto rights', () => {
    expect(control.investorBlockingRights.length).toBeGreaterThan(0);
  });
});

describe('Clean control', () => {
  const control = computeControl(cleanTerms);

  it('control status is founder-led', () => {
    expect(control.controlStatus).toBe('founder-led');
  });

  it('founder has majority', () => {
    expect(control.founderHasMajority).toBe(true);
  });
});

describe('Hidden Pool + Double Dip at $30M', () => {
  const hpClause = CLAUSE_CATALOG.find(c => c.id === 'hidden-pool')!;
  const ddClause = CLAUSE_CATALOG.find(c => c.id === 'double-dip')!;
  const terms = applyClauseEffects(cleanTerms, [hpClause, ddClause]);
  const ownership = computeOwnership(scenario.baseShareholders, scenario.preMoneyValuation, scenario.investmentAmount, terms);
  const waterfall = computeWaterfall(ownership, terms, scenario.investmentAmount, 30_000_000);

  it('founder ownership ≈ 61.39%', () => {
    expect(getOwnership(ownership, 'founders')?.percentage).toBeCloseTo(61.39, 1);
  });

  it('investor payout = $14M', () => {
    expect(getHolder(waterfall.holderPayouts, 'investor')?.payout).toBeCloseTo(14000000, 0);
  });

  it('founder payout ≈ $12.28M', () => {
    expect(getHolder(waterfall.holderPayouts, 'founders')?.payout).toBeCloseTo(12280000, -4);
  });

  it('pool payout = $3M', () => {
    expect(getHolder(waterfall.holderPayouts, 'pool')?.payout).toBeCloseTo(3000000, -4);
  });

  it('payouts conserve', () => {
    const total = waterfall.holderPayouts.reduce((s, h) => s + h.payout, 0);
    expect(total).toBeCloseTo(30000000, 0);
  });
});
