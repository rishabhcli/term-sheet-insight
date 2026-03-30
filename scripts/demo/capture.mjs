import {execFile} from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {chromium} from "playwright";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const rawDir = path.join(repoRoot, "output", "demo", "raw");
const tmpDir = path.join(repoRoot, "output", "demo", "tmp");
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4174";
const viewport = {width: 1600, height: 900};

const shots = [
  {
    id: "hook_dirty_deal",
    takes: 2,
    run: async ({page}) => {
      await goto(page, "/?scenario=nova-series-a&clauses=double-dip,hidden-pool,crown-seat&exit=30000000", 2000);
      await wait(14000);
    },
  },
  {
    id: "baseline_clean",
    takes: 1,
    run: async ({page}) => {
      await goto(page, "/", 2000);
      await wait(24000);
    },
  },
  {
    id: "economics_reveal",
    takes: 1,
    run: async ({page}) => {
      await goto(page, "/", 2000);
      await wait(2500);
      await clickByName(page, "switch", /The Double Dip/i);
      await wait(13000);
      await clickByName(page, "switch", /The Hidden Pool/i);
      await wait(15000);
    },
  },
  {
    id: "control_reveal",
    takes: 1,
    run: async ({page}) => {
      await goto(page, "/?scenario=nova-series-a&clauses=double-dip,hidden-pool&exit=30000000", 2000);
      await wait(2500);
      await clickByName(page, "switch", /The Crown Seat/i);
      await wait(18000);
    },
  },
  {
    id: "exit_slider",
    takes: 1,
    run: async ({page}) => {
      await goto(page, "/?scenario=nova-series-a&clauses=double-dip,hidden-pool,crown-seat&exit=15000000", 2000);
      await wait(2500);
      await setRangeValue(page, "Exit value:", 30000000);
      await wait(5000);
      await setRangeValue(page, "Exit value:", 60000000);
      await wait(5000);
      await setRangeValue(page, "Exit value:", 90000000);
      await wait(6000);
      await setRangeValue(page, "Exit value:", 45000000);
      await wait(5000);
    },
  },
  {
    id: "compare_mode",
    takes: 2,
    run: async ({page}) => {
      await goto(
        page,
        "/compare?a=nova-series-a&ac=double-dip,hidden-pool&ae=40000000&b=pulse-series-b&bc=crown-seat&be=150000000",
        2000,
      );
      await wait(3500);
      await clickButton(page, /The Hidden Pool/i, 0);
      await wait(7000);
      await setRangeValue(page, "Deal A exit value", 50000000);
      await wait(9000);
      await setRangeValue(page, "Deal A exit value", 65000000);
      await wait(7000);
    },
  },
  {
    id: "builder_custom",
    takes: 2,
    run: async ({page}) => {
      await goto(page, "/build", 1200);
      await humanType(page.getByLabel("Company Name"), "Atlas Robotics", 65);
      await page.getByLabel("Round").selectOption("Series B");
      await humanType(
        page.getByLabel("Description (optional)"),
        "Industrial robotics round with an expanded employee pool.",
        18,
      );
      await wait(700);
      const launchButton = page.getByRole("button", {name: "Launch Simulator"});
      await launchButton.scrollIntoViewIfNeeded();
      await launchButton.click();
      await page
        .locator("form")
        .evaluate(form =>
          form.dispatchEvent(new Event("submit", {bubbles: true, cancelable: true})),
        );
      await page.waitForFunction(() => window.location.pathname === "/");
      await settle(page, 1800);
      await wait(18000);
    },
  },
  {
    id: "share_link",
    takes: 2,
    run: async ({page}) => {
      await goto(page, "/?scenario=nova-series-a&clauses=double-dip,hidden-pool,crown-seat&exit=30000000", 1800);
      await wait(1500);
      await clickButton(page, /^Copy link$/i);
      await wait(2500);
      const copied = await readLastCopiedText(page);
      if (!copied) {
        throw new Error("Copy link did not produce a URL.");
      }

      await page.goto(copied, {waitUntil: "networkidle"});
      await settle(page, 1800);
      await wait(15000);
    },
  },
  {
    id: "how_it_works",
    takes: 1,
    run: async ({page}) => {
      await goto(page, "/how-it-works", 1500);
      for (const y of [400, 820, 1320, 1840]) {
        await page.evaluate((nextY) => window.scrollTo({top: nextY, behavior: "smooth"}), y);
        await wait(4500);
      }
      await wait(4000);
    },
  },
];

await fs.mkdir(rawDir, {recursive: true});
await fs.mkdir(tmpDir, {recursive: true});

const browser = await chromium.launch({
  headless: true,
  args: ["--force-color-profile=srgb"],
});

const manifest = [];

for (const shot of shots) {
  for (let take = 1; take <= shot.takes; take += 1) {
    console.log(`Capturing ${shot.id} take ${take}...`);
    const result = await recordShot(browser, shot, take);
    manifest.push(result);
    console.log(`Saved ${path.relative(repoRoot, result.file)} (${result.durationSec.toFixed(2)}s)`);
  }
}

await browser.close();

const manifestPath = path.join(rawDir, "manifest.json");
await fs.writeFile(manifestPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  baseURL,
  viewport,
  shots: manifest,
}, null, 2));

console.log(`Raw capture manifest written to ${path.relative(repoRoot, manifestPath)}`);

async function recordShot(browserInstance, shot, take) {
  const videoDir = path.join(tmpDir, `${shot.id}-take${take}`);
  await fs.rm(videoDir, {recursive: true, force: true});
  await fs.mkdir(videoDir, {recursive: true});

  const context = await browserInstance.newContext({
    viewport,
    colorScheme: "dark",
    recordVideo: {
      dir: videoDir,
      size: viewport,
    },
  });
  const page = await context.newPage();

  await installClipboardStub(page);
  await shot.run({page});

  const video = page.video();
  await context.close();

  const src = await video.path();
  const dest = path.join(rawDir, `${shot.id}-take${take}.webm`);
  await fs.rm(dest, {force: true});
  await fs.copyFile(src, dest);

  return {
    id: shot.id,
    take,
    file: dest,
    durationSec: await getDuration(dest),
  };
}

async function goto(page, route, settleMs) {
  await page.goto(new URL(route, baseURL).toString(), {waitUntil: "networkidle"});
  await settle(page, settleMs);
}

async function settle(page, ms = 1200) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await wait(ms);
}

async function humanType(locator, text, delay) {
  await locator.click();
  await locator.fill("");
  await locator.type(text, {delay});
}

async function clickButton(page, name, index = 0) {
  const button = page.getByRole("button", {name}).nth(index);
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

async function clickByName(page, role, name, index = 0) {
  const control = page.getByRole(role, {name}).nth(index);
  await control.scrollIntoViewIfNeeded();
  await control.click();
}

async function setRangeValue(page, labelPrefix, nextValue) {
  const input = page.locator(`input[type="range"][aria-label^="${labelPrefix}"]`).first();
  await input.evaluate((element, value) => {
    const range = element;
    range.value = String(value);
    range.dispatchEvent(new Event("input", {bubbles: true}));
    range.dispatchEvent(new Event("change", {bubbles: true}));
  }, nextValue);
}

async function installClipboardStub(page) {
  await page.addInitScript(() => {
    const writeText = async (text) => {
      window.__lastCopiedText = text;
    };
    window.__lastCopiedText = "";

    try {
      if (navigator.clipboard) {
        Object.defineProperty(navigator.clipboard, "writeText", {
          configurable: true,
          value: writeText,
        });
      } else {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {writeText},
        });
      }
    } catch {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {writeText},
      });
    }
  });
}

async function readLastCopiedText(page) {
  return page.evaluate(() => window.__lastCopiedText ?? "");
}

async function getDuration(file) {
  const {stdout} = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return Number.parseFloat(stdout.trim());
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
