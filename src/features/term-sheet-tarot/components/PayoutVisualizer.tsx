import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency } from '../domain/formatting';

const barSpring = { type: 'spring' as const, stiffness: 200, damping: 28, mass: 0.8 };

export function PayoutVisualizer() {
  const { currentSnapshot, cleanSnapshot, exitValue } = useSimulatorStore();
  const { waterfall } = currentSnapshot;
  const cleanWaterfall = cleanSnapshot.waterfall;
  const reducedMotion = useReducedMotion();

  const order = ['investor', 'founders', 'pool', 'advisors'];
  const colorMap: Record<string, string> = {
    investor: 'bg-payout-investor',
    founders: 'bg-payout-founder',
    pool: 'bg-payout-pool',
    advisors: 'bg-payout-advisor',
  };
  const labelMap: Record<string, string> = {
    investor: 'Investor',
    founders: 'Founders',
    pool: 'Pool',
    advisors: 'Advisors',
  };

  const sortedPayouts = order.map(id => {
    const holder = waterfall.holderPayouts.find(h => h.holderId === id);
    const cleanHolder = cleanWaterfall.holderPayouts.find(h => h.holderId === id);
    return {
      id,
      label: labelMap[id] || id,
      payout: holder?.payout || 0,
      cleanPayout: cleanHolder?.payout || 0,
      percentage: holder?.percentage || 0,
      color: colorMap[id] || 'bg-muted',
    };
  }).filter(p => p.payout > 0 || p.cleanPayout > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          Payout at Exit
        </h2>
        <motion.span
          key={exitValue}
          className="font-display text-lg font-bold text-primary"
          initial={reducedMotion ? false : { opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {formatCurrency(exitValue)}
        </motion.span>
      </div>

      {/* Stacked bar */}
      <div className="relative h-14 rounded-lg overflow-hidden bg-secondary flex" role="img" aria-label="Payout distribution bar">
        {sortedPayouts.map(p => (
          <motion.div
            key={p.id}
            className={`${p.color} h-full relative overflow-hidden`}
            initial={false}
            animate={{ width: `${p.percentage}%` }}
            transition={barSpring}
            title={`${p.label}: ${formatCurrency(p.payout)} (${p.percentage.toFixed(1)}%)`}
          >
            {/* Inner shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
              {p.percentage > 12 && (
                <motion.span
                  key={`${p.id}-${formatCurrency(p.payout)}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-primary-foreground drop-shadow-sm"
                >
                  {formatCurrency(p.payout)}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedPayouts.map(p => {
          const delta = p.payout - p.cleanPayout;
          const hasDelta = Math.abs(delta) > 1;
          return (
            <motion.div key={p.id} className="space-y-1" layout>
              <div className="flex items-center gap-2">
                <motion.div
                  className={`w-3 h-3 rounded-sm ${p.color}`}
                  animate={hasDelta ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                />
                <span className="text-xs text-muted-foreground font-body">{p.label}</span>
              </div>
              <motion.div
                key={`val-${p.payout}`}
                className="font-display text-sm font-bold text-foreground"
                initial={reducedMotion ? false : { opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {formatCurrency(p.payout)}
              </motion.div>
              <AnimatePresence mode="wait">
                {hasDelta && (
                  <motion.div
                    key={`delta-${delta}`}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 25, delay: 0.1 }}
                    className={`text-xs font-display ${delta > 0 ? 'text-metric-positive' : 'text-metric-negative'}`}
                  >
                    {delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(delta))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
