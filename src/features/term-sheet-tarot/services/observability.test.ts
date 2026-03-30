import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryBuilder, mockSupabase } from "@/test/mocks/supabase";

describe("observability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSupabase.from.mockReset().mockImplementation(() => createQueryBuilder());
    window.history.pushState({}, "Observability", "/");
  });

  it("batches events and flushes them to Supabase", async () => {
    const insertBuilder = createQueryBuilder({
      result: { data: null, error: null },
    });
    mockSupabase.from.mockReturnValue(insertBuilder);

    const { trackEvent } = await import("./observability");
    window.history.pushState({}, "Compare", "/compare");
    trackEvent({ type: "page_view", page: "/compare" });

    expect(insertBuilder.insert).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_500);

    expect(mockSupabase.from).toHaveBeenCalledWith("event_logs");
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        event_name: "page_view",
        payload: expect.objectContaining({
          page: "/compare",
          url: "/compare",
        }),
      }),
    ]);
  });

  it("records performance and error telemetry in the flushed batch", async () => {
    const insertBuilder = createQueryBuilder({
      result: { data: null, error: null },
    });
    mockSupabase.from.mockReturnValue(insertBuilder);

    const { trackAsyncTiming, trackError } = await import("./observability");

    await trackAsyncTiming("expensive_task", async () => "done");
    trackError("share_page", new Error("boom"));

    await vi.advanceTimersByTimeAsync(1_500);

    const [batch] = insertBuilder.insert.mock.calls.at(-1) ?? [[]];
    const eventNames = batch.map((event: { event_name: string }) => event.event_name);

    expect(eventNames).toEqual(expect.arrayContaining(["performance", "error"]));
    expect(
      batch.find((event: { event_name: string }) => event.event_name === "performance"),
    ).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          metric: "expensive_task",
        }),
      }),
    );
    expect(
      batch.find((event: { event_name: string }) => event.event_name === "error"),
    ).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          source: "share_page",
          message: "boom",
        }),
      }),
    );
  });
});
