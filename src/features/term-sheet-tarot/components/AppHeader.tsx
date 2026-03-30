import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '../hooks/useAuth';
import { AuthDialog } from './AuthDialog';

export function AppHeader({ minimal = false }: { minimal?: boolean }) {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  const navLinks = [
    { to: '/', label: 'Simulator' },
    { to: '/scenarios', label: 'Scenarios' },
    { to: '/about', label: 'About' },
    { to: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <>
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-50 no-print">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            {/* Logo mark */}
            <div className="relative w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
              <span className="text-gold-shimmer font-display text-sm font-bold">T</span>
              <div className="absolute -top-px -right-px w-2 h-2 rounded-full bg-primary/60" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading text-base font-bold text-foreground tracking-tight whitespace-nowrap">
                Term Sheet Tarot
              </span>
              {!minimal && (
                <span className="hidden lg:block text-[10px] text-muted-foreground font-body tracking-wide truncate">
                  Clause-reveal simulator
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Desktop nav */}
            {!minimal && (
              <nav className="hidden md:flex items-center gap-0.5 bg-secondary/50 rounded-lg p-1" aria-label="Main navigation">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 text-xs font-heading font-medium rounded-md transition-all duration-200 ${
                      location.pathname === link.to
                        ? 'text-primary-foreground bg-primary shadow-glow'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Auth */}
            {!loading && (
              <div className="no-print ml-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 border border-border/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-metric-positive animate-pulse" />
                      <span className="text-[11px] text-muted-foreground font-body truncate max-w-[100px]">
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-heading px-2.5 py-1.5 rounded-md border border-border/40 hover:bg-accent hover:border-border transition-all"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="text-[11px] font-heading font-semibold px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow"
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
              className="md:hidden overflow-hidden border-t border-border/40 bg-card/95 backdrop-blur-xl"
              aria-label="Mobile navigation"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-3 text-sm font-heading rounded-md transition-colors ${
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
