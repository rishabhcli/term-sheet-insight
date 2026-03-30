import { expect, test } from "../playwright-fixture";

import { readSeedState } from "./support/state";

test("shared snapshot links render for anonymous users", async ({ page }) => {
  const state = await readSeedState();
  test.skip(!state.seededShareSlug, "A seeded share link is not available for this run.");

  await page.goto(`/share/${state.seededShareSlug}`);

  await expect(page.getByText("Shared scenario snapshot")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deal Snapshot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in simulator →" })).toBeVisible();
});
