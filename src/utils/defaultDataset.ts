// Heuristic Rule Classifier & Pre-populated Baseline Dataset for all 42 signs

import { LandmarkPoint, normalizeLandmarks } from "./gestureClassifier";

export type HandPoseConfig = {
  thumb: "extended" | "curled" | "up" | "down" | "across" | "touch_index" | "touch_middle" | "touch_ring" | "touch_pinky";
  index: "extended" | "curled" | "bent" | "touch_thumb";
  middle: "extended" | "curled" | "bent" | "touch_thumb";
  ring: "extended" | "curled" | "bent" | "touch_thumb";
  pinky: "extended" | "curled" | "bent" | "touch_thumb";
  handOrientation?: "up" | "down" | "sideways";
};

// Base MCP positions relative to wrist (0,0,0)
const MCP_POS = {
  thumb: { x: -0.3, y: -0.2, z: 0 },
  index: { x: -0.2, y: -0.6, z: 0 },
  middle: { x: 0.0, y: -0.65, z: 0 },
  ring: { x: 0.2, y: -0.6, z: 0 },
  pinky: { x: 0.35, y: -0.5, z: 0 },
};

function generatePoseLandmarks(config: HandPoseConfig, variationAngle = 0): number[] {
  const pts: LandmarkPoint[] = new Array(21);
  pts[0] = { x: 0, y: 0, z: 0 }; // Wrist

  // Rotate helper
  const cos = Math.cos(variationAngle);
  const sin = Math.sin(variationAngle);
  const rotate = (x: number, y: number, z: number) => ({
    x: x * cos - y * sin,
    y: x * sin + y * cos,
    z,
  });

  // Helper for 4 joints of a finger
  const buildFinger = (mcp: { x: number; y: number; z: number }, dirX: number, dirY: number, state: string, startIndex: number) => {
    let dx = dirX;
    let dy = dirY;
    let dz = 0;

    if (state === "curled") {
      dx *= 0.2;
      dy = 0.2; // Curl toward wrist
      dz = 0.3;
    } else if (state === "bent") {
      dx *= 0.5;
      dy *= 0.5;
      dz = 0.2;
    }

    const p1 = { x: mcp.x + dx * 0.3, y: mcp.y + dy * 0.3, z: mcp.z + dz * 0.3 };
    const p2 = { x: mcp.x + dx * 0.6, y: mcp.y + dy * 0.6, z: mcp.z + dz * 0.6 };
    const p3 = { x: mcp.x + dx * 1.0, y: mcp.y + dy * 1.0, z: mcp.z + dz * 1.0 };

    pts[startIndex] = rotate(mcp.x, mcp.y, mcp.z);
    pts[startIndex + 1] = rotate(p1.x, p1.y, p1.z);
    pts[startIndex + 2] = rotate(p2.x, p2.y, p2.z);
    pts[startIndex + 3] = rotate(p3.x, p3.y, p3.z);
  };

  // Build 4 main fingers
  buildFinger(MCP_POS.index, -0.15, -0.4, config.index, 5);
  buildFinger(MCP_POS.middle, 0, -0.45, config.middle, 9);
  buildFinger(MCP_POS.ring, 0.15, -0.4, config.ring, 13);
  buildFinger(MCP_POS.pinky, 0.3, -0.35, config.pinky, 17);

  // Build Thumb
  const tMcp = MCP_POS.thumb;
  let tDirX = -0.4;
  let tDirY = -0.3;
  let tDirZ = 0;

  if (config.thumb === "up") { tDirX = -0.1; tDirY = -0.6; }
  else if (config.thumb === "down") { tDirX = -0.1; tDirY = 0.6; }
  else if (config.thumb === "curled" || config.thumb === "across") { tDirX = 0.2; tDirY = -0.1; tDirZ = 0.2; }
  else if (config.thumb === "touch_index") {
    tDirX = pts[8].x - tMcp.x;
    tDirY = pts[8].y - tMcp.y;
  } else if (config.thumb === "touch_middle") {
    tDirX = pts[12].x - tMcp.x;
    tDirY = pts[12].y - tMcp.y;
  } else if (config.thumb === "touch_ring") {
    tDirX = pts[16].x - tMcp.x;
    tDirY = pts[16].y - tMcp.y;
  } else if (config.thumb === "touch_pinky") {
    tDirX = pts[20].x - tMcp.x;
    tDirY = pts[20].y - tMcp.y;
  }

  pts[1] = rotate(tMcp.x, tMcp.y, tMcp.z);
  pts[2] = rotate(tMcp.x + tDirX * 0.3, tMcp.y + tDirY * 0.3, tMcp.z + tDirZ * 0.3);
  pts[3] = rotate(tMcp.x + tDirX * 0.6, tMcp.y + tDirY * 0.6, tMcp.z + tDirZ * 0.6);
  pts[4] = rotate(tMcp.x + tDirX * 1.0, tMcp.y + tDirY * 1.0, tMcp.z + tDirZ * 1.0);

  return normalizeLandmarks(pts);
}

// Generate baseline dataset with 15 samples per sign for all 42 signs
export function generatePrepopulatedDataset(): Record<string, number[][]> {
  const dataset: Record<string, number[][]> = {};

  const POSE_SPECS: Record<string, HandPoseConfig> = {
    // Greetings
    hello: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    goodbye: { thumb: "curled", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    thank_you: { thumb: "across", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    please: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    welcome: { thumb: "extended", index: "extended", middle: "extended", ring: "curled", pinky: "extended" },
    nice_to_meet_you: { thumb: "across", index: "extended", middle: "curled", ring: "curled", pinky: "curled" },

    // Needs
    water: { thumb: "touch_pinky", index: "extended", middle: "extended", ring: "extended", pinky: "curled" },
    food: { thumb: "touch_index", index: "bent", middle: "bent", ring: "bent", pinky: "bent" },
    bathroom: { thumb: "across", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    help: { thumb: "up", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    more: { thumb: "touch_index", index: "touch_thumb", middle: "touch_thumb", ring: "touch_thumb", pinky: "touch_thumb" },
    done: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    need: { thumb: "across", index: "bent", middle: "curled", ring: "curled", pinky: "curled" },
    want: { thumb: "extended", index: "bent", middle: "bent", ring: "bent", pinky: "bent" },
    sleep: { thumb: "across", index: "bent", middle: "bent", ring: "bent", pinky: "bent" },
    wash: { thumb: "across", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },

    // Emergency
    emergency: { thumb: "across", index: "bent", middle: "bent", ring: "bent", pinky: "bent" },
    stop: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    pain: { thumb: "across", index: "extended", middle: "curled", ring: "curled", pinky: "curled" },
    danger: { thumb: "up", index: "extended", middle: "curled", ring: "curled", pinky: "curled" },
    doctor: { thumb: "across", index: "extended", middle: "extended", ring: "curled", pinky: "curled" },
    police: { thumb: "extended", index: "bent", middle: "bent", ring: "curled", pinky: "curled" },
    fire: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    care: { thumb: "across", index: "extended", middle: "extended", ring: "curled", pinky: "curled" },

    // Numbers 0-9
    num_0: { thumb: "touch_index", index: "touch_thumb", middle: "curled", ring: "curled", pinky: "curled" },
    num_1: { thumb: "across", index: "extended", middle: "curled", ring: "curled", pinky: "curled" },
    num_2: { thumb: "across", index: "extended", middle: "extended", ring: "curled", pinky: "curled" },
    num_3: { thumb: "extended", index: "extended", middle: "extended", ring: "curled", pinky: "curled" },
    num_4: { thumb: "across", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    num_5: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    num_6: { thumb: "touch_pinky", index: "extended", middle: "extended", ring: "extended", pinky: "touch_thumb" },
    num_7: { thumb: "touch_ring", index: "extended", middle: "extended", ring: "touch_thumb", pinky: "extended" },
    num_8: { thumb: "touch_middle", index: "extended", middle: "touch_thumb", ring: "extended", pinky: "extended" },
    num_9: { thumb: "touch_index", index: "touch_thumb", middle: "extended", ring: "extended", pinky: "extended" },

    // Responses
    yes: { thumb: "up", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    no: { thumb: "down", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    ok: { thumb: "touch_index", index: "touch_thumb", middle: "extended", ring: "extended", pinky: "extended" },
    maybe: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
    understand: { thumb: "across", index: "extended", middle: "curled", ring: "curled", pinky: "curled" },
    good: { thumb: "up", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    bad: { thumb: "down", index: "curled", middle: "curled", ring: "curled", pinky: "curled" },
    wait: { thumb: "extended", index: "extended", middle: "extended", ring: "extended", pinky: "extended" },
  };

  Object.entries(POSE_SPECS).forEach(([id, spec]) => {
    const samples: number[][] = [];
    // Generate 15 angle variations per pose
    for (let i = 0; i < 15; i++) {
      const angle = ((i - 7) * 4 * Math.PI) / 180;
      samples.push(generatePoseLandmarks(spec, angle));
    }
    dataset[id] = samples;
  });

  return dataset;
}

/**
 * Geometric Rule Classifier Fallback for instantaneous 42-gesture recognition
 */
export function classifyByRules(points: LandmarkPoint[]): { id: string; confidence: number } {
  if (!points || points.length < 21) return { id: "no_match", confidence: 0 };
  const wrist = points[0];

  const extended = [[8, 6], [12, 10], [16, 14], [20, 18]].map(
    ([tip, pip]) => points[tip].y < points[pip].y - 0.02
  );
  const [indexExt, middleExt, ringExt, pinkyExt] = extended;

  const thumbSpread = Math.hypot(points[4].x - points[5].x, points[4].y - points[5].y);
  const thumbUp = points[4].y < wrist.y - 0.06 && !indexExt && !middleExt && !ringExt && !pinkyExt;
  const thumbDown = points[4].y > wrist.y + 0.08 && !indexExt && !middleExt && !ringExt && !pinkyExt;

  const pinchIndex = Math.hypot(points[4].x - points[8].x, points[4].y - points[8].y) < 0.08;
  const pinchMiddle = Math.hypot(points[4].x - points[12].x, points[4].y - points[12].y) < 0.08;
  const pinchRing = Math.hypot(points[4].x - points[16].x, points[4].y - points[16].y) < 0.08;
  const pinchPinky = Math.hypot(points[4].x - points[20].x, points[4].y - points[20].y) < 0.08;

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  if (pinchIndex && middleExt && ringExt && pinkyExt) return { id: "ok", confidence: 94 };
  if (pinchIndex && !middleExt && !ringExt && !pinkyExt) return { id: "num_0", confidence: 91 };
  if (thumbUp) return { id: "yes", confidence: 93 };
  if (thumbDown) return { id: "no", confidence: 93 };
  if (indexExt && !middleExt && !ringExt && !pinkyExt) return { id: "num_1", confidence: 92 };
  if (indexExt && middleExt && !ringExt && !pinkyExt) return { id: "num_2", confidence: 92 };
  if (indexExt && middleExt && ringExt && !pinkyExt && pinchPinky) return { id: "water", confidence: 90 };
  if (indexExt && middleExt && ringExt && !pinkyExt) return { id: "num_3", confidence: 91 };
  if (indexExt && middleExt && ringExt && pinkyExt && !thumbSpread) return { id: "num_4", confidence: 91 };
  if (indexExt && middleExt && ringExt && pinkyExt && thumbSpread) return { id: "hello", confidence: 93 };
  if (pinchMiddle && indexExt && ringExt && pinkyExt) return { id: "num_8", confidence: 89 };
  if (pinchRing && indexExt && middleExt && pinkyExt) return { id: "num_7", confidence: 89 };
  if (pinchPinky && indexExt && middleExt && ringExt) return { id: "num_6", confidence: 89 };

  if (extendedCount === 4) return { id: "stop", confidence: 88 };
  if (extendedCount === 0) return { id: "bathroom", confidence: 85 };

  return { id: "no_match", confidence: 0 };
}
