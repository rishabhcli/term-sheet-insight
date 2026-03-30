import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSupabaseSession, setSupabaseSession } from "@/test/mocks/supabase";
import { renderWithProviders } from "@/test/test-utils";

import { getCanonicalScenario } from "../data/scenarios";
import { useSimulatorStore } from "../state/simulator-store";

const {
  copyTextMock,
  copyTextWithPromptFallbackMock,
  createShareLinkMock,
  exportTermSheetPDFMock,
  logEventMock,
  saveScenarioToCloudMock,
  saveSnapshotToCloudMock,
} = vi.hoisted(() => ({
  copyTextMock: vi.fn(async () => undefined),
  copyTextWithPromptFallbackMock: vi.fn(async () => true),
  createShareLinkMock: vi.fn(),
  exportTermSheetPDFMock: vi.fn(),
  logEventMock: vi.fn(),
  saveScenarioToCloudMock: vi.fn(),
  saveSnapshotToCloudMock: vi.fn(),
}));

vi.mock("../services/pdf-export", () => ({
  exportTermSheetPDF: exportTermSheetPDFMock,
}));

vi.mock("../services/clipboard", () => ({
  copyText: copyTextMock,
  copyTextWithPromptFallback: copyTextWithPromptFallbackMock,
}));

vi.mock("../services/supabase-service", () => ({
  createShareLink: createShareLinkMock,
  logEvent: logEventMock,
  saveScenarioToCloud: saveScenarioToCloudMock,
  saveSnapshotToCloud: saveSnapshotToCloudMock,
}));

import { ResetControls } from "./ResetControls";

describe("ResetControls", () => {
  beforeEach(() => {
    clearSupabaseSession();
    useSimulatorStore.getState().loadScenario(getCanonicalScenario());
    useSimulatorStore.getState().toggleClause("double-dip");
    copyTextMock.mockReset().mockResolvedValue(undefined);
    copyTextWithPromptFallbackMock.mockReset().mockResolvedValue(true);
    createShareLinkMock.mockReset().mockResolvedValue({ url: "http://localhost:3000/share/shared-1" });
    exportTermSheetPDFMock.mockClear();
    logEventMock.mockClear();
    saveScenarioToCloudMock.mockReset().mockResolvedValue({ id: "scenario-db-id" });
    saveSnapshotToCloudMock.mockReset().mockResolvedValue({ id: "snapshot-db-id" });
  });

  it("copies a query-param share link for anonymous users", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ResetControls />);

    await user.click(await screen.findByRole("button", { name: "Copy link" }));

    await waitFor(() => {
      expect(copyTextWithPromptFallbackMock).toHaveBeenCalledWith(
        expect.stringContaining("scenario=nova-series-a"),
      );
    });
    expect(screen.getByText("Link copied to clipboard")).toBeInTheDocument();
  });

  it("opens the auth dialog when an anonymous user tries to save", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ResetControls />);

    await user.click(await screen.findByRole("button", { name: "Sign in to save" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("saves a snapshot, creates a share link, and copies it for signed-in users", async () => {
    const user = userEvent.setup();
    setSupabaseSession({ id: "user-7", email: "founder@example.com" });

    renderWithProviders(<ResetControls />);

    await user.click(await screen.findByRole("button", { name: "Save & share" }));

    await waitFor(() => {
      expect(saveScenarioToCloudMock).toHaveBeenCalledWith(expect.any(Object), "user-7");
      expect(saveSnapshotToCloudMock).toHaveBeenCalled();
      expect(createShareLinkMock).toHaveBeenCalledWith("snapshot-db-id", "user-7");
      expect(copyTextMock).toHaveBeenCalledWith("http://localhost:3000/share/shared-1");
    });
  });

  it("exports the current scenario as a PDF", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ResetControls />);

    await user.click(await screen.findByRole("button", { name: "Export PDF" }));

    expect(exportTermSheetPDFMock).toHaveBeenCalled();
  });
});
