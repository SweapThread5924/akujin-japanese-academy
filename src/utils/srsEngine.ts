export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type SrsRating = 1 | 3 | 4 | 5; // 1: Again, 3: Hard, 4: Good, 5: Easy

export interface SrsCardProgress {
  kanjiId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewIso: string;
  lastReviewedIso: string;
  lapses: number;
  correctCount: number;
  reviewCount: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  reviews: number;
}

export interface LearnerRank {
  title: string;
  japaneseTitle: string;
  jlptFocus: JlptLevel;
  minXp: number;
  nextXp: number;
}

export interface AdaptiveQuizRecommendation {
  recommendedLevel: JlptLevel;
  difficultyLabel: 'Foundational' | 'Standard' | 'Exam Challenge';
  accuracyPct: number;
  rationale: string;
}

export interface RegisterSample {
  registerLabel: string;
  japaneseTag: string;
  japanese: string;
  reading: string;
  romaji: string;
  english: string;
  grammarNote: string;
}

const RANKS: LearnerRank[] = [
  { title: 'Zero Starter', japaneseTitle: '入門', jlptFocus: 'N5', minXp: 0, nextXp: 150 },
  { title: 'N5 Novice', japaneseTitle: '初級', jlptFocus: 'N5', minXp: 150, nextXp: 450 },
  { title: 'N4 Apprentice', japaneseTitle: '基礎', jlptFocus: 'N4', minXp: 450, nextXp: 1000 },
  { title: 'N3 Adept', japaneseTitle: '中級', jlptFocus: 'N3', minXp: 1000, nextXp: 2000 },
  { title: 'N2 Scholar', japaneseTitle: '上級', jlptFocus: 'N2', minXp: 2000, nextXp: 3500 },
  { title: 'N1 Sensei', japaneseTitle: '達人', jlptFocus: 'N1', minXp: 3500, nextXp: 6000 },
];

export function createInitialSrsProgress(kanjiId: string, nowIso = new Date().toISOString()): SrsCardProgress {
  return {
    kanjiId,
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewIso: nowIso,
    lastReviewedIso: nowIso,
    lapses: 0,
    correctCount: 0,
    reviewCount: 0,
  };
}

export function calculateSm2Review(
  current: SrsCardProgress,
  rating: SrsRating,
  nowDate = new Date()
): SrsCardProgress {
  const nowIso = nowDate.toISOString();
  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let easeFactor = current.easeFactor;
  let lapses = current.lapses;
  const reviewCount = current.reviewCount + 1;
  const correctCount = rating >= 3 ? current.correctCount + 1 : current.correctCount;

  if (rating < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    if (rating === 3) {
      intervalDays = Math.max(1, Math.round(intervalDays * 0.8));
    } else if (rating === 5) {
      intervalDays = Math.round(intervalDays * 1.3);
    }
    repetitions += 1;
  }

  // Standard SM-2 ease adjustment clamped at >= 1.3
  const qDiff = 5 - rating;
  easeFactor = Math.max(
    1.3,
    Number((easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02))).toFixed(2))
  );

  const nextDate = new Date(nowDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    kanjiId: current.kanjiId,
    repetitions,
    intervalDays,
    easeFactor,
    nextReviewIso: nextDate.toISOString(),
    lastReviewedIso: nowIso,
    lapses,
    correctCount,
    reviewCount,
  };
}

export function computeRetentionAndStats(
  srsMap: Record<string, SrsCardProgress>,
  totalDeckSize: number
): {
  learnedCount: number;
  masteredCount: number;
  totalReviews: number;
  retentionRate: number;
  deckCoveragePct: number;
} {
  const entries = Object.values(srsMap);
  const learnedCount = entries.filter((item) => item.repetitions >= 1).length;
  const masteredCount = entries.filter((item) => item.repetitions >= 3 && item.intervalDays >= 6).length;
  const totalReviews = entries.reduce((sum, item) => sum + item.reviewCount, 0);
  const totalCorrect = entries.reduce((sum, item) => sum + item.correctCount, 0);

  const retentionRate = totalReviews === 0 ? 100 : Math.round((totalCorrect / totalReviews) * 100);
  const deckCoveragePct = totalDeckSize === 0 ? 0 : Math.round((learnedCount / totalDeckSize) * 100);

  return {
    learnedCount,
    masteredCount,
    totalReviews,
    retentionRate,
    deckCoveragePct,
  };
}

export function buildHeatmapDays(
  historyMap: Record<string, number>,
  daysCount = 56,
  referenceDate = new Date()
): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const start = new Date(referenceDate);
  start.setUTCHours(0, 0, 0, 0);

  for (let offset = daysCount - 1; offset >= 0; offset--) {
    const d = new Date(start.getTime() - offset * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      reviews: historyMap[key] ?? 0,
    });
  }
  return days;
}

export function getLearnerRank(xp: number): LearnerRank & { progressPct: number } {
  const safeXp = Math.max(0, xp);
  let active = RANKS[0];
  for (const rank of RANKS) {
    if (safeXp >= rank.minXp) {
      active = rank;
    }
  }
  const span = Math.max(1, active.nextXp - active.minXp);
  const progressPct = Math.min(100, Math.round(((safeXp - active.minXp) / span) * 100));
  return { ...active, progressPct };
}

export function computeStreakAfterStudy(
  currentStreak: number,
  lastStudyDate: string,
  todayDate: string
): number {
  if (!lastStudyDate) return Math.max(1, currentStreak);
  if (lastStudyDate === todayDate) return Math.max(1, currentStreak);

  const prev = new Date(`${lastStudyDate}T00:00:00Z`).getTime();
  const curr = new Date(`${todayDate}T00:00:00Z`).getTime();
  const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));

  if (diffDays === 1) return currentStreak + 1;
  if (diffDays > 1) return 1;
  return Math.max(1, currentStreak);
}

export function selectAdaptiveDifficulty(
  recentResults: boolean[],
  selectedLevel: JlptLevel
): AdaptiveQuizRecommendation {
  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const currentIdx = levels.indexOf(selectedLevel);

  if (recentResults.length === 0) {
    return {
      recommendedLevel: selectedLevel,
      difficultyLabel: 'Standard',
      accuracyPct: 100,
      rationale: `Calibrated to ${selectedLevel} core syllabus.`,
    };
  }

  const windowSlice = recentResults.slice(-8);
  const correct = windowSlice.filter(Boolean).length;
  const accuracyPct = Math.round((correct / windowSlice.length) * 100);

  if (accuracyPct >= 85 && windowSlice.length >= 4) {
    const promoted = levels[Math.min(levels.length - 1, currentIdx + 1)];
    return {
      recommendedLevel: promoted,
      difficultyLabel: 'Exam Challenge',
      accuracyPct,
      rationale: `${accuracyPct}% recent accuracy — unlocking ${promoted} exam-speed drills.`,
    };
  }

  if (accuracyPct < 55 && windowSlice.length >= 3) {
    const fallback = levels[Math.max(0, currentIdx - 1)];
    return {
      recommendedLevel: fallback,
      difficultyLabel: 'Foundational',
      accuracyPct,
      rationale: `${accuracyPct}% recent accuracy — reinforcing ${fallback} grammar foundations.`,
    };
  }

  return {
    recommendedLevel: selectedLevel,
    difficultyLabel: 'Standard',
    accuracyPct,
    rationale: `${accuracyPct}% recent accuracy — steady progression in ${selectedLevel}.`,
  };
}

export function interpolateRegisterTier(sliderValue: number): 0 | 1 | 2 {
  const clamped = Math.max(0, Math.min(100, sliderValue));
  if (clamped < 34) return 0; // Textbook Polite
  if (clamped < 68) return 1; // Natural Casual Tokyo
  return 2; // Anime / Expressive Slang
}

export function evaluateUnlockedAchievements(params: {
  xp: number;
  streak: number;
  learnedKanjiCount: number;
  bookmarkedCount: number;
  quizCorrectTotal: number;
}): string[] {
  const unlocked: string[] = [];
  if (params.streak >= 3) unlocked.push('streak_3');
  if (params.streak >= 7) unlocked.push('streak_7');
  if (params.learnedKanjiCount >= 1) unlocked.push('first_kanji');
  if (params.learnedKanjiCount >= 5) unlocked.push('kanji_5');
  if (params.xp >= 500) unlocked.push('xp_500');
  if (params.xp >= 1500) unlocked.push('xp_1500');
  if (params.bookmarkedCount >= 3) unlocked.push('phrasebook_3');
  if (params.quizCorrectTotal >= 5) unlocked.push('quiz_5');
  return unlocked;
}

export const STREAK_FLAME_THRESHOLD = 5;

export function isStreakOnFire(streak: number): boolean {
  return streak >= STREAK_FLAME_THRESHOLD;
}

