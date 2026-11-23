import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countAnsweredOnboardingQuestions,
  getStartingTrackMeta,
  isOnboardingComplete,
  resolveTopBarBadgeDisplay,
  STARTING_TRACK_OPTIONS,
  TOTAL_ONBOARDING_QUESTIONS,
} from './onboardingProfile';

test('resolveTopBarBadgeDisplay does not display JLPT N5 Beginner before onboarding completes', () => {
  const unset = resolveTopBarBadgeDisplay({
    onboardingCompleted: false,
    startingTrack: null,
    targetLevel: 'N5',
  });
  assert.equal(unset.isSet, false);
  assert.equal(unset.labelText, 'Set Your Level');
  assert.ok(!unset.labelText.includes('JLPT N5'));
});

test('resolveTopBarBadgeDisplay reflects every chosen level accurately once onboarded', () => {
  assert.equal(STARTING_TRACK_OPTIONS.length, 8);

  const zero = resolveTopBarBadgeDisplay({
    onboardingCompleted: true,
    startingTrack: 'zero',
    targetLevel: 'N5',
  });
  assert.equal(zero.labelText, 'Zero Knowledge');

  const kana = resolveTopBarBadgeDisplay({
    onboardingCompleted: true,
    startingTrack: 'kana',
    targetLevel: 'N5',
  });
  assert.equal(kana.labelText, 'Knows Basic Kana');

  const pre = resolveTopBarBadgeDisplay({
    onboardingCompleted: true,
    startingTrack: 'pre-n5',
    targetLevel: 'N5',
  });
  assert.equal(pre.labelText, 'Pre-N5 Bridge');

  const n1 = resolveTopBarBadgeDisplay({
    onboardingCompleted: true,
    startingTrack: 'N1',
    targetLevel: 'N1',
  });
  assert.equal(n1.labelText, 'JLPT N1 / Native');
  assert.equal(getStartingTrackMeta('N3').mappedJlptLevel, 'N3');
});

test('countAnsweredOnboardingQuestions and isOnboardingComplete require all 7 answers with no auto-selection', () => {
  assert.equal(TOTAL_ONBOARDING_QUESTIONS, 7);
  assert.equal(countAnsweredOnboardingQuestions({}), 0);
  assert.equal(isOnboardingComplete({}), false);

  const partial = {
    aim: 'Pass JLPT & speak naturally',
    whyJapanese: 'Career growth & love for Japanese culture',
    startingTrack: 'N5' as const,
  };
  assert.equal(countAnsweredOnboardingQuestions(partial), 3);
  assert.equal(isOnboardingComplete(partial), false);

  const complete = {
    aim: 'Pass JLPT & speak naturally',
    whyJapanese: 'Career growth & love for Japanese culture',
    futureGoal: 'Work or study in Japan confidently',
    japanPlan: 'Yes — Career & Work in Japan',
    startingTrack: 'N5' as const,
    dailyGoalMinutes: 15 as const,
    prioritySkill: 'Speaking, Kana & Core Vocabulary',
  };
  assert.equal(countAnsweredOnboardingQuestions(complete), 7);
  assert.equal(isOnboardingComplete(complete), true);
});
