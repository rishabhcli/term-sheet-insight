import { motion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency, formatPercent } from '../domain/formatting';

export function PayoutVisualizer() {
  const { currentSnapshot, cleanSnapshot, exitValue } = useSimulatorStore();
  const { waterfall } = currentSnapshot;
  const cleanWaterfall = cleanSnapshot.waterfall;

  // Ordered: investor, founders, pool, advisors
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
        <span className="font-display text-lg font-bold text-primary">
          {formatCurrency(exitValue)}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="relative h-12 rounded-lg overflow-hidden bg-secondary flex" role="img" aria-label="Payout distribution bar">
        {sortedPayouts.map(p => (
          <motion.div
            key={p.id}
            className={`${p.color} h-full relative group`}
            initial={false}
            animate={{ width: `${p.percentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            title={`${p.label}: ${formatCurrency(p.payout)} (${p.percentage.toFixed(1)}%)`}
          >
            {p.percentage > 10 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-primary-foreground">
                {formatCurrency(p.payout)}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedPayouts.map(p => {
          const delta = p.payout - p.cleanPayout;
          const hasDelta = Math.abs(delta) > 1;
          return (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${p.color}`} />
                <span className="text-xs text-muted-foreground font-body">{p.label}</span>
              </div>
              <div className="font-display text-sm font-bold text-foreground">
                {formatCurrency(p.payout)}
              </div>
              {hasDelta && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-display ${delta > 0 ? 'text-metric-positive' : 'text-metric-negative'}`}
                >
                  {delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(delta))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
