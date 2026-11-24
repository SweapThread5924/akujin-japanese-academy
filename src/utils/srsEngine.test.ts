import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeatmapDays,
  calculateSm2Review,
  computeRetentionAndStats,
  computeStreakAfterStudy,
  createInitialSrsProgress,
  evaluateUnlockedAchievements,
  getLearnerRank,
  interpolateRegisterTier,
  isStreakOnFire,
  selectAdaptiveDifficulty,
} from './srsEngine';

test('SM-2 SRS calculates intervals and eases correctly across ratings', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const card0 = createInitialSrsProgress('kanji-hibi', now.toISOString());

  const card1 = calculateSm2Review(card0, 4, now);
  assert.equal(card1.repetitions, 1);
  assert.equal(card1.intervalDays, 1);
  assert.equal(card1.correctCount, 1);

  const card2 = calculateSm2Review(card1, 4, now);
  assert.equal(card2.repetitions, 2);
  assert.equal(card2.intervalDays, 6);

  const card3 = calculateSm2Review(card2, 5, now);
  assert.equal(card3.repetitions, 3);
  assert.ok(card3.intervalDays > 6);

  // Lapse resets repetitions to 0 and interval to 1
  const lapsed = calculateSm2Review(card3, 1, now);
  assert.equal(lapsed.repetitions, 0);
  assert.equal(lapsed.intervalDays, 1);
  assert.equal(lapsed.lapses, 1);
});

test('computeRetentionAndStats aggregates learned count and retention accurately', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const a = calculateSm2Review(createInitialSrsProgress('a', now.toISOString()), 4, now);
  const b1 = calculateSm2Review(createInitialSrsProgress('b', now.toISOString()), 4, now);
  const b2 = calculateSm2Review(b1, 1, now); // 1 correct, 1 lapse

  const stats = computeRetentionAndStats({ a, b: b2 }, 10);
  assert.equal(stats.learnedCount, 1); // only 'a' has repetitions >= 1
  assert.equal(stats.totalReviews, 3);
  assert.equal(stats.retentionRate, 67);
  assert.equal(stats.deckCoveragePct, 10);
});

test('buildHeatmapDays creates exact contiguous UTC day grid', () => {
  const ref = new Date('2026-11-15T10:00:00Z');
  const grid = buildHeatmapDays({ '2026-11-15': 8, '2026-11-13': 4 }, 7, ref);
  assert.equal(grid.length, 7);
  assert.equal(grid[6].date, '2026-11-15');
  assert.equal(grid[6].reviews, 8);
  assert.equal(grid[4].date, '2026-11-13');
  assert.equal(grid[4].reviews, 4);
  assert.equal(grid[0].reviews, 0);
});

test('XP ranks, streaks, adaptive quiz difficulty, and register slider tiers behave deterministically', () => {
  assert.equal(getLearnerRank(0).title, 'Zero Starter');
  assert.equal(getLearnerRank(0).japaneseTitle, '入門');
  assert.equal(getLearnerRank(200).title, 'N5 Novice');
  assert.equal(getLearnerRank(1250).title, 'N3 Adept');
  assert.equal(getLearnerRank(3600).title, 'N1 Sensei');

  assert.equal(computeStreakAfterStudy(6, '2026-11-14', '2026-11-15'), 7);
  assert.equal(computeStreakAfterStudy(6, '2026-11-15', '2026-11-15'), 6);
  assert.equal(computeStreakAfterStudy(6, '2026-11-10', '2026-11-15'), 1);

  const promoted = selectAdaptiveDifficulty([true, true, true, true, true], 'N5');
  assert.equal(promoted.recommendedLevel, 'N4');
  assert.equal(promoted.difficultyLabel, 'Exam Challenge');

  const reinforced = selectAdaptiveDifficulty([false, false, false, true], 'N3');
  assert.equal(reinforced.recommendedLevel, 'N4');
  assert.equal(reinforced.difficultyLabel, 'Foundational');

  assert.equal(interpolateRegisterTier(10), 0);
  assert.equal(interpolateRegisterTier(50), 1);
  assert.equal(interpolateRegisterTier(90), 2);

  const badges = evaluateUnlockedAchievements({
    xp: 620,
    streak: 7,
    learnedKanjiCount: 100,
    bookmarkedCount: 3,
    quizCorrectTotal: 6,
  });
  assert.ok(badges.includes('streak_5'));
  assert.ok(badges.includes('streak_7'));
  assert.ok(badges.includes('kanji_5'));
  assert.ok(badges.includes('kanji_25'));
  assert.ok(badges.includes('kanji_100'));
  assert.ok(badges.includes('xp_500'));
  assert.ok(badges.includes('phrasebook_3'));

  assert.equal(isStreakOnFire(0), false);
  assert.equal(isStreakOnFire(4), false);
  assert.equal(isStreakOnFire(5), true);
  assert.equal(isStreakOnFire(7), true);
});

