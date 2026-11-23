import type { JlptLevel } from './srsEngine';

export interface ReadingSpeedRecord {
  id: string;
  passageId: string;
  passageTitle: string;
  level: JlptLevel;
  charCount: number;
  elapsedSeconds: number;
  cpm: number;
  comprehensionCorrect?: boolean;
  recordedAt: string;
}

export interface ReadingPaceClassification {
  tier: 'careful' | 'steady' | 'exam-ready' | 'fluent';
  label: string;
  targetCpm: number;
  deltaFromTarget: number;
  badgeColorClass: string;
}

export interface ReadingLevelBenchmark {
  level: JlptLevel;
  targetCpm: number;
  sessionsCount: number;
  averageCpm: number;
  bestCpm: number;
}

export interface ReadingSpeedSummary {
  totalPassagesTimed: number;
  averageCpm: number;
  bestCpm: number;
  latestRecord: ReadingSpeedRecord | null;
  totalCharactersRead: number;
  comprehensionAccuracyPct: number | null;
  byLevel: ReadingLevelBenchmark[];
}

export const MAX_READING_SPEED_RECORDS = 50;

export const JLPT_TARGET_CPM: Record<JlptLevel, number> = {
  N5: 120,
  N4: 180,
  N3: 240,
  N2: 320,
  N1: 400,
};

const VALID_LEVELS = new Set<JlptLevel>(['N5', 'N4', 'N3', 'N2', 'N1']);

/**
 * Counts readable characters in a Japanese passage, stripping whitespace/newlines
 * so spacing does not skew CPM measurements. Uses codepoint iteration for Unicode safety.
 */
export function countJapaneseReadingCharacters(text: string): number {
  const cleaned = String(text ?? '').replace(/[\s\u3000]+/g, '');
  if (!cleaned) return 0;
  return Array.from(cleaned).length;
}

/**
 * Computes rounded elapsed seconds (clamped >= 1) and characters per minute (CPM).
 */
export function calculateReadingCpm(
  charCount: number,
  elapsedMs: number
): { elapsedSeconds: number; cpm: number } {
  const safeChars = Math.max(0, Math.round(Number(charCount) || 0));
  const rawSeconds = Math.round((Number(elapsedMs) || 0) / 1000);
  const elapsedSeconds = Math.min(7200, Math.max(1, rawSeconds));
  if (safeChars === 0) {
    return { elapsedSeconds, cpm: 0 };
  }
  const cpm = Math.min(5000, Math.max(1, Math.round((safeChars / elapsedSeconds) * 60)));
  return { elapsedSeconds, cpm };
}

/**
 * Classifies a learner's reading CPM relative to JLPT target reading speeds.
 */
export function classifyReadingPace(
  cpm: number,
  level: JlptLevel
): ReadingPaceClassification {
  const targetCpm = JLPT_TARGET_CPM[level] ?? 180;
  const safeCpm = Math.max(0, Math.round(cpm));
  const deltaFromTarget = safeCpm - targetCpm;
  const ratio = safeCpm / Math.max(1, targetCpm);

  if (ratio >= 1.25) {
    return {
      tier: 'fluent',
      label: 'Fluent Pace',
      targetCpm,
      deltaFromTarget,
      badgeColorClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }
  if (ratio >= 0.95) {
    return {
      tier: 'exam-ready',
      label: 'Exam Target Pace',
      targetCpm,
      deltaFromTarget,
      badgeColorClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-500/30',
    };
  }
  if (ratio >= 0.65) {
    return {
      tier: 'steady',
      label: 'Steady Study Pace',
      targetCpm,
      deltaFromTarget,
      badgeColorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-500/30',
    };
  }
  return {
    tier: 'careful',
    label: 'Careful Comprehension',
    targetCpm,
    deltaFromTarget,
    badgeColorClass: 'bg-stone-100 dark:bg-[#1E2029] text-stone-700 dark:text-zinc-300 border-stone-300 dark:border-zinc-700',
  };
}

export function formatDurationMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function sanitizeReadingSpeedRecords(raw: unknown): ReadingSpeedRecord[] {
  if (!Array.isArray(raw)) return [];
  const valid: ReadingSpeedRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Partial<ReadingSpeedRecord>;
    const level = VALID_LEVELS.has(rec.level as JlptLevel) ? (rec.level as JlptLevel) : 'N5';
    const charCount = Math.round(Number(rec.charCount) || 0);
    const elapsedSeconds = Math.round(Number(rec.elapsedSeconds) || 0);
    const cpm = Math.round(Number(rec.cpm) || 0);
    if (
      charCount < 1 ||
      charCount > 10000 ||
      elapsedSeconds < 1 ||
      elapsedSeconds > 7200 ||
      cpm < 1 ||
      cpm > 5000
    ) {
      continue;
    }
    const cleanRecord: ReadingSpeedRecord = {
      id: String(rec.id || `rs-${valid.length + 1}`).slice(0, 64),
      passageId: String(rec.passageId || 'passage').slice(0, 64),
      passageTitle: String(rec.passageTitle || 'Reading Passage').slice(0, 120),
      level,
      charCount,
      elapsedSeconds,
      cpm,
      recordedAt:
        typeof rec.recordedAt === 'string' && rec.recordedAt.length > 0
          ? rec.recordedAt.slice(0, 40)
          : new Date().toISOString(),
    };
    if (typeof rec.comprehensionCorrect === 'boolean') {
      cleanRecord.comprehensionCorrect = rec.comprehensionCorrect;
    }
    valid.push(cleanRecord);
    if (valid.length >= MAX_READING_SPEED_RECORDS) break;
  }
  return valid;
}

export function prependReadingSpeedRecord(
  existing: ReadingSpeedRecord[],
  nextRecord: ReadingSpeedRecord
): ReadingSpeedRecord[] {
  return sanitizeReadingSpeedRecords([nextRecord, ...existing]).slice(
    0,
    MAX_READING_SPEED_RECORDS
  );
}

export function summarizeReadingSpeed(
  records: ReadingSpeedRecord[]
): ReadingSpeedSummary {
  const safeRecords = sanitizeReadingSpeedRecords(records);
  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  if (safeRecords.length === 0) {
    return {
      totalPassagesTimed: 0,
      averageCpm: 0,
      bestCpm: 0,
      latestRecord: null,
      totalCharactersRead: 0,
      comprehensionAccuracyPct: null,
      byLevel: levels.map((level) => ({
        level,
        targetCpm: JLPT_TARGET_CPM[level],
        sessionsCount: 0,
        averageCpm: 0,
        bestCpm: 0,
      })),
    };
  }

  let totalCpm = 0;
  let bestCpm = 0;
  let totalChars = 0;
  let answeredCount = 0;
  let correctCount = 0;

  for (const r of safeRecords) {
    totalCpm += r.cpm;
    if (r.cpm > bestCpm) bestCpm = r.cpm;
    totalChars += r.charCount;
    if (typeof r.comprehensionCorrect === 'boolean') {
      answeredCount += 1;
      if (r.comprehensionCorrect) correctCount += 1;
    }
  }

  const byLevel = levels.map((level) => {
    const matches = safeRecords.filter((r) => r.level === level);
    if (matches.length === 0) {
      return {
        level,
        targetCpm: JLPT_TARGET_CPM[level],
        sessionsCount: 0,
        averageCpm: 0,
        bestCpm: 0,
      };
    }
    const sum = matches.reduce((acc, m) => acc + m.cpm, 0);
    const best = matches.reduce((acc, m) => Math.max(acc, m.cpm), 0);
    return {
      level,
      targetCpm: JLPT_TARGET_CPM[level],
      sessionsCount: matches.length,
      averageCpm: Math.round(sum / matches.length),
      bestCpm: best,
    };
  });

  return {
    totalPassagesTimed: safeRecords.length,
    averageCpm: Math.round(totalCpm / safeRecords.length),
    bestCpm,
    latestRecord: safeRecords[0] ?? null,
    totalCharactersRead: totalChars,
    comprehensionAccuracyPct:
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : null,
    byLevel,
  };
}
