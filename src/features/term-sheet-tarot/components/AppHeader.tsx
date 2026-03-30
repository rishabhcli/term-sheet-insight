import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AuthDialog } from './AuthDialog';

export function AppHeader({ minimal = false }: { minimal?: boolean }) {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <span className="font-display text-lg font-bold text-primary whitespace-nowrap">Term Sheet Tarot</span>
            {!minimal && (
              <span className="hidden lg:inline text-xs text-muted-foreground font-body truncate">
                A clause-reveal simulator for startup deals
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            {/* Desktop nav */}
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

            {/* Auth button */}
            {!loading && (
              <div className="no-print">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-body hidden sm:inline truncate max-w-[120px]">
                      {user.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-xs text-muted-foreground hover:text-foreground font-display px-2 py-1.5 rounded border border-border hover:bg-accent transition-colors"
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

            {/* Mobile hamburger */}
            {!minimal && (
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && !minimal && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border bg-card"
              aria-label="Mobile navigation"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-3 text-sm font-body rounded-md transition-colors ${
                      location.pathname === link.to
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
