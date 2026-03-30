import { motion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import type { TermRowData } from '../domain/types';

export function DealComparisonPanel() {
  const { currentSnapshot } = useSimulatorStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <DealColumn title="Clean Offer" rows={currentSnapshot.termRows} side="clean" />
      <DealColumn title="Proposed Offer" rows={currentSnapshot.termRows} side="proposed" />
    </div>
  );
}

function DealColumn({ title, rows, side }: { title: string; rows: TermRowData[]; side: 'clean' | 'proposed' }) {
  const isProposed = side === 'proposed';
  return (
    <div className={`glass-surface rounded-xl p-4 relative overflow-hidden ${isProposed ? 'border-primary/15' : ''}`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px ${
        isProposed 
          ? 'bg-gradient-to-r from-transparent via-primary/30 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-foreground/5 to-transparent'
      }`} />

      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${isProposed ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
        <h3 className={`text-[10px] font-display uppercase tracking-[0.15em] ${isProposed ? 'text-primary' : 'text-muted-foreground'}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-0">
        {rows.map((row, i) => (
          <TermRow key={i} row={row} side={side} />
        ))}
      </div>
    </div>
  );
}

function TermRow({ row, side }: { row: TermRowData; side: 'clean' | 'proposed' }) {
  const value = side === 'clean' ? row.cleanValue : row.proposedValue;
  const isChanged = side === 'proposed' && row.changed;

  return (
    <motion.div
      className={`flex items-center justify-between py-2.5 border-b border-border/30 last:border-0 ${
        isChanged ? 'bg-primary/4 -mx-2 px-2 rounded-md' : ''
      }`}
      animate={isChanged ? { 
        backgroundColor: ['hsla(42,90%,60%,0.04)', 'hsla(42,90%,60%,0.02)', 'hsla(42,90%,60%,0.04)'] 
      } : {}}
      transition={isChanged ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <span className="text-[12px] text-muted-foreground font-body">{row.label}</span>
      <span className={`text-[12px] font-display font-semibold tabular-nums ${
        isChanged
          ? row.severity === 'danger' ? 'text-metric-negative' : 'text-clause-economics'
          : 'text-foreground/80'
      }`}>
        {value}
      </span>
    </motion.div>
  );
}
