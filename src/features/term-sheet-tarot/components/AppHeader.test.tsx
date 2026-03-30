import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { clearSupabaseSession, mockSupabase, setSupabaseSession } from "@/test/mocks/supabase";
import { renderWithProviders } from "@/test/test-utils";

import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  beforeEach(() => {
    clearSupabaseSession();
  });

  it("shows navigation and a sign-in action for signed-out users", async () => {
    renderWithProviders(<AppHeader />, { route: "/compare" });

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Simulator" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("shows the signed-in email and signs out", async () => {
    const user = userEvent.setup();
    setSupabaseSession({ id: "user-2", email: "signed-in@example.com" });

    renderWithProviders(<AppHeader />, { route: "/" });

    expect(await screen.findByText("signed-in@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
