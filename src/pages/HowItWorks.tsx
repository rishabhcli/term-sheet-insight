import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground">How It Works</h1>

        <div className="space-y-6 font-body text-foreground/90 leading-relaxed">
          <h2 className="font-display text-xl font-bold text-foreground">Ownership Calculation</h2>
          <p>
            Given a pre-money valuation and investment amount, the price per share is calculated as:
          </p>
          <code className="block bg-card border border-border rounded-lg p-4 font-display text-sm text-foreground">
            Price per share = Pre-money valuation ÷ Total pre-money shares
          </code>
          <p>
            Investor shares are then: Investment ÷ Price per share.
            Post-money ownership is each holder's shares divided by total post-money shares.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">The Hidden Pool (Pre-Money Option Pool Top-Up)</h2>
          <p>
            When a deal requires a target post-money option pool percentage, new shares are added
            to the pool <em>before</em> the round is priced. This dilutes existing common holders before the investor enters.
          </p>
          <code className="block bg-card border border-border rounded-lg p-4 font-display text-sm text-foreground whitespace-pre-wrap">
{`Additional pool shares = (t × (1 + r) × S − E) ÷ (1 − t × (1 + r))

Where:
  t = target post-money pool %
  r = investment ÷ pre-money valuation
  S = total pre-money shares (before top-up)
  E = existing pool shares`}
          </code>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Payout at Exit (Waterfall)</h2>
          <h3 className="font-display text-lg font-semibold text-foreground">Non-participating preferred (clean)</h3>
          <p>
            The investor receives the greater of their liquidation preference (investment × multiplier)
            or their as-converted pro rata share. If preference wins, remaining proceeds go to common holders.
            If conversion wins, all proceeds are distributed pro rata.
          </p>

          <h3 className="font-display text-lg font-semibold text-foreground">Participating preferred (double dip)</h3>
          <p>
            The investor first takes their full preference off the top (investment × multiplier).
            Then the investor <em>also</em> participates in remaining proceeds based on their ownership percentage.
            This is the "double dip" — they get preference <em>and</em> participation.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Control Model</h2>
          <p>
            Control status is derived from board seat counts and veto rights.
            If founders hold a majority of seats with no veto rights, control is "Founder-led."
            If the board is evenly split or the investor has veto rights, control is "Shared / investor blocking."
          </p>
          <p className="text-sm text-muted-foreground">
            This is a simplified educational model, not a legal opinion on governance.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Conservation</h2>
          <p>
            Total payouts always equal the exit value. No money is created or destroyed in the model.
          </p>
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}
