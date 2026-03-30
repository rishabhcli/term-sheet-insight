import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { PRESET_SCENARIOS } from '../features/term-sheet-tarot/data/scenarios';
import { useSimulatorStore } from '../features/term-sheet-tarot/state/simulator-store';
import { formatCurrency } from '../features/term-sheet-tarot/domain/formatting';

export default function ScenariosPage() {
  const navigate = useNavigate();
  const loadScenario = useSimulatorStore(s => s.loadScenario);

  const handleLaunch = (scenario: typeof PRESET_SCENARIOS[0]) => {
    loadScenario(scenario);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Scenario Library</h1>
            <p className="text-muted-foreground font-body">
              Choose a preset scenario to explore, or build your own.
            </p>
          </div>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-display text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-glow whitespace-nowrap"
          >
            + Build Custom
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => handleLaunch(scenario)}
              className="bg-card border border-border rounded-lg p-5 text-left hover:border-primary/50 hover:shadow-glow transition-all cursor-pointer group"
            >
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {scenario.name}
                </h2>
                <span className="text-xs text-muted-foreground font-display">{scenario.roundLabel}</span>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-3">{scenario.description}</p>
              <div className="flex gap-4 text-xs text-muted-foreground font-display">
                <span>{formatCurrency(scenario.preMoneyValuation)} pre</span>
                <span>{formatCurrency(scenario.investmentAmount)} raise</span>
              </div>
            </button>
          ))}
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}
