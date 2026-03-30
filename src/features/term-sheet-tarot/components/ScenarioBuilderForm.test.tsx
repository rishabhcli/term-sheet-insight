import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import { useSimulatorStore } from "../state/simulator-store";

const { logEventMock, navigateMock, saveScenarioToCloudMock, useAuthMock } = vi.hoisted(() => ({
  logEventMock: vi.fn(),
  navigateMock: vi.fn(),
  saveScenarioToCloudMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("../services/supabase-service", () => ({
  logEvent: logEventMock,
  saveScenarioToCloud: saveScenarioToCloudMock,
}));

vi.mock("../hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => useAuthMock(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { ScenarioBuilderForm } from "./ScenarioBuilderForm";

describe("ScenarioBuilderForm", () => {
  beforeEach(() => {
    logEventMock.mockClear();
    navigateMock.mockClear();
    saveScenarioToCloudMock.mockReset().mockResolvedValue({ id: "scenario-db-id" });
    useAuthMock.mockReset().mockReturnValue({ user: null });
  });

  it("shows validation errors for missing required fields", async () => {
    renderWithProviders(<ScenarioBuilderForm />, { route: "/build" });

    fireEvent.submit(screen.getByRole("button", { name: "Launch Simulator" }).closest("form")!);

    expect(await screen.findByText(/Name is required/)).toBeInTheDocument();
  });

  it("loads the scenario into the simulator store and auto-saves for signed-in users", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: "user-3", email: "builder@example.com" } });

    renderWithProviders(<ScenarioBuilderForm />, { route: "/build" });

    await user.type(screen.getByLabelText("Company Name"), "Acme Rocket");
    fireEvent.submit(screen.getByRole("button", { name: "Launch Simulator" }).closest("form")!);

    await waitFor(() => {
      expect(saveScenarioToCloudMock).toHaveBeenCalled();
    });
    expect(useSimulatorStore.getState().scenario.name).toBe("Acme Rocket");
    expect(logEventMock).toHaveBeenCalledWith(
      "custom_scenario_created",
      { name: "Acme Rocket" },
      "user-3",
    );
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
