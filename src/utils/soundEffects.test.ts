import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSoundEffectSpec,
  parseStoredSoundPreference,
  playCardFlipSound,
  playQuizFeedbackSound,
  playSrsRatingSound,
  resetAudioContextForTests,
} from './soundEffects';

test('parseStoredSoundPreference defaults to true unless explicitly false', () => {
  assert.equal(parseStoredSoundPreference(null), true);
  assert.equal(parseStoredSoundPreference('true'), true);
  assert.equal(parseStoredSoundPreference(''), true);
  assert.equal(parseStoredSoundPreference('false'), false);
});

test('getSoundEffectSpec defines ascending chime for correct quiz and descending cue for wrong', () => {
  const flipSpec = getSoundEffectSpec('flip');
  assert.equal(flipSpec.length, 1);
  assert.ok(flipSpec[0].frequencyEnd > flipSpec[0].frequencyStart);

  const correctSpec = getSoundEffectSpec('quiz-correct');
  assert.equal(correctSpec.length, 3);
  assert.ok(correctSpec[2].frequencyStart > correctSpec[0].frequencyStart);

  const wrongSpec = getSoundEffectSpec('quiz-wrong');
  assert.equal(wrongSpec.length, 2);
  assert.ok(wrongSpec[1].frequencyEnd < wrongSpec[0].frequencyStart);
});

test('sound playback functions return false cleanly when disabled or outside browser', () => {
  resetAudioContextForTests();
  assert.equal(playCardFlipSound(false), false);
  assert.equal(playQuizFeedbackSound(false, true), false);
  assert.equal(playQuizFeedbackSound(false, false), false);
  assert.equal(playSrsRatingSound(false, true), false);

  // Even when enabled in Node (no window), safely returns false without throwing
  assert.equal(playCardFlipSound(true), false);
  assert.equal(playQuizFeedbackSound(true, true), false);
});
