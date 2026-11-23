import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuoteOfTheDay, INSPIRING_QUOTES } from './dailyQuotes';

test('INSPIRING_QUOTES has rich daily coverage and deterministic calendar rotation', () => {
  assert.ok(INSPIRING_QUOTES.length >= 28);
  const d1 = new Date(2026, 10, 17, 9, 0, 0);
  const d1Later = new Date(2026, 10, 17, 22, 30, 0);
  const d2 = new Date(2026, 10, 18, 8, 0, 0);

  const q1a = getQuoteOfTheDay(d1);
  const q1b = getQuoteOfTheDay(d1Later);
  const q2 = getQuoteOfTheDay(d2);

  assert.equal(q1a.id, q1b.id);
  assert.equal(q1a.dateKey, '2026-11-17');
  assert.equal(q2.dateKey, '2026-11-18');
  assert.notEqual(q1a.id, q2.id);
});
