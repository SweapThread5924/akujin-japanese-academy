import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { JoyoKanjiEntry } from './datasetLoader';
import {
  DEFAULT_DICTIONARY_FILTER,
  extractDictionaryFacets,
  filterKanjiDictionary,
  hasActiveDictionaryFilters,
  normalizeReadingToHiragana,
  paginateDictionary,
} from './kanjiDictionary';

const joyoPath = path.resolve(process.cwd(), 'public/data/joyo-kanji-2136.json');
const JOYO_2136: JoyoKanjiEntry[] = JSON.parse(fs.readFileSync(joyoPath, 'utf-8'));

test('indexes all 2,136 Joyo Kanji and extracts accurate stroke & radical facets', () => {
  assert.equal(JOYO_2136.length, 2136);

  const facets = extractDictionaryFacets(JOYO_2136);
  assert.ok(facets.radicals.length > 50);
  assert.ok(facets.strokes.length >= 20);

  const radicalSum = facets.radicals.reduce((acc, r) => acc + r.count, 0);
  const strokeSum = facets.strokes.reduce((acc, s) => acc + s.count, 0);
  assert.equal(radicalSum, 2136);
  assert.equal(strokeSum, 2136);
  assert.equal(facets.strokes[0].strokes, 1);
});

test('normalizes Katakana input to Hiragana accurately', () => {
  assert.equal(normalizeReadingToHiragana('ニチ・ジツ'), 'にち・じつ');
  assert.equal(normalizeReadingToHiragana('エキシタ'), 'えきした');
});

test('searches by reading across Hiragana, Katakana, okurigana-stripped Kana, and Romaji', () => {
  // Hiragana On'yomi
  const hiraRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    readingQuery: 'にち',
  });
  assert.ok(hiraRes.some((k) => k.kanji === '日'));
  assert.equal(hiraRes[0].kanji, '日');

  // Katakana On'yomi
  const kataRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    readingQuery: 'ニチ',
  });
  assert.ok(kataRes.some((k) => k.kanji === '日'));

  // Okurigana-stripped Kun'yomi (やす.む -> やすむ)
  const kunRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    readingQuery: 'やすむ',
  });
  assert.ok(kunRes.some((k) => k.kanji === '休'));

  // Hepburn Romaji reading
  const romajiRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    readingQuery: 'mizu',
  });
  assert.ok(romajiRes.some((k) => k.kanji === '水'));
});

test('filters strictly by exact stroke count and radical', () => {
  const sixStrokeRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    strokeCount: 6,
  });
  assert.ok(sixStrokeRes.length > 50);
  assert.ok(sixStrokeRes.every((k) => k.strokes === 6));

  const sunRadicalRes = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    radical: 'Sun',
  });
  assert.ok(sunRadicalRes.length > 10);
  assert.ok(sunRadicalRes.every((k) => k.radical === 'Sun'));
  assert.ok(sunRadicalRes.some((k) => k.kanji === '日'));
});

test('combines reading, stroke count, radical, and JLPT level filters cleanly', () => {
  const combined = filterKanjiDictionary(JOYO_2136, {
    readingQuery: 'とき',
    strokeCount: 10,
    radical: 'Sun',
    level: 'N5',
    sortBy: 'frequency',
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].kanji, '時');
});

test('handles empty query, unmatched query, sorting, and pagination cleanly', () => {
  const allByStrokesAsc = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    sortBy: 'strokes-asc',
  });
  assert.equal(allByStrokesAsc.length, 2136);
  assert.ok(allByStrokesAsc[0].strokes <= allByStrokesAsc[2135].strokes);

  const empty = filterKanjiDictionary(JOYO_2136, {
    ...DEFAULT_DICTIONARY_FILTER,
    readingQuery: 'zzzznotakanji999',
  });
  assert.equal(empty.length, 0);

  assert.equal(hasActiveDictionaryFilters(DEFAULT_DICTIONARY_FILTER), false);
  assert.equal(
    hasActiveDictionaryFilters({ ...DEFAULT_DICTIONARY_FILTER, strokeCount: 4 }),
    true
  );

  const page2 = paginateDictionary(JOYO_2136, 1, 50);
  assert.equal(page2.safePage, 1);
  assert.equal(page2.items.length, 50);
  assert.equal(page2.startItem, 51);
  assert.equal(page2.endItem, 100);
  assert.equal(page2.totalPages, 43);
});
