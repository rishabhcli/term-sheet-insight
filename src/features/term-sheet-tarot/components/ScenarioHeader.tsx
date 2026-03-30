import { motion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency } from '../domain/formatting';

export function ScenarioHeader() {
  const { scenario, exitValue, activeClauseIds } = useSimulatorStore();
  const clauseCount = activeClauseIds.length;

  return (
    <div className="relative">
      {/* Ambient glow behind header */}
      <div className="absolute -top-8 left-1/4 w-1/2 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <motion.h1
              className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
              layout
            >
              {scenario.name}
            </motion.h1>
            <span className="px-2.5 py-0.5 text-[10px] font-display font-bold uppercase tracking-widest rounded-full border border-primary/25 text-primary bg-primary/8">
              {scenario.roundLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-body flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              {formatCurrency(scenario.preMoneyValuation)} pre-money
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              {formatCurrency(scenario.investmentAmount)} raise
            </span>
          </p>
        </div>
        
        {clauseCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/8 border border-destructive/20"
          >
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-display text-destructive/90">
              {clauseCount} clause{clauseCount > 1 ? 's' : ''} active
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
