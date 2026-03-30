import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSimulatorStore } from '../state/simulator-store';
import { saveScenarioToCloud, saveSnapshotToCloud, createShareLink, logEvent } from '../services/supabase-service';
import { AuthDialog } from './AuthDialog';

export function ResetControls() {
  const { activeClauseIds, resetToClean, scenario, exitValue, currentSnapshot } = useSimulatorStore();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const hasDirty = activeClauseIds.length > 0;

  const handleShare = () => {
    // Always support query-param fallback
    const params = new URLSearchParams();
    params.set('scenario', scenario.id);
    if (activeClauseIds.length > 0) params.set('clauses', activeClauseIds.join(','));
    params.set('exit', String(exitValue));
    const url = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareUrl(url);
      logEvent('share_link_created', { method: 'query-param', scenario: scenario.id }, user?.id);
      setTimeout(() => setShareUrl(null), 3000);
    }).catch(() => {
      prompt('Copy this link:', url);
    });
  };

  const handleCloudSave = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setSaving(true);
    try {
      await saveScenarioToCloud(scenario, user.id);
      const snapshot = await saveSnapshotToCloud(scenario.id, currentSnapshot, exitValue, user.id);
      const share = await createShareLink(snapshot.id, user.id);
      setShareUrl(share.url);
      await navigator.clipboard.writeText(share.url);
      logEvent('snapshot_saved', { scenario: scenario.id, clauses: activeClauseIds }, user.id);
      setTimeout(() => setShareUrl(null), 5000);
    } catch (err) {
      console.error('Save failed:', err);
      // Fall back to query param share
      handleShare();
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    logEvent('export_triggered', { scenario: scenario.id }, user?.id);
    window.print();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 no-print">
        {hasDirty && (
          <button
            onClick={resetToClean}
            className="px-4 py-2 text-sm font-display font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Reset to clean
          </button>
        )}
        <button
          onClick={handleCloudSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : user ? 'Save & share' : 'Sign in to save'}
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
        >
          Copy link
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
        >
          Export / Print
        </button>
      </div>
      {shareUrl && (
        <div className="text-xs text-metric-positive font-display mt-1">
          ✓ Link copied to clipboard
        </div>
      )}
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
