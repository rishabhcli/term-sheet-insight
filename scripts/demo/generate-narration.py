from __future__ import annotations

import argparse
import json
import math
import pathlib
import urllib.request
from typing import Any

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
STORYBOARD_PATH = REPO_ROOT / "scripts" / "demo" / "storyboard.json"
MODELS_DIR = REPO_ROOT / "output" / "demo" / "models"
AUDIO_DIR = REPO_ROOT / "output" / "demo" / "audio"
SAMPLES_DIR = AUDIO_DIR / "samples"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
VOICES_PATH = MODELS_DIR / "voices-v1.0.bin"


def download(url: str, dest: pathlib.Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
      return
    print(f"Downloading {url} -> {dest}")
    urllib.request.urlretrieve(url, dest)


def choose_voice(available: list[str], requested: str | None) -> str:
    if requested:
        if requested not in available:
            raise ValueError(f"Requested voice {requested} not found. Available sample: {available[:12]}")
        return requested

    preferred = [
        "af_sarah",
        "af_nicole",
        "af_sky",
        "af_heart",
        "am_adam",
        "am_michael",
    ]
    for voice in preferred:
        if voice in available:
            return voice

    for prefix in ("af_", "am_", "bf_", "bm_"):
        for voice in available:
            if voice.startswith(prefix):
                return voice

    return available[0]


def silence(sample_rate: int, seconds: float) -> np.ndarray:
    return np.zeros(int(sample_rate * max(seconds, 0)), dtype=np.float32)


def duration(samples: np.ndarray, sample_rate: int) -> float:
    return float(len(samples)) / float(sample_rate)


def synthesize_segment(
    kokoro: Kokoro,
    text: str,
    voice: str,
    target_duration_sec: float,
    initial_speed: float,
) -> tuple[np.ndarray, int, dict[str, Any]]:
    lead_padding = 0.18
    tail_padding = 0.42
    speed = initial_speed

    raw, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    raw_duration = duration(raw, sample_rate)

    desired_speech_duration = max(target_duration_sec - lead_padding - tail_padding, 1.0)
    if raw_duration < desired_speech_duration - 0.8:
        adjusted_speed = max(0.72, min(0.98, speed * raw_duration / desired_speech_duration))
        if not math.isclose(adjusted_speed, speed):
            speed = adjusted_speed
            raw, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
            raw_duration = duration(raw, sample_rate)

    if raw_duration > desired_speech_duration + 0.8:
        adjusted_speed = max(0.72, min(1.08, speed * raw_duration / desired_speech_duration))
        if not math.isclose(adjusted_speed, speed):
            speed = adjusted_speed
            raw, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
            raw_duration = duration(raw, sample_rate)

    extra_tail = max(0.0, target_duration_sec - raw_duration - lead_padding - tail_padding)
    segment_audio = np.concatenate(
        [
            silence(sample_rate, lead_padding),
            raw.astype(np.float32),
            silence(sample_rate, tail_padding + extra_tail),
        ]
    )

    return segment_audio, sample_rate, {
        "voice": voice,
        "speed": speed,
        "speechDurationSec": round(raw_duration, 3),
        "targetDurationSec": target_duration_sec,
        "leadPaddingSec": lead_padding,
        "tailPaddingSec": round(tail_padding + extra_tail, 3),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default=None)
    parser.add_argument("--speed", type=float, default=0.82)
    parser.add_argument("--audition", action="store_true")
    args = parser.parse_args()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    download(MODEL_URL, MODEL_PATH)
    download(VOICES_URL, VOICES_PATH)

    kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
    available_voices = sorted(kokoro.voices.files)
    voice = choose_voice(available_voices, args.voice)

    storyboard = json.loads(STORYBOARD_PATH.read_text())
    segments = storyboard["segments"]

    if args.audition:
        audition_candidates = [v for v in ["af_sarah", "af_nicole", "af_sky", "am_adam"] if v in available_voices][:3]
        intro_text = segments[0]["narration"]
        for candidate in audition_candidates:
            samples, sample_rate = kokoro.create(intro_text, voice=candidate, speed=args.speed, lang="en-us")
            out = SAMPLES_DIR / f"intro-{candidate}.wav"
            sf.write(out, samples, sample_rate)
            print(f"Audition sample written to {out}")
        print("Audition complete.")
        return

    segment_manifest: list[dict[str, Any]] = []
    stitched: list[np.ndarray] = []
    stitched_sample_rate = None

    for segment in segments:
        segment_audio, sample_rate, stats = synthesize_segment(
            kokoro=kokoro,
            text=segment["narration"],
            voice=voice,
            target_duration_sec=float(segment["targetDurationSec"]),
            initial_speed=args.speed,
        )
        if stitched_sample_rate is None:
            stitched_sample_rate = sample_rate

        segment_path = AUDIO_DIR / f"{segment['id']}.wav"
        sf.write(segment_path, segment_audio, sample_rate)
        stitched.append(segment_audio)

        segment_manifest.append(
            {
                "id": segment["id"],
                "title": segment["title"],
                "file": str(segment_path),
                "durationSec": round(duration(segment_audio, sample_rate), 3),
                **stats,
            }
        )
        print(
            f"Generated {segment['id']} with voice={voice} speed={stats['speed']:.3f} "
            f"duration={duration(segment_audio, sample_rate):.2f}s"
        )

    assert stitched_sample_rate is not None
    narration = np.concatenate(stitched)
    narration_path = AUDIO_DIR / "narration.wav"
    sf.write(narration_path, narration, stitched_sample_rate)

    manifest_path = AUDIO_DIR / "segments.json"
    manifest_path.write_text(
        json.dumps(
            {
                "voice": voice,
                "sampleRate": stitched_sample_rate,
                "segments": segment_manifest,
                "narrationFile": str(narration_path),
                "totalDurationSec": round(duration(narration, stitched_sample_rate), 3),
            },
            indent=2,
        )
    )
    print(f"Narration written to {narration_path}")
    print(f"Segment manifest written to {manifest_path}")


if __name__ == "__main__":
    main()
