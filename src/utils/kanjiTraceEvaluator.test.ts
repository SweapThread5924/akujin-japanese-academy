import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIdealReferenceShape,
  evaluateFullTraceComparison,
  evaluateLiveTracePoint,
} from './kanjiTraceEvaluator';
import { KANJI_DECK } from '../data/curriculumData';

test('evaluateLiveTracePoint classifies locked, close, and off-track points accurately', () => {
  const yasumu = KANJI_DECK[0]; // 休
  const ref = buildIdealReferenceShape(yasumu.strokePaths);
  const exactPt = ref[0].points[4];

  const locked = evaluateLiveTracePoint(exactPt, ref);
  assert.equal(locked.zone, 'locked');
  assert.ok(locked.precisionPct >= 95);

  const close = evaluateLiveTracePoint({ x: exactPt.x + 7, y: exactPt.y }, ref);
  assert.equal(close.zone, 'close');

  const offTrack = evaluateLiveTracePoint({ x: 96, y: 10 }, ref);
  assert.equal(offTrack.zone, 'off-track');
});

test('evaluateFullTraceComparison passes when user traces ideal reference shape closely', () => {
  const yasumu = KANJI_DECK[0];
  const ref = buildIdealReferenceShape(yasumu.strokePaths);
  const slightlyOffsetStrokes = ref.map((s) =>
    s.points.map((p) => ({ x: p.x + 2, y: p.y - 1.5 }))
  );

  const result = evaluateFullTraceComparison(slightlyOffsetStrokes, ref);
  assert.equal(result.passed, true);
  assert.ok(result.coveragePct >= 95);
  assert.ok(result.shapeAccuracyPct >= 95);
  assert.ok(result.compositeScorePct >= 95);
});

test('evaluateFullTraceComparison fails partial or off-target traces with clear feedback', () => {
  const yasumu = KANJI_DECK[0];
  const ref = buildIdealReferenceShape(yasumu.strokePaths);

  // Only trace 1 stroke out of 6
  const partial = evaluateFullTraceComparison([ref[0].points], ref);
  assert.equal(partial.passed, false);
  assert.ok(partial.coveragePct < 50);
  assert.ok(partial.shapeAccuracyPct >= 90);

  // Draw off-target scribble far away from strokes
  const offTarget = evaluateFullTraceComparison(
    [[{ x: 5, y: 5 }, { x: 95, y: 5 }, { x: 95, y: 95 }]],
    ref
  );
  assert.equal(offTarget.passed, false);
  assert.ok(offTarget.shapeAccuracyPct < 65);
});
