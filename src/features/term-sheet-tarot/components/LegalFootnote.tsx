import { Link } from 'react-router-dom';

export function LegalFootnote() {
  return (
    <footer className="mt-12 py-8 border-t border-border/30 no-print">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[10px] text-muted-foreground/60 font-body text-center sm:text-left">
          Educational & illustrative only — not legal or financial advice.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground font-body transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground font-body transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
