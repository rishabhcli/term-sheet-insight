import { createClient } from "@supabase/supabase-js";

import {
  CLAUSE_CATALOG,
  getCanonicalScenario,
} from "../../src/features/term-sheet-tarot/data/scenarios";
import { buildSnapshot } from "../../src/features/term-sheet-tarot/domain/snapshot-builder";
import type { ScenarioDefinition } from "../../src/features/term-sheet-tarot/domain/types";

import type { E2ESeedState } from "./state";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSeedScenario(prefix: string): ScenarioDefinition {
  const scenario = getCanonicalScenario();
  const now = new Date().toISOString();
  const scenarioName = `${prefix} Nova`;
  return {
    ...scenario,
    id: `${prefix}-${scenario.id}`,
    name: scenarioName,
    description: `${scenario.description} Seeded for Playwright share-link smoke tests.`,
    isPreset: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasSupabaseRuntimeEnv() {
  return Boolean(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasSupabaseAuthEnv() {
  return Boolean(
    hasSupabaseRuntimeEnv() &&
      process.env.E2E_SUPABASE_EMAIL &&
      process.env.E2E_SUPABASE_PASSWORD,
  );
}

async function createSignedInClient() {
  const client = createClient(
    requireEnv("VITE_SUPABASE_URL"),
    requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data, error } = await client.auth.signInWithPassword({
    email: requireEnv("E2E_SUPABASE_EMAIL"),
    password: requireEnv("E2E_SUPABASE_PASSWORD"),
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to authenticate the E2E Supabase user.");
  }

  return { client, user: data.user };
}

export async function seedSharedSnapshot(): Promise<E2ESeedState> {
  const { client, user } = await createSignedInClient();
  const seedPrefix = `e2e-seed-${randomToken()}`;
  const scenario = buildSeedScenario(seedPrefix);

  const { data: seededScenario, error: scenarioError } = await client
    .from("scenarios")
    .upsert(
      {
        slug: scenario.id,
        name: scenario.name,
        round_label: scenario.roundLabel,
        description: scenario.description,
        currency: scenario.currency,
        pre_money_valuation: scenario.preMoneyValuation,
        investment_amount: scenario.investmentAmount,
        base_shareholders: scenario.baseShareholders,
        clean_terms: scenario.cleanTerms,
        exit_range: scenario.exitRange,
        is_preset: false,
        is_public: true,
        owner_id: user.id,
      },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();

  if (scenarioError || !seededScenario) {
    throw scenarioError ?? new Error("Failed to seed the E2E scenario.");
  }

  const snapshot = buildSnapshot(
    scenario,
    ["double-dip"],
    CLAUSE_CATALOG,
    45_000_000,
  );

  const { data: seededSnapshot, error: snapshotError } = await client
    .from("scenario_snapshots")
    .insert({
      scenario_id: seededScenario.id,
      owner_id: user.id,
      active_clause_ids: snapshot.activeClauseIds,
      exit_value: snapshot.waterfall.exitValue,
      snapshot_payload: snapshot,
      title: `${scenario.name} seeded snapshot`,
    })
    .select("id")
    .single();

  if (snapshotError || !seededSnapshot) {
    throw snapshotError ?? new Error("Failed to seed the E2E snapshot.");
  }

  const seededShareSlug = `${slugify(seedPrefix)}-${randomToken()}`;
  const { error: shareError } = await client.from("share_links").insert({
    slug: seededShareSlug,
    scenario_snapshot_id: seededSnapshot.id,
    created_by: user.id,
    is_public: true,
  });

  if (shareError) {
    throw shareError;
  }

  return {
    seedPrefix,
    seededOwnerId: user.id,
    seededScenarioId: seededScenario.id,
    seededScenarioSlug: seededScenario.slug,
    seededShareSlug,
    seededSnapshotId: seededSnapshot.id,
  };
}

export async function cleanupSeededSnapshot(state: E2ESeedState) {
  if (!state.seededScenarioId || !state.seededSnapshotId || !state.seededShareSlug) {
    return;
  }

  const { client } = await createSignedInClient();

  await client.from("share_links").delete().eq("slug", state.seededShareSlug);
  await client.from("scenario_snapshots").delete().eq("id", state.seededSnapshotId);
  await client.from("scenarios").delete().eq("id", state.seededScenarioId);
}

export async function cleanupScenarioByName(name: string) {
  const { client, user } = await createSignedInClient();

  const { data: scenarios } = await client
    .from("scenarios")
    .select("id")
    .eq("name", name)
    .eq("owner_id", user.id);

  if (!scenarios?.length) {
    return;
  }

  for (const scenario of scenarios) {
    const { data: snapshots } = await client
      .from("scenario_snapshots")
      .select("id")
      .eq("scenario_id", scenario.id);

    for (const snapshot of snapshots ?? []) {
      await client
        .from("share_links")
        .delete()
        .eq("scenario_snapshot_id", snapshot.id);
      await client.from("scenario_snapshots").delete().eq("id", snapshot.id);
    }

    await client.from("scenarios").delete().eq("id", scenario.id);
  }
}
