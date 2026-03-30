import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { AuthDialog } from '../features/term-sheet-tarot/components/AuthDialog';
import { PRESET_SCENARIOS } from '../features/term-sheet-tarot/data/scenarios';
import { useSimulatorStore } from '../features/term-sheet-tarot/state/simulator-store';
import { useAuth } from '../features/term-sheet-tarot/hooks/useAuth';
import { fetchUserScenarios, deleteScenarioFromCloud, logEvent } from '../features/term-sheet-tarot/services/supabase-service';
import { formatCurrency } from '../features/term-sheet-tarot/domain/formatting';
import type { ScenarioDefinition, BaseShareholder, DealTerms, ExitRange } from '../features/term-sheet-tarot/domain/types';

interface DbScenario {
  id: string;
  slug: string;
  name: string;
  round_label: string;
  description: string | null;
  currency: string;
  pre_money_valuation: number;
  investment_amount: number;
  base_shareholders: BaseShareholder[];
  clean_terms: DealTerms;
  exit_range: ExitRange;
  is_preset: boolean;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

function dbToScenario(db: DbScenario): ScenarioDefinition {
  return {
    id: db.slug,
    name: db.name,
    roundLabel: db.round_label,
    description: db.description || '',
    currency: db.currency,
    preMoneyValuation: db.pre_money_valuation,
    investmentAmount: db.investment_amount,
    baseShareholders: db.base_shareholders,
    cleanTerms: db.clean_terms,
    exitRange: db.exit_range,
    isPreset: db.is_preset,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export default function ScenariosPage() {
  const navigate = useNavigate();
  const loadScenario = useSimulatorStore(s => s.loadScenario);
  const { user } = useAuth();
  const [savedScenarios, setSavedScenarios] = useState<DbScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedScenarios([]);
      return;
    }
    setLoading(true);
    fetchUserScenarios(user.id)
      .then(data => setSavedScenarios((data || []) as unknown as DbScenario[]))
      .catch(err => console.error('Failed to fetch scenarios:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLaunch = (scenario: ScenarioDefinition) => {
    loadScenario(scenario);
    logEvent('scenario_launched', { id: scenario.id, name: scenario.name }, user?.id);
    navigate('/');
  };

  const handleDelete = async (dbId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(dbId);
    try {
      await deleteScenarioFromCloud(dbId);
      setSavedScenarios(prev => prev.filter(s => s.id !== dbId));
      logEvent('scenario_deleted', { id: dbId }, user?.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
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

        {/* ===== SAVED SCENARIOS ===== */}
        {user && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-foreground">Your Scenarios</h2>
              {loading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {!loading && savedScenarios.length === 0 && (
              <div className="bg-card border border-dashed border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground font-body mb-3">
                  No saved scenarios yet. Build a custom scenario to see it here.
                </p>
                <Link
                  to="/build"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-display font-semibold bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors"
                >
                  + Create one
                </Link>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedScenarios.map(dbScenario => (
                  <motion.div
                    key={dbScenario.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-primary/20 rounded-lg p-5 text-left group relative"
                  >
                    <button
                      onClick={() => handleLaunch(dbToScenario(dbScenario))}
                      className="w-full text-left"
                    >
                      <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {dbScenario.name}
                        </h3>
                        <span className="text-xs text-muted-foreground font-display">{dbScenario.round_label}</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display font-semibold">
                          Saved
                        </span>
                      </div>
                      {dbScenario.description && (
                        <p className="text-sm text-muted-foreground font-body mb-3 line-clamp-2">{dbScenario.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground font-display">
                        <span>{formatCurrency(dbScenario.pre_money_valuation)} pre</span>
                        <span>{formatCurrency(dbScenario.investment_amount)} raise</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(dbScenario.id, dbScenario.name)}
                      disabled={deletingId === dbScenario.id}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-display"
                      aria-label={`Delete ${dbScenario.name}`}
                    >
                      {deletingId === dbScenario.id ? '...' : '✕'}
                    </button>
                    <div className="text-[10px] text-muted-foreground/60 font-body mt-2">
                      Saved {new Date(dbScenario.updated_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </section>
        )}

        {!user && (
          <div className="bg-card border border-dashed border-border rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-body">
              Sign in to save custom scenarios and access them from any device.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-5 py-2 text-sm font-display font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        )}

        {/* ===== PRESETS ===== */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Preset Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleLaunch(scenario)}
                className="bg-card border border-border rounded-lg p-5 text-left hover:border-primary/50 hover:shadow-glow transition-all cursor-pointer group"
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {scenario.name}
                  </h3>
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
        </section>

        <LegalFootnote />
      </main>
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
