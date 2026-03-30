import type { DealTerms, DealSnapshot, VerdictChip, OwnershipSnapshot, ControlSnapshot } from './types';

export function computeVerdicts(
  cleanTerms: DealTerms,
  proposedTerms: DealTerms,
  ownership: OwnershipSnapshot,
  control: ControlSnapshot
): VerdictChip[] {
  const chips: VerdictChip[] = [];

  if (proposedTerms.optionPoolTiming === 'pre-money-top-up' && proposedTerms.optionPoolTargetPostMoneyPct > 0) {
    chips.push({
      id: 'pre-money-dilution',
      label: 'Pre-money dilution',
      severity: 'warning',
      category: 'dilution',
    });
  }

  if (proposedTerms.participationMode === 'participating') {
    chips.push({
      id: 'investor-double-dips',
      label: 'Investor double-dips',
      severity: 'danger',
      category: 'economics',
    });
  }

  if (proposedTerms.liquidationPreferenceMultiple > 1) {
    chips.push({
      id: 'exit-proceeds-skewed',
      label: 'Exit proceeds skewed',
      severity: 'danger',
      category: 'economics',
    });
  }

  if (!control.founderHasMajority) {
    chips.push({
      id: 'founder-majority-lost',
      label: 'Founder majority lost',
      severity: 'danger',
      category: 'control',
    });
  }

  if (control.investorBlockingRights.length > 0) {
    chips.push({
      id: 'investor-veto-rights',
      label: 'Investor veto rights',
      severity: 'warning',
      category: 'control',
    });
  }

  return chips;
}
