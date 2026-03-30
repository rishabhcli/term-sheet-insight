import { beforeEach, describe, expect, it, vi } from "vitest";

import { CLAUSE_CATALOG, getCanonicalScenario } from "../data/scenarios";
import { buildSnapshot } from "../domain/snapshot-builder";
import {
  clearSupabaseSession,
  createQueryBuilder,
  mockSupabase,
} from "@/test/mocks/supabase";

const {
  trackAsyncTimingMock,
  trackErrorMock,
  trackEventMock,
} = vi.hoisted(() => ({
  trackAsyncTimingMock: vi.fn(async (_label: string, fn: () => Promise<unknown>) => fn()),
  trackErrorMock: vi.fn(),
  trackEventMock: vi.fn(),
}));

vi.mock("./observability", () => ({
  trackAsyncTiming: trackAsyncTimingMock,
  trackError: trackErrorMock,
  trackEvent: trackEventMock,
}));

import {
  createShareLink,
  deleteScenarioFromCloud,
  fetchUserScenarios,
  getShareLinkBySlug,
  saveScenarioToCloud,
  saveSnapshotToCloud,
} from "./supabase-service";

describe("supabase-service", () => {
  const scenario = getCanonicalScenario();
  const snapshot = buildSnapshot(scenario, ["double-dip"], CLAUSE_CATALOG, 30_000_000);

  beforeEach(() => {
    clearSupabaseSession();
    mockSupabase.from.mockReset().mockImplementation(() => createQueryBuilder());
    trackAsyncTimingMock.mockClear().mockImplementation(async (_label, fn) => fn());
    trackErrorMock.mockClear();
    trackEventMock.mockClear();
  });

  it("saves scenarios with an upsert keyed by slug", async () => {
    const builder = createQueryBuilder({
      singleResult: { data: { id: "scenario-db-id" }, error: null },
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await saveScenarioToCloud(scenario, "user-1");

    expect(trackAsyncTimingMock).toHaveBeenCalledWith("save_scenario", expect.any(Function));
    expect(mockSupabase.from).toHaveBeenCalledWith("scenarios");
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: scenario.id,
        owner_id: "user-1",
        name: scenario.name,
      }),
      { onConflict: "slug" },
    );
    expect(result).toEqual({ id: "scenario-db-id" });
  });

  it("tracks and rethrows scenario save failures", async () => {
    const error = new Error("write failed");
    const builder = createQueryBuilder({
      singleResult: { data: null, error },
    });
    mockSupabase.from.mockReturnValue(builder);

    await expect(saveScenarioToCloud(scenario, "user-1")).rejects.toThrow("write failed");
    expect(trackErrorMock).toHaveBeenCalledWith("save_scenario", error);
  });

  it("saves snapshots and emits a saved event", async () => {
    const lookupBuilder = createQueryBuilder({
      singleResult: { data: { id: "scenario-db-id" }, error: null },
    });
    const insertBuilder = createQueryBuilder({
      singleResult: { data: { id: "snapshot-db-id" }, error: null },
    });
    mockSupabase.from
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);

    const result = await saveSnapshotToCloud(scenario.id, snapshot, snapshot.waterfall.exitValue, "user-1");

    expect(result).toEqual({ id: "snapshot-db-id" });
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        scenario_id: "scenario-db-id",
        owner_id: "user-1",
        snapshot_payload: snapshot,
      }),
    );
    expect(trackEventMock).toHaveBeenCalledWith(
      { type: "snapshot_saved", scenarioId: scenario.id, clauseCount: snapshot.activeClauseIds.length },
      "user-1",
    );
  });

  it("creates a share link with an absolute URL", async () => {
    const builder = createQueryBuilder({
      singleResult: { data: { id: "share-1", slug: "abcd1234" }, error: null },
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await createShareLink("snapshot-1", "user-1");

    expect(result).toEqual(
      expect.objectContaining({
        id: "share-1",
        slug: "abcd1234",
        url: expect.stringContaining("/share/"),
      }),
    );
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: "user-1",
        scenario_snapshot_id: "snapshot-1",
      }),
    );
  });

  it("fetches public user scenarios in descending updated order", async () => {
    const builder = createQueryBuilder({
      result: {
        data: [{ id: "custom-1" }],
        error: null,
      },
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await fetchUserScenarios("user-1");

    expect(builder.eq).toHaveBeenNthCalledWith(1, "owner_id", "user-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "is_preset", false);
    expect(builder.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(result).toEqual([{ id: "custom-1" }]);
  });

  it("looks up a public share link by slug", async () => {
    const builder = createQueryBuilder({
      singleResult: {
        data: { slug: "abcd1234", scenario_snapshots: { id: "snapshot-1" } },
        error: null,
      },
    });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getShareLinkBySlug("abcd1234");

    expect(builder.select).toHaveBeenCalledWith("*, scenario_snapshots(*)");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "slug", "abcd1234");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "is_public", true);
    expect(result).toEqual({ slug: "abcd1234", scenario_snapshots: { id: "snapshot-1" } });
  });

  it("tracks deletes and rethrows delete failures", async () => {
    const error = new Error("delete failed");
    const builder = createQueryBuilder({
      result: { data: null, error },
    });
    mockSupabase.from.mockReturnValue(builder);

    await expect(deleteScenarioFromCloud("scenario-1")).rejects.toThrow("delete failed");
    expect(trackErrorMock).toHaveBeenCalledWith("delete_scenario", error);
  });
});
