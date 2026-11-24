import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS } from '../data/curriculumData';
import {
  createAchievementToastItem,
  createStandardToastItem,
  detectNewMilestoneAchievements,
  dismissToastItem,
  enqueueToastItems,
  sanitizeUnlockedAchievements,
} from './achievementToast';

test('detectNewMilestoneAchievements unlocks streak_5 on 5-day streak and awards XP bonus', () => {
  const res = detectNewMilestoneAchievements({
    xp: 100,
    streak: 5,
    learnedKanjiCount: 0,
    bookmarkedCount: 0,
    quizCorrectTotal: 0,
    existingUnlockedIds: ['streak_3'],
  });

  assert.deepEqual(res.newlyUnlockedIds, ['streak_5']);
  assert.ok(res.nextUnlockedIds.includes('streak_3'));
  assert.ok(res.nextUnlockedIds.includes('streak_5'));
  assert.equal(res.xpBonusEarned, 150);
  assert.equal(res.finalXp, 250);
});

test('detectNewMilestoneAchievements unlocks kanji_100 when 100 Kanji mastered and chains xp_500', () => {
  const res = detectNewMilestoneAchievements({
    xp: 120,
    streak: 1,
    learnedKanjiCount: 100,
    bookmarkedCount: 0,
    quizCorrectTotal: 0,
    existingUnlockedIds: ['first_kanji', 'kanji_5', 'kanji_25'],
  });

  assert.ok(res.newlyUnlockedIds.includes('kanji_100'));
  assert.ok(res.newlyUnlockedIds.includes('xp_500'));
  assert.equal(res.xpBonusEarned, 500); // 400 (kanji_100) + 100 (xp_500)
  assert.equal(res.finalXp, 620);
});

test('detectNewMilestoneAchievements never duplicates or re-awards already unlocked badges', () => {
  const res = detectNewMilestoneAchievements({
    xp: 620,
    streak: 5,
    learnedKanjiCount: 100,
    bookmarkedCount: 0,
    quizCorrectTotal: 0,
    existingUnlockedIds: [
      'streak_3',
      'streak_5',
      'first_kanji',
      'kanji_5',
      'kanji_25',
      'kanji_100',
      'xp_500',
    ],
  });

  assert.deepEqual(res.newlyUnlockedIds, []);
  assert.equal(res.xpBonusEarned, 0);
  assert.equal(res.finalXp, 620);
});

test('sanitizeUnlockedAchievements deduplicates, filters invalid entries, and preserves valid IDs', () => {
  const sanitized = sanitizeUnlockedAchievements([
    'streak_5',
    'invalid_badge',
    'streak_5',
    123,
    'kanji_100',
  ]);
  assert.deepEqual(sanitized, ['streak_5', 'kanji_100']);
});

test('enqueueToastItems deduplicates active achievements, prioritizes achievement cards over old info toasts, and dismisses cleanly', () => {
  const streak5Def = ACHIEVEMENTS.find((a) => a.id === 'streak_5')!;
  const kanji100Def = ACHIEVEMENTS.find((a) => a.id === 'kanji_100')!;

  const t1 = createStandardToastItem('Saved +10 XP', 1000);
  const t2 = createStandardToastItem('Hearts refilled', 1100);
  const a1 = createAchievementToastItem(streak5Def, 1200);
  const a1Dup = createAchievementToastItem(streak5Def, 1300);
  const a2 = createAchievementToastItem(kanji100Def, 1400);

  const q1 = enqueueToastItems([], [t1, t2, a1, a1Dup], 3);
  assert.equal(q1.length, 3);
  assert.equal(q1.filter((t) => t.kind === 'achievement').length, 1);
  assert.equal(a1.sealShape, 'circle');
  assert.equal(a2.sealShape, 'square');

  // Adding a second achievement trims oldest info toast first while preserving active achievements
  const q2 = enqueueToastItems(q1, [a2], 3);
  assert.equal(q2.length, 3);
  assert.ok(q2.some((t) => t.achievement?.id === 'streak_5'));
  assert.ok(q2.some((t) => t.achievement?.id === 'kanji_100'));

  const q3 = dismissToastItem(q2, a1.id);
  assert.equal(q3.length, 2);
  assert.ok(!q3.some((t) => t.id === a1.id));
});
