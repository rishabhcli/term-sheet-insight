import { useSimulatorStore } from '../state/simulator-store';

export function ControlSummary() {
  const { currentSnapshot } = useSimulatorStore();
  const { control } = currentSnapshot;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
        Board & Control
      </h2>

      {/* Seat strip */}
      <div className="flex gap-2" role="img" aria-label={`Board: ${control.founderSeats} founder, ${control.investorSeats} investor, ${control.independentSeats} independent seats`}>
        {Array.from({ length: control.founderSeats }).map((_, i) => (
          <div key={`f-${i}`} className="w-8 h-8 rounded bg-payout-founder flex items-center justify-center text-xs font-display font-bold text-primary-foreground" title="Founder seat">
            F
          </div>
        ))}
        {Array.from({ length: control.investorSeats }).map((_, i) => (
          <div key={`i-${i}`} className="w-8 h-8 rounded bg-payout-investor flex items-center justify-center text-xs font-display font-bold text-primary-foreground" title="Investor seat">
            I
          </div>
        ))}
        {Array.from({ length: control.independentSeats }).map((_, i) => (
          <div key={`ind-${i}`} className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-display font-bold text-muted-foreground" title="Independent seat">
            ?
          </div>
        ))}
      </div>

      {/* Veto chips */}
      {control.investorBlockingRights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {control.investorBlockingRights.map(right => (
            <span key={right} className="px-2 py-0.5 rounded-full bg-clause-control/15 text-clause-control text-xs font-display border border-clause-control/30">
              Veto: {right}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground font-body">{control.explanation}</p>
    </div>
  );
}
