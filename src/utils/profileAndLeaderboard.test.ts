import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRealLeaderboard,
  getAchievementSealProgress,
} from './profileAndLeaderboard';

test('buildRealLeaderboard strips fake seeded entries and keeps only real learners sorted by XP', () => {
  const rawRows = [
    { id: 'lb-1', name: 'Sora Takahashi', targetLevel: 'N1', xp: 2480, streak: 28, kanjiLearned: 10 },
    { id: 'lb-2', name: 'Ananya Verma', targetLevel: 'N2', xp: 1790, streak: 19, kanjiLearned: 8 },
    { id: 'lb-3', name: 'Rohan Iyer', targetLevel: 'N3', xp: 1120, streak: 12, kanjiLearned: 6 },
    { id: 'lb-4', name: 'Yuki Sato', targetLevel: 'N5', xp: 260, streak: 4, kanjiLearned: 1 },
    { id: 'user-real-2', name: 'Aarav', targetLevel: 'N4', xp: 340, streak: 5, kanjiLearned: 4 },
  ];

  const result = buildRealLeaderboard(rawRows, {
    id: 'akujin-local',
    name: 'Anshul',
    targetLevel: 'N5',
    xp: 480,
    streak: 6,
    kanjiLearned: 5,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'akujin-local');
  assert.equal(result[0].name, 'Anshul');
  assert.equal(result[0].xp, 480);
  assert.equal(result[1].id, 'user-real-2');
  assert.ok(!result.some((r) => r.id.startsWith('lb-')));
});

test('getAchievementSealProgress returns accurate live progress percentages for all seals', () => {
  const metrics = {
    xp: 250,
    streak: 2,
    learnedKanjiCount: 3,
    bookmarkedCount: 1,
    quizCorrectTotal: 5,
  };

  const firstKanji = getAchievementSealProgress('first_kanji', metrics);
  assert.equal(firstKanji.pct, 100);
  assert.equal(firstKanji.progressLabel, '1 / 1 Kanji');

  const kanji5 = getAchievementSealProgress('kanji_5', metrics);
  assert.equal(kanji5.pct, 60);
  assert.equal(kanji5.progressLabel, '3 / 5 Kanji');

  const xp500 = getAchievementSealProgress('xp_500', metrics);
  assert.equal(xp500.pct, 50);

  const quiz5 = getAchievementSealProgress('quiz_5', metrics);
  assert.equal(quiz5.pct, 100);
});
