import { describe, expect, it } from "vitest";

import { getCanonicalScenario } from "../data/scenarios";
import { applyClauseEffects } from "../domain/clause-effects";
import type { ClauseDefinition } from "../domain/types";

describe("applyClauseEffects", () => {
  const cleanTerms = getCanonicalScenario().cleanTerms;

  it("returns a new immutable terms object", () => {
    const clause: ClauseDefinition = {
      id: "board-reset",
      arcanaName: "Board Reset",
      subtitle: "Shift board control",
      category: "control",
      descriptionShort: "Moves one seat to the investor and adds a veto.",
      effects: {
        board: { founderSeats: 1, investorSeats: 2, independentSeats: 0 },
        vetoRights: ["sale"],
      },
      warningTemplates: [],
      displayOrder: 99,
    };

    const result = applyClauseEffects(cleanTerms, [clause]);

    expect(result).not.toBe(cleanTerms);
    expect(result.board).not.toBe(cleanTerms.board);
    expect(result.vetoRights).not.toBe(cleanTerms.vetoRights);
    expect(cleanTerms.board).toEqual({ founderSeats: 2, investorSeats: 1, independentSeats: 0 });
    expect(cleanTerms.vetoRights).toEqual([]);
  });

  it("composes multiple clauses with later effects winning for the same field", () => {
    const clauses: ClauseDefinition[] = [
      {
        id: "light-pref",
        arcanaName: "Light Preference",
        subtitle: "1.5x preference",
        category: "economics",
        descriptionShort: "Raises liquidation preference.",
        effects: {
          liquidationPreferenceMultiple: 1.5,
          participationMode: "non-participating",
        },
        warningTemplates: [],
        displayOrder: 1,
      },
      {
        id: "heavy-pref",
        arcanaName: "Heavy Preference",
        subtitle: "2x participating",
        category: "economics",
        descriptionShort: "Overrides the economic terms again.",
        effects: {
          liquidationPreferenceMultiple: 2,
          participationMode: "participating",
        },
        warningTemplates: [],
        displayOrder: 2,
      },
    ];

    const result = applyClauseEffects(cleanTerms, clauses);

    expect(result.liquidationPreferenceMultiple).toBe(2);
    expect(result.participationMode).toBe("participating");
  });
});
