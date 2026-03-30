import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';
import { getShareLinkBySlug } from '../features/term-sheet-tarot/services/supabase-service';
import { formatCurrency, formatPercent } from '../features/term-sheet-tarot/domain/formatting';
import type { DealSnapshot } from '../features/term-sheet-tarot/domain/types';

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>();
  const [snapshot, setSnapshot] = useState<DealSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getShareLinkBySlug(slug)
      .then(data => {
        if (data?.scenario_snapshots?.snapshot_payload) {
          setSnapshot(data.scenario_snapshots.snapshot_payload as unknown as DealSnapshot);
        } else {
          setError('Snapshot not found');
        }
      })
      .catch(() => setError('Share link not found or expired'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader minimal />
        <div className="flex items-center justify-center h-64">
          <span className="text-muted-foreground font-display">Loading shared scenario...</span>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader minimal />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="text-muted-foreground font-display text-lg">{error || 'Not found'}</span>
          <a href="/" className="text-sm text-primary font-display hover:underline">Open simulator →</a>
        </div>
      </div>
    );
  }

  const founderOwnership = snapshot.ownership.holderPercentages.find(h => h.holderId === 'founders');
  const investorPayout = snapshot.waterfall.holderPayouts.find(h => h.holderId === 'investor');
  const founderPayout = snapshot.waterfall.holderPayouts.find(h => h.holderId === 'founders');

  const controlLabel = snapshot.control.controlStatus === 'founder-led' ? 'Founder-led'
    : snapshot.control.controlStatus === 'shared' ? 'Shared / investor blocking'
    : 'Investor-leaning';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader minimal />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-center">
          <span className="text-sm font-display text-primary">Shared scenario snapshot</span>
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Deal Snapshot
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Exit at {formatCurrency(snapshot.waterfall.exitValue)} · {snapshot.activeClauseIds.length} clause{snapshot.activeClauseIds.length !== 1 ? 's' : ''} active
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Founder Ownership</div>
            <div className="font-display text-xl font-bold text-foreground mt-1">{formatPercent(founderOwnership?.percentage ?? 0)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Investor Payout</div>
            <div className="font-display text-xl font-bold text-payout-investor mt-1">{formatCurrency(investorPayout?.payout ?? 0)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Founder Payout</div>
            <div className="font-display text-xl font-bold text-payout-founder mt-1">{formatCurrency(founderPayout?.payout ?? 0)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Control</div>
            <div className={`font-display text-lg font-bold mt-1 ${
              snapshot.control.controlStatus === 'founder-led' ? 'text-metric-positive' : 'text-clause-economics'
            }`}>{controlLabel}</div>
          </div>
        </div>

        {snapshot.verdictChips.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {snapshot.verdictChips.map(chip => (
              <span key={chip.id} className="px-3 py-1 rounded-full text-xs font-display font-semibold bg-clause-economics/15 text-clause-economics border border-clause-economics/30">
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <a href="/" className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:bg-primary/90 transition-colors">
            Open in simulator →
          </a>
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}
