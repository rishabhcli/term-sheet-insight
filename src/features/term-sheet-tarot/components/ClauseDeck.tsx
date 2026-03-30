import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { CLAUSE_CATALOG } from '../data/scenarios';
import type { ClauseDefinition, ClauseCategory } from '../domain/types';

const categoryStyles: Record<ClauseCategory, { border: string; bg: string; text: string; glow: string; activeBg: string }> = {
  dilution: {
    border: 'border-clause-dilution',
    bg: 'bg-clause-dilution/10',
    text: 'text-clause-dilution',
    glow: 'shadow-[0_0_30px_-4px_hsl(280,60%,60%,0.3)]',
    activeBg: 'hsl(280, 60%, 60%)',
  },
  economics: {
    border: 'border-clause-economics',
    bg: 'bg-clause-economics/10',
    text: 'text-clause-economics',
    glow: 'shadow-[0_0_30px_-4px_hsl(38,80%,55%,0.3)]',
    activeBg: 'hsl(38, 80%, 55%)',
  },
  control: {
    border: 'border-clause-control',
    bg: 'bg-clause-control/10',
    text: 'text-clause-control',
    glow: 'shadow-[0_0_30px_-4px_hsl(0,65%,55%,0.3)]',
    activeBg: 'hsl(0, 65%, 55%)',
  },
};

const cardVariants = {
  inactive: {
    scale: 1,
    borderColor: 'hsl(220, 15%, 18%)',
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  active: {
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
  hover: {
    scale: 1.01,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
};

const indicatorVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 20, delay: 0.05 },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const glowPulse = {
  active: (color: string) => ({
    boxShadow: [
      `0 0 20px -4px ${color}40`,
      `0 0 35px -4px ${color}25`,
      `0 0 20px -4px ${color}40`,
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  }),
};

function ClauseCard({ clause, index }: { clause: ClauseDefinition; index: number }) {
  const { activeClauseIds, toggleClause } = useSimulatorStore();
  const isActive = activeClauseIds.includes(clause.id);
  const styles = categoryStyles[clause.category];
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => toggleClause(clause.id)}
      className={`
        relative w-full text-left rounded-lg border-2 p-5 cursor-pointer overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        ${isActive
          ? `${styles.border} ${styles.bg}`
          : 'border-border bg-card hover:border-muted-foreground/30'
        }
      `}
      variants={cardVariants}
      initial="inactive"
      animate={isActive ? 'active' : 'inactive'}
      whileTap="tap"
      whileHover="hover"
      layout
      role="switch"
      aria-checked={isActive}
      aria-label={`${clause.arcanaName}: ${clause.subtitle}`}
    >
      {/* Animated glow border on active */}
      <AnimatePresence>
        {isActive && !reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={glowPulse.active(styles.activeBg)}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>

      {/* Activation flash */}
      <AnimatePresence>
        {isActive && !reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0.3, background: `radial-gradient(circle at center, ${styles.activeBg}30, transparent 70%)` }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <motion.div
            className={`text-xs font-display uppercase tracking-wider mb-1`}
            animate={{ color: isActive ? styles.activeBg : 'hsl(220, 10%, 50%)' }}
            transition={{ duration: 0.2 }}
          >
            {clause.category}
          </motion.div>
          <h3 className={`font-display text-lg font-bold mb-1 ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
            {clause.arcanaName}
          </h3>
          <motion.p
            className="text-sm font-body mb-2"
            animate={{ color: isActive ? styles.activeBg : 'hsl(220, 10%, 50%)' }}
            transition={{ duration: 0.2 }}
          >
            {clause.subtitle}
          </motion.p>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {clause.descriptionShort}
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={`
          w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors duration-200
          ${isActive ? `${styles.border} ${styles.bg}` : 'border-muted-foreground/30'}
        `}>
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key="dot"
                variants={indicatorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`w-3.5 h-3.5 rounded-full ${
                  clause.category === 'dilution' ? 'bg-clause-dilution' :
                  clause.category === 'economics' ? 'bg-clause-economics' : 'bg-clause-control'
                }`}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

export function ClauseDeck() {
  return (
    <div className="space-y-3" role="group" aria-label="Deal clause cards">
      <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-4">
        Clause Cards
      </h2>
      {CLAUSE_CATALOG.map((clause, i) => (
        <ClauseCard key={clause.id} clause={clause} index={i} />
      ))}
    </div>
  );
}
