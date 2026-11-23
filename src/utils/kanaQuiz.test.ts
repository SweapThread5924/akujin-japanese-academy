import test from 'node:test';
import assert from 'node:assert/strict';
import { HIRAGANA_46, KATAKANA_46 } from '../data/foundationsData';
import { buildKanaQuizOptions } from './kanaQuiz';

test('buildKanaQuizOptions returns 4 unique choices including target romaji for every pool index', () => {
  const pool = [...HIRAGANA_46, ...KATAKANA_46];
  for (let i = 0; i < pool.length; i += 1) {
    const target = pool[i];
    const options = buildKanaQuizOptions(target, pool, i);
    assert.equal(options.length, 4, `Expected 4 options for ${target.kana} at idx ${i}`);
    assert.ok(options.includes(target.romaji), `Target ${target.romaji} missing for idx ${i}`);
    const unique = new Set(options);
    assert.equal(unique.size, 4, `Duplicate romaji options found for idx ${i}: ${options.join(', ')}`);
  }
});
