import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';
import { LegalFootnote } from '../features/term-sheet-tarot/components/LegalFootnote';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground">About Term Sheet Tarot</h1>

        <div className="space-y-6 font-body text-foreground/90 leading-relaxed">
          <p>
            <strong className="text-foreground">Term Sheet Tarot</strong> is a clause-reveal simulator for startup financing.
            It helps founders see what specific deal terms do to their ownership, payout at exit, and board control — instantly.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-2">Who is it for?</h2>
          <p>
            First-time founders evaluating a venture round. Mentors and coaches explaining deal mechanics.
            Anyone who wants to understand the gap between the deal they think they have and the deal they actually signed.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-2">What it does</h2>
          <p>
            You start with a clean deal — standard 1x non-participating preferred, no pool top-up, founder-led board.
            Then you activate clause cards. Each card changes one dimension of the deal. The consequences appear immediately:
            ownership shifts, payout shifts, control shifts.
          </p>
          <p>
            The product identity in one sentence: <em className="text-primary">Move one clause, watch the deal change.</em>
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-2">What it does not do</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>It is not legal advice.</li>
            <li>It is not a cap table manager.</li>
            <li>It does not parse PDFs or real term sheets.</li>
            <li>It does not use AI to explain terms — the interaction is the explanation.</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-2">Why it exists</h2>
          <p>
            Founders often understand the headline valuation of a round but miss what specific clauses do.
            A 2x participating preference with a pre-money pool top-up can dramatically reshape who gets paid at exit.
            This product makes that visible in seconds.
          </p>
        </div>

        <LegalFootnote />
      </main>
    </div>
  );
}
