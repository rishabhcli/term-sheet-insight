import fs from "node:fs/promises";
import path from "node:path";

export interface E2ESeedState {
  seedPrefix?: string;
  seededOwnerId?: string;
  seededScenarioId?: string;
  seededScenarioSlug?: string;
  seededShareSlug?: string;
  seededSnapshotId?: string;
}

export const E2E_STATE_FILE = path.resolve(
  process.cwd(),
  "test-results/e2e-seed-state.json",
);

export async function readSeedState(): Promise<E2ESeedState> {
  try {
    const raw = await fs.readFile(E2E_STATE_FILE, "utf8");
    return JSON.parse(raw) as E2ESeedState;
  } catch {
    return {};
  }
}

export async function writeSeedState(state: E2ESeedState) {
  await fs.mkdir(path.dirname(E2E_STATE_FILE), { recursive: true });
  await fs.writeFile(E2E_STATE_FILE, JSON.stringify(state, null, 2));
}

export async function clearSeedState() {
  await fs.rm(E2E_STATE_FILE, { force: true });
}
