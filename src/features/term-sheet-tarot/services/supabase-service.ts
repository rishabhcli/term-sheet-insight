import { supabase } from '@/integrations/supabase/client';
import type { ScenarioDefinition, DealSnapshot } from '../domain/types';
import { trackEvent, trackError, trackAsyncTiming } from './observability';

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function saveScenarioToCloud(scenario: ScenarioDefinition, userId: string) {
  return trackAsyncTiming('save_scenario', async () => {
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

    if (error) {
      trackError('save_scenario', error);
      throw error;
    }
    return data;
  });
}

export async function saveSnapshotToCloud(
  scenarioId: string,
  snapshot: DealSnapshot,
  exitValue: number,
  userId: string,
  title?: string
) {
  return trackAsyncTiming('save_snapshot', async () => {
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

    if (error) {
      trackError('save_snapshot', error);
      throw error;
    }

    trackEvent({ type: 'snapshot_saved', scenarioId, clauseCount: snapshot.activeClauseIds.length }, userId);
    return data;
  });
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

  if (error) {
    trackError('create_share_link', error);
    throw error;
  }
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
    .eq('is_preset', false)
    .order('updated_at', { ascending: false });

  if (error) {
    trackError('fetch_user_scenarios', error);
    throw error;
  }
  return data;
}

export async function deleteScenarioFromCloud(scenarioId: string) {
  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', scenarioId);

  if (error) {
    trackError('delete_scenario', error);
    throw error;
  }
  trackEvent({ type: 'scenario_deleted', scenarioId });
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

// Legacy compat — delegates to observability layer
export function logEvent(eventName: string, payload?: Record<string, any>, userId?: string) {
  trackEvent({ type: 'custom_scenario_created', name: eventName, shareholderCount: 0, ...payload } as any, userId);
}
