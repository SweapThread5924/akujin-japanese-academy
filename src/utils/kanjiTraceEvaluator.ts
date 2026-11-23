import {
  distanceBetween,
  parseSvgStrokePath,
  resamplePolyline,
  type Point2D,
} from './kanjiStrokeVerifier';

export type TraceHapticZone = 'locked' | 'close' | 'off-track';

export interface ReferenceStrokeSample {
  strokeIndex: number;
  points: Point2D[];
}

export interface LiveTraceEvaluation {
  zone: TraceHapticZone;
  minDistance: number;
  snappedPoint: Point2D;
  precisionPct: number;
}

export interface FullTraceComparison {
  shapeAccuracyPct: number;
  coveragePct: number;
  compositeScorePct: number;
  passed: boolean;
  coveredStrokePointFlags: boolean[][];
  feedback: string;
}

export const TRACE_LOCKED_RADIUS = 5.5;
export const TRACE_TOLERANCE_RADIUS = 9.5;

/**
 * Builds a dense ideal reference point set from a Kanji's SVG strokePaths
 * in normalized 0..100 canvas coordinates.
 */
export function buildIdealReferenceShape(
  strokePaths: string[],
  pointsPerStroke = 32
): ReferenceStrokeSample[] {
  return strokePaths.map((d, idx) => ({
    strokeIndex: idx,
    points: resamplePolyline(parseSvgStrokePath(d), pointsPerStroke),
  }));
}

/**
 * Evaluates a single live cursor/pen coordinate against the ideal reference shape
 * for real-time haptic-like visual feedback.
 */
export function evaluateLiveTracePoint(
  point: Point2D,
  referenceStrokes: ReferenceStrokeSample[]
): LiveTraceEvaluation {
  let minDistance = Infinity;
  let snappedPoint: Point2D = { ...point };

  for (const stroke of referenceStrokes) {
    for (const refPt of stroke.points) {
      const d = distanceBetween(point, refPt);
      if (d < minDistance) {
        minDistance = d;
        snappedPoint = refPt;
      }
    }
  }

  if (!Number.isFinite(minDistance)) {
    return {
      zone: 'off-track',
      minDistance: 100,
      snappedPoint: { ...point },
      precisionPct: 0,
    };
  }

  let zone: TraceHapticZone = 'off-track';
  if (minDistance <= TRACE_LOCKED_RADIUS) {
    zone = 'locked';
  } else if (minDistance <= TRACE_TOLERANCE_RADIUS) {
    zone = 'close';
  }

  const precisionPct = Math.round(
    Math.max(0, Math.min(100, 100 - minDistance * 6.5))
  );

  return {
    zone,
    minDistance: Number(minDistance.toFixed(2)),
    snappedPoint,
    precisionPct,
  };
}

/**
 * Compares all user-traced strokes against the ideal reference shape, computing
 * path accuracy, shape coverage, and per-reference-point coverage flags.
 */
export function evaluateFullTraceComparison(
  userStrokes: Point2D[][],
  referenceStrokes: ReferenceStrokeSample[],
  toleranceRadius = TRACE_TOLERANCE_RADIUS
): FullTraceComparison {
  const allUserPoints: Point2D[] = [];
  for (const stroke of userStrokes) {
    for (const pt of stroke) {
      allUserPoints.push(pt);
    }
  }

  const coveredStrokePointFlags = referenceStrokes.map((stroke) =>
    stroke.points.map(() => false)
  );

  if (allUserPoints.length === 0 || referenceStrokes.length === 0) {
    return {
      shapeAccuracyPct: 0,
      coveragePct: 0,
      compositeScorePct: 0,
      passed: false,
      coveredStrokePointFlags,
      feedback: 'Trace smoothly over the ideal Kanji reference shape.',
    };
  }

  // 1. Accuracy: percentage of user trace points within tolerance of ideal shape
  let accurateUserPts = 0;
  for (const uPt of allUserPoints) {
    const evalRes = evaluateLiveTracePoint(uPt, referenceStrokes);
    if (evalRes.minDistance <= toleranceRadius) {
      accurateUserPts += 1;
    }
  }
  const shapeAccuracyPct = Math.round((accurateUserPts / allUserPoints.length) * 100);

  // 2. Coverage: percentage of ideal reference points covered by user trace
  let totalRefPts = 0;
  let coveredRefPts = 0;
  for (let sIdx = 0; sIdx < referenceStrokes.length; sIdx++) {
    const refPts = referenceStrokes[sIdx].points;
    for (let pIdx = 0; pIdx < refPts.length; pIdx++) {
      totalRefPts += 1;
      const rPt = refPts[pIdx];
      for (const uPt of allUserPoints) {
        if (distanceBetween(uPt, rPt) <= toleranceRadius) {
          coveredStrokePointFlags[sIdx][pIdx] = true;
          coveredRefPts += 1;
          break;
        }
      }
    }
  }

  const coveragePct =
    totalRefPts > 0 ? Math.round((coveredRefPts / totalRefPts) * 100) : 0;
  const compositeScorePct = Math.round(coveragePct * 0.55 + shapeAccuracyPct * 0.45);
  const passed = coveragePct >= 78 && shapeAccuracyPct >= 72;

  let feedback = `Keep tracing — ${coveragePct}% of ideal shape covered (${shapeAccuracyPct}% precision).`;
  if (passed) {
    feedback = `Ideal shape matched! ${coveragePct}% coverage · ${shapeAccuracyPct}% trace precision.`;
  } else if (shapeAccuracyPct < 65) {
    feedback = `Drifting off the ideal reference (${shapeAccuracyPct}% precision) — stay closer to the dashed guide.`;
  }

  return {
    shapeAccuracyPct,
    coveragePct,
    compositeScorePct,
    passed,
    coveredStrokePointFlags,
    feedback,
  };
}
