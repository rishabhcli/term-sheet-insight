import type { Page } from "@playwright/test";
import { expect } from "../../playwright-fixture";

export async function installClipboardStub(page: Page) {
  await page.addInitScript(() => {
    const writeText = async (text: string) => {
      (window as Window & { __lastCopiedText?: string }).__lastCopiedText = text;
    };

    (window as Window & { __lastCopiedText?: string }).__lastCopiedText = "";

    try {
      if (navigator.clipboard) {
        Object.defineProperty(navigator.clipboard, "writeText", {
          configurable: true,
          value: writeText,
        });
      } else {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText },
        });
      }
    } catch {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
    }
  });
}

export async function readLastCopiedText(page: Page) {
  return page.evaluate(() => {
    return (window as Window & { __lastCopiedText?: string }).__lastCopiedText ?? "";
  });
}

export async function loginThroughUi(page: Page, email: string, password: string) {
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

export async function setRangeValue(page: Page, label: string, value: number) {
  const input = page.getByLabel(label);
  await input.evaluate((element, nextValue) => {
    const range = element as HTMLInputElement;
    range.value = String(nextValue);
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
