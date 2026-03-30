import { expect, test } from "../playwright-fixture";

import {
  installClipboardStub,
  loginThroughUi,
  readLastCopiedText,
} from "./support/app";
import { cleanupScenarioByName, hasSupabaseAuthEnv } from "./support/supabase";

const authEmail = process.env.E2E_SUPABASE_EMAIL ?? "";
const authPassword = process.env.E2E_SUPABASE_PASSWORD ?? "";

test("authenticated users can build, save, share, open, and delete a custom scenario", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutating live E2E runs only in Chromium.");
  test.skip(!hasSupabaseAuthEnv(), "Supabase E2E credentials are not configured.");

  const scenarioName = `e2e-${Date.now()} custom scenario`;

  await installClipboardStub(page);

  try {
    await page.goto("/scenarios");
    await loginThroughUi(page, authEmail, authPassword);

    await page.getByRole("link", { name: "Build Custom" }).click();
    await expect(page.getByRole("heading", { name: "Build a Scenario" })).toBeVisible();

    await page.getByLabel("Company Name").fill(scenarioName);
    await page.getByRole("button", { name: "Launch Simulator" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: scenarioName })).toBeVisible();

    await page.getByRole("button", { name: "Save & share" }).click();
    await expect(page.getByText("Link copied to clipboard")).toBeVisible();

    let shareUrl = "";
    await expect
      .poll(async () => {
        shareUrl = await readLastCopiedText(page);
        return shareUrl;
      }, {
        message: "Expected the save-and-share flow to copy a share URL",
      })
      .not.toBe("");

    await page.goto(shareUrl);
    await expect(page.getByText("Shared scenario snapshot")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deal Snapshot" })).toBeVisible();

    await page.goto("/scenarios");
    await expect(page.getByRole("heading", { name: "Scenario Library" })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByLabel(`Delete ${scenarioName}`).click({ force: true });
    await expect(page.getByText(scenarioName)).toHaveCount(0);
  } finally {
    await cleanupScenarioByName(scenarioName);
  }
});
