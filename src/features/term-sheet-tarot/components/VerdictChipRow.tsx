import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';

export function VerdictChipRow() {
  const { currentSnapshot } = useSimulatorStore();
  const { verdictChips } = currentSnapshot;
  const reducedMotion = useReducedMotion();

  if (verdictChips.length === 0) return null;

  const severityStyles = {
    warning: 'bg-clause-economics/15 text-clause-economics border-clause-economics/30',
    danger: 'bg-clause-control/15 text-clause-control border-clause-control/30',
    info: 'bg-clause-dilution/15 text-clause-dilution border-clause-dilution/30',
  };

  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Deal warnings">
      <AnimatePresence mode="popLayout">
        {verdictChips.map((chip, i) => (
          <motion.span
            key={chip.id}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -4 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 22, delay: i * 0.06 }}
            layout
            className={`px-3 py-1 rounded-full text-xs font-display font-semibold border ${severityStyles[chip.severity]}`}
          >
            {chip.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
