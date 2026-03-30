import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Library, Sparkles } from 'lucide-react';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { AuthDialog } from '../features/term-sheet-tarot/components/AuthDialog';
import { PRESET_SCENARIOS } from '../features/term-sheet-tarot/data/scenarios';
import { useSimulatorStore } from '../features/term-sheet-tarot/state/simulator-store';
import { useAuth } from '../features/term-sheet-tarot/hooks/useAuth';
import { fetchUserScenarios, deleteScenarioFromCloud } from '../features/term-sheet-tarot/services/supabase-service';
import { trackEvent } from '../features/term-sheet-tarot/services/observability';
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
    trackEvent({ type: 'page_view', page: '/scenarios' }, user?.id);
    if (!user) { setSavedScenarios([]); return; }
    setLoading(true);
    fetchUserScenarios(user.id)
      .then(data => setSavedScenarios((data || []) as unknown as DbScenario[]))
      .catch(err => console.error('Failed to fetch scenarios:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLaunch = (scenario: ScenarioDefinition) => {
    loadScenario(scenario);
    navigate('/');
  };

  const handleDelete = async (dbId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(dbId);
    try {
      await deleteScenarioFromCloud(dbId);
      setSavedScenarios(prev => prev.filter(s => s.id !== dbId));
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
        {/* Hero header */}
        <div className="relative">
          <div className="absolute -top-6 left-1/3 w-1/3 h-24 bg-primary/4 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Library className="w-3.5 h-3.5 text-primary" />
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Scenario Library</h1>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Choose a preset scenario to explore, or build your own.
              </p>
            </div>
            <Link
              to="/build"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-heading text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-glow whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Build Custom
            </Link>
          </div>
        </div>

        {/* ===== SAVED SCENARIOS ===== */}
        {user && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Your Scenarios</h2>
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {!loading && savedScenarios.length === 0 && (
              <div className="glass-surface rounded-xl p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground font-body mb-3">
                  No saved scenarios yet. Build one to see it here.
                </p>
                <Link
                  to="/build"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-heading font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create one
                </Link>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedScenarios.map(dbScenario => (
                  <motion.div
                    key={dbScenario.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-surface rounded-xl p-5 text-left group relative overflow-hidden border-primary/10"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    <button onClick={() => handleLaunch(dbToScenario(dbScenario))} className="w-full text-left">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                          {dbScenario.name}
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-display">{dbScenario.round_label}</span>
                        <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display font-semibold tracking-wide">
                          SAVED
                        </span>
                      </div>
                      {dbScenario.description && (
                        <p className="text-[12px] text-muted-foreground font-body mb-3 line-clamp-2">{dbScenario.description}</p>
                      )}
                      <div className="flex gap-4 text-[11px] text-muted-foreground font-display tabular-nums">
                        <span>{formatCurrency(dbScenario.pre_money_valuation)} pre</span>
                        <span>{formatCurrency(dbScenario.investment_amount)} raise</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(dbScenario.id, dbScenario.name)}
                      disabled={deletingId === dbScenario.id}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${dbScenario.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[9px] text-muted-foreground/50 font-body mt-2">
                      Saved {new Date(dbScenario.updated_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </section>
        )}

        {!user && (
          <div className="glass-surface rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-dashed border-border/30">
            <p className="text-sm text-muted-foreground font-body">
              Sign in to save custom scenarios and access them from any device.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-5 py-2 text-sm font-heading font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-glow whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        )}

        {/* ===== PRESETS ===== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-muted">
              <Library className="w-3 h-3 text-muted-foreground" />
            </div>
            <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">Preset Scenarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleLaunch(scenario)}
                className="glass-surface rounded-xl p-5 text-left hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/4 to-transparent group-hover:via-primary/15 transition-all" />
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                    {scenario.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-display">{scenario.roundLabel}</span>
                </div>
                <p className="text-[12px] text-muted-foreground font-body mb-3 leading-relaxed">{scenario.description}</p>
                <div className="flex gap-4 text-[11px] text-muted-foreground font-display tabular-nums">
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
