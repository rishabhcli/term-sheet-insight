import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import AboutPage from "./About";
import BuildScenarioPage from "./BuildScenario";
import FallbackPage from "./Fallback";
import HowItWorksPage from "./HowItWorks";
import NotFound from "./NotFound";
import PrivacyPage from "./Privacy";
import TermsPage from "./Terms";

describe("static and informational pages", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the build scenario page", async () => {
    renderWithProviders(<BuildScenarioPage />, { route: "/build" });

    expect(await screen.findByRole("heading", { name: "Build a Scenario" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch Simulator" })).toBeInTheDocument();
  });

  it("renders the about page", async () => {
    renderWithProviders(<AboutPage />, { route: "/about" });
    expect(await screen.findByRole("heading", { name: "About Term Sheet Tarot" })).toBeInTheDocument();
  });

  it("renders the how-it-works page", async () => {
    renderWithProviders(<HowItWorksPage />, { route: "/how-it-works" });
    expect(await screen.findByRole("heading", { name: "How It Works" })).toBeInTheDocument();
  });

  it("renders the privacy page", async () => {
    renderWithProviders(<PrivacyPage />, { route: "/privacy" });
    expect(await screen.findByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
  });

  it("renders the terms page", async () => {
    renderWithProviders(<TermsPage />, { route: "/terms" });
    expect(await screen.findByRole("heading", { name: "Terms & Disclaimer" })).toBeInTheDocument();
  });

  it("renders the fallback page", async () => {
    renderWithProviders(<FallbackPage />, { route: "/fallback" });
    expect(await screen.findByRole("heading", { name: /Nova — Series A/i })).toBeInTheDocument();
    expect(screen.getByText("Baseline — Clean Deal")).toBeInTheDocument();
  });

  it("renders the not-found page", async () => {
    renderWithProviders(<NotFound />, { route: "/missing" });
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toHaveAttribute("href", "/");
  });
});
