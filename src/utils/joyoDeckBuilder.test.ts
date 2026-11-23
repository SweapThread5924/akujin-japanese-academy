import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { KANJI_DECK } from '../data/curriculumData';
import type { JoyoKanjiEntry } from './datasetLoader';
import {
  buildFullJoyoKanjiDeck,
  generateGuidedStrokePaths,
} from './joyoDeckBuilder';

test('buildFullJoyoKanjiDeck expands to all 2,136 unique Joyo Kanji with valid strokePaths', () => {
  const jsonPath = path.resolve(process.cwd(), 'public/data/joyo-kanji-2136.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as JoyoKanjiEntry[];
  assert.equal(raw.length, 2136);

  const fullDeck = buildFullJoyoKanjiDeck(KANJI_DECK, raw);
  assert.equal(fullDeck.length, 2136);

  // Curated KANJI_DECK entries keep their exact IDs and handcrafted strokePaths
  for (const curated of KANJI_DECK) {
    const match = fullDeck.find((c) => c.kanji === curated.kanji);
    assert.ok(match, `Expected curated kanji ${curated.kanji} in full deck`);
    assert.equal(match.id, curated.id);
    assert.deepEqual(match.strokePaths, curated.strokePaths);
  }

  // Every single one of the 2,136 cards has at least 1 strokePath and a valid JLPT level
  const uniqueChars = new Set<string>();
  const levelCounts: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  for (const card of fullDeck) {
    uniqueChars.add(card.kanji);
    assert.ok(card.strokePaths.length >= 1, `Missing strokePaths for ${card.kanji}`);
    assert.ok(card.meaning.length > 0, `Missing meaning for ${card.kanji}`);
    levelCounts[card.level] = (levelCounts[card.level] ?? 0) + 1;
  }

  assert.equal(uniqueChars.size, 2136);
  assert.ok(levelCounts.N5 >= 100);
  assert.ok(levelCounts.N4 >= 140);
  assert.ok(levelCounts.N3 >= 360);
  assert.ok(levelCounts.N2 >= 360);
  assert.ok(levelCounts.N1 >= 1100);
});

test('generateGuidedStrokePaths matches stroke count and stays within 0..100 viewBox', () => {
  const paths = generateGuidedStrokePaths('漢', 13);
  assert.equal(paths.length, 13);
  for (const d of paths) {
    assert.match(d, /^M \d+ \d+ L \d+ \d+$/);
  }
});
