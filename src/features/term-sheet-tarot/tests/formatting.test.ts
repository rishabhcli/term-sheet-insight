import { describe, expect, it } from "vitest";

import { getCanonicalScenario } from "../data/scenarios";
import {
  formatBoard,
  formatCurrency,
  formatParticipation,
  formatPercent,
  formatPoolTreatment,
  formatShareCount,
} from "../domain/formatting";

describe("formatting helpers", () => {
  const cleanTerms = getCanonicalScenario().cleanTerms;

  it("formats currency across unit boundaries", () => {
    expect(formatCurrency(950)).toBe("$950");
    expect(formatCurrency(25_000)).toBe("$25K");
    expect(formatCurrency(5_500_000)).toBe("$5.50M");
    expect(formatCurrency(2_000_000_000)).toBe("$2.0B");
  });

  it("formats percentages and share counts consistently", () => {
    expect(formatPercent(20)).toBe("20%");
    expect(formatPercent(20.456)).toBe("20.46%");
    expect(formatShareCount(999)).toBe("999");
    expect(formatShareCount(12_500)).toBe("13K");
    expect(formatShareCount(5_200_000)).toBe("5.20M");
  });

  it("formats participation, pool treatment, and board text", () => {
    expect(formatParticipation("participating")).toBe("Full participation");
    expect(formatParticipation("non-participating")).toBe("Non-participating");
    expect(formatPoolTreatment(cleanTerms)).toBe("No top-up");
    expect(
      formatPoolTreatment({
        ...cleanTerms,
        optionPoolTiming: "pre-money-top-up",
        optionPoolTargetPostMoneyPct: 0.15,
      }),
    ).toBe("15% pre-money top-up");
    expect(formatBoard(cleanTerms)).toBe("2F / 1I");
    expect(
      formatBoard({
        ...cleanTerms,
        board: { founderSeats: 2, investorSeats: 2, independentSeats: 1 },
        vetoRights: ["sale"],
      }),
    ).toBe("2F / 2I / 1Ind + veto");
  });
});
