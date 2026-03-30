import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { ResetControls } from '../features/term-sheet-tarot/components/ResetControls';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';

export default function SimulatorPage() {
  const [searchParams] = useSearchParams();
  const { initializeFromParams, errorState, clearError } = useSimulatorStore();

  useEffect(() => {
    if (searchParams.toString()) {
      initializeFromParams(searchParams);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {errorState && (
          <div className="glass-surface rounded-xl px-4 py-3 flex items-center justify-between border-destructive/30">
            <span className="text-[12px] text-destructive font-body">{errorState}</span>
            <button onClick={clearError} className="text-[10px] text-destructive hover:underline font-display">Dismiss</button>
          </div>
        )}

        <ScenarioHeader />

        {/* Key metrics */}
        <section aria-label="Deal outcomes">
          <FounderDeltaStrip />
        </section>

        <VerdictChipRow />

        <section aria-label="Payout distribution">
          <PayoutVisualizer />
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <DealComparisonPanel />
            <ExitSliderPanel />
            <ControlSummary />
            <ResetControls />
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
