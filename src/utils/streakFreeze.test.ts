import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ACTIVE_STREAK_FREEZES,
  STREAK_FREEZE_COST_XP,
  applyPendingStreakProtection,
  canPurchaseStreakFreeze,
  purchaseStreakFreeze,
  resolveStreakOnStudy,
} from './streakFreeze';

test('canPurchaseStreakFreeze enforces XP balance and max inventory capacity', () => {
  assert.equal(canPurchaseStreakFreeze(STREAK_FREEZE_COST_XP, 0).allowed, true);
  assert.equal(canPurchaseStreakFreeze(STREAK_FREEZE_COST_XP - 1, 0).allowed, false);
  assert.match(
    canPurchaseStreakFreeze(100, 0).reason ?? '',
    /Need 50 more XP/
  );

  assert.equal(
    canPurchaseStreakFreeze(1000, MAX_ACTIVE_STREAK_FREEZES).allowed,
    false
  );
  assert.match(
    canPurchaseStreakFreeze(1000, MAX_ACTIVE_STREAK_FREEZES).reason ?? '',
    /Inventory full/
  );
});

test('purchaseStreakFreeze deducts XP, increments inventory, and prepends history log', () => {
  const initial = {
    xp: 525,
    streakFreezes: 0,
    streakFreezeHistory: [],
  };

  const first = purchaseStreakFreeze(initial, '2026-11-15T08:00:00.000Z');
  assert.equal(first.ok, true);
  assert.equal(first.nextState.xp, 525 - STREAK_FREEZE_COST_XP);
  assert.equal(first.nextState.streakFreezes, 1);
  assert.equal(first.nextState.streakFreezeHistory.length, 1);
  assert.equal(first.nextState.streakFreezeHistory[0].type, 'purchased');
  assert.equal(first.nextState.streakFreezeHistory[0].xpDelta, -STREAK_FREEZE_COST_XP);
  assert.equal(first.nextState.streakFreezeHistory[0].balanceAfter, 1);

  const second = purchaseStreakFreeze(first.nextState, '2026-11-15T08:05:00.000Z');
  assert.equal(second.ok, true);
  assert.equal(second.nextState.streakFreezes, 2);
  assert.equal(second.nextState.streakFreezeHistory.length, 2);
  assert.equal(second.nextState.streakFreezeHistory[0].timestampIso, '2026-11-15T08:05:00.000Z');
});

test('applyPendingStreakProtection consumes freeze for 1 missed day and preserves streak', () => {
  const res = applyPendingStreakProtection({
    streak: 7,
    lastStudyDate: '2026-11-13',
    todayDate: '2026-11-15',
    streakFreezes: 2,
    streakFreezeHistory: [],
    nowIso: '2026-11-15T09:00:00.000Z',
  });

  assert.equal(res.consumedCount, 1);
  assert.equal(res.streak, 7);
  assert.equal(res.streakFreezes, 1);
  assert.equal(res.lastStudyDate, '2026-11-14');
  assert.equal(res.streakFreezeHistory.length, 1);
  assert.equal(res.streakFreezeHistory[0].type, 'consumed');
  assert.equal(res.streakFreezeHistory[0].protectedDate, '2026-11-14');
  assert.equal(res.streakFreezeHistory[0].balanceAfter, 1);
});

test('resolveStreakOnStudy increments protected streak or resets when freezes are insufficient', () => {
  const protectedStudy = resolveStreakOnStudy({
    streak: 7,
    lastStudyDate: '2026-11-13',
    todayDate: '2026-11-15',
    streakFreezes: 1,
    streakFreezeHistory: [],
    nowIso: '2026-11-15T09:00:00.000Z',
  });
  assert.equal(protectedStudy.consumedCount, 1);
  assert.equal(protectedStudy.streak, 8);
  assert.equal(protectedStudy.streakFreezes, 0);
  assert.equal(protectedStudy.lastStudyDate, '2026-11-15');

  const lapsedStudy = resolveStreakOnStudy({
    streak: 7,
    lastStudyDate: '2026-11-10',
    todayDate: '2026-11-15',
    streakFreezes: 1,
    streakFreezeHistory: [],
    nowIso: '2026-11-15T09:00:00.000Z',
  });
  assert.equal(lapsedStudy.consumedCount, 0);
  assert.equal(lapsedStudy.streak, 1);
  assert.equal(lapsedStudy.streakFreezes, 1); // not wasted when gap exceeds available shields
});
