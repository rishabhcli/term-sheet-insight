import {execFile} from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia} from "@remotion/renderer";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "demo");
const stagingDir = path.join(outputDir, "staging");
const processedManifestPath = path.join(outputDir, "processed", "manifest.json");
const audioManifestPath = path.join(outputDir, "audio", "segments.json");
const captionsPath = path.join(outputDir, "captions.srt");
const storyboardPath = path.join(__dirname, "storyboard.json");
const remotionEntry = path.join(__dirname, "remotion", "root.tsx");
const intermediate = path.join(outputDir, "term-sheet-tarot-demo-remotion.mp4");
const finalVideo = path.join(outputDir, "term-sheet-tarot-demo.mp4");
const deliveryMaster = path.join(outputDir, "term-sheet-tarot-demo-master.mp4");
const tightenedVideo = path.join(outputDir, "term-sheet-tarot-demo-tight.mp4");
const maxRuntimeSec = 315;
const targetRuntimeSec = 313.5;

await fs.rm(stagingDir, {recursive: true, force: true});
await fs.mkdir(path.join(stagingDir, "video"), {recursive: true});
await fs.mkdir(path.join(stagingDir, "audio"), {recursive: true});

const [storyboard, processedManifest, audioManifest] = await Promise.all([
  readJson(storyboardPath),
  readJson(processedManifestPath),
  readJson(audioManifestPath),
]);

const captions = parseSrt(await fs.readFile(captionsPath, "utf8"));
const shots = new Map(processedManifest.shots.map((shot) => [shot.id, shot]));
const audioSegments = new Map(audioManifest.segments.map((segment) => [segment.id, segment]));

for (const shot of processedManifest.shots) {
  await fs.copyFile(shot.file, path.join(stagingDir, "video", path.basename(shot.file)));
}

for (const segment of audioManifest.segments) {
  await fs.copyFile(segment.file, path.join(stagingDir, "audio", path.basename(segment.file)));
}

const renderSegments = storyboard.segments.map((segment) => {
  const audio = audioSegments.get(segment.id);
  if (!audio) {
    throw new Error(`Missing audio segment for ${segment.id}`);
  }

  if (segment.montage) {
    return {
      ...segment,
      audioSrc: `audio/${path.basename(audio.file)}`,
      audioDurationSec: audio.durationSec,
      montage: segment.montage.map((item) => {
        const shot = shots.get(item.shotId);
        if (!shot) {
          throw new Error(`Missing shot ${item.shotId} for montage segment ${segment.id}`);
        }
        return {
          ...item,
          videoSrc: `video/${path.basename(shot.file)}`,
        };
      }),
    };
  }

  const shot = shots.get(segment.shotId);
  if (!shot) {
    throw new Error(`Missing shot ${segment.shotId} for segment ${segment.id}`);
  }

  return {
    ...segment,
    audioSrc: `audio/${path.basename(audio.file)}`,
    audioDurationSec: audio.durationSec,
    videoSrc: `video/${path.basename(shot.file)}`,
  };
});

const props = {
  title: storyboard.title,
  fps: storyboard.fps,
  width: storyboard.width,
  height: storyboard.height,
  segments: renderSegments,
  captions,
};

const propsPath = path.join(outputDir, "render-props.json");
await fs.writeFile(propsPath, JSON.stringify(props, null, 2));

const serveUrl = await bundle({
  entryPoint: remotionEntry,
  publicDir: stagingDir,
  onProgress: () => undefined,
});

const compositions = await getCompositions(serveUrl, {
  inputProps: props,
});

const composition = compositions.find((item) => item.id === "TermSheetTarotDemo");
if (!composition) {
  throw new Error("Missing TermSheetTarotDemo composition.");
}

await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  inputProps: props,
  outputLocation: intermediate,
  overwrite: true,
  logLevel: "verbose",
  onProgress: ({progress, renderedFrames, encodedFrames}) => {
    const pct = (progress * 100).toFixed(1);
    process.stdout.write(
      `\rRendering ${pct}% (rendered ${renderedFrames}f, encoded ${encodedFrames}f)`,
    );
  },
});
process.stdout.write("\n");

await execFileAsync("ffmpeg", [
  "-y",
  "-i",
  intermediate,
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  finalVideo,
], {maxBuffer: 1024 * 1024 * 20});

let durationSec = await getDuration(finalVideo);
let deliverySpeedFactor = 1;

if (durationSec > maxRuntimeSec) {
  deliverySpeedFactor = durationSec / targetRuntimeSec;
  const videoPtsFactor = 1 / deliverySpeedFactor;

  await fs.copyFile(finalVideo, deliveryMaster);
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    deliveryMaster,
    "-filter_complex",
    `[0:v]setpts=${videoPtsFactor.toFixed(6)}*PTS[v];[0:a]atempo=${deliverySpeedFactor.toFixed(5)}[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    tightenedVideo,
  ], {maxBuffer: 1024 * 1024 * 20});

  await fs.copyFile(tightenedVideo, finalVideo);
  durationSec = await getDuration(finalVideo);
}

const summaryPath = path.join(outputDir, "render-summary.json");
await fs.writeFile(summaryPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  durationSec,
  finalVideo,
  intermediate,
  deliveryMaster: deliverySpeedFactor > 1 ? deliveryMaster : null,
  deliverySpeedFactor,
}, null, 2));

console.log(`Final video written to ${path.relative(repoRoot, finalVideo)} (${durationSec.toFixed(2)}s)`);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function parseSrt(input) {
  return input
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [_, timecode, ...lines] = block.split("\n");
      const [start, end] = timecode.split(" --> ").map(parseTimecode);
      return {
        startSec: start,
        endSec: end,
        text: lines.join(" ").replace(/\s+/g, " ").trim(),
      };
    });
}

function parseTimecode(value) {
  const [hms, millis] = value.split(",");
  const [hours, minutes, seconds] = hms.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(millis) / 1000;
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
