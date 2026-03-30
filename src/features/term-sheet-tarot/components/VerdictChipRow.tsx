import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';

export function VerdictChipRow() {
  const { currentSnapshot } = useSimulatorStore();
  const { verdictChips } = currentSnapshot;

  if (verdictChips.length === 0) return null;

  const severityStyles = {
    warning: 'bg-clause-economics/15 text-clause-economics border-clause-economics/30',
    danger: 'bg-clause-control/15 text-clause-control border-clause-control/30',
    info: 'bg-clause-dilution/15 text-clause-dilution border-clause-dilution/30',
  };

  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Deal warnings">
      <AnimatePresence>
        {verdictChips.map(chip => (
          <motion.span
            key={chip.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`px-3 py-1 rounded-full text-xs font-display font-semibold border ${severityStyles[chip.severity]}`}
          >
            {chip.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
