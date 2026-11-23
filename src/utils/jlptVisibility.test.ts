import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_JLPT_LEVELS,
  isAllJlptLevelsVisible,
  matchesJlptLevelSpan,
  normalizeVisibleJlptLevels,
  resolveActiveVisibleLevel,
  toggleVisibleJlptLevel,
} from './jlptVisibility';

test('normalizeVisibleJlptLevels deduplicates, orders N5->N1, and defaults to all 5', () => {
  assert.deepEqual(normalizeVisibleJlptLevels(null), [...ALL_JLPT_LEVELS]);
  assert.deepEqual(normalizeVisibleJlptLevels([]), [...ALL_JLPT_LEVELS]);
  assert.deepEqual(normalizeVisibleJlptLevels(['N1', 'N5', 'N1', 'INVALID']), ['N5', 'N1']);
});

test('toggleVisibleJlptLevel toggles levels on/off and prevents removing the last remaining level', () => {
  const step1 = toggleVisibleJlptLevel(['N5', 'N4', 'N3', 'N2', 'N1'], 'N1');
  assert.equal(step1.blockedLastLevel, false);
  assert.deepEqual(step1.next, ['N5', 'N4', 'N3', 'N2']);

  const step2 = toggleVisibleJlptLevel(step1.next, 'N1');
  assert.equal(step2.blockedLastLevel, false);
  assert.deepEqual(step2.next, ['N5', 'N4', 'N3', 'N2', 'N1']);

  const blocked = toggleVisibleJlptLevel(['N4'], 'N4');
  assert.equal(blocked.blockedLastLevel, true);
  assert.deepEqual(blocked.next, ['N4']);
});

test('resolveActiveVisibleLevel preserves preferred if visible else picks first visible', () => {
  assert.equal(resolveActiveVisibleLevel('N4', ['N5', 'N4']), 'N4');
  assert.equal(resolveActiveVisibleLevel('N1', ['N5', 'N3']), 'N5');
});

test('isAllJlptLevelsVisible detects full vs filtered selections accurately', () => {
  assert.equal(isAllJlptLevelsVisible(['N5', 'N4', 'N3', 'N2', 'N1']), true);
  assert.equal(isAllJlptLevelsVisible(['N5', 'N4']), false);
});

test('matchesJlptLevelSpan evaluates single levels, ranges, and non-JLPT labels accurately', () => {
  assert.equal(matchesJlptLevelSpan('JLPT N5 → N4', ['N4']), true);
  assert.equal(matchesJlptLevelSpan('JLPT N5 → N4', ['N2', 'N1']), false);
  assert.equal(matchesJlptLevelSpan('JLPT N3–N1', ['N2']), true);
  assert.equal(matchesJlptLevelSpan('JLPT N3–N1', ['N5', 'N4']), false);
  assert.equal(matchesJlptLevelSpan('800 → 10,000 Words', ['N3']), true);
});
