import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSimulatorStore } from '../state/simulator-store';
import { saveScenarioToCloud, saveSnapshotToCloud, createShareLink, logEvent } from '../services/supabase-service';
import { copyText, copyTextWithPromptFallback } from '../services/clipboard';
import { exportTermSheetPDF } from '../services/pdf-export';
import { AuthDialog } from './AuthDialog';
import { Save, Link2, FileDown, Printer, RotateCcw, Check } from 'lucide-react';

export function ResetControls() {
  const { activeClauseIds, resetToClean, scenario, exitValue, currentSnapshot } = useSimulatorStore();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const hasDirty = activeClauseIds.length > 0;

  const handleShare = () => {
    const params = new URLSearchParams();
    params.set('scenario', scenario.id);
    if (activeClauseIds.length > 0) params.set('clauses', activeClauseIds.join(','));
    params.set('exit', String(exitValue));
    const url = `${window.location.origin}/?${params.toString()}`;
    copyTextWithPromptFallback(url).then((copied) => {
      if (!copied) return;
      setShareUrl(url);
      logEvent('share_link_created', { method: 'query-param', scenario: scenario.id }, user?.id);
      setTimeout(() => setShareUrl(null), 3000);
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
      await copyText(share.url);
      logEvent('snapshot_saved', { scenario: scenario.id, clauses: activeClauseIds }, user.id);
      setTimeout(() => setShareUrl(null), 5000);
    } catch (err) {
      console.error('Save failed:', err);
      handleShare();
    } finally {
      setSaving(false);
    }
  };

  const handlePDF = () => {
    logEvent('pdf_export', { scenario: scenario.id, clauses: activeClauseIds }, user?.id);
    const cleanSnap = useSimulatorStore.getState().cleanSnapshot;
    exportTermSheetPDF(scenario, cleanSnap, currentSnapshot, activeClauseIds, exitValue);
  };

  const handlePrint = () => {
    logEvent('export_triggered', { scenario: scenario.id }, user?.id);
    window.print();
  };

  const btnBase = "inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-heading font-semibold rounded-lg transition-all duration-200 min-h-[40px]";

  return (
    <>
      <div className="flex flex-wrap gap-2 no-print">
        {hasDirty && (
          <button onClick={resetToClean} className={`${btnBase} bg-secondary text-secondary-foreground hover:bg-accent border border-border/40`}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
        <button
          onClick={handleCloudSave}
          disabled={saving}
          className={`${btnBase} bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow disabled:opacity-50`}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : user ? 'Save & share' : 'Sign in to save'}
        </button>
        <button onClick={handleShare} className={`${btnBase} border border-border/40 text-foreground/80 hover:text-foreground hover:bg-accent`}>
          <Link2 className="w-3.5 h-3.5" />
          Copy link
        </button>
        <button onClick={handlePDF} className={`${btnBase} border border-primary/20 text-primary hover:bg-primary/8`}>
          <FileDown className="w-3.5 h-3.5" />
          Export PDF
        </button>
        <button onClick={handlePrint} className={`${btnBase} border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent`}>
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>
      {shareUrl && (
        <div className="flex items-center gap-1.5 text-[11px] text-metric-positive font-display mt-2">
          <Check className="w-3 h-3" />
          Link copied to clipboard
        </div>
      )}
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
