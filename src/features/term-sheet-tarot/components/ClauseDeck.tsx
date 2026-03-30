import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { CLAUSE_CATALOG } from '../data/scenarios';
import type { ClauseDefinition, ClauseCategory } from '../domain/types';

const categoryStyles: Record<ClauseCategory, { border: string; bg: string; text: string; glow: string }> = {
  dilution: {
    border: 'border-clause-dilution',
    bg: 'bg-clause-dilution/10',
    text: 'text-clause-dilution',
    glow: 'shadow-[0_0_30px_-4px_hsl(280,60%,60%,0.3)]',
  },
  economics: {
    border: 'border-clause-economics',
    bg: 'bg-clause-economics/10',
    text: 'text-clause-economics',
    glow: 'shadow-[0_0_30px_-4px_hsl(38,80%,55%,0.3)]',
  },
  control: {
    border: 'border-clause-control',
    bg: 'bg-clause-control/10',
    text: 'text-clause-control',
    glow: 'shadow-[0_0_30px_-4px_hsl(0,65%,55%,0.3)]',
  },
};

function ClauseCard({ clause }: { clause: ClauseDefinition }) {
  const { activeClauseIds, toggleClause } = useSimulatorStore();
  const isActive = activeClauseIds.includes(clause.id);
  const styles = categoryStyles[clause.category];

  return (
    <motion.button
      onClick={() => toggleClause(clause.id)}
      className={`
        relative w-full text-left rounded-lg border-2 p-5 transition-colors cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        ${isActive
          ? `${styles.border} ${styles.bg} ${styles.glow}`
          : 'border-border bg-card hover:border-muted-foreground/30'
        }
      `}
      whileTap={{ scale: 0.98 }}
      layout
      role="switch"
      aria-checked={isActive}
      aria-label={`${clause.arcanaName}: ${clause.subtitle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-display uppercase tracking-wider mb-1 ${isActive ? styles.text : 'text-muted-foreground'}`}>
            {clause.category}
          </div>
          <h3 className={`font-display text-lg font-bold mb-1 ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
            {clause.arcanaName}
          </h3>
          <p className={`text-sm font-body mb-2 ${isActive ? styles.text : 'text-muted-foreground'}`}>
            {clause.subtitle}
          </p>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {clause.descriptionShort}
          </p>
        </div>
        <div className={`
          w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all
          ${isActive ? `${styles.border} ${styles.bg}` : 'border-muted-foreground/30'}
        `}>
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`w-3 h-3 rounded-full ${
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
      {CLAUSE_CATALOG.map(clause => (
        <ClauseCard key={clause.id} clause={clause} />
      ))}
    </div>
  );
}
