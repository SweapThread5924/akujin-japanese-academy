import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS } from '../data/curriculumData';
import { buildQuickActionSummary, getLocalDateKey } from './quickActions';

test('getLocalDateKey formats YYYY-MM-DD consistently', () => {
  const sample = new Date(2026, 4, 7, 14, 30, 0);
  assert.equal(getLocalDateKey(sample), '2026-05-07');
});

test('buildQuickActionSummary reflects guest starter defaults cleanly', () => {
  const summary = buildQuickActionSummary({
    streak: 0,
    streakFreezes: 0,
    lastStudyDate: '',
    todayDateKey: '2026-11-27',
    unlockedAchievementIds: [],
    xp: 0,
    dailyGoalMinutes: 15,
    todayMinutesStudied: 0,
    isGmailConnected: false,
    gmailEmail: null,
  });

  assert.equal(summary.gmail.connected, false);
  assert.equal(summary.gmail.statusLabel, 'Ready');
  assert.equal(summary.achievements.unlockedCount, 0);
  assert.equal(summary.achievements.totalCount, ACHIEVEMENTS.length);
  assert.equal(summary.achievements.completionPct, 0);
  assert.equal(summary.achievements.latestUnlockedTitle, null);
  assert.equal(summary.streak.days, 0);
  assert.equal(summary.streak.headline, '0 days');
  assert.equal(summary.streak.state, 'inactive');
  assert.equal(summary.streak.statusLabel, 'Start today');
});

test('buildQuickActionSummary computes active-today streak, freeze status, latest seal, and connected Gmail', () => {
  const summary = buildQuickActionSummary({
    streak: 5,
    streakFreezes: 2,
    lastStudyDate: '2026-11-27',
    todayDateKey: '2026-11-27',
    unlockedAchievementIds: ['first_kanji', 'streak_5', 'streak_5', 'unknown_id'],
    xp: 640,
    dailyGoalMinutes: 20,
    todayMinutesStudied: 15,
    isGmailConnected: true,
    gmailEmail: 'learner@example.com',
  });

  assert.equal(summary.gmail.connected, true);
  assert.equal(summary.gmail.statusLabel, 'Connected');
  assert.equal(summary.gmail.detailText, 'learner@example.com');
  assert.equal(summary.achievements.unlockedCount, 2);
  assert.equal(summary.achievements.latestUnlockedTitle, 'Five-Day Flame Streak');
  assert.equal(summary.achievements.completionPct, Math.round((2 / ACHIEVEMENTS.length) * 100));
  assert.equal(summary.streak.headline, '5 days');
  assert.equal(summary.streak.state, 'active-today');
  assert.equal(summary.streak.statusLabel, 'Active today');
  assert.equal(summary.streak.freezesEquipped, 2);
  assert.match(summary.streak.detailText, /2\/3 freezes · 15\/20m today/);
});

test('buildQuickActionSummary flags freeze-ready and needs-study when not yet studied today', () => {
  const withFreeze = buildQuickActionSummary({
    streak: 1,
    streakFreezes: 1,
    lastStudyDate: '2026-11-26',
    todayDateKey: '2026-11-27',
    unlockedAchievementIds: [],
    xp: 100,
    dailyGoalMinutes: 15,
    todayMinutesStudied: 0,
    isGmailConnected: false,
  });
  assert.equal(withFreeze.streak.headline, '1 day');
  assert.equal(withFreeze.streak.state, 'freeze-ready');
  assert.equal(withFreeze.streak.statusLabel, 'Freeze ready');

  const withoutFreeze = buildQuickActionSummary({
    streak: 4,
    streakFreezes: 0,
    lastStudyDate: '2026-11-26',
    todayDateKey: '2026-11-27',
    unlockedAchievementIds: [],
    xp: 100,
    dailyGoalMinutes: 15,
    todayMinutesStudied: 0,
    isGmailConnected: false,
  });
  assert.equal(withoutFreeze.streak.state, 'needs-study');
  assert.equal(withoutFreeze.streak.statusLabel, 'Study today');
});
