import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_SPEED_PRESETS,
  clampAudioSpeed,
  DEFAULT_AUDIO_SPEED,
  formatAudioSpeedLabel,
  getAudioSpeedDescriptor,
  MAX_AUDIO_SPEED,
  MIN_AUDIO_SPEED,
  parseStoredAudioSpeed,
} from './audioSpeed';

test('clampAudioSpeed enforces 0.5x to 1.5x bounds and handles invalid input', () => {
  assert.equal(MIN_AUDIO_SPEED, 0.5);
  assert.equal(MAX_AUDIO_SPEED, 1.5);
  assert.equal(clampAudioSpeed(0.1), 0.5);
  assert.equal(clampAudioSpeed(0.5), 0.5);
  assert.equal(clampAudioSpeed(1.0), 1.0);
  assert.equal(clampAudioSpeed(1.25), 1.25);
  assert.equal(clampAudioSpeed(2.4), 1.5);
  assert.equal(clampAudioSpeed(Number.NaN), DEFAULT_AUDIO_SPEED);
  assert.equal(clampAudioSpeed(Number.POSITIVE_INFINITY), DEFAULT_AUDIO_SPEED);
});

test('parseStoredAudioSpeed safely parses and clamps stored values', () => {
  assert.equal(parseStoredAudioSpeed(null), 1.0);
  assert.equal(parseStoredAudioSpeed(''), 1.0);
  assert.equal(parseStoredAudioSpeed('not-a-number'), 1.0);
  assert.equal(parseStoredAudioSpeed('0.75'), 0.75);
  assert.equal(parseStoredAudioSpeed('0.2'), 0.5);
  assert.equal(parseStoredAudioSpeed('3.0'), 1.5);
});

test('formatAudioSpeedLabel and getAudioSpeedDescriptor produce clean tempo labels', () => {
  assert.deepEqual(
    AUDIO_SPEED_PRESETS.map((p) => formatAudioSpeedLabel(p)),
    ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x']
  );
  assert.equal(getAudioSpeedDescriptor(0.5), 'Slow Study');
  assert.equal(getAudioSpeedDescriptor(0.8), 'Careful');
  assert.equal(getAudioSpeedDescriptor(1.0), 'Natural');
  assert.equal(getAudioSpeedDescriptor(1.25), 'Brisk');
  assert.equal(getAudioSpeedDescriptor(1.5), 'Native Fast');
});
