import { cleanupSeededSnapshot, hasSupabaseAuthEnv } from "./support/supabase";
import { clearSeedState, readSeedState } from "./support/state";

export default async function globalTeardown() {
  const state = await readSeedState();

  if (hasSupabaseAuthEnv()) {
    await cleanupSeededSnapshot(state);
  }

  await clearSeedState();
}
