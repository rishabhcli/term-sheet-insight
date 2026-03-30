import { expect, test } from "../playwright-fixture";

import { installClipboardStub, readLastCopiedText } from "./support/app";

test("anonymous users can hydrate the simulator from URL params", async ({ page }) => {
  await page.goto(
    "/?scenario=pulse-series-b&clauses=double-dip,hidden-pool&exit=125000000",
  );

  await expect(page.getByRole("heading", { name: /Pulse/i })).toBeVisible();
  await expect(page.getByText("2 clauses active")).toBeVisible();
  await expect(page.getByText("$125M").first()).toBeVisible();
});

test("anonymous users can adjust the compare view and copy a share link", async ({
  page,
}) => {
  await installClipboardStub(page);
  await page.goto(
    "/compare?a=nova-series-a&ac=double-dip&ae=35000000&b=pulse-series-b&be=150000000",
  );

  await expect(page.getByRole("heading", { name: "Compare Scenarios" })).toBeVisible();
  await expect(page.getByLabel("Deal A scenario")).toHaveValue("nova-series-a");
  await expect(page.getByLabel("Deal B scenario")).toHaveValue("pulse-series-b");

  await page.getByRole("button", { name: "The Hidden Pool" }).first().click();
  await expect(page.getByRole("button", { name: "The Hidden Pool" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const exitSlider = page.getByLabel("Deal A exit value");
  await exitSlider.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(exitSlider).toHaveValue("45000000");

  await page.getByRole("button", { name: "Share Link" }).click();
  await expect(page.getByText("Copied!")).toBeVisible();
  await expect
    .poll(async () => readLastCopiedText(page))
    .toContain("ae=45000000");
});

test("mobile navigation opens and links between routes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation is only visible in the mobile project.");

  await page.goto("/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();

  await page.getByRole("link", { name: "Scenarios" }).click();
  await expect(page.getByRole("heading", { name: "Scenario Library" })).toBeVisible();
});
