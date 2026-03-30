import { create } from 'zustand';
import type { ScenarioDefinition, DealSnapshot, ClauseDefinition } from '../domain/types';
import { buildSnapshot } from '../domain/snapshot-builder';
import { CLAUSE_CATALOG, getCanonicalScenario, getScenarioById, PRESET_SCENARIOS } from '../data/scenarios';
import { trackEvent, trackError } from '../services/observability';

interface SimulatorState {
  mode: 'simulator' | 'demo';
  scenarioId: string;
  scenario: ScenarioDefinition;
  activeClauseIds: string[];
  exitValue: number;
  cleanSnapshot: DealSnapshot;
  currentSnapshot: DealSnapshot;
  isHydrated: boolean;
  errorState: string | null;

  // Actions
  loadScenario: (scenario: ScenarioDefinition) => void;
  toggleClause: (clauseId: string) => void;
  setExitValue: (value: number) => void;
  resetToClean: () => void;
  setMode: (mode: 'simulator' | 'demo') => void;
  initializeDemo: () => void;
  initializeFromParams: (params: URLSearchParams) => void;
  clearError: () => void;
}

function safeSnapshot(scenario: ScenarioDefinition, clauseIds: string[], exitValue: number): DealSnapshot {
  try {
    return buildSnapshot(scenario, clauseIds, CLAUSE_CATALOG, exitValue);
  } catch (e) {
    console.error('Snapshot computation error:', e);
    // Return baseline as fallback
    return buildSnapshot(scenario, [], CLAUSE_CATALOG, exitValue);
  }
}

const defaultScenario = getCanonicalScenario();
const defaultExit = defaultScenario.exitRange.default;
const defaultClean = safeSnapshot(defaultScenario, [], defaultExit);

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  mode: 'simulator',
  scenarioId: defaultScenario.id,
  scenario: defaultScenario,
  activeClauseIds: [],
  exitValue: defaultExit,
  cleanSnapshot: defaultClean,
  currentSnapshot: defaultClean,
  isHydrated: true,
  errorState: null,

  loadScenario: (scenario) => {
    const exitValue = scenario.exitRange.default;
    const clean = safeSnapshot(scenario, [], exitValue);
    set({
      scenario,
      scenarioId: scenario.id,
      activeClauseIds: [],
      exitValue,
      cleanSnapshot: clean,
      currentSnapshot: clean,
      errorState: null,
    });
  },

  toggleClause: (clauseId) => {
    const { activeClauseIds, scenario, exitValue } = get();
    const next = activeClauseIds.includes(clauseId)
      ? activeClauseIds.filter(id => id !== clauseId)
      : [...activeClauseIds, clauseId];
    const snapshot = safeSnapshot(scenario, next, exitValue);
    set({ activeClauseIds: next, currentSnapshot: snapshot });
  },

  setExitValue: (value) => {
    const { scenario, activeClauseIds } = get();
    const snapshot = safeSnapshot(scenario, activeClauseIds, value);
    set({ exitValue: value, currentSnapshot: snapshot });
  },

  resetToClean: () => {
    const { scenario } = get();
    const exitValue = scenario.exitRange.default;
    const clean = safeSnapshot(scenario, [], exitValue);
    set({ activeClauseIds: [], exitValue, currentSnapshot: clean, cleanSnapshot: clean });
  },

  setMode: (mode) => set({ mode }),

  initializeDemo: () => {
    const scenario = getCanonicalScenario();
    const exitValue = scenario.exitRange.default;
    const clean = safeSnapshot(scenario, [], exitValue);
    set({
      mode: 'demo',
      scenario,
      scenarioId: scenario.id,
      activeClauseIds: [],
      exitValue,
      cleanSnapshot: clean,
      currentSnapshot: clean,
      errorState: null,
      isHydrated: true,
    });
  },

  initializeFromParams: (params) => {
    try {
      const scenarioId = params.get('scenario') || defaultScenario.id;
      const scenario = getScenarioById(scenarioId) || defaultScenario;
      const clauseStr = params.get('clauses');
      const clauseIds = clauseStr ? clauseStr.split(',').filter(c => CLAUSE_CATALOG.some(cl => cl.id === c)) : [];
      const exitStr = params.get('exit');
      const exitValue = exitStr ? Math.max(scenario.exitRange.min, Math.min(scenario.exitRange.max, Number(exitStr))) : scenario.exitRange.default;

      const clean = safeSnapshot(scenario, [], exitValue);
      const current = safeSnapshot(scenario, clauseIds, exitValue);
      set({
        scenario,
        scenarioId: scenario.id,
        activeClauseIds: clauseIds,
        exitValue: isNaN(exitValue) ? scenario.exitRange.default : exitValue,
        cleanSnapshot: clean,
        currentSnapshot: current,
        isHydrated: true,
        errorState: null,
      });
    } catch {
      const scenario = defaultScenario;
      const clean = safeSnapshot(scenario, [], scenario.exitRange.default);
      set({
        scenario,
        scenarioId: scenario.id,
        activeClauseIds: [],
        exitValue: scenario.exitRange.default,
        cleanSnapshot: clean,
        currentSnapshot: clean,
        errorState: 'Failed to parse URL state. Loaded default scenario.',
        isHydrated: true,
      });
    }
  },

  clearError: () => set({ errorState: null }),
}));
