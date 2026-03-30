import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSupabaseSession, setSupabaseSession } from "@/test/mocks/supabase";
import { renderWithProviders } from "@/test/test-utils";

const { deleteScenarioFromCloudMock, fetchUserScenariosMock } = vi.hoisted(() => ({
  deleteScenarioFromCloudMock: vi.fn(),
  fetchUserScenariosMock: vi.fn(),
}));

vi.mock("../features/term-sheet-tarot/services/supabase-service", () => ({
  deleteScenarioFromCloud: deleteScenarioFromCloudMock,
  fetchUserScenarios: fetchUserScenariosMock,
}));

import ScenariosPage from "./Scenarios";

describe("ScenariosPage", () => {
  beforeEach(() => {
    clearSupabaseSession();
    deleteScenarioFromCloudMock.mockReset().mockResolvedValue(undefined);
    fetchUserScenariosMock.mockReset().mockResolvedValue([]);
  });

  it("shows the signed-out prompt and opens auth", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ScenariosPage />, { route: "/scenarios" });

    expect(await screen.findByText("Sign in to save custom scenarios and access them from any device.")).toBeInTheDocument();
    await user.click((await screen.findAllByRole("button", { name: "Sign in" })).at(-1)!);
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("loads saved scenarios and deletes them after confirmation", async () => {
    const user = userEvent.setup();
    setSupabaseSession({ id: "user-10", email: "library@example.com" });
    fetchUserScenariosMock.mockResolvedValueOnce([
      {
        id: "db-1",
        slug: "custom-nova",
        name: "Custom Nova",
        round_label: "Series A",
        description: "Saved custom deal",
        currency: "USD",
        pre_money_valuation: 20_000_000,
        investment_amount: 5_000_000,
        base_shareholders: [],
        clean_terms: {},
        exit_range: {},
        is_preset: false,
        is_public: true,
        owner_id: "user-10",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]);

    renderWithProviders(<ScenariosPage />, { route: "/scenarios" });

    expect(await screen.findByText("Custom Nova")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete Custom Nova" }));

    await waitFor(() => {
      expect(deleteScenarioFromCloudMock).toHaveBeenCalledWith("db-1");
    });
    await waitFor(() => {
      expect(screen.queryByText("Custom Nova")).not.toBeInTheDocument();
    });
  });
});
