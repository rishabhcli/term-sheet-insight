import { useSimulatorStore } from '../state/simulator-store';
import { formatCurrency } from '../domain/formatting';

export function ScenarioHeader() {
  const { scenario, exitValue } = useSimulatorStore();
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h1 className="font-display text-2xl font-bold text-foreground">
        {scenario.name}
        <span className="text-muted-foreground font-normal ml-2">— {scenario.roundLabel}</span>
      </h1>
      <div className="text-sm text-muted-foreground font-body">
        {formatCurrency(scenario.preMoneyValuation)} pre-money · {formatCurrency(scenario.investmentAmount)} raise
      </div>
    </div>
  );
}
