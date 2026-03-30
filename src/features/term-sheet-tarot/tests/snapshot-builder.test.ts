import { describe, expect, it, vi } from "vitest";

import { CLAUSE_CATALOG, getCanonicalScenario } from "../data/scenarios";
import { buildSnapshot } from "../domain/snapshot-builder";

describe("buildSnapshot", () => {
  const scenario = getCanonicalScenario();

  it("creates a deterministic snapshot with changed term rows and verdict chips", () => {
    vi.spyOn(Date, "now").mockReturnValue(123_456_789);

    const snapshot = buildSnapshot(
      scenario,
      ["hidden-pool", "double-dip"],
      CLAUSE_CATALOG,
      30_000_000,
    );

    expect(snapshot.scenarioId).toBe(scenario.id);
    expect(snapshot.activeClauseIds).toEqual(["hidden-pool", "double-dip"]);
    expect(snapshot.generatedAt).toBe(123_456_789);
    expect(snapshot.dirtyLevel).toBe(2);
    expect(snapshot.termRows.filter((row) => row.changed).map((row) => row.label)).toEqual([
      "Liquidation preference",
      "Participation",
      "Option pool",
    ]);
    expect(snapshot.verdictChips.map((chip) => chip.id)).toEqual([
      "pre-money-dilution",
      "investor-double-dips",
      "exit-proceeds-skewed",
    ]);
    expect(snapshot.waterfall.holderPayouts.reduce((sum, holder) => sum + holder.payout, 0)).toBeCloseTo(
      30_000_000,
      0,
    );
  });

  it("keeps all term rows unchanged for a clean scenario", () => {
    const snapshot = buildSnapshot(scenario, [], CLAUSE_CATALOG, scenario.exitRange.default);

    expect(snapshot.dirtyLevel).toBe(0);
    expect(snapshot.termRows.every((row) => row.changed === false)).toBe(true);
  });
});
