import type { ScenarioDefinition, ClauseDefinition } from '../domain/types';

export const CLAUSE_CATALOG: ClauseDefinition[] = [
  {
    id: 'hidden-pool',
    arcanaName: 'The Hidden Pool',
    subtitle: '15% pre-money option pool',
    category: 'dilution',
    descriptionShort: 'The pool is topped up before pricing, diluting existing holders before the investor enters.',
    effects: {
      optionPoolTargetPostMoneyPct: 0.15,
      optionPoolTiming: 'pre-money-top-up',
    },
    warningTemplates: ['Pre-money dilution', 'Founder ownership drops'],
    displayOrder: 1,
  },
  {
    id: 'double-dip',
    arcanaName: 'The Double Dip',
    subtitle: '2x participating preferred',
    category: 'economics',
    descriptionShort: 'Investor takes 2x their money off the top, then participates in remaining proceeds.',
    effects: {
      liquidationPreferenceMultiple: 2,
      participationMode: 'participating',
    },
    warningTemplates: ['Investor double-dips', 'Exit proceeds skewed'],
    displayOrder: 2,
  },
  {
    id: 'crown-seat',
    arcanaName: 'The Crown Seat',
    subtitle: 'Investor board seat + veto',
    category: 'control',
    descriptionShort: 'Board becomes evenly split. Investor gains blocking rights on major company actions.',
    effects: {
      board: { founderSeats: 2, investorSeats: 2, independentSeats: 0 },
      vetoRights: ['sale', 'new_financing', 'budget'],
    },
    warningTemplates: ['Founder majority lost', 'Investor veto rights'],
    displayOrder: 3,
  },
];

export const PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'nova-series-a',
    name: 'Nova',
    roundLabel: 'Series A',
    description: 'A clean Series A with a $20M pre-money valuation and $5M raise. The baseline for understanding how terms change the deal.',
    currency: 'USD',
    preMoneyValuation: 20_000_000,
    investmentAmount: 5_000_000,
    baseShareholders: [
      { id: 'founders', label: 'Founders', shares: 8_500_000, classType: 'common', displayOrder: 1 },
      { id: 'pool', label: 'Employee Pool', shares: 1_000_000, classType: 'pool', displayOrder: 2 },
      { id: 'advisors', label: 'Advisors', shares: 500_000, classType: 'advisor', displayOrder: 3 },
    ],
    cleanTerms: {
      liquidationPreferenceMultiple: 1,
      participationMode: 'non-participating',
      optionPoolTargetPostMoneyPct: 0,
      optionPoolTiming: 'none',
      board: { founderSeats: 2, investorSeats: 1, independentSeats: 0 },
      vetoRights: [],
    },
    exitRange: { min: 10_000_000, max: 100_000_000, step: 5_000_000, default: 30_000_000 },
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'northstar-seed',
    name: 'Northstar',
    roundLabel: 'Seed',
    description: 'An early-stage seed round with a modest valuation and two founders splitting most of the equity.',
    currency: 'USD',
    preMoneyValuation: 6_000_000,
    investmentAmount: 2_000_000,
    baseShareholders: [
      { id: 'founders', label: 'Founders', shares: 7_000_000, classType: 'common', displayOrder: 1 },
      { id: 'pool', label: 'Employee Pool', shares: 2_000_000, classType: 'pool', displayOrder: 2 },
      { id: 'advisors', label: 'Advisors', shares: 1_000_000, classType: 'advisor', displayOrder: 3 },
    ],
    cleanTerms: {
      liquidationPreferenceMultiple: 1,
      participationMode: 'non-participating',
      optionPoolTargetPostMoneyPct: 0,
      optionPoolTiming: 'none',
      board: { founderSeats: 2, investorSeats: 1, independentSeats: 0 },
      vetoRights: [],
    },
    exitRange: { min: 5_000_000, max: 50_000_000, step: 2_500_000, default: 15_000_000 },
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lattice-series-a',
    name: 'Lattice',
    roundLabel: 'Series A',
    description: 'A larger Series A with concentrated founder ownership and a lean employee pool.',
    currency: 'USD',
    preMoneyValuation: 30_000_000,
    investmentAmount: 8_000_000,
    baseShareholders: [
      { id: 'founders', label: 'Founders', shares: 9_000_000, classType: 'common', displayOrder: 1 },
      { id: 'pool', label: 'Employee Pool', shares: 500_000, classType: 'pool', displayOrder: 2 },
      { id: 'advisors', label: 'Advisors', shares: 500_000, classType: 'advisor', displayOrder: 3 },
    ],
    cleanTerms: {
      liquidationPreferenceMultiple: 1,
      participationMode: 'non-participating',
      optionPoolTargetPostMoneyPct: 0,
      optionPoolTiming: 'none',
      board: { founderSeats: 3, investorSeats: 1, independentSeats: 1 },
      vetoRights: [],
    },
    exitRange: { min: 20_000_000, max: 150_000_000, step: 10_000_000, default: 50_000_000 },
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pulse-series-b',
    name: 'Pulse',
    roundLabel: 'Series B',
    description: 'A growth-stage Series B with more complex dynamics and higher stakes.',
    currency: 'USD',
    preMoneyValuation: 80_000_000,
    investmentAmount: 20_000_000,
    baseShareholders: [
      { id: 'founders', label: 'Founders', shares: 6_000_000, classType: 'common', displayOrder: 1 },
      { id: 'pool', label: 'Employee Pool', shares: 2_000_000, classType: 'pool', displayOrder: 2 },
      { id: 'advisors', label: 'Advisors', shares: 500_000, classType: 'advisor', displayOrder: 3 },
      { id: 'existing-investor', label: 'Series A Investor', shares: 1_500_000, classType: 'common', displayOrder: 4 },
    ],
    cleanTerms: {
      liquidationPreferenceMultiple: 1,
      participationMode: 'non-participating',
      optionPoolTargetPostMoneyPct: 0,
      optionPoolTiming: 'none',
      board: { founderSeats: 2, investorSeats: 2, independentSeats: 1 },
      vetoRights: [],
    },
    exitRange: { min: 50_000_000, max: 500_000_000, step: 25_000_000, default: 150_000_000 },
    isPreset: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export function getScenarioById(id: string): ScenarioDefinition | undefined {
  return PRESET_SCENARIOS.find(s => s.id === id);
}

export function getCanonicalScenario(): ScenarioDefinition {
  return PRESET_SCENARIOS[0];
}
