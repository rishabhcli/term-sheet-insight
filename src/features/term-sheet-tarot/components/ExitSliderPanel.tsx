import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency } from '../domain/formatting';

export function ExitSliderPanel() {
  const { scenario, exitValue, setExitValue } = useSimulatorStore();
  const { min, max, step } = scenario.exitRange;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          Exit Value
        </h2>
        <span className="font-display text-lg font-bold text-foreground">
          {formatCurrency(exitValue)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={exitValue}
        onChange={e => setExitValue(Number(e.target.value))}
        className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary
          [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_hsla(38,70%,55%,0.4)]"
        aria-label={`Exit value: ${formatCurrency(exitValue)}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground font-display">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}
