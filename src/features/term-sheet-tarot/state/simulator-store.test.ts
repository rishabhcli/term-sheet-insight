import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCanonicalScenario, PRESET_SCENARIOS } from "../data/scenarios";
import { useSimulatorStore } from "./simulator-store";

describe("simulator store", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads a scenario and clears prior clause state", () => {
    const scenario = PRESET_SCENARIOS[1];

    useSimulatorStore.getState().toggleClause("double-dip");
    useSimulatorStore.getState().loadScenario(scenario);

    const state = useSimulatorStore.getState();
    expect(state.scenarioId).toBe(scenario.id);
    expect(state.activeClauseIds).toEqual([]);
    expect(state.exitValue).toBe(scenario.exitRange.default);
    expect(state.currentSnapshot.scenarioId).toBe(scenario.id);
  });

  it("toggles clauses, updates exit values, and resets back to the clean snapshot", () => {
    const initial = useSimulatorStore.getState().currentSnapshot.generatedAt;

    useSimulatorStore.getState().toggleClause("hidden-pool");
    useSimulatorStore.getState().setExitValue(45_000_000);

    let state = useSimulatorStore.getState();
    expect(state.activeClauseIds).toEqual(["hidden-pool"]);
    expect(state.exitValue).toBe(45_000_000);
    expect(state.currentSnapshot.generatedAt).toBeGreaterThanOrEqual(initial);

    useSimulatorStore.getState().resetToClean();

    state = useSimulatorStore.getState();
    expect(state.activeClauseIds).toEqual([]);
    expect(state.exitValue).toBe(state.scenario.exitRange.default);
    expect(state.currentSnapshot).toEqual(state.cleanSnapshot);
  });

  it("initializes demo mode from the canonical scenario", () => {
    useSimulatorStore.getState().initializeDemo();

    const state = useSimulatorStore.getState();
    expect(state.mode).toBe("demo");
    expect(state.scenarioId).toBe(getCanonicalScenario().id);
    expect(state.isHydrated).toBe(true);
  });

  it("hydrates from URL params and filters unknown clause ids", () => {
    useSimulatorStore
      .getState()
      .initializeFromParams(new URLSearchParams("scenario=pulse-series-b&clauses=double-dip,missing&exit=125000000"));

    const state = useSimulatorStore.getState();
    expect(state.scenarioId).toBe("pulse-series-b");
    expect(state.activeClauseIds).toEqual(["double-dip"]);
    expect(state.exitValue).toBe(125_000_000);
  });

  it("falls back cleanly when URL params are malformed", () => {
    useSimulatorStore.getState().initializeFromParams(new URLSearchParams("scenario=nova-series-a&exit=abc"));

    const state = useSimulatorStore.getState();
    expect(state.scenarioId).toBe(getCanonicalScenario().id);
    expect(state.activeClauseIds).toEqual([]);
    expect(state.errorState).toBe("Failed to parse URL state. Loaded default scenario.");
    expect(state.isHydrated).toBe(true);
  });
});
