import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency, formatPercent } from '../domain/formatting';
import { TrendingDown, TrendingUp, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

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

  const controlConfig = {
    'founder-led': { label: 'Founder-led', color: 'text-metric-positive', icon: Shield, bg: 'bg-metric-positive/8', border: 'border-metric-positive/15' },
    'shared': { label: 'Shared control', color: 'text-clause-economics', icon: ShieldAlert, bg: 'bg-clause-economics/8', border: 'border-clause-economics/15' },
    'investor-leaning': { label: 'Investor-leaning', color: 'text-metric-negative', icon: ShieldOff, bg: 'bg-metric-negative/8', border: 'border-metric-negative/15' },
  }[controlStatus] ?? { label: controlStatus, color: 'text-foreground', icon: Shield, bg: 'bg-card', border: 'border-border' };

  const ControlIcon = controlConfig.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <MetricTile
        index={0}
        label="Founder Ownership"
        value={formatPercent(ownershipPct)}
        delta={Math.abs(ownershipDelta) > 0.01 ? `${ownershipDelta > 0 ? '+' : ''}${ownershipDelta.toFixed(2)}%` : undefined}
        deltaDirection={ownershipDelta >= 0 ? 'positive' : 'negative'}
        reducedMotion={reducedMotion}
        icon={ownershipDelta < -0.01 ? TrendingDown : TrendingUp}
      />
      <MetricTile
        index={1}
        label="Founder Payout"
        value={formatCurrency(payout)}
        delta={Math.abs(payoutDelta) > 1 ? `${payoutDelta > 0 ? '+' : '−'}${formatCurrency(Math.abs(payoutDelta))}` : undefined}
        deltaDirection={payoutDelta >= 0 ? 'positive' : 'negative'}
        reducedMotion={reducedMotion}
        icon={payoutDelta < -1 ? TrendingDown : TrendingUp}
      />
      
      {/* Control tile — unique design */}
      <motion.div
        className={`glass-surface relative rounded-xl p-4 overflow-hidden ${controlConfig.bg} ${controlConfig.border}`}
        style={{ border: undefined }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-muted/50">
              <ControlIcon className={`w-3 h-3 ${controlConfig.color}`} />
            </div>
            <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">
              Control
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={controlStatus}
              initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={springTransition}
              className={`font-heading text-xl font-bold ${controlConfig.color}`}
            >
              {controlConfig.label}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {controlChanged && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ ...springTransition, delay: 0.15 }}
                className="text-[11px] text-metric-negative font-display mt-1.5 flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-metric-negative" />
                Changed from founder-led
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
  icon: Icon,
}: {
  index: number;
  label: string;
  value: string;
  delta?: string;
  deltaDirection: 'positive' | 'negative';
  reducedMotion: boolean | null;
  icon: typeof TrendingUp;
}) {
  const hasDelta = !!delta;
  return (
    <motion.div
      className="glass-surface relative rounded-xl p-4 overflow-hidden group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: index * 0.05 }}
    >
      {/* Subtle gradient accent along top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </span>
          {hasDelta && (
            <Icon className={`w-3.5 h-3.5 ${deltaDirection === 'positive' ? 'text-metric-positive' : 'text-metric-negative'}`} />
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={springTransition}
            className="font-heading text-2xl font-bold text-foreground tabular-nums"
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
              className={`text-[11px] font-display mt-1.5 tabular-nums ${deltaDirection === 'positive' ? 'text-metric-positive' : 'text-metric-negative'}`}
            >
              {delta}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
