import { clearSeedState, writeSeedState } from "./support/state";
import { hasSupabaseAuthEnv, seedSharedSnapshot } from "./support/supabase";

export default async function globalSetup() {
  await clearSeedState();

  if (!hasSupabaseAuthEnv()) {
    await writeSeedState({});
    return;
  }

  const state = await seedSharedSnapshot();
  await writeSeedState(state);
}
