import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadingCpm,
  classifyReadingPace,
  countJapaneseReadingCharacters,
  formatDurationMmSs,
  prependReadingSpeedRecord,
  sanitizeReadingSpeedRecords,
  summarizeReadingSpeed,
} from './readingSpeed.ts';

test('countJapaneseReadingCharacters excludes whitespace and counts Japanese characters accurately', () => {
  const sample = '私は 毎日\n日本語を 勉強します。';
  assert.equal(countJapaneseReadingCharacters(sample), 14);
  assert.equal(countJapaneseReadingCharacters('   \n\t  '), 0);
});

test('calculateReadingCpm clamps sub-second runs safely and computes accurate CPM', () => {
  assert.deepEqual(calculateReadingCpm(150, 60_000), {
    elapsedSeconds: 60,
    cpm: 150,
  });
  assert.deepEqual(calculateReadingCpm(100, 30_000), {
    elapsedSeconds: 30,
    cpm: 200,
  });
  // Sub-second clamp avoids Infinity/NaN
  assert.deepEqual(calculateReadingCpm(90, 200), {
    elapsedSeconds: 1,
    cpm: 5000, // 90 * 60 = 5400 clamped to max 5000
  });
  assert.deepEqual(calculateReadingCpm(0, 12_000), {
    elapsedSeconds: 12,
    cpm: 0,
  });
});

test('classifyReadingPace evaluates speed against JLPT level targets', () => {
  assert.equal(classifyReadingPace(160, 'N5').tier, 'fluent');
  assert.equal(classifyReadingPace(120, 'N5').tier, 'exam-ready');
  assert.equal(classifyReadingPace(90, 'N5').tier, 'steady');
  assert.equal(classifyReadingPace(50, 'N5').tier, 'careful');
  assert.equal(classifyReadingPace(315, 'N2').tier, 'exam-ready');
});

test('summarizeReadingSpeed aggregates overall metrics, comprehension accuracy, and per-level stats', () => {
  const records = [
    {
      id: 'r1',
      passageId: 'n5-r1',
      passageTitle: 'Saturday Routine in Tokyo',
      level: 'N5' as const,
      charCount: 120,
      elapsedSeconds: 60,
      cpm: 120,
      comprehensionCorrect: true,
      recordedAt: '2026-11-23T08:00:00Z',
    },
    {
      id: 'r2',
      passageId: 'n4-r1',
      passageTitle: 'Part-Time Job Shift',
      level: 'N4' as const,
      charCount: 180,
      elapsedSeconds: 50,
      cpm: 216,
      comprehensionCorrect: false,
      recordedAt: '2026-11-23T08:05:00Z',
    },
  ];

  const summary = summarizeReadingSpeed(records);
  assert.equal(summary.totalPassagesTimed, 2);
  assert.equal(summary.averageCpm, 168);
  assert.equal(summary.bestCpm, 216);
  assert.equal(summary.totalCharactersRead, 300);
  assert.equal(summary.comprehensionAccuracyPct, 50);
  assert.equal(summary.latestRecord?.id, 'r1');
  const n5 = summary.byLevel.find((b) => b.level === 'N5');
  assert.equal(n5?.averageCpm, 120);
  assert.equal(n5?.sessionsCount, 1);
});

test('sanitizeReadingSpeedRecords filters invalid bounds and enforces max cap', () => {
  const noisy = [
    { id: 'bad1', charCount: 0, elapsedSeconds: 10, cpm: 100 },
    { id: 'bad2', charCount: 100, elapsedSeconds: 10, cpm: 99999 },
    {
      id: 'good',
      passageId: 'n3-r1',
      passageTitle: 'Valid Passage',
      level: 'N3',
      charCount: 240,
      elapsedSeconds: 60,
      cpm: 240,
      recordedAt: '2026-11-23T08:10:00Z',
    },
  ];
  const cleaned = sanitizeReadingSpeedRecords(noisy);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].id, 'good');

  let list = cleaned;
  for (let i = 0; i < 60; i++) {
    list = prependReadingSpeedRecord(list, {
      ...cleaned[0],
      id: `item-${i}`,
    });
  }
  assert.equal(list.length, 50);
  assert.equal(formatDurationMmSs(125), '02:05');
});
