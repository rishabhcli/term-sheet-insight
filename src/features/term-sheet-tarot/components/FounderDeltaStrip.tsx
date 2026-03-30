import { motion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency, formatPercent } from '../domain/formatting';

export function FounderDeltaStrip() {
  const { currentSnapshot, cleanSnapshot } = useSimulatorStore();

  const founderOwnership = currentSnapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const cleanFounderOwnership = cleanSnapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const founderPayout = currentSnapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');
  const cleanFounderPayout = cleanSnapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');

  const ownershipPct = founderOwnership?.percentage ?? 0;
  const cleanOwnershipPct = cleanFounderOwnership?.percentage ?? 0;
  const ownershipDelta = ownershipPct - cleanOwnershipPct;

  const payout = founderPayout?.payout ?? 0;
  const cleanPay = cleanFounderPayout?.payout ?? 0;
  const payoutDelta = payout - cleanPay;

  const controlStatus = currentSnapshot.control.controlStatus;
  const cleanControl = cleanSnapshot.control.controlStatus;
  const controlChanged = controlStatus !== cleanControl;

  const controlLabel = controlStatus === 'founder-led' ? 'Founder-led'
    : controlStatus === 'shared' ? 'Shared / investor blocking'
    : 'Investor-leaning';

  const controlColor = controlStatus === 'founder-led' ? 'text-metric-positive'
    : controlStatus === 'shared' ? 'text-clause-economics'
    : 'text-metric-negative';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricTile
        label="Founder Ownership"
        value={formatPercent(ownershipPct)}
        delta={Math.abs(ownershipDelta) > 0.01 ? `${ownershipDelta > 0 ? '+' : ''}${ownershipDelta.toFixed(2)}%` : undefined}
        deltaDirection={ownershipDelta >= 0 ? 'positive' : 'negative'}
      />
      <MetricTile
        label="Founder Payout"
        value={formatCurrency(payout)}
        delta={Math.abs(payoutDelta) > 1 ? `${payoutDelta > 0 ? '+' : ''}${formatCurrency(payoutDelta)}` : undefined}
        deltaDirection={payoutDelta >= 0 ? 'positive' : 'negative'}
      />
      <div className="bg-card rounded-lg border border-border p-4 shadow-card">
        <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">
          Control
        </div>
        <motion.div
          key={controlStatus}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-display text-xl font-bold ${controlColor}`}
        >
          {controlLabel}
        </motion.div>
        {controlChanged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-metric-negative font-display mt-1"
          >
            Changed from founder-led
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  delta,
  deltaDirection,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection: 'positive' | 'negative';
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card">
      <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-2xl font-bold text-foreground"
      >
        {value}
      </motion.div>
      {delta && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-display mt-1 ${deltaDirection === 'positive' ? 'text-metric-positive' : 'text-metric-negative'}`}
        >
          {delta}
        </motion.div>
      )}
    </div>
  );
}
