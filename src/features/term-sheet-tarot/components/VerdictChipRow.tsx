import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';

const chipVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 22, delay: i * 0.06 },
  }),
  exit: { opacity: 0, scale: 0.7, y: -4, transition: { duration: 0.15 } },
};

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
            custom={i}
            variants={chipVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="visible"
            exit="exit"
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
