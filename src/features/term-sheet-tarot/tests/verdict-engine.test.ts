import { describe, expect, it } from "vitest";

import { CLAUSE_CATALOG, getCanonicalScenario } from "../data/scenarios";
import { computeOwnership } from "../domain/cap-table-engine";
import { applyClauseEffects } from "../domain/clause-effects";
import { computeControl } from "../domain/control-engine";
import { computeVerdicts } from "../domain/verdict-engine";

describe("computeVerdicts", () => {
  const scenario = getCanonicalScenario();

  it("returns no chips for the clean baseline", () => {
    const ownership = computeOwnership(
      scenario.baseShareholders,
      scenario.preMoneyValuation,
      scenario.investmentAmount,
      scenario.cleanTerms,
    );
    const control = computeControl(scenario.cleanTerms);

    expect(computeVerdicts(scenario.cleanTerms, scenario.cleanTerms, ownership, control)).toEqual([]);
  });

  it("flags dilution, economics, and control regressions together", () => {
    const proposedTerms = applyClauseEffects(scenario.cleanTerms, CLAUSE_CATALOG);
    const ownership = computeOwnership(
      scenario.baseShareholders,
      scenario.preMoneyValuation,
      scenario.investmentAmount,
      proposedTerms,
    );
    const control = computeControl(proposedTerms);

    expect(computeVerdicts(scenario.cleanTerms, proposedTerms, ownership, control)).toEqual([
      expect.objectContaining({ id: "pre-money-dilution", severity: "warning" }),
      expect.objectContaining({ id: "investor-double-dips", severity: "danger" }),
      expect.objectContaining({ id: "exit-proceeds-skewed", severity: "danger" }),
      expect.objectContaining({ id: "founder-majority-lost", severity: "danger" }),
      expect.objectContaining({ id: "investor-veto-rights", severity: "warning" }),
    ]);
  });
});
