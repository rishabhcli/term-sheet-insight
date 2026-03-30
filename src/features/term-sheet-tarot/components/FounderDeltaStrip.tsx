import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency, formatPercent } from '../domain/formatting';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function FounderDeltaStrip() {
  const { currentSnapshot, cleanSnapshot } = useSimulatorStore();
  const reducedMotion = useReducedMotion();

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
        index={0}
        label="Founder Ownership"
        value={formatPercent(ownershipPct)}
        delta={Math.abs(ownershipDelta) > 0.01 ? `${ownershipDelta > 0 ? '+' : ''}${ownershipDelta.toFixed(2)}%` : undefined}
        deltaDirection={ownershipDelta >= 0 ? 'positive' : 'negative'}
        reducedMotion={reducedMotion}
      />
      <MetricTile
        index={1}
        label="Founder Payout"
        value={formatCurrency(payout)}
        delta={Math.abs(payoutDelta) > 1 ? `${payoutDelta > 0 ? '+' : '−'}${formatCurrency(Math.abs(payoutDelta))}` : undefined}
        deltaDirection={payoutDelta >= 0 ? 'positive' : 'negative'}
        reducedMotion={reducedMotion}
      />
      <motion.div
        className="bg-card rounded-lg border border-border p-4 shadow-card overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">
          Control
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={controlStatus}
            initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={springTransition}
            className={`font-display text-xl font-bold ${controlColor}`}
          >
            {controlLabel}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {controlChanged && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ ...springTransition, delay: 0.15 }}
              className="text-xs text-metric-negative font-display mt-1"
            >
              Changed from founder-led
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MetricTile({
  index,
  label,
  value,
  delta,
  deltaDirection,
  reducedMotion,
}: {
  index: number;
  label: string;
  value: string;
  delta?: string;
  deltaDirection: 'positive' | 'negative';
  reducedMotion: boolean | null;
}) {
  return (
    <motion.div
      className="bg-card rounded-lg border border-border p-4 shadow-card overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: index * 0.05 }}
    >
      <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">
        {label}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={springTransition}
          className="font-display text-2xl font-bold text-foreground"
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {delta && (
          <motion.div
            key={delta}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ ...springTransition, delay: 0.15 }}
            className={`text-xs font-display mt-1 ${deltaDirection === 'positive' ? 'text-metric-positive' : 'text-metric-negative'}`}
          >
            {delta}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
