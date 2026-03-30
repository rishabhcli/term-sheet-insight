import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import { CLAUSE_CATALOG } from '../data/scenarios';
import type { ClauseDefinition, ClauseCategory } from '../domain/types';
import { Sparkles } from 'lucide-react';

const categoryStyles: Record<ClauseCategory, { border: string; bg: string; text: string; activeBg: string; icon: string }> = {
  dilution: {
    border: 'border-clause-dilution/60',
    bg: 'bg-clause-dilution/8',
    text: 'text-clause-dilution',
    activeBg: 'hsl(272, 72%, 62%)',
    icon: '◈',
  },
  economics: {
    border: 'border-clause-economics/60',
    bg: 'bg-clause-economics/8',
    text: 'text-clause-economics',
    activeBg: 'hsl(42, 90%, 60%)',
    icon: '◆',
  },
  control: {
    border: 'border-clause-control/60',
    bg: 'bg-clause-control/8',
    text: 'text-clause-control',
    activeBg: 'hsl(2, 78%, 58%)',
    icon: '◉',
  },
};

function ClauseCard({ clause }: { clause: ClauseDefinition }) {
  const { activeClauseIds, toggleClause } = useSimulatorStore();
  const isActive = activeClauseIds.includes(clause.id);
  const styles = categoryStyles[clause.category];
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => toggleClause(clause.id)}
      className={`
        relative w-full text-left rounded-xl border p-4 sm:p-5 cursor-pointer overflow-hidden
        min-h-[72px] touch-manipulation transition-colors duration-200
        focus-glow
        ${isActive
          ? `${styles.border} ${styles.bg}`
          : 'border-border/60 bg-card/50 hover:bg-card hover:border-muted-foreground/20'
        }
      `}
      animate={isActive
        ? { scale: 1, boxShadow: `0 0 30px -6px ${styles.activeBg}30` }
        : { scale: 1, boxShadow: '0 0 0px 0px transparent' }
      }
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
      layout
      role="switch"
      aria-checked={isActive}
      aria-label={`${clause.arcanaName}: ${clause.subtitle}`}
    >
      {/* Subtle radial glow on active */}
      <AnimatePresence>
        {isActive && !reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 30% 0%, ${styles.activeBg}12, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start justify-between gap-3 z-10">
        <div className="flex-1 min-w-0">
          {/* Category pill */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-display uppercase tracking-[0.15em] ${isActive ? styles.text : 'text-muted-foreground'}`}>
              {styles.icon} {clause.category}
            </span>
          </div>
          
          <h3 className={`font-heading text-base font-bold mb-0.5 tracking-tight ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
            {clause.arcanaName}
          </h3>
          <motion.p
            className="text-[12px] font-display mb-2"
            animate={{ color: isActive ? styles.activeBg : 'hsl(225, 12%, 45%)' }}
            transition={{ duration: 0.2 }}
          >
            {clause.subtitle}
          </motion.p>
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
            {clause.descriptionShort}
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={`
          w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 border
          ${isActive 
            ? `${styles.border} ${styles.bg}` 
            : 'border-border/40 bg-secondary/50'
          }
        `}>
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                transition={{ type: 'spring' as const, stiffness: 500, damping: 20 }}
              >
                <Sparkles className={`w-4 h-4 ${
                  clause.category === 'dilution' ? 'text-clause-dilution' :
                  clause.category === 'economics' ? 'text-clause-economics' : 'text-clause-control'
                }`} />
              </motion.div>
            ) : (
              <motion.div
                key="inactive"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-2 h-2 rounded-full bg-muted-foreground/20"
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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">
          Clause Cards
        </h2>
      </div>
      {CLAUSE_CATALOG.map((clause) => (
        <ClauseCard key={clause.id} clause={clause} />
      ))}
    </div>
  );
}
