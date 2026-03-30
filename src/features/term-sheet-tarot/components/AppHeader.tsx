import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthDialog } from './AuthDialog';

export function AppHeader({ minimal = false }: { minimal?: boolean }) {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const navLinks = [
    { to: '/', label: 'Simulator' },
    { to: '/scenarios', label: 'Scenarios' },
    { to: '/about', label: 'About' },
    { to: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <>
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
          <div className="flex items-center gap-4">
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
            {!loading && (
              <div className="no-print">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-body hidden sm:inline">
                      {user.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-xs text-muted-foreground hover:text-foreground font-display px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="text-xs font-display font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
