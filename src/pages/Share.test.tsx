import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import { CLAUSE_CATALOG, getCanonicalScenario } from "../features/term-sheet-tarot/data/scenarios";
import { buildSnapshot } from "../features/term-sheet-tarot/domain/snapshot-builder";

const { getShareLinkBySlugMock } = vi.hoisted(() => ({
  getShareLinkBySlugMock: vi.fn(),
}));

vi.mock("../features/term-sheet-tarot/services/supabase-service", () => ({
  getShareLinkBySlug: getShareLinkBySlugMock,
}));

import SharePage from "./Share";

describe("SharePage", () => {
  const snapshot = buildSnapshot(getCanonicalScenario(), ["double-dip"], CLAUSE_CATALOG, 30_000_000);

  beforeEach(() => {
    getShareLinkBySlugMock.mockReset();
  });

  it("shows a loading state before the share lookup resolves", async () => {
    getShareLinkBySlugMock.mockReturnValue(new Promise(() => undefined));

    renderWithProviders(<SharePage />, { path: "/share/:slug", route: "/share/loading-link" });

    expect(await screen.findByText("Loading shared scenario...")).toBeInTheDocument();
  });

  it("renders the shared snapshot", async () => {
    getShareLinkBySlugMock.mockResolvedValue({
      scenario_snapshots: {
        snapshot_payload: snapshot,
      },
    });

    renderWithProviders(<SharePage />, { path: "/share/:slug", route: "/share/demo-link" });

    expect(await screen.findByRole("heading", { name: "Deal Snapshot" })).toBeInTheDocument();
    expect(screen.getByText("Shared scenario snapshot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open in simulator →" })).toHaveAttribute("href", "/");
  });

  it("renders the error state when the share link is missing", async () => {
    getShareLinkBySlugMock.mockRejectedValue(new Error("missing"));

    renderWithProviders(<SharePage />, { path: "/share/:slug", route: "/share/missing-link" });

    expect(await screen.findByText("Share link not found or expired")).toBeInTheDocument();
  });
});
