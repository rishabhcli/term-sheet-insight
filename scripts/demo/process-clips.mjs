import {execFile} from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const rawDir = path.join(repoRoot, "output", "demo", "raw");
const processedDir = path.join(repoRoot, "output", "demo", "processed");

await fs.mkdir(processedDir, {recursive: true});

const rawManifest = JSON.parse(await fs.readFile(path.join(rawDir, "manifest.json"), "utf8"));
const processedShots = [];

for (const shot of rawManifest.shots) {
  const source = shot.file;
  const dest = path.join(processedDir, `${shot.id}-take${shot.take}.mp4`);
  console.log(`Processing ${path.basename(source)} -> ${path.basename(dest)}`);
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    source,
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    "-an",
    dest,
  ]);
  processedShots.push({
    ...shot,
    source,
    file: dest,
    durationSec: await getDuration(dest),
  });
}

const manifestPath = path.join(processedDir, "manifest.json");
await fs.writeFile(manifestPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  shots: processedShots,
}, null, 2));

console.log(`Processed manifest written to ${path.relative(repoRoot, manifestPath)}`);

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
