import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export function VerdictChipRow() {
  const { currentSnapshot } = useSimulatorStore();
  const { verdictChips } = currentSnapshot;
  const reducedMotion = useReducedMotion();

  if (verdictChips.length === 0) return null;

  const severityConfig = {
    warning: { classes: 'bg-clause-economics/10 text-clause-economics border-clause-economics/20', icon: AlertTriangle },
    danger: { classes: 'bg-clause-control/10 text-clause-control border-clause-control/20', icon: AlertOctagon },
    info: { classes: 'bg-clause-dilution/10 text-clause-dilution border-clause-dilution/20', icon: Info },
  };

  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Deal warnings">
      <AnimatePresence mode="popLayout">
        {verdictChips.map((chip, i) => {
          const config = severityConfig[chip.severity];
          const ChipIcon = config.icon;
          return (
            <motion.span
              key={chip.id}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.7, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -4 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 22, delay: i * 0.06 }}
              layout
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold border ${config.classes}`}
            >
              <ChipIcon className="w-3 h-3 flex-shrink-0" />
              {chip.label}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
