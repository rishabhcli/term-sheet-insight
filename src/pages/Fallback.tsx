import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { buildSnapshot } from '../features/term-sheet-tarot/domain/snapshot-builder';
import { CLAUSE_CATALOG, getCanonicalScenario } from '../features/term-sheet-tarot/data/scenarios';
import { formatCurrency, formatPercent } from '../features/term-sheet-tarot/domain/formatting';
import type { DealSnapshot } from '../features/term-sheet-tarot/domain/types';

const scenario = getCanonicalScenario();
const EXIT = 30_000_000;

const scenes: { title: string; description: string; clauseIds: string[]; snapshot: DealSnapshot }[] = [
  {
    title: 'Baseline — Clean Deal',
    description: 'No adverse terms. Founders retain majority ownership and control.',
    clauseIds: [],
    snapshot: buildSnapshot(scenario, [], CLAUSE_CATALOG, EXIT),
  },
  {
    title: 'The Double Dip',
    description: '2x participating preferred. Investor takes preference off the top, then participates in remaining proceeds.',
    clauseIds: ['double-dip'],
    snapshot: buildSnapshot(scenario, ['double-dip'], CLAUSE_CATALOG, EXIT),
  },
  {
    title: 'Double Dip + Hidden Pool',
    description: 'Participation plus pre-money pool top-up. Founders get diluted before the investor enters, and the investor double-dips at exit.',
    clauseIds: ['double-dip', 'hidden-pool'],
    snapshot: buildSnapshot(scenario, ['double-dip', 'hidden-pool'], CLAUSE_CATALOG, EXIT),
  },
  {
    title: 'Full Dirty Deal',
    description: 'All three clauses active. Maximum economic and control impact.',
    clauseIds: ['double-dip', 'hidden-pool', 'crown-seat'],
    snapshot: buildSnapshot(scenario, ['double-dip', 'hidden-pool', 'crown-seat'], CLAUSE_CATALOG, EXIT),
  },
];

export default function FallbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {scenario.name} — {scenario.roundLabel}
          </h1>
          <p className="text-muted-foreground font-body">
            {formatCurrency(scenario.preMoneyValuation)} pre-money · {formatCurrency(scenario.investmentAmount)} raise · Exit at {formatCurrency(EXIT)}
          </p>
        </div>

        <div className="space-y-6">
          {scenes.map((scene, i) => {
            const founderOwnership = scene.snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
            const investorPayout = scene.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'investor');
            const founderPayout = scene.snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');

            return (
              <div key={i} className="bg-card border border-border rounded-lg p-6 shadow-card">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">{scene.title}</h2>
                <p className="text-sm text-muted-foreground font-body mb-4">{scene.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Founder Ownership</div>
                    <div className="font-display text-lg font-bold text-foreground">{formatPercent(founderOwnership?.percentage ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Investor Payout</div>
                    <div className="font-display text-lg font-bold text-payout-investor">{formatCurrency(investorPayout?.payout ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Founder Payout</div>
                    <div className="font-display text-lg font-bold text-payout-founder">{formatCurrency(founderPayout?.payout ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Control</div>
                    <div className={`font-display text-lg font-bold ${
                      scene.snapshot.control.controlStatus === 'founder-led' ? 'text-metric-positive' : 'text-clause-economics'
                    }`}>
                      {scene.snapshot.control.controlStatus === 'founder-led' ? 'Founder-led' : 'Shared / investor blocking'}
                    </div>
                  </div>
                </div>

                {scene.snapshot.verdictChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {scene.snapshot.verdictChips.map(chip => (
                      <span key={chip.id} className="px-2.5 py-0.5 rounded-full text-xs font-display font-semibold bg-clause-economics/15 text-clause-economics border border-clause-economics/30">
                        {chip.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}
