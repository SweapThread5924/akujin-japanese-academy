export const SOUND_PREF_STORAGE_KEY = 'akujin_sound_enabled';

export type SoundEffectKind =
  | 'flip'
  | 'quiz-correct'
  | 'quiz-wrong'
  | 'srs-good'
  | 'srs-again'
  | 'achievement';

export interface ToneStepSpec {
  frequencyStart: number;
  frequencyEnd: number;
  durationMs: number;
  delayMs: number;
  gain: number;
  type: OscillatorType;
}

export function parseStoredSoundPreference(raw: string | null): boolean {
  if (raw === 'false') return false;
  return true;
}

export function getSoundEffectSpec(kind: SoundEffectKind): ToneStepSpec[] {
  switch (kind) {
    case 'flip':
      return [
        {
          frequencyStart: 320,
          frequencyEnd: 520,
          durationMs: 75,
          delayMs: 0,
          gain: 0.08,
          type: 'triangle',
        },
      ];
    case 'quiz-correct':
      return [
        {
          frequencyStart: 523.25, // C5
          frequencyEnd: 523.25,
          durationMs: 110,
          delayMs: 0,
          gain: 0.1,
          type: 'sine',
        },
        {
          frequencyStart: 659.25, // E5
          frequencyEnd: 659.25,
          durationMs: 120,
          delayMs: 85,
          gain: 0.11,
          type: 'sine',
        },
        {
          frequencyStart: 783.99, // G5
          frequencyEnd: 783.99,
          durationMs: 210,
          delayMs: 170,
          gain: 0.12,
          type: 'triangle',
        },
      ];
    case 'quiz-wrong':
      return [
        {
          frequencyStart: 310,
          frequencyEnd: 270,
          durationMs: 130,
          delayMs: 0,
          gain: 0.09,
          type: 'triangle',
        },
        {
          frequencyStart: 240,
          frequencyEnd: 190,
          durationMs: 190,
          delayMs: 110,
          gain: 0.09,
          type: 'sine',
        },
      ];
    case 'srs-good':
      return [
        {
          frequencyStart: 587.33, // D5
          frequencyEnd: 587.33,
          durationMs: 90,
          delayMs: 0,
          gain: 0.08,
          type: 'sine',
        },
        {
          frequencyStart: 880, // A5
          frequencyEnd: 880,
          durationMs: 160,
          delayMs: 75,
          gain: 0.09,
          type: 'sine',
        },
      ];
    case 'srs-again':
      return [
        {
          frequencyStart: 280,
          frequencyEnd: 220,
          durationMs: 150,
          delayMs: 0,
          gain: 0.07,
          type: 'sine',
        },
      ];
    case 'achievement':
      return [
        {
          frequencyStart: 523.25, // C5
          frequencyEnd: 523.25,
          durationMs: 100,
          delayMs: 0,
          gain: 0.09,
          type: 'triangle',
        },
        {
          frequencyStart: 659.25, // E5
          frequencyEnd: 659.25,
          durationMs: 100,
          delayMs: 75,
          gain: 0.1,
          type: 'triangle',
        },
        {
          frequencyStart: 783.99, // G5
          frequencyEnd: 783.99,
          durationMs: 120,
          delayMs: 150,
          gain: 0.11,
          type: 'sine',
        },
        {
          frequencyStart: 1046.5, // C6
          frequencyEnd: 1046.5,
          durationMs: 260,
          delayMs: 230,
          gain: 0.12,
          type: 'sine',
        },
      ];
  }
}

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function resetAudioContextForTests(): void {
  sharedAudioContext = null;
}

export function primeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
}

export function playSoundEffect(kind: SoundEffectKind, enabled: boolean): boolean {
  if (!enabled) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;
    const steps = getSoundEffectSpec(kind);

    for (const step of steps) {
      const startTime = now + step.delayMs / 1000;
      const endTime = startTime + step.durationMs / 1000;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = step.type;
      osc.frequency.setValueAtTime(step.frequencyStart, startTime);
      if (step.frequencyEnd !== step.frequencyStart) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(40, step.frequencyEnd),
          endTime
        );
      }

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(step.gain, startTime + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime + 0.015);
    }
    return true;
  } catch {
    return false;
  }
}

export function playCardFlipSound(enabled: boolean): boolean {
  return playSoundEffect('flip', enabled);
}

export function playQuizFeedbackSound(enabled: boolean, isCorrect: boolean): boolean {
  return playSoundEffect(isCorrect ? 'quiz-correct' : 'quiz-wrong', enabled);
}

export function playSrsRatingSound(enabled: boolean, isPositive: boolean): boolean {
  return playSoundEffect(isPositive ? 'srs-good' : 'srs-again', enabled);
}

export function playAchievementSound(enabled: boolean): boolean {
  return playSoundEffect('achievement', enabled);
}
