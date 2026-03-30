import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import SimulatorPage from "./Index";

describe("SimulatorPage", () => {
  it("hydrates the simulator from URL params", async () => {
    renderWithProviders(<SimulatorPage />, {
      route: "/?scenario=pulse-series-b&clauses=double-dip&exit=125000000",
    });

    expect(await screen.findByRole("heading", { name: "Pulse" })).toBeInTheDocument();
    expect(screen.getByText("1 clause active")).toBeInTheDocument();
    expect(screen.getByLabelText("Exit value: $125M")).toBeInTheDocument();
  });

  it("shows and dismisses a malformed URL warning", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<SimulatorPage />, {
      route: "/?scenario=nova-series-a&exit=abc",
    });

    expect(await screen.findByText("Failed to parse URL state. Loaded default scenario.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Failed to parse URL state. Loaded default scenario.")).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
