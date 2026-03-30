import { useEffect, useCallback } from 'react';
import { useSimulatorStore } from '../features/term-sheet-tarot/state/simulator-store';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { ScenarioHeader } from '../features/term-sheet-tarot/components/ScenarioHeader';
import { FounderDeltaStrip } from '../features/term-sheet-tarot/components/FounderDeltaStrip';
import { VerdictChipRow } from '../features/term-sheet-tarot/components/VerdictChipRow';
import { PayoutVisualizer } from '../features/term-sheet-tarot/components/PayoutVisualizer';
import { DealComparisonPanel } from '../features/term-sheet-tarot/components/DealComparisonPanel';
import { ClauseDeck } from '../features/term-sheet-tarot/components/ClauseDeck';
import { ExitSliderPanel } from '../features/term-sheet-tarot/components/ExitSliderPanel';
import { ControlSummary } from '../features/term-sheet-tarot/components/ControlSummary';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';

export default function DemoPage() {
  const { initializeDemo, toggleClause, setExitValue, resetToClean, scenario } = useSimulatorStore();

  useEffect(() => {
    initializeDemo();
  }, []);

  // Demo hotkeys
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.key) {
      case '1': toggleClause('double-dip'); break;
      case '2': toggleClause('hidden-pool'); break;
      case '3': toggleClause('crown-seat'); break;
      case '0': resetToClean(); break;
      case '[': {
        const store = useSimulatorStore.getState();
        const newVal = Math.max(store.scenario.exitRange.min, store.exitValue - store.scenario.exitRange.step);
        setExitValue(newVal);
        break;
      }
      case ']': {
        const store = useSimulatorStore.getState();
        const newVal = Math.min(store.scenario.exitRange.max, store.exitValue + store.scenario.exitRange.step);
        setExitValue(newVal);
        break;
      }
    }
  }, [toggleClause, setExitValue, resetToClean]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader minimal />

      <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center no-print">
        <span className="text-xs font-display text-primary">
          Demo mode · Hotkeys: 1–3 toggle clauses · 0 reset · [ ] adjust exit
        </span>
      </div>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        <ScenarioHeader />
        <section aria-label="Deal outcomes">
          <FounderDeltaStrip />
        </section>
        <VerdictChipRow />
        <section aria-label="Payout distribution">
          <PayoutVisualizer />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DealComparisonPanel />
            <ExitSliderPanel />
            <ControlSummary />
          </div>
          <div className="lg:col-span-1">
            <ClauseDeck />
          </div>
        </div>
        <LegalFootnote />
      </main>
    </div>
  );
}
