import { Link, useLocation } from 'react-router-dom';

export function AppHeader({ minimal = false }: { minimal?: boolean }) {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Simulator' },
    { to: '/scenarios', label: 'Scenarios' },
    { to: '/about', label: 'About' },
    { to: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 no-print">
      <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-primary">Term Sheet Tarot</span>
          {!minimal && (
            <span className="hidden md:inline text-xs text-muted-foreground font-body">
              A clause-reveal simulator for startup deals
            </span>
          )}
        </Link>
        {!minimal && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm font-body rounded-md transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
