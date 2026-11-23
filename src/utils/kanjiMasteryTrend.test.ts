import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKanjiMasteryTrend } from './kanjiMasteryTrend';
import type { SrsCardProgress } from './srsEngine';

test('buildKanjiMasteryTrend returns 30 clean zero-filled days when srsProgress is empty', () => {
  const now = new Date('2026-11-19T12:00:00.000Z');
  const result = buildKanjiMasteryTrend({}, 30, now);

  assert.equal(result.points.length, 30);
  assert.equal(result.points[0].date, '2026-10-21');
  assert.equal(result.points[29].date, '2026-11-19');
  assert.equal(result.points[29].label, 'Nov 19');
  assert.equal(result.summary.totalReviews30d, 0);
  assert.equal(result.summary.currentMasteryRate, 0);
  assert.equal(result.summary.activeDays30d, 0);
  assert.equal(result.summary.masteredCardsCount, 0);
});

test('buildKanjiMasteryTrend aggregates daily review frequency and cumulative mastery rate accurately', () => {
  const now = new Date('2026-11-19T12:00:00.000Z');
  const srsProgress: Record<string, SrsCardProgress> = {
    'kanji-nichi': {
      kanjiId: 'kanji-nichi',
      repetitions: 3,
      intervalDays: 14,
      easeFactor: 2.6,
      nextReviewIso: '2026-12-01T00:00:00.000Z',
      lastReviewedIso: '2026-11-17T09:30:00.000Z',
      lapses: 0,
      correctCount: 4,
      reviewCount: 4,
    },
    'kanji-gaku': {
      kanjiId: 'kanji-gaku',
      repetitions: 1,
      intervalDays: 1,
      easeFactor: 2.1,
      nextReviewIso: '2026-11-20T00:00:00.000Z',
      lastReviewedIso: '2026-11-19T08:00:00.000Z',
      lapses: 1,
      correctCount: 1,
      reviewCount: 2,
    },
    'kanji-sei': {
      kanjiId: 'kanji-sei',
      repetitions: 2,
      intervalDays: 8,
      easeFactor: 2.5,
      nextReviewIso: '2026-11-27T00:00:00.000Z',
      lastReviewedIso: '2026-11-19T10:15:00.000Z',
      lapses: 0,
      correctCount: 3,
      reviewCount: 3,
    },
  };

  const result = buildKanjiMasteryTrend(srsProgress, 30, now);

  assert.equal(result.points.length, 30);
  assert.equal(result.summary.totalReviews30d, 9);
  assert.equal(result.summary.activeDays30d, 2);
  assert.equal(result.summary.peakDailyReviews, 5); // 2 + 3 on Nov 19
  assert.equal(result.summary.masteredCardsCount, 2);
  assert.equal(result.summary.totalTrackedCards, 3);
  assert.equal(result.summary.currentMasteryRate, 89); // 8 correct / 9 total = 88.88 -> 89%

  const nov17 = result.points.find((p) => p.date === '2026-11-17');
  const nov18 = result.points.find((p) => p.date === '2026-11-18');
  const nov19 = result.points.find((p) => p.date === '2026-11-19');

  assert.equal(nov17?.reviews, 4);
  assert.equal(nov17?.masteryRate, 100);
  assert.equal(nov18?.reviews, 0);
  assert.equal(nov18?.masteryRate, 100); // carries forward cumulative mastery
  assert.equal(nov19?.reviews, 5);
  assert.equal(nov19?.masteryRate, 89);
});
