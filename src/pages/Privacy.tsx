import { AppHeader } from '../features/term-sheet-tarot/components/AppHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
        <div className="font-body text-foreground/90 leading-relaxed space-y-4">
          <p>Term Sheet Tarot is an educational simulator. We respect your privacy.</p>
          <p>The core simulator runs entirely in your browser. No financial data is sent to any server during simulation.</p>
          <p>If you save scenarios or create share links, that data is stored securely and associated with your session. We do not sell or share your data with third parties.</p>
          <p>We may collect anonymous usage analytics (page views, feature interactions) to improve the product. No personally identifiable information is collected without your consent.</p>
          <p>Cookies may be used for session management and preferences. You can clear them at any time.</p>
          <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
        </div>
      </main>
    </div>
  );
}
