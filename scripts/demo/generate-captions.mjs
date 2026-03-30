import {execFile} from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const audioDir = path.join(repoRoot, "output", "demo", "audio");
const subtitleDir = path.join(repoRoot, "output", "demo");
const audioFile = path.join(audioDir, "narration.wav");

await fs.mkdir(subtitleDir, {recursive: true});

console.log("Generating captions with Whisper...");
await execFileAsync("whisper", [
  audioFile,
  "--model",
  process.env.WHISPER_MODEL || "base",
  "--language",
  "en",
  "--task",
  "transcribe",
  "--fp16",
  "False",
  "--output_format",
  "srt",
  "--output_dir",
  subtitleDir,
]);

const rawSrt = path.join(subtitleDir, "narration.srt");
const fixedSrt = path.join(subtitleDir, "captions.srt");
const contents = await fs.readFile(rawSrt, "utf8");
await fs.writeFile(fixedSrt, normalizeSrt(contents));
console.log(`Captions written to ${path.relative(repoRoot, fixedSrt)}`);

function normalizeSrt(input) {
  return input
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const [_, timecode, ...lines] = block.split("\n");
      const text = lines.join(" ").replace(/\s+/g, " ").trim();
      return `${index + 1}\n${timecode}\n${text}`;
    })
    .join("\n\n");
}
