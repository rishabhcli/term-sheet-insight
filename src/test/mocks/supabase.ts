import { vi } from "vitest";

type QueryResult<T = unknown> = {
  data: T;
  error: unknown;
};

type QueryBuilderOptions<T = unknown> = {
  result?: QueryResult<T>;
  singleResult?: QueryResult<T>;
};

export function createQueryBuilder<T = unknown>({
  result = { data: null as T, error: null },
  singleResult = result,
}: QueryBuilderOptions<T> = {}) {
  const terminal = Promise.resolve(result);
  const builder = {
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => singleResult),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => singleResult),
    upsert: vi.fn(() => builder),
    then: terminal.then.bind(terminal),
    catch: terminal.catch.bind(terminal),
    finally: terminal.finally.bind(terminal),
  };

  return builder;
}

export function makeAuthUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: "user-1",
    email: "founder@example.com",
    ...overrides,
  };
}

export function makeAuthSession(user = makeAuthUser()) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: Date.now() + 3_600_000,
    token_type: "bearer",
    user,
  };
}

const subscription = {
  unsubscribe: vi.fn(),
};

export const mockSupabase = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
    signInWithPassword: vi.fn(async () => ({
      data: { session: null, user: null },
      error: null,
    })),
    signOut: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({
      data: { session: null, user: null },
      error: null,
    })),
  },
  from: vi.fn(() => createQueryBuilder()),
};

export function setSupabaseSession(user = makeAuthUser()) {
  const session = makeAuthSession(user);
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session } });
  return session;
}

export function clearSupabaseSession() {
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
}

export function resetSupabaseMock() {
  subscription.unsubscribe.mockReset();
  mockSupabase.auth.getSession.mockReset().mockResolvedValue({ data: { session: null } });
  mockSupabase.auth.onAuthStateChange
    .mockReset()
    .mockImplementation(() => ({ data: { subscription } }));
  mockSupabase.auth.signInWithPassword
    .mockReset()
    .mockResolvedValue({ data: { session: null, user: null }, error: null });
  mockSupabase.auth.signUp
    .mockReset()
    .mockResolvedValue({ data: { session: null, user: null }, error: null });
  mockSupabase.auth.signOut.mockReset().mockResolvedValue({ error: null });
  mockSupabase.from.mockReset().mockImplementation(() => createQueryBuilder());
}
