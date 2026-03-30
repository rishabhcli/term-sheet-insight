import { describe, expect, it } from "vitest";

import { getCanonicalScenario } from "../data/scenarios";
import { computeControl } from "../domain/control-engine";
import { computeOwnership } from "../domain/cap-table-engine";
import { computeWaterfall } from "../domain/waterfall-engine";

describe("finance engine edge cases", () => {
  const scenario = getCanonicalScenario();

  it("caps the investor take at the exit value when preference exceeds proceeds", () => {
    const terms = {
      ...scenario.cleanTerms,
      liquidationPreferenceMultiple: 2,
      participationMode: "participating" as const,
    };
    const ownership = computeOwnership(
      scenario.baseShareholders,
      scenario.preMoneyValuation,
      scenario.investmentAmount,
      terms,
    );

    const waterfall = computeWaterfall(ownership, terms, scenario.investmentAmount, 4_000_000);

    expect(waterfall.investorTotalPayout).toBe(4_000_000);
    expect(waterfall.investorParticipationTake).toBe(0);
    expect(
      waterfall.holderPayouts.filter((holder) => holder.holderId !== "investor").every((holder) => holder.payout === 0),
    ).toBe(true);
  });

  it("supports investor-majority control states", () => {
    const control = computeControl({
      ...scenario.cleanTerms,
      board: { founderSeats: 1, investorSeats: 3, independentSeats: 0 },
      vetoRights: [],
    });

    expect(control.controlStatus).toBe("investor-leaning");
    expect(control.founderHasMajority).toBe(false);
    expect(control.explanation).toContain("Investor holds board majority");
  });
});
