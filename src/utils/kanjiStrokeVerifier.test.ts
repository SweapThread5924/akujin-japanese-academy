import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSvgStrokePath,
  resamplePolyline,
  verifyStrokeAttempt,
  type Point2D,
} from './kanjiStrokeVerifier';
import { KANJI_DECK } from '../data/curriculumData';

function reversePoints(pts: Point2D[]): Point2D[] {
  return [...pts].reverse();
}

test('parseSvgStrokePath samples M/L/C/Z commands cleanly in 0..100 space', () => {
  const linePts = parseSvgStrokePath('M 40 38 L 86 38');
  assert.ok(linePts.length >= 2);
  assert.deepEqual(linePts[0], { x: 40, y: 38 });
  assert.deepEqual(linePts[linePts.length - 1], { x: 86, y: 38 });

  const curvePts = parseSvgStrokePath('M 34 16 C 28 32 20 44 12 54');
  assert.ok(curvePts.length >= 10);
  assert.deepEqual(curvePts[0], { x: 34, y: 16 });
  assert.deepEqual(curvePts[curvePts.length - 1], { x: 12, y: 54 });
});

test('verifyStrokeAttempt accepts accurate stroke with slight natural hand jitter', () => {
  const yasumu = KANJI_DECK[0]; // 休
  const guide = resamplePolyline(parseSvgStrokePath(yasumu.strokePaths[0]), 20);
  const slightlyJittered = guide.map((p, idx) => ({
    x: p.x + (idx % 2 === 0 ? 1.5 : -1.2),
    y: p.y + (idx % 3 === 0 ? 1.0 : -0.8),
  }));

  const res = verifyStrokeAttempt({
    strokePaths: yasumu.strokePaths,
    expectedStrokeIndex: 0,
    userPoints: slightlyJittered,
  });

  assert.equal(res.passed, true);
  assert.ok(res.accuracyPct >= 75);
});

test('verifyStrokeAttempt rejects reversed stroke direction with explicit hint', () => {
  const yasumu = KANJI_DECK[0]; // 休 stroke 3: M 40 38 L 86 38 (left to right)
  const forward = parseSvgStrokePath(yasumu.strokePaths[2]);
  const reversed = reversePoints(forward);

  const res = verifyStrokeAttempt({
    strokePaths: yasumu.strokePaths,
    expectedStrokeIndex: 2,
    userPoints: reversed,
  });

  assert.equal(res.passed, false);
  assert.equal(res.reason, 'wrong-direction');
});

test('verifyStrokeAttempt detects out-of-order stroke and prompts expected stroke number', () => {
  const yasumu = KANJI_DECK[0]; // 休
  const stroke3Pts = parseSvgStrokePath(yasumu.strokePaths[2]); // Horizontal crossbeam

  const res = verifyStrokeAttempt({
    strokePaths: yasumu.strokePaths,
    expectedStrokeIndex: 0, // Expecting stroke 1 (left slant)
    userPoints: stroke3Pts,
  });

  assert.equal(res.passed, false);
  assert.equal(res.reason, 'wrong-order');
  assert.equal(res.matchedOutOfOrderIndex, 2);
});

test('verifyStrokeAttempt rejects tiny accidental taps as too-short', () => {
  const yasumu = KANJI_DECK[0];
  const res = verifyStrokeAttempt({
    strokePaths: yasumu.strokePaths,
    expectedStrokeIndex: 0,
    userPoints: [
      { x: 34, y: 16 },
      { x: 35, y: 17 },
    ],
  });

  assert.equal(res.passed, false);
  assert.equal(res.reason, 'too-short');
});

test('every KANJI_DECK stroke path self-verifies cleanly in exact order', () => {
  for (const card of KANJI_DECK) {
    assert.ok(card.strokePaths.length > 0, `${card.kanji} must have strokePaths`);
    for (let i = 0; i < card.strokePaths.length; i++) {
      const pts = parseSvgStrokePath(card.strokePaths[i]);
      const res = verifyStrokeAttempt({
        strokePaths: card.strokePaths,
        expectedStrokeIndex: i,
        userPoints: pts,
      });
      assert.equal(
        res.passed,
        true,
        `${card.kanji} stroke ${i + 1} failed self-verification: ${res.feedback}`
      );
    }
  }
});
