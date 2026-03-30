import { supabase } from '@/integrations/supabase/client';
import type { ScenarioDefinition, DealSnapshot } from '../domain/types';

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function saveScenarioToCloud(scenario: ScenarioDefinition, userId: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .upsert({
      slug: scenario.id,
      name: scenario.name,
      round_label: scenario.roundLabel,
      description: scenario.description,
      currency: scenario.currency,
      pre_money_valuation: scenario.preMoneyValuation,
      investment_amount: scenario.investmentAmount,
      base_shareholders: scenario.baseShareholders as any,
      clean_terms: scenario.cleanTerms as any,
      exit_range: scenario.exitRange as any,
      is_preset: false,
      is_public: true,
      owner_id: userId,
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveSnapshotToCloud(
  scenarioId: string,
  snapshot: DealSnapshot,
  exitValue: number,
  userId: string,
  title?: string
) {
  // First find the DB scenario by slug
  const { data: dbScenario } = await supabase
    .from('scenarios')
    .select('id')
    .eq('slug', scenarioId)
    .single();

  const { data, error } = await supabase
    .from('scenario_snapshots')
    .insert({
      scenario_id: dbScenario?.id ?? null,
      owner_id: userId,
      active_clause_ids: snapshot.activeClauseIds as any,
      exit_value: exitValue,
      snapshot_payload: snapshot as any,
      title: title || `Snapshot at ${new Date().toLocaleString()}`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createShareLink(snapshotId: string, userId: string) {
  const slug = generateSlug();
  const { data, error } = await supabase
    .from('share_links')
    .insert({
      slug,
      scenario_snapshot_id: snapshotId,
      created_by: userId,
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, url: `${window.location.origin}/share/${slug}` };
}

export async function getShareLinkBySlug(slug: string) {
  const { data, error } = await supabase
    .from('share_links')
    .select('*, scenario_snapshots(*)')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserScenarios(userId: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchPublicPresets() {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('is_preset', true)
    .eq('is_public', true)
    .order('created_at');

  if (error) throw error;
  return data;
}

export async function logEvent(eventName: string, payload?: Record<string, any>, userId?: string) {
  try {
    await supabase.from('event_logs').insert({
      event_name: eventName,
      payload: payload as any,
      user_id: userId ?? null,
      session_id: getSessionId(),
    });
  } catch {
    // Silent fail - analytics should never break UX
  }
}

function getSessionId(): string {
  const key = 'termsheet-tarot:session-id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}
