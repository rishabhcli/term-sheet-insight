// ===== Domain Types for Term Sheet Tarot =====

export type ClauseCategory = 'dilution' | 'economics' | 'control';
export type ParticipationMode = 'non-participating' | 'participating';
export type OptionPoolTiming = 'none' | 'pre-money-top-up';
export type ControlStatus = 'founder-led' | 'shared' | 'investor-leaning';
export type VetoRight = 'sale' | 'new_financing' | 'budget' | 'hiring' | 'ip';

export interface BaseShareholder {
  id: string;
  label: string;
  shares: number;
  classType: 'common' | 'preferred' | 'pool' | 'advisor';
  displayOrder: number;
}

export interface BoardTerms {
  founderSeats: number;
  investorSeats: number;
  independentSeats: number;
}

export interface DealTerms {
  liquidationPreferenceMultiple: number;
  participationMode: ParticipationMode;
  optionPoolTargetPostMoneyPct: number;
  optionPoolTiming: OptionPoolTiming;
  board: BoardTerms;
  vetoRights: VetoRight[];
}

export interface ExitRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  roundLabel: string;
  description: string;
  currency: string;
  preMoneyValuation: number;
  investmentAmount: number;
  baseShareholders: BaseShareholder[];
  cleanTerms: DealTerms;
  exitRange: ExitRange;
  themeAccent?: string;
  isPreset: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClauseEffect {
  liquidationPreferenceMultiple?: number;
  participationMode?: ParticipationMode;
  optionPoolTargetPostMoneyPct?: number;
  optionPoolTiming?: OptionPoolTiming;
  board?: BoardTerms;
  vetoRights?: VetoRight[];
}

export interface ClauseDefinition {
  id: string;
  arcanaName: string;
  subtitle: string;
  category: ClauseCategory;
  descriptionShort: string;
  effects: ClauseEffect;
  warningTemplates: string[];
  displayOrder: number;
}

export interface HolderPercentage {
  holderId: string;
  label: string;
  shares: number;
  percentage: number;
  classType: string;
}

export interface OwnershipSnapshot {
  postMoneySharesTotal: number;
  pricePerShare: number;
  investorShares: number;
  additionalPoolShares: number;
  holderPercentages: HolderPercentage[];
}

export interface HolderPayout {
  holderId: string;
  label: string;
  payout: number;
  percentage: number;
}

export interface WaterfallSnapshot {
  exitValue: number;
  investorPreferenceTake: number;
  investorParticipationTake: number;
  investorTotalPayout: number;
  holderPayouts: HolderPayout[];
  distributionMode: 'preference' | 'conversion';
}

export interface ControlSnapshot {
  founderSeats: number;
  investorSeats: number;
  independentSeats: number;
  founderHasMajority: boolean;
  investorBlockingRights: VetoRight[];
  controlStatus: ControlStatus;
  explanation: string;
}

export interface VerdictChip {
  id: string;
  label: string;
  severity: 'warning' | 'danger' | 'info';
  category: ClauseCategory;
}

export interface TermRowData {
  label: string;
  cleanValue: string;
  proposedValue: string;
  changed: boolean;
  severity: 'neutral' | 'warning' | 'danger';
  category?: ClauseCategory;
}

export interface DealSnapshot {
  scenarioId: string;
  activeClauseIds: string[];
  terms: DealTerms;
  ownership: OwnershipSnapshot;
  waterfall: WaterfallSnapshot;
  control: ControlSnapshot;
  verdictChips: VerdictChip[];
  termRows: TermRowData[];
  dirtyLevel: number;
  generatedAt: number;
}
