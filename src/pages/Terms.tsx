import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Terms & Disclaimer</h1>
        <div className="font-body text-foreground/90 leading-relaxed space-y-4">
          <p>Term Sheet Tarot is provided as an educational tool. It is not legal advice, financial advice, or a substitute for professional counsel.</p>
          <p>The calculations presented are simplified models intended to illustrate the directional impact of common venture financing terms. Real financing structures may involve additional complexities not captured by this tool.</p>
          <p>You should consult with qualified legal and financial advisors before making any financing decisions.</p>
          <p>The tool is provided "as is" without warranty of any kind. We are not liable for any decisions made based on the outputs of this simulator.</p>
          <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
        </div>
      </main>
    </div>
  );
}
