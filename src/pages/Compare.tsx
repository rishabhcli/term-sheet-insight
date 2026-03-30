import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { AnimatedNumber } from '../features/term-sheet-tarot/components/AnimatedNumber';
import { PRESET_SCENARIOS, CLAUSE_CATALOG } from '../features/term-sheet-tarot/data/scenarios';
import { buildSnapshot } from '../features/term-sheet-tarot/domain/snapshot-builder';
import { formatCurrency, formatPercent } from '../features/term-sheet-tarot/domain/formatting';
import type { ScenarioDefinition, DealSnapshot, ClauseDefinition } from '../features/term-sheet-tarot/domain/types';
import { Shield, ShieldAlert, ShieldOff, GitCompareArrows, TrendingUp, TrendingDown, Minus, FileDown, Link2, Check } from 'lucide-react';
import { exportComparisonPDF } from '../features/term-sheet-tarot/services/pdf-comparison-export';

function useScenarioSide(scenarios: ScenarioDefinition[]) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '');
  const [activeClauseIds, setActiveClauseIds] = useState<string[]>([]);
  const scenario = scenarios.find(s => s.id === scenarioId) ?? scenarios[0];
  const [exitValue, setExitValue] = useState(scenario.exitRange.default);

  const toggleClause = (id: string) =>
    setActiveClauseIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const changeScenario = (id: string) => {
    setScenarioId(id);
    setActiveClauseIds([]);
    const s = scenarios.find(sc => sc.id === id) ?? scenarios[0];
    setExitValue(s.exitRange.default);
  };

  const snapshot = useMemo(
    () => buildSnapshot(scenario, activeClauseIds, CLAUSE_CATALOG, exitValue),
    [scenario, activeClauseIds, exitValue]
  );

  const cleanSnapshot = useMemo(
    () => buildSnapshot(scenario, [], CLAUSE_CATALOG, exitValue),
    [scenario, exitValue]
  );

  return { scenario, scenarioId, changeScenario, activeClauseIds, toggleClause, exitValue, setExitValue, snapshot, cleanSnapshot };
}

function DeltaIndicator({ a, b }: { a: number; b: number }) {
  const diff = b - a;
  if (Math.abs(diff) < 0.01) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  return diff > 0 ? <TrendingUp className="w-3.5 h-3.5 text-metric-positive" /> : <TrendingDown className="w-3.5 h-3.5 text-metric-negative" />;
}

function ControlBadge({ status }: { status: string }) {
  const config = {
    'founder-led': { label: 'Founder-led', color: 'text-metric-positive', bg: 'bg-metric-positive/10', Icon: Shield },
    'shared': { label: 'Shared', color: 'text-clause-economics', bg: 'bg-clause-economics/10', Icon: ShieldAlert },
    'investor-leaning': { label: 'Investor-leaning', color: 'text-metric-negative', bg: 'bg-metric-negative/10', Icon: ShieldOff },
  }[status] ?? { label: status, color: 'text-foreground', bg: 'bg-muted', Icon: Shield };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-display ${config.color} ${config.bg}`}>
      <config.Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function SidePanel({
  label,
  scenarios,
  side,
  reducedMotion,
}: {
  label: string;
  scenarios: ScenarioDefinition[];
  side: ReturnType<typeof useScenarioSide>;
  reducedMotion: boolean | null;
}) {
  const founder = side.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const founderPayout = side.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');
  const pct = ((side.exitValue - side.scenario.exitRange.min) / (side.scenario.exitRange.max - side.scenario.exitRange.min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>

      {/* Scenario selector */}
      <select
        value={side.scenarioId}
        onChange={e => side.changeScenario(e.target.value)}
        className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
      >
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name} — {s.roundLabel}</option>
        ))}
      </select>

      {/* Clause toggles */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Clauses</span>
        <div className="flex flex-wrap gap-1.5">
          {CLAUSE_CATALOG.map(clause => {
            const active = side.activeClauseIds.includes(clause.id);
            const categoryColor = {
              dilution: 'border-clause-dilution/40 bg-clause-dilution/8 text-clause-dilution',
              economics: 'border-clause-economics/40 bg-clause-economics/8 text-clause-economics',
              control: 'border-clause-control/40 bg-clause-control/8 text-clause-control',
            }[clause.category];
            return (
              <button
                key={clause.id}
                onClick={() => side.toggleClause(clause.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-display border transition-all ${
                  active
                    ? categoryColor
                    : 'border-border/40 bg-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {clause.arcanaName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exit slider */}
      <div className="glass-surface rounded-lg p-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Exit Value</span>
          <span className="font-heading text-sm font-bold text-foreground tabular-nums">{formatCurrency(side.exitValue)}</span>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-primary/30 pointer-events-none transition-all" style={{ width: `${pct}%` }} />
          <input
            type="range"
            min={side.scenario.exitRange.min}
            max={side.scenario.exitRange.max}
            step={side.scenario.exitRange.step}
            value={side.exitValue}
            onChange={e => side.setExitValue(Number(e.target.value))}
            className="w-full h-6 cursor-pointer touch-manipulation relative z-10"
            style={{ background: 'transparent' }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <MetricRow label="Ownership" reducedMotion={reducedMotion} value={founder?.percentage ?? 0} format={formatPercent} />
        <MetricRow label="Payout" reducedMotion={reducedMotion} value={founderPayout?.payout ?? 0} format={formatCurrency} />
        <div>
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Control</span>
          <div className="mt-1">
            <ControlBadge status={side.snapshot.control.controlStatus} />
          </div>
        </div>
      </div>

      {/* Verdict chips */}
      {side.snapshot.verdictChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {side.snapshot.verdictChips.map(chip => {
            const chipColor = {
              warning: 'bg-clause-economics/10 text-clause-economics border-clause-economics/20',
              danger: 'bg-metric-negative/10 text-metric-negative border-metric-negative/20',
              info: 'bg-primary/10 text-primary border-primary/20',
            }[chip.severity];
            return (
              <span key={chip.id} className={`text-[10px] font-display px-2 py-0.5 rounded border ${chipColor}`}>
                {chip.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, format, reducedMotion }: { label: string; value: number; format: (n: number) => string; reducedMotion: boolean | null }) {
  return (
    <div>
      <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <div className="font-heading text-xl font-bold text-foreground tabular-nums mt-0.5">
        {reducedMotion ? format(value) : <AnimatedNumber value={value} format={format} />}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const reducedMotion = useReducedMotion();
  const scenarios = PRESET_SCENARIOS;
  const sideA = useScenarioSide(scenarios);
  const sideB = useScenarioSide(scenarios);

  const founderA = sideA.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const founderB = sideB.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const payoutA = sideA.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');
  const payoutB = sideB.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <GitCompareArrows className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Compare Scenarios</h1>
                <p className="text-xs text-muted-foreground font-body">Pick two scenarios, toggle different clauses, and see the impact side by side.</p>
              </div>
            </div>
            <button
              onClick={() => exportComparisonPDF(
                { scenario: sideA.scenario, snapshot: sideA.snapshot, activeClauseIds: sideA.activeClauseIds, exitValue: sideA.exitValue },
                { scenario: sideB.scenario, snapshot: sideB.snapshot, activeClauseIds: sideB.activeClauseIds, exitValue: sideB.exitValue },
              )}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-display hover:bg-primary/20 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-0">
          {/* Side A */}
          <motion.div
            className="glass-surface rounded-xl p-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
          >
            <SidePanel label="Deal A" scenarios={scenarios} side={sideA} reducedMotion={reducedMotion} />
          </motion.div>

          {/* Center comparison column */}
          <motion.div
            className="hidden lg:flex flex-col items-center justify-center px-4 py-8 space-y-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <div className="w-px h-8 bg-border/40" />
            <div className="space-y-4 text-center">
              <CompareMetric label="Ownership" a={founderA?.percentage ?? 0} b={founderB?.percentage ?? 0} format={(v) => formatPercent(v)} />
              <CompareMetric label="Payout" a={payoutA?.payout ?? 0} b={payoutB?.payout ?? 0} format={formatCurrency} />
              <div>
                <span className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">Control</span>
                <div className="mt-1">
                  {sideA.snapshot.control.controlStatus === sideB.snapshot.control.controlStatus ? (
                    <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
                  ) : (
                    <span className="text-[10px] text-metric-negative font-display">differs</span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-border/40" />
          </motion.div>

          {/* Side B */}
          <motion.div
            className="glass-surface rounded-xl p-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
          >
            <SidePanel label="Deal B" scenarios={scenarios} side={sideB} reducedMotion={reducedMotion} />
          </motion.div>
        </div>

        {/* Mobile comparison strip */}
        <div className="lg:hidden glass-surface rounded-xl p-4 space-y-3">
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Comparison</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <CompareMetric label="Ownership" a={founderA?.percentage ?? 0} b={founderB?.percentage ?? 0} format={formatPercent} />
            <CompareMetric label="Payout" a={payoutA?.payout ?? 0} b={payoutB?.payout ?? 0} format={formatCurrency} />
            <div>
              <span className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">Control</span>
              <div className="mt-1">
                {sideA.snapshot.control.controlStatus === sideB.snapshot.control.controlStatus ? (
                  <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
                ) : (
                  <span className="text-[10px] text-metric-negative font-display">differs</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}

function CompareMetric({ label, a, b, format }: { label: string; a: number; b: number; format: (n: number) => string }) {
  const diff = b - a;
  return (
    <div>
      <span className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <DeltaIndicator a={a} b={b} />
        <span className={`text-xs font-heading font-bold tabular-nums ${
          Math.abs(diff) < 0.01 ? 'text-muted-foreground' : diff > 0 ? 'text-metric-positive' : 'text-metric-negative'
        }`}>
          {Math.abs(diff) < 0.01 ? '—' : `${diff > 0 ? '+' : '-'}${format(Math.abs(diff))}`}
        </span>
      </div>
    </div>
  );
}
