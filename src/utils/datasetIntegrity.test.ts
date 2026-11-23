import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SYLLABUS_TOTALS } from './datasetLoader';
import type { JlptLevel } from './srsEngine';

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data');
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

test('static joyo-kanji-2136.json contains all 2,136 unique Joyo Kanji matching SYLLABUS_TOTALS', () => {
  const raw = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'joyo-kanji-2136.json'), 'utf8')
  ) as Array<{
    level: JlptLevel;
    kanji: string;
    meaning: string;
    strokes: number;
    onyomi: string;
    kunyomi: string;
  }>;

  assert.equal(raw.length, 2136);
  const seen = new Set<string>();
  const counts: Record<JlptLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };

  for (const item of raw) {
    assert.ok(item.kanji && item.kanji.length >= 1);
    assert.ok(item.meaning && item.meaning.trim().length > 0);
    assert.ok(typeof item.strokes === 'number' && item.strokes > 0);
    assert.ok(LEVELS.includes(item.level));
    assert.equal(seen.has(item.kanji), false, `Duplicate kanji: ${item.kanji}`);
    seen.add(item.kanji);
    counts[item.level]++;
  }

  for (const lvl of LEVELS) {
    assert.equal(counts[lvl], SYLLABUS_TOTALS[lvl].levelKanji);
  }
});

test('static jlpt-vocab-n5..n1 JSON files contain exactly 10,000 unique words across N5–N1', () => {
  const globalSeen = new Set<string>();
  let cumulative = 0;

  for (const lvl of LEVELS) {
    const filePath = path.join(DATA_DIR, `jlpt-vocab-${lvl.toLowerCase()}.json`);
    const rows = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<{
      level: JlptLevel;
      word: string;
      reading: string;
      romaji: string;
      english: string;
      pos: string;
    }>;

    assert.equal(rows.length, SYLLABUS_TOTALS[lvl].addedVocab);
    cumulative += rows.length;
    assert.equal(cumulative, SYLLABUS_TOTALS[lvl].cumulativeVocab);

    for (const v of rows) {
      assert.equal(v.level, lvl);
      assert.ok(v.word.trim().length > 0);
      assert.ok(v.reading.trim().length > 0);
      assert.ok(v.romaji.trim().length > 0);
      assert.ok(v.english.trim().length > 0);
      const key = `${v.word}|${v.reading}`;
      assert.equal(globalSeen.has(key), false, `Duplicate vocab entry: ${key}`);
      globalSeen.add(key);
    }
  }

  assert.equal(cumulative, 10000);
  assert.equal(globalSeen.size, 10000);
});

test('static jlpt-grammar-all.json covers all 5 JLPT levels with 500+ grammar patterns', () => {
  const grammarMap = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'jlpt-grammar-all.json'), 'utf8')
  ) as Record<JlptLevel, Array<{ pattern: string; meaning: string }>>;

  let total = 0;
  for (const lvl of LEVELS) {
    const list = grammarMap[lvl];
    assert.ok(Array.isArray(list) && list.length >= 80, `Expected >=80 grammar patterns for ${lvl}`);
    for (const g of list) {
      assert.ok(g.pattern && g.pattern.trim().length > 0);
      assert.ok(g.meaning && g.meaning.trim().length > 0);
    }
    total += list.length;
  }
  assert.ok(total >= 500);
});
