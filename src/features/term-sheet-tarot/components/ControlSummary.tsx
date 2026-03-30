import { useSimulatorStore } from '../state/simulator-store';
import { Users } from 'lucide-react';

export function ControlSummary() {
  const { currentSnapshot } = useSimulatorStore();
  const { control } = currentSnapshot;

  return (
    <div className="glass-surface rounded-xl p-5 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10">
          <Users className="w-3 h-3 text-primary" />
        </div>
        <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground">
          Board & Control
        </h2>
      </div>

      {/* Seat strip */}
      <div className="flex gap-1.5" role="img" aria-label={`Board: ${control.founderSeats} founder, ${control.investorSeats} investor, ${control.independentSeats} independent seats`}>
        {Array.from({ length: control.founderSeats }).map((_, i) => (
          <div key={`f-${i}`} className="w-9 h-9 rounded-lg bg-payout-founder/20 border border-payout-founder/30 flex items-center justify-center text-[10px] font-display font-bold text-payout-founder" title="Founder seat">
            F
          </div>
        ))}
        {Array.from({ length: control.investorSeats }).map((_, i) => (
          <div key={`i-${i}`} className="w-9 h-9 rounded-lg bg-payout-investor/20 border border-payout-investor/30 flex items-center justify-center text-[10px] font-display font-bold text-payout-investor" title="Investor seat">
            I
          </div>
        ))}
        {Array.from({ length: control.independentSeats }).map((_, i) => (
          <div key={`ind-${i}`} className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-[10px] font-display font-bold text-muted-foreground" title="Independent seat">
            ?
          </div>
        ))}
      </div>

      {/* Veto chips */}
      {control.investorBlockingRights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {control.investorBlockingRights.map(right => (
            <span key={right} className="px-2.5 py-1 rounded-lg bg-clause-control/8 text-clause-control text-[10px] font-display font-semibold border border-clause-control/15">
              Veto: {right}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/80 font-body leading-relaxed">{control.explanation}</p>
    </div>
  );
}
