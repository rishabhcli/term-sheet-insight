import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { ScenarioBuilderForm } from '../features/term-sheet-tarot/components/ScenarioBuilderForm';

export default function BuildScenarioPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Build a Scenario</h1>
          <p className="text-muted-foreground font-body text-sm">
            Define your deal's cap table and terms, then launch the simulator to see how clauses affect the outcome.
          </p>
        </div>
        <ScenarioBuilderForm />
        <LegalFootnote />
      </main>
    </div>
  );
}
