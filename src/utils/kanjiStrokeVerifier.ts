export interface Point2D {
  x: number;
  y: number;
}

export type StrokeFailureReason =
  | 'too-short'
  | 'wrong-direction'
  | 'wrong-order'
  | 'off-target';

export interface StrokeVerificationResult {
  passed: boolean;
  accuracyPct: number;
  reason?: StrokeFailureReason;
  matchedOutOfOrderIndex?: number;
  feedback: string;
}

const SAMPLE_COUNT = 24;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cubicPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function quadPoint(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function distanceBetween(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polylineLength(points: Point2D[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distanceBetween(points[i - 1], points[i]);
  }
  return len;
}

/**
 * Parses an SVG path string (supporting M, L, C, Q, Z) in 0..100 coordinates
 * into a dense sequence of 2D points.
 */
export function parseSvgStrokePath(d: string): Point2D[] {
  const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+/g);
  if (!tokens || tokens.length === 0) return [];

  const points: Point2D[] = [];
  let idx = 0;
  let cmd = '';
  let current: Point2D = { x: 0, y: 0 };
  let startSubpath: Point2D = { x: 0, y: 0 };

  const nextNum = (): number => {
    const val = Number(tokens[idx]);
    idx += 1;
    return Number.isFinite(val) ? val : 0;
  };

  while (idx < tokens.length) {
    const tok = tokens[idx];
    if (/^[MLCQZmlcqz]$/.test(tok)) {
      cmd = tok;
      idx += 1;
      if (cmd === 'Z' || cmd === 'z') {
        if (distanceBetween(current, startSubpath) > 0.1) {
          for (let s = 1; s <= 6; s++) {
            const t = s / 6;
            points.push({
              x: lerp(current.x, startSubpath.x, t),
              y: lerp(current.y, startSubpath.y, t),
            });
          }
          current = { ...startSubpath };
        }
        continue;
      }
    }

    if (cmd === 'M' || cmd === 'L') {
      const x = nextNum();
      const y = nextNum();
      const target = { x, y };
      if (cmd === 'M' && points.length === 0) {
        points.push(target);
        startSubpath = { ...target };
      } else if (cmd === 'M') {
        points.push(target);
        startSubpath = { ...target };
      } else {
        for (let s = 1; s <= 8; s++) {
          const t = s / 8;
          points.push({
            x: lerp(current.x, target.x, t),
            y: lerp(current.y, target.y, t),
          });
        }
      }
      current = target;
      if (cmd === 'M') cmd = 'L';
    } else if (cmd === 'C') {
      const c1 = { x: nextNum(), y: nextNum() };
      const c2 = { x: nextNum(), y: nextNum() };
      const end = { x: nextNum(), y: nextNum() };
      const p0 = { ...current };
      for (let s = 1; s <= 12; s++) {
        points.push(cubicPoint(p0, c1, c2, end, s / 12));
      }
      current = end;
    } else if (cmd === 'Q') {
      const c1 = { x: nextNum(), y: nextNum() };
      const end = { x: nextNum(), y: nextNum() };
      const p0 = { ...current };
      for (let s = 1; s <= 10; s++) {
        points.push(quadPoint(p0, c1, end, s / 10));
      }
      current = end;
    } else {
      // Skip unrecognized token safely
      idx += 1;
    }
  }

  return points;
}

export function resamplePolyline(
  rawPoints: Point2D[],
  count: number = SAMPLE_COUNT
): Point2D[] {
  if (rawPoints.length === 0) return [];
  if (rawPoints.length === 1 || count <= 1) {
    return Array.from({ length: count }, () => ({ ...rawPoints[0] }));
  }

  const totalLen = polylineLength(rawPoints);
  if (totalLen < 0.001) {
    return Array.from({ length: count }, () => ({ ...rawPoints[0] }));
  }

  const step = totalLen / (count - 1);
  const resampled: Point2D[] = [{ ...rawPoints[0] }];
  let accumulated = 0;
  let i = 1;
  let prev = { ...rawPoints[0] };

  while (i < rawPoints.length && resampled.length < count) {
    const curr = rawPoints[i];
    const segLen = distanceBetween(prev, curr);
    if (accumulated + segLen >= step) {
      const t = (step - accumulated) / Math.max(segLen, 1e-6);
      const interpolated = {
        x: lerp(prev.x, curr.x, t),
        y: lerp(prev.y, curr.y, t),
      };
      resampled.push(interpolated);
      prev = interpolated;
      accumulated = 0;
    } else {
      accumulated += segLen;
      prev = curr;
      i += 1;
    }
  }

  while (resampled.length < count) {
    resampled.push({ ...rawPoints[rawPoints.length - 1] });
  }

  return resampled;
}

function meanNearestDistance(source: Point2D[], target: Point2D[]): number {
  if (source.length === 0 || target.length === 0) return Infinity;
  let sum = 0;
  for (const p of source) {
    let best = Infinity;
    for (const q of target) {
      const d = distanceBetween(p, q);
      if (d < best) best = d;
    }
    sum += best;
  }
  return sum / source.length;
}

function computeDirectionDot(aStart: Point2D, aEnd: Point2D, bStart: Point2D, bEnd: Point2D): number {
  const ax = aEnd.x - aStart.x;
  const ay = aEnd.y - aStart.y;
  const bx = bEnd.x - bStart.x;
  const by = bEnd.y - bStart.y;
  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  if (magA < 4 || magB < 4) return 1; // Closed or near-closed box stroke
  return (ax * bx + ay * by) / (magA * magB);
}

interface SingleStrokeScore {
  passed: boolean;
  accuracyPct: number;
  directionDot: number;
  startDist: number;
  endDist: number;
  meanPathDist: number;
}

function scoreAgainstExpectedPath(
  userResampled: Point2D[],
  expectedPathD: string
): SingleStrokeScore {
  const expectedRaw = parseSvgStrokePath(expectedPathD);
  const expectedResampled = resamplePolyline(expectedRaw, SAMPLE_COUNT);

  if (expectedResampled.length === 0 || userResampled.length === 0) {
    return {
      passed: false,
      accuracyPct: 0,
      directionDot: 0,
      startDist: 100,
      endDist: 100,
      meanPathDist: 100,
    };
  }

  const uStart = userResampled[0];
  const uEnd = userResampled[userResampled.length - 1];
  const eStart = expectedResampled[0];
  const eEnd = expectedResampled[expectedResampled.length - 1];

  const startDist = distanceBetween(uStart, eStart);
  const endDist = distanceBetween(uEnd, eEnd);
  const forwardDist = meanNearestDistance(userResampled, expectedResampled);
  const backwardDist = meanNearestDistance(expectedResampled, userResampled);
  const meanPathDist = (forwardDist + backwardDist) / 2;

  const expectedDisp = distanceBetween(eStart, eEnd);
  const directionDot =
    expectedDisp >= 8 ? computeDirectionDot(uStart, uEnd, eStart, eEnd) : 1;

  // Compute human-readable accuracy score 0..100
  const pathPenalty = meanPathDist * 2.1;
  const endpointPenalty = ((startDist + endDist) / 2) * 0.85;
  const dirPenalty = directionDot < 0.7 ? (0.7 - directionDot) * 45 : 0;
  const rawScore = Math.round(
    Math.max(0, Math.min(100, 100 - pathPenalty - endpointPenalty - dirPenalty))
  );

  const passed =
    startDist <= 26 &&
    endDist <= 28 &&
    meanPathDist <= 22 &&
    directionDot >= 0.35;

  return {
    passed,
    accuracyPct: rawScore,
    directionDot,
    startDist,
    endDist,
    meanPathDist,
  };
}

/**
 * Verifies a user-drawn canvas stroke (in normalized 0..100 SVG coordinates)
 * against the expected stroke at `expectedStrokeIndex` and checks for
 * directional errors or out-of-order strokes from the remaining stroke sequence.
 */
export function verifyStrokeAttempt(params: {
  strokePaths: string[];
  expectedStrokeIndex: number;
  userPoints: Point2D[];
}): StrokeVerificationResult {
  const { strokePaths, expectedStrokeIndex, userPoints } = params;

  if (
    expectedStrokeIndex < 0 ||
    expectedStrokeIndex >= strokePaths.length ||
    userPoints.length < 2
  ) {
    return {
      passed: false,
      accuracyPct: 0,
      reason: 'too-short',
      feedback: 'Draw a full stroke following the numbered guide.',
    };
  }

  const userLen = polylineLength(userPoints);
  if (userLen < 6) {
    return {
      passed: false,
      accuracyPct: 0,
      reason: 'too-short',
      feedback: 'Stroke too short — draw smoothly from start to finish.',
    };
  }

  const userResampled = resamplePolyline(userPoints, SAMPLE_COUNT);
  const expectedD = strokePaths[expectedStrokeIndex];
  const score = scoreAgainstExpectedPath(userResampled, expectedD);

  if (score.passed) {
    return {
      passed: true,
      accuracyPct: Math.max(score.accuracyPct, 72),
      feedback: `Stroke ${expectedStrokeIndex + 1} verified (${Math.max(
        score.accuracyPct,
        72
      )}% match).`,
    };
  }

  // Check if the user drew the expected stroke in reverse direction
  if (
    score.meanPathDist <= 22 &&
    score.directionDot < 0.2
  ) {
    return {
      passed: false,
      accuracyPct: Math.min(score.accuracyPct, 48),
      reason: 'wrong-direction',
      feedback: `Reverse direction on stroke ${
        expectedStrokeIndex + 1
      } — start at the red dot and follow the arrow.`,
    };
  }

  // Check if the user drew a different (later or earlier) stroke out of order
  let bestOtherIdx = -1;
  let bestOtherScore = 0;
  for (let i = 0; i < strokePaths.length; i++) {
    if (i === expectedStrokeIndex) continue;
    const candidate = scoreAgainstExpectedPath(userResampled, strokePaths[i]);
    if (candidate.passed && candidate.accuracyPct > bestOtherScore) {
      bestOtherIdx = i;
      bestOtherScore = candidate.accuracyPct;
    }
  }

  if (bestOtherIdx !== -1) {
    return {
      passed: false,
      accuracyPct: score.accuracyPct,
      reason: 'wrong-order',
      matchedOutOfOrderIndex: bestOtherIdx,
      feedback: `Wrong stroke order — that matches stroke ${
        bestOtherIdx + 1
      }. Draw stroke ${expectedStrokeIndex + 1} first.`,
    };
  }

  return {
    passed: false,
    accuracyPct: score.accuracyPct,
    reason: 'off-target',
    feedback: `Off target for stroke ${
      expectedStrokeIndex + 1
    } — trace closer to the dashed guide from the start dot.`,
  };
}
