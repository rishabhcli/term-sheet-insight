import { useSimulatorStore } from '../state/simulator-store';
import { useLocation, useNavigate } from 'react-router-dom';

export function ResetControls() {
  const { activeClauseIds, resetToClean, scenario, exitValue } = useSimulatorStore();
  const navigate = useNavigate();
  const hasDirty = activeClauseIds.length > 0;

  const handleShare = () => {
    const params = new URLSearchParams();
    params.set('scenario', scenario.id);
    if (activeClauseIds.length > 0) params.set('clauses', activeClauseIds.join(','));
    params.set('exit', String(exitValue));
    const url = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard');
    }).catch(() => {
      prompt('Copy this link:', url);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
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
        onClick={handleShare}
        className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
      >
        Share link
      </button>
      <button
        onClick={handlePrint}
        className="px-4 py-2 text-sm font-display font-semibold rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
      >
        Export / Print
      </button>
    </div>
  );
}
