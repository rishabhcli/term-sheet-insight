import React, {useMemo} from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Zoom = {
  fromScale: number;
  toScale: number;
  fromX: number;
  toX: number;
  fromY: number;
  toY: number;
};

type MontageItem = {
  videoSrc: string;
  weight: number;
  trimStartSec?: number;
  zoom?: Zoom;
};

type Segment = {
  id: string;
  title: string;
  audioSrc: string;
  audioDurationSec: number;
  videoSrc?: string;
  trimStartSec?: number;
  playbackRate?: number;
  zoom?: Zoom;
  montage?: MontageItem[];
};

type Caption = {
  startSec: number;
  endSec: number;
  text: string;
};

type DemoVideoProps = {
  segments: Segment[];
  captions: Caption[];
};

export const DemoVideo: React.FC<DemoVideoProps> = ({segments, captions}) => {
  const {fps} = useVideoConfig();
  const currentFrame = useCurrentFrame();

  const timelines = useMemo(() => {
    let from = 0;
    return segments.map((segment) => {
      const durationInFrames = Math.max(1, Math.round(segment.audioDurationSec * fps));
      const entry = {segment, from, durationInFrames};
      from += durationInFrames;
      return entry;
    });
  }, [fps, segments]);

  const activeCaption = captions.find((caption) => {
    const currentTimeSec = currentFrame / fps;
    return currentTimeSec >= caption.startSec && currentTimeSec <= caption.endSec;
  });

  return (
    <AbsoluteFill style={{backgroundColor: "#05070d", color: "#f7f2e4"}}>
      {timelines.map(({segment, from, durationInFrames}) => (
        <Sequence key={segment.id} from={from} durationInFrames={durationInFrames}>
          <SegmentVisual segment={segment} durationInFrames={durationInFrames} />
          <Audio src={staticFile(segment.audioSrc)} />
          <SegmentLabel title={segment.title} />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 96px 56px 96px",
          pointerEvents: "none",
        }}
      >
        {activeCaption ? <CaptionPill text={activeCaption.text} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SegmentVisual: React.FC<{segment: Segment; durationInFrames: number}> = ({segment, durationInFrames}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (segment.montage?.length) {
    let from = 0;
    const totalWeight = segment.montage.reduce((sum, item) => sum + item.weight, 0);

    return (
      <AbsoluteFill style={{opacity: fade}}>
        {segment.montage.map((item, index) => {
          const itemFrames = Math.max(1, Math.round((item.weight / totalWeight) * durationInFrames));
          const sequence = (
            <Sequence key={`${segment.id}-${index}`} from={from} durationInFrames={itemFrames}>
              <VideoLayer
                src={item.videoSrc}
                trimStartFrames={Math.round((item.trimStartSec ?? 0) * 30)}
                durationInFrames={itemFrames}
                zoom={item.zoom}
              />
            </Sequence>
          );
          from += itemFrames;
          return sequence;
        })}
        <GradientOverlay />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <VideoLayer
        src={segment.videoSrc!}
        trimStartFrames={Math.round((segment.trimStartSec ?? 0) * 30)}
        durationInFrames={durationInFrames}
        zoom={segment.zoom}
      />
      <GradientOverlay />
    </AbsoluteFill>
  );
};

const VideoLayer: React.FC<{
  src: string;
  trimStartFrames: number;
  durationInFrames: number;
  zoom?: Zoom;
}> = ({src, trimStartFrames, durationInFrames, zoom}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [zoom?.fromScale ?? 1, zoom?.toScale ?? 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [0, durationInFrames], [zoom?.fromX ?? 0, zoom?.toX ?? 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, durationInFrames], [zoom?.fromY ?? 0, zoom?.toY ?? 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={trimStartFrames}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </AbsoluteFill>
  );
};

const GradientOverlay: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(5,7,13,0.24) 0%, rgba(5,7,13,0) 22%, rgba(5,7,13,0.32) 75%, rgba(5,7,13,0.72) 100%)",
      }}
    />
  );
};

const SegmentLabel: React.FC<{title: string}> = ({title}) => {
  return (
    <AbsoluteFill style={{padding: 40, pointerEvents: "none"}}>
      <div
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderRadius: 999,
          background: "rgba(12, 16, 28, 0.72)",
          border: "1px solid rgba(255, 224, 157, 0.18)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 22,
          letterSpacing: "0.02em",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#f0bf54",
          }}
        />
        {title}
      </div>
    </AbsoluteFill>
  );
};

const CaptionPill: React.FC<{text: string}> = ({text}) => {
  return (
    <div
      style={{
        alignSelf: "center",
        maxWidth: 1240,
        padding: "18px 28px",
        borderRadius: 24,
        background: "rgba(7, 10, 18, 0.82)",
        border: "1px solid rgba(255, 224, 157, 0.14)",
        boxShadow: "0 14px 32px rgba(0, 0, 0, 0.45)",
        color: "#f7f2e4",
        fontFamily: "DM Sans, sans-serif",
        fontSize: 34,
        fontWeight: 600,
        lineHeight: 1.35,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};
