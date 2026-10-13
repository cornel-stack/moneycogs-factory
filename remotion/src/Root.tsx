import React from "react";
import { Composition, Still } from "remotion";
import { Video } from "./Video";
import { ShortVideo } from "./ShortVideo";
import { Thumbnail } from "./Thumbnail";
import { CastSheetPoses, CastSheetExpr } from "./CastSheet";
import { CastGestureSheet } from "./CastGestureSheet";
import { CastSideSheet } from "./CastSideSheet";
import { CastCheckSheet } from "./CastCheckSheet";
import { CastSideExprCheck } from "./CastSideExprCheck";
import { PropSheet } from "./PropSheet";
import { StageSheet } from "./StageSheet";
import { TravelTest } from "./TravelTest";
import { WardrobeCompare } from "./WardrobeCompare";
import { PeepsCalib } from "./PeepsCalib";
import { PeepsFusionSheet } from "./PeepsFusionSheet";
import { CrowdDemo } from "./CrowdDemo";
import { MotionTest } from "./MotionTest";
import { CoggySheet } from "./components/Coggy";
import { VIDEO } from "./theme";
import { Script } from "./schema";
import type { RenderProps } from "./schema";
import sampleScript from "../../content/_fixtures/sample-video.json";

/**
 * Default props so Remotion Studio (and the Thumbnail still) open on the
 * MoneyCogs sample fixture without a real build. Actual renders always pass
 * `--props` (real script + measured timing manifest), which override these.
 *
 * The placeholder manifest gives every scene a uniform 3s slot (no real audio
 * timing); a dev render of the fixture expects silent clips at
 * remotion/public/assets/sample-video/<scene-id>.mp3 (gitignored build art).
 */
const PLACEHOLDER_SCENE_FRAMES = VIDEO.fps * 3;
const fixtureScript = Script.parse(sampleScript);

const defaultProps: RenderProps = {
  script: fixtureScript,
  manifest: {
    videoId: fixtureScript.id,
    fps: VIDEO.fps,
    width: VIDEO.width,
    height: VIDEO.height,
    totalDurationInFrames: PLACEHOLDER_SCENE_FRAMES * fixtureScript.scenes.length,
    scenes: fixtureScript.scenes.map((s, i) => ({
      id: s.id,
      type: s.type,
      startFrame: i * PLACEHOLDER_SCENE_FRAMES,
      durationInFrames: PLACEHOLDER_SCENE_FRAMES,
      audioFile: `assets/${fixtureScript.id}/${s.id}.mp3`,
      audioDurationSec: 3,
      words: [],
    })),
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Video}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={defaultProps.manifest.totalDurationInFrames}
        defaultProps={defaultProps}
        // Duration/fps/resolution are driven by the timing manifest at render time.
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(1, props.manifest.totalDurationInFrames),
          fps: props.manifest.fps,
          width: props.manifest.width,
          height: props.manifest.height,
        })}
      />
      <Still id="CastSheetPoses" component={CastSheetPoses} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CastSheetExpr" component={CastSheetExpr} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CastGestureSheet" component={CastGestureSheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CastSideSheet" component={CastSideSheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CastCheckSheet" component={CastCheckSheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CastSideExprCheck" component={CastSideExprCheck} width={VIDEO.width} height={VIDEO.height} />
      <Still id="PropSheet" component={PropSheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="Coggy" component={CoggySheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="StageSheet" component={StageSheet} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="TravelTest" component={TravelTest} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={130} />
      <Still id="WardrobeCompare" component={WardrobeCompare} width={VIDEO.width} height={VIDEO.height} />
      <Still id="PeepsCalib" component={PeepsCalib} width={1080} height={1080} />
      <Still id="PeepsFusionSheet" component={PeepsFusionSheet} width={VIDEO.width} height={VIDEO.height} />
      <Still id="CrowdDemo" component={CrowdDemo} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="MotionTest" component={MotionTest} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={780} />
      <Still
        id="Thumbnail"
        component={Thumbnail}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaultProps}
      />
      <Composition
        id="Short"
        component={ShortVideo}
        width={1080}
        height={1920}
        fps={VIDEO.fps}
        durationInFrames={defaultProps.manifest.totalDurationInFrames}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(1, props.manifest.totalDurationInFrames),
          fps: props.manifest.fps,
          width: props.manifest.width,
          height: props.manifest.height,
        })}
      />
    </>
  );
};
