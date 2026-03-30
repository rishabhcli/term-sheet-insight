import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency } from '../domain/formatting';
import { SlidersHorizontal } from 'lucide-react';

export function ExitSliderPanel() {
  const { scenario, exitValue, setExitValue } = useSimulatorStore();
  const { min, max, step } = scenario.exitRange;

  // Calculate percentage for track fill
  const pct = ((exitValue - min) / (max - min)) * 100;

  return (
    <div className="glass-surface rounded-xl p-5 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10">
            <SlidersHorizontal className="w-3 h-3 text-primary" />
          </div>
          <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">
            Exit Value
          </h2>
        </div>
        <span className="font-heading text-lg font-bold text-foreground tabular-nums">
          {formatCurrency(exitValue)}
        </span>
      </div>

      {/* Custom slider */}
      <div className="relative">
        {/* Track fill */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-primary/30 pointer-events-none transition-all" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={exitValue}
          onChange={e => setExitValue(Number(e.target.value))}
          className="w-full h-6 cursor-pointer touch-manipulation relative z-10"
          style={{ background: 'transparent' }}
          aria-label={`Exit value: ${formatCurrency(exitValue)}`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-display tabular-nums">
        <span>{formatCurrency(min)}</span>
        <span className="text-muted-foreground/40">|</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}
