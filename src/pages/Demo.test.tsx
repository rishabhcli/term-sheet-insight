import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import DemoPage from "./Demo";

describe("DemoPage", () => {
  it("responds to keyboard shortcuts for clauses, reset, and exit changes", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DemoPage />, { route: "/demo" });

    expect(await screen.findByText(/Demo mode/)).toBeInTheDocument();

    await user.keyboard("1");
    expect(screen.getByText("1 clause active")).toBeInTheDocument();

    await user.keyboard("]");
    expect(screen.getAllByText("$35M").length).toBeGreaterThan(0);

    await user.keyboard("0");
    expect(screen.queryByText("1 clause active")).not.toBeInTheDocument();
  });
});
