import { motion } from 'framer-motion';
import { useSimulatorStore } from '../state/simulator-store';
import type { TermRowData } from '../domain/types';

export function DealComparisonPanel() {
  const { currentSnapshot } = useSimulatorStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DealColumn title="Clean Offer" rows={currentSnapshot.termRows} side="clean" />
      <DealColumn title="Proposed Offer" rows={currentSnapshot.termRows} side="proposed" />
    </div>
  );
}

function DealColumn({ title, rows, side }: { title: string; rows: TermRowData[]; side: 'clean' | 'proposed' }) {
  const isProposed = side === 'proposed';
  return (
    <div className={`bg-card rounded-lg border p-4 ${isProposed ? 'border-primary/30' : 'border-border'}`}>
      <h3 className={`font-display text-sm uppercase tracking-wider mb-3 ${isProposed ? 'text-primary' : 'text-muted-foreground'}`}>
        {title}
      </h3>
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
      className={`flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 ${
        isChanged ? 'bg-primary/5 -mx-2 px-2 rounded' : ''
      }`}
      animate={isChanged ? { backgroundColor: ['hsla(38,70%,55%,0.08)', 'hsla(38,70%,55%,0.03)', 'hsla(38,70%,55%,0.08)'] } : {}}
      transition={isChanged ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <span className="text-sm text-muted-foreground font-body">{row.label}</span>
      <span className={`text-sm font-display font-semibold ${
        isChanged
          ? row.severity === 'danger' ? 'text-metric-negative' : 'text-clause-economics'
          : 'text-foreground'
      }`}>
        {value}
      </span>
    </motion.div>
  );
}
