import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeScrollProgressPct,
  computeStaggerDelayMs,
  isElementInitiallyInViewport,
} from './scrollReveal.ts';

test('computeScrollProgressPct clamps cleanly between 0 and 100', () => {
  assert.equal(computeScrollProgressPct(0, 2000, 1000), 0);
  assert.equal(computeScrollProgressPct(500, 2000, 1000), 50);
  assert.equal(computeScrollProgressPct(1000, 2000, 1000), 100);
  assert.equal(computeScrollProgressPct(1500, 2000, 1000), 100);
  assert.equal(computeScrollProgressPct(0, 800, 900), 0);
});

test('computeStaggerDelayMs produces progressive capped delays', () => {
  assert.equal(computeStaggerDelayMs(0), 0);
  assert.equal(computeStaggerDelayMs(1, 60, 300), 60);
  assert.equal(computeStaggerDelayMs(3, 60, 300), 180);
  assert.equal(computeStaggerDelayMs(10, 60, 300), 300);
});

test('isElementInitiallyInViewport detects above-the-fold and below-the-fold elements', () => {
  assert.equal(isElementInitiallyInViewport(120, 420, 900), true);
  assert.equal(isElementInitiallyInViewport(950, 1200, 900), false);
  assert.equal(isElementInitiallyInViewport(-200, -10, 900), false);
});
