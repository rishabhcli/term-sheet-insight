import React from "react";
import {Composition} from "remotion";

import {DemoVideo} from "./video";

type Segment = {
  id: string;
  audioDurationSec: number;
};

type DemoProps = {
  fps: number;
  width: number;
  height: number;
  segments: Segment[];
  captions: {startSec: number; endSec: number; text: string}[];
};

const defaultProps: DemoProps = {
  fps: 30,
  width: 1600,
  height: 900,
  segments: [],
  captions: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TermSheetTarotDemo"
      component={DemoVideo}
      fps={30}
      width={1600}
      height={900}
      defaultProps={defaultProps}
      durationInFrames={9000}
      calculateMetadata={({props}) => {
        const typed = props as DemoProps;
        const durationInFrames = Math.max(
          1,
          Math.ceil(typed.segments.reduce((sum, segment) => sum + segment.audioDurationSec, 0) * typed.fps),
        );

        return {
          durationInFrames,
          fps: typed.fps,
          width: typed.width,
          height: typed.height,
        };
      }}
    />
  );
};

export default RemotionRoot;
