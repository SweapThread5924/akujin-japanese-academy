import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_STUDY_GOAL_OPTIONS,
  DEFAULT_DAILY_STUDY_GOAL_MINUTES,
  computeDailyStudyProgress,
  estimateTodayStudyMinutes,
  getLearnerInitials,
  normalizeDailyStudyGoal,
} from './dailyStudyGoal';

test('normalizeDailyStudyGoal accepts 5, 15, 30 and falls back to 15 otherwise', () => {
  assert.equal(DAILY_STUDY_GOAL_OPTIONS.map((o) => o.minutes).join(','), '5,15,30');
  assert.equal(normalizeDailyStudyGoal(5), 5);
  assert.equal(normalizeDailyStudyGoal(15), 15);
  assert.equal(normalizeDailyStudyGoal(30), 30);
  assert.equal(normalizeDailyStudyGoal('30'), 30);
  assert.equal(normalizeDailyStudyGoal(20), DEFAULT_DAILY_STUDY_GOAL_MINUTES);
  assert.equal(normalizeDailyStudyGoal(undefined), DEFAULT_DAILY_STUDY_GOAL_MINUTES);
});

test('estimateTodayStudyMinutes reads today key safely from heatmapHistory', () => {
  const history = { '2026-11-15': 9, '2026-11-14': 7 };
  assert.equal(estimateTodayStudyMinutes(history, '2026-11-15'), 9);
  assert.equal(estimateTodayStudyMinutes(history, '2026-11-16'), 0);
  assert.equal(estimateTodayStudyMinutes(undefined, '2026-11-15'), 0);
});

test('computeDailyStudyProgress calculates ring percentage and SVG dashoffset accurately', () => {
  const zero = computeDailyStudyProgress({ minutesStudied: 0, goalMinutes: 15, ringRadius: 17 });
  assert.equal(zero.progressPct, 0);
  assert.equal(zero.goalReached, false);
  assert.equal(zero.strokeDashoffset, zero.circumference);

  const partial = computeDailyStudyProgress({ minutesStudied: 9, goalMinutes: 15, ringRadius: 17 });
  assert.equal(partial.progressPct, 60);
  assert.equal(partial.goalReached, false);
  assert.ok(partial.strokeDashoffset > 0 && partial.strokeDashoffset < partial.circumference);

  const intensive = computeDailyStudyProgress({ minutesStudied: 9, goalMinutes: 30, ringRadius: 17 });
  assert.equal(intensive.progressPct, 30);
  assert.equal(intensive.goalReached, false);

  const met = computeDailyStudyProgress({ minutesStudied: 9, goalMinutes: 5, ringRadius: 17 });
  assert.equal(met.progressPct, 100);
  assert.equal(met.goalReached, true);
  assert.equal(met.strokeDashoffset, 0);
});

test('getLearnerInitials derives concise initials with fallback', () => {
  assert.equal(getLearnerInitials('Kaito Learner'), 'KL');
  assert.equal(getLearnerInitials('Sora'), 'SO');
  assert.equal(getLearnerInitials('  '), 'AK');
});
