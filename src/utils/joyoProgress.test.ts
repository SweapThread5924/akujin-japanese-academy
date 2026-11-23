import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFocusModeDeck,
  buildKanjiPronunciationScript,
  computePerLevelKanjiBreakdown,
  computeTargetLevelJoyoProgress,
  formatKanaReadingsWithRomaji,
  formatKanjiCardReadingsWithRomaji,
  kanaToRomaji,
  MASTERY_STREAK_TARGET,
  searchKanjiDeck,
  updateMasteryStreak,
} from './joyoProgress';
import { SYLLABUS_TOTALS } from './datasetLoader';
import { KANJI_DECK } from '../data/curriculumData';
import { getKanjiExampleSentences } from '../data/kanjiExamples';

const MOCK_CATALOG = [
  { id: 'joyo-1', kanji: '日', level: 'N5' as const },
  { id: 'joyo-2', kanji: '月', level: 'N5' as const },
  { id: 'joyo-3', kanji: '火', level: 'N5' as const },
  { id: 'joyo-4', kanji: '水', level: 'N5' as const },
  { id: 'joyo-10', kanji: '学', level: 'N4' as const },
  { id: 'joyo-11', kanji: '校', level: 'N4' as const },
];

const MOCK_SRS_DECK = [
  { id: 'k-sun', kanji: '日', level: 'N5' as const },
  { id: 'k-moon', kanji: '月', level: 'N5' as const },
  { id: 'k-study', kanji: '学', level: 'N4' as const },
];

test('computeTargetLevelJoyoProgress returns 0% when no kanji are completed', () => {
  const res = computeTargetLevelJoyoProgress({
    targetLevel: 'N5',
    joyoCatalog: MOCK_CATALOG,
    masteredItemIds: [],
    srsProgress: {},
    srsDeck: MOCK_SRS_DECK,
  });

  assert.equal(res.targetLevel, 'N5');
  assert.equal(res.completedCount, 0);
  assert.equal(res.totalCount, SYLLABUS_TOTALS.N5.levelKanji);
  assert.equal(res.remainingCount, SYLLABUS_TOTALS.N5.levelKanji);
  assert.equal(res.percentage, 0);
  assert.equal(res.formattedPercentage, '0');
});

test('computeTargetLevelJoyoProgress combines directory mastery and SRS reviews without double-counting', () => {
  const res = computeTargetLevelJoyoProgress({
    targetLevel: 'N5',
    joyoCatalog: MOCK_CATALOG,
    masteredItemIds: ['joyo-1', 'joyo-3', 'joyo-10'], // joyo-10 is N4, must not count toward N5
    srsProgress: {
      'k-sun': {
        kanjiId: 'k-sun',
        repetitions: 2,
        intervalDays: 6,
        easeFactor: 2.5,
        nextReviewIso: '2026-12-01T00:00:00.000Z',
        lastReviewedIso: '2026-11-17T00:00:00.000Z',
        lapses: 0,
        correctCount: 2,
        reviewCount: 2,
      },
      'k-moon': {
        kanjiId: 'k-moon',
        repetitions: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewIso: '2026-11-18T00:00:00.000Z',
        lastReviewedIso: '2026-11-17T00:00:00.000Z',
        lapses: 0,
        correctCount: 1,
        reviewCount: 1,
      },
    },
    srsDeck: MOCK_SRS_DECK,
  });

  // Unique N5 completed: 日 (both mastered + SRS -> 1), 月 (SRS -> 1), 火 (mastered -> 1) = 3 total
  assert.equal(res.completedCount, 3);
  assert.equal(res.totalCount, 104);
  assert.equal(res.remainingCount, 101);
  assert.equal(res.percentage, 2.9);
  assert.equal(res.formattedPercentage, '2.9');
});

test('computeTargetLevelJoyoProgress computes 100% cleanly when all level kanji are mastered', () => {
  const fullN5 = Array.from({ length: 104 }, (_, i) => ({
    id: `joyo-n5-${i}`,
    kanji: String.fromCodePoint(0x4e00 + i),
    level: 'N5' as const,
  }));

  const res = computeTargetLevelJoyoProgress({
    targetLevel: 'N5',
    joyoCatalog: fullN5,
    masteredItemIds: fullN5.map((k) => k.id),
    srsProgress: {},
    srsDeck: [],
  });

  assert.equal(res.completedCount, 104);
  assert.equal(res.totalCount, 104);
  assert.equal(res.remainingCount, 0);
  assert.equal(res.percentage, 100);
  assert.equal(res.formattedPercentage, '100');
});

test('updateMasteryStreak triggers celebration on 5 consecutive rating-5 reviews and resets on non-5', () => {
  assert.equal(MASTERY_STREAK_TARGET, 5);
  let streak = 0;

  for (let i = 1; i <= 4; i++) {
    const step = updateMasteryStreak(streak, 5);
    assert.equal(step.streak, i);
    assert.equal(step.badgeUnlocked, false);
    assert.equal(step.justTriggeredCelebration, false);
    streak = step.streak;
  }

  const fifth = updateMasteryStreak(streak, 5);
  assert.equal(fifth.streak, 5);
  assert.equal(fifth.badgeUnlocked, true);
  assert.equal(fifth.justTriggeredCelebration, true);

  const sixth = updateMasteryStreak(fifth.streak, 5);
  assert.equal(sixth.streak, 6);
  assert.equal(sixth.badgeUnlocked, true);
  assert.equal(sixth.justTriggeredCelebration, false);

  const reset = updateMasteryStreak(sixth.streak, 4);
  assert.equal(reset.streak, 0);
  assert.equal(reset.badgeUnlocked, false);
  assert.equal(reset.justTriggeredCelebration, false);
});

test('computePerLevelKanjiBreakdown separates mastered vs learning per JLPT level without overlap', () => {
  const breakdown = computePerLevelKanjiBreakdown({
    joyoCatalog: MOCK_CATALOG,
    masteredItemIds: ['joyo-1', 'joyo-3'], // N5: 日, 火 mastered
    srsProgress: {
      'k-sun': {
        kanjiId: 'k-sun',
        repetitions: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewIso: '2026-11-20T00:00:00.000Z',
        lastReviewedIso: '2026-11-19T00:00:00.000Z',
        lapses: 0,
        correctCount: 1,
        reviewCount: 1,
      }, // 日 already mastered via directory -> must NOT also count as learning
      'k-moon': {
        kanjiId: 'k-moon',
        repetitions: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewIso: '2026-11-20T00:00:00.000Z',
        lastReviewedIso: '2026-11-19T00:00:00.000Z',
        lapses: 0,
        correctCount: 1,
        reviewCount: 1,
      }, // 月 -> N5 learning
      'k-study': {
        kanjiId: 'k-study',
        repetitions: 2,
        intervalDays: 6,
        easeFactor: 2.5,
        nextReviewIso: '2026-11-25T00:00:00.000Z',
        lastReviewedIso: '2026-11-19T00:00:00.000Z',
        lapses: 0,
        correctCount: 2,
        reviewCount: 2,
      }, // 学 -> N4 mastered via SRS repetitions >= 2
    },
    srsDeck: MOCK_SRS_DECK,
  });

  assert.equal(breakdown.length, 5);
  assert.deepEqual(
    breakdown.map((b) => b.level),
    ['N5', 'N4', 'N3', 'N2', 'N1']
  );

  const n5 = breakdown[0];
  assert.equal(n5.masteredCount, 2); // 日, 火
  assert.equal(n5.learningCount, 1); // 月
  assert.equal(n5.totalCount, SYLLABUS_TOTALS.N5.levelKanji);
  assert.equal(n5.unseenCount, n5.totalCount - 3);

  const n4 = breakdown[1];
  assert.equal(n4.masteredCount, 1); // 学
  assert.equal(n4.learningCount, 0);
  assert.equal(n4.totalCount, SYLLABUS_TOTALS.N4.levelKanji);
});

test('searchKanjiDeck finds Kanji by character, meaning, kana reading, and romaji reading', () => {
  const deck = [
    {
      id: 'k-water',
      kanji: '水',
      meaning: 'Water',
      level: 'N5' as const,
      strokes: 4,
      onyomi: [{ kana: 'スイ', romaji: 'sui' }],
      kunyomi: [{ kana: 'みず', romaji: 'mizu' }],
    },
    {
      id: 'k-study',
      kanji: '学',
      meaning: 'Study / Learning',
      level: 'N5' as const,
      strokes: 8,
      onyomi: [{ kana: 'ガク', romaji: 'gaku' }],
      kunyomi: [{ kana: 'まな.ぶ', romaji: 'manabu' }],
    },
    {
      id: 'k-dream',
      kanji: '夢',
      meaning: 'Dream',
      level: 'N3' as const,
      strokes: 13,
      onyomi: [{ kana: 'ム', romaji: 'mu' }],
      kunyomi: [{ kana: 'ゆめ', romaji: 'yume' }],
    },
  ];

  assert.equal(searchKanjiDeck(deck, '').length, 0);
  assert.equal(searchKanjiDeck(deck, '水')[0]?.id, 'k-water');
  assert.equal(searchKanjiDeck(deck, 'dream')[0]?.id, 'k-dream');
  assert.equal(searchKanjiDeck(deck, 'みず')[0]?.id, 'k-water');
  assert.equal(searchKanjiDeck(deck, 'manabu')[0]?.id, 'k-study');
  assert.equal(searchKanjiDeck(deck, 'まなぶ')[0]?.id, 'k-study');
  assert.equal(searchKanjiDeck(deck, 'GAKU')[0]?.id, 'k-study');
});

test('kanaToRomaji and reading formatters append Hepburn romaji in brackets beside every reading', () => {
  assert.equal(kanaToRomaji('キュウ'), 'kyuu');
  assert.equal(kanaToRomaji('やす(む)'), 'yasumu');
  assert.equal(kanaToRomaji('チョウ'), 'chou');
  assert.equal(kanaToRomaji('きって'), 'kitte');

  assert.equal(
    formatKanjiCardReadingsWithRomaji([
      { kana: 'キュウ', romaji: 'kyuu' },
      { kana: 'ク', romaji: 'ku' },
    ]),
    'キュウ (kyuu) · ク (ku)'
  );
  assert.equal(formatKanjiCardReadingsWithRomaji([]), '—');

  assert.equal(
    formatKanaReadingsWithRomaji('ニチ、ジツ'),
    'ニチ (nichi) · ジツ (jitsu)'
  );
  assert.equal(
    formatKanaReadingsWithRomaji('やす.む'),
    'やす.む (yasumu)'
  );
});

test('buildKanjiPronunciationScript produces clear On-yomi and Kun-yomi speech text', () => {
  assert.equal(
    buildKanjiPronunciationScript(['キュウ'], ['やす(む)'], '休'),
    'おんよみ、キュウ。くんよみ、やすむ'
  );
  assert.equal(
    buildKanjiPronunciationScript(['エキ'], [], '駅'),
    'おんよみ、エキ'
  );
  assert.equal(
    buildKanjiPronunciationScript([], [], '日'),
    '日'
  );
});

test('getKanjiExampleSentences provides 3 distinct level-matched sentences with furigana, romaji, and English for every KANJI_DECK card', () => {
  for (const card of KANJI_DECK) {
    const sentences = getKanjiExampleSentences(card);
    assert.equal(sentences.length, 3, `Expected 3 sentences for ${card.kanji}`);
    const uniquePlains = new Set(sentences.map((s) => s.plain));
    assert.equal(uniquePlains.size, 3, `Expected 3 unique sentences for ${card.kanji}`);

    for (const s of sentences) {
      assert.equal(s.level, card.level);
      assert.ok(s.plain.includes(card.kanji), `Sentence "${s.plain}" should contain kanji ${card.kanji}`);
      assert.ok(s.romaji.trim().length > 0, `Missing romaji for ${card.kanji}`);
      assert.ok(s.english.trim().length > 0, `Missing English meaning for ${card.kanji}`);
      assert.ok(
        s.segments.some((seg) => Boolean(seg.reading)),
        `Expected furigana readings in segments for ${card.kanji}`
      );
    }
  }
});

test('buildFocusModeDeck ranks most struggled Kanji first by lapses, low accuracy, and ease factor', () => {
  const now = Date.parse('2026-11-19T12:00:00.000Z');
  const deck = Array.from({ length: 12 }, (_, i) => ({
    id: `k-${i}`,
    kanji: String.fromCodePoint(0x4e00 + i),
  }));

  const srsProgress = {
    'k-0': {
      kanjiId: 'k-0',
      repetitions: 4,
      intervalDays: 21,
      easeFactor: 2.6,
      nextReviewIso: '2026-12-10T00:00:00.000Z',
      lastReviewedIso: '2026-11-19T00:00:00.000Z',
      lapses: 0,
      correctCount: 4,
      reviewCount: 4,
    }, // Strong mastered card -> should rank last
    'k-5': {
      kanjiId: 'k-5',
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 1.7,
      nextReviewIso: '2026-11-19T00:00:00.000Z',
      lastReviewedIso: '2026-11-18T00:00:00.000Z',
      lapses: 3,
      correctCount: 1,
      reviewCount: 4,
    }, // Highest struggle -> must be #1
    'k-9': {
      kanjiId: 'k-9',
      repetitions: 1,
      intervalDays: 1,
      easeFactor: 2.1,
      nextReviewIso: '2026-11-20T00:00:00.000Z',
      lastReviewedIso: '2026-11-19T00:00:00.000Z',
      lapses: 1,
      correctCount: 1,
      reviewCount: 2,
    }, // Second highest struggle -> must be #2
  };

  const result = buildFocusModeDeck(deck, srsProgress, 10, now);
  assert.equal(result.items.length, 10);
  assert.equal(result.items[0].card.id, 'k-5');
  assert.equal(result.items[0].lapses, 3);
  assert.equal(result.items[1].card.id, 'k-9');
  assert.equal(result.struggledCount, 2);
  // Mastered card k-0 (score 0) should be pushed out of the top 10
  assert.equal(
    result.items.some((i) => i.card.id === 'k-0'),
    false
  );
});
