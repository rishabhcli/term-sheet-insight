import { supabase } from '@/integrations/supabase/client';

// ── Session & Timing ──

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  const key = 'tst:session';
  sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

const sessionStartTime = Date.now();
const interactionTimings: number[] = [];

// ── Structured Event Types ──

export type ObservabilityEvent =
  | { type: 'page_view'; page: string; referrer?: string }
  | { type: 'clause_toggled'; clauseId: string; active: boolean; activeCount: number }
  | { type: 'exit_value_changed'; value: number; scenarioId: string }
  | { type: 'scenario_loaded'; scenarioId: string; source: 'preset' | 'custom' | 'shared' | 'url' }
  | { type: 'snapshot_saved'; scenarioId: string; clauseCount: number }
  | { type: 'share_link_created'; method: 'cloud' | 'query-param'; scenarioId: string }
  | { type: 'pdf_exported'; scenarioId: string; clauseCount: number }
  | { type: 'auth_action'; action: 'sign_in' | 'sign_up' | 'sign_out' | 'auth_error'; email?: string }
  | { type: 'error'; source: string; message: string; stack?: string }
  | { type: 'performance'; metric: string; value: number; unit: string }
  | { type: 'custom_scenario_created'; name: string; shareholderCount: number }
  | { type: 'scenario_deleted'; scenarioId: string };

// ── Core Logger ──

const eventQueue: Array<{
  event_name: string;
  payload: Record<string, unknown>;
  user_id: string | null;
  session_id: string;
  created_at: string;
}> = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function enqueue(event: ObservabilityEvent, userId?: string | null) {
  const now = Date.now();
  interactionTimings.push(now);

  eventQueue.push({
    event_name: event.type,
    payload: {
      ...event,
      session_elapsed_ms: now - sessionStartTime,
      interaction_count: interactionTimings.length,
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      url: typeof window !== 'undefined' ? window.location.pathname : '',
    },
    user_id: userId ?? null,
    session_id: getSessionId(),
    created_at: new Date().toISOString(),
  });

  // Debounce flush — batch events
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 1500);

  // Immediate flush if queue gets big
  if (eventQueue.length >= 10) flush();
}

async function flush() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, eventQueue.length);
  flushTimer = null;

  try {
    const { error } = await supabase.from('event_logs').insert(
      batch.map(e => ({
        event_name: e.event_name,
        payload: e.payload as any,
        user_id: e.user_id,
        session_id: e.session_id,
      }))
    );
    if (error) {
      console.warn('[observability] flush error:', error.message);
    }
  } catch {
    // Silent fail — never break UX for analytics
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);
}

// ── Public API ──

export function trackEvent(event: ObservabilityEvent, userId?: string | null) {
  enqueue(event, userId);
}

// ── Performance Helpers ──

export function trackTiming(label: string, fn: () => void): void {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  trackEvent({ type: 'performance', metric: label, value: Math.round(duration * 100) / 100, unit: 'ms' });
}

export async function trackAsyncTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    trackEvent({ type: 'performance', metric: label, value: Math.round(duration * 100) / 100, unit: 'ms' });
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    trackEvent({ type: 'performance', metric: `${label}_error`, value: Math.round(duration * 100) / 100, unit: 'ms' });
    throw err;
  }
}

// ── Error Tracking ──

export function trackError(source: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack?.slice(0, 500) : undefined;
  trackEvent({ type: 'error', source, message, stack });
}

// ── Global Error Handler ──

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError('window.onerror', event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    trackError('unhandled_rejection', event.reason);
  });
}

// ── Session Summary ──

export function getSessionSummary() {
  return {
    sessionId: getSessionId(),
    elapsed: Date.now() - sessionStartTime,
    interactions: interactionTimings.length,
    pendingEvents: eventQueue.length,
  };
}
