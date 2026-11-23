import test from 'node:test';
import assert from 'node:assert/strict';
import { JLPT_LEVEL_ORDER, getJlptBadgeConfig } from './jlptBadge';

test('getJlptBadgeConfig maps N5 through N1 to ascending tiers and Japanese seals', () => {
  JLPT_LEVEL_ORDER.forEach((lvl, index) => {
    const cfg = getJlptBadgeConfig(lvl);
    assert.equal(cfg.level, lvl);
    assert.equal(cfg.tier, index + 1);
    assert.ok(cfg.japaneseSeal.length >= 2);
    assert.ok(cfg.kanjiGoal >= 100);
  });

  assert.equal(getJlptBadgeConfig('n2').level, 'N2');
  assert.equal(getJlptBadgeConfig(' n1 ').japaneseSeal, '達人');
  assert.equal(getJlptBadgeConfig('unknown').level, 'N5');
  assert.equal(getJlptBadgeConfig(undefined).level, 'N5');
});
