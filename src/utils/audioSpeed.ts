export const MIN_AUDIO_SPEED = 0.5;
export const MAX_AUDIO_SPEED = 1.5;
export const DEFAULT_AUDIO_SPEED = 1.0;
export const AUDIO_SPEED_STEP = 0.05;
export const AUDIO_SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
export const AUDIO_SPEED_STORAGE_KEY = 'akujin_audio_speed_v1';

export function clampAudioSpeed(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AUDIO_SPEED;
  const clamped = Math.min(MAX_AUDIO_SPEED, Math.max(MIN_AUDIO_SPEED, value));
  return Math.round(clamped * 100) / 100;
}

export function parseStoredAudioSpeed(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === '') return DEFAULT_AUDIO_SPEED;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_AUDIO_SPEED;
  return clampAudioSpeed(parsed);
}

export function formatAudioSpeedLabel(speed: number): string {
  const safe = clampAudioSpeed(speed);
  const formatted = safe.toFixed(2).replace(/0$/, '');
  return `${formatted}x`;
}

export function getAudioSpeedDescriptor(speed: number): string {
  const safe = clampAudioSpeed(speed);
  if (safe <= 0.7) return 'Slow Study';
  if (safe <= 0.9) return 'Careful';
  if (safe <= 1.1) return 'Natural';
  if (safe <= 1.3) return 'Brisk';
  return 'Native Fast';
}
