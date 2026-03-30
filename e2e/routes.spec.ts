import { expect, test } from "../playwright-fixture";

const routeChecks = [
  { path: "/", name: "simulator", heading: /Nova|Northstar|Term Sheet Tarot/i },
  { path: "/compare", name: "compare", heading: "Compare Scenarios" },
  { path: "/scenarios", name: "scenarios", heading: "Scenario Library" },
  { path: "/build", name: "build", heading: "Build a Scenario" },
  { path: "/about", name: "about", heading: "About Term Sheet Tarot" },
  { path: "/how-it-works", name: "how-it-works", heading: "How It Works" },
  { path: "/privacy", name: "privacy", heading: "Privacy Policy" },
  { path: "/terms", name: "terms", heading: "Terms & Disclaimer" },
];

for (const route of routeChecks) {
  test(`smoke: ${route.name} route renders`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
  });
}

test("smoke: unknown routes render the 404 page", async ({ page }) => {
  await page.goto("/missing-e2e-route");

  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to Home" })).toBeVisible();
});
