import type { SrsCardProgress } from './srsEngine';

export interface KanjiMasteryTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Nov 19"
  reviews: number; // Kanji review frequency on this date
  masteryRate: number; // 0–100 (%) cumulative mastery/accuracy rate up to this date
  masteredCount: number; // cumulative mastered kanji cards up to this date
}

export interface KanjiMasteryTrendSummary {
  totalReviews30d: number;
  currentMasteryRate: number;
  activeDays30d: number;
  masteredCardsCount: number;
  totalTrackedCards: number;
  peakDailyReviews: number;
}

export interface KanjiMasteryTrendResult {
  points: KanjiMasteryTrendPoint[];
  summary: KanjiMasteryTrendSummary;
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatShortUtcDate(date: Date): string {
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

function toUtcDateKey(isoOrDate: string | Date): string | null {
  if (isoOrDate instanceof Date) {
    if (Number.isNaN(isoOrDate.getTime())) return null;
    return isoOrDate.toISOString().slice(0, 10);
  }
  if (typeof isoOrDate !== 'string' || isoOrDate.length < 10) return null;
  const key = isoOrDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

/**
 * Computes a deterministic 30-day Kanji Mastery Trend series directly from srsProgress.
 * - reviews: daily Kanji review frequency attributed to each card's lastReviewedIso date
 * - masteryRate: cumulative mastery rate (0–100%) across all Kanji cards reviewed up to each day
 * - masteredCount: cumulative count of Kanji cards with repetitions >= 2 & intervalDays >= 6 (or >= 80% accuracy on >= 2 reviews)
 */
export function buildKanjiMasteryTrend(
  srsProgress: Record<string, SrsCardProgress>,
  days = 30,
  nowDate = new Date()
): KanjiMasteryTrendResult {
  const safeDays = Math.max(7, Math.min(90, Math.round(days)));
  const endUtc = new Date(
    Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())
  );

  // Build ordered 30-day date buckets
  const dayKeys: { date: string; label: string }[] = [];
  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const d = new Date(endUtc.getTime() - i * 24 * 60 * 60 * 1000);
    dayKeys.push({
      date: d.toISOString().slice(0, 10),
      label: formatShortUtcDate(d),
    });
  }

  const firstKey = dayKeys[0].date;
  const lastKey = dayKeys[dayKeys.length - 1].date;

  const reviewedCards = Object.values(srsProgress).filter(
    (card) => card && typeof card.reviewCount === 'number' && card.reviewCount > 0
  );

  // Group cards by their UTC review date key
  const dailyReviewsMap = new Map<string, number>();
  const dailyCorrectMap = new Map<string, number>();
  const dailyTotalReviewEventsMap = new Map<string, number>();
  const dailyMasteredCardsMap = new Map<string, number>();

  let preWindowCorrect = 0;
  let preWindowReviews = 0;
  let preWindowMastered = 0;

  for (const card of reviewedCards) {
    const key = toUtcDateKey(card.lastReviewedIso);
    const isMastered =
      (card.repetitions >= 2 && card.intervalDays >= 6) ||
      (card.reviewCount >= 2 && card.correctCount / card.reviewCount >= 0.8 && card.repetitions >= 1);

    if (!key || key < firstKey) {
      preWindowCorrect += Math.max(0, card.correctCount);
      preWindowReviews += Math.max(0, card.reviewCount);
      if (isMastered) preWindowMastered += 1;
      continue;
    }

    // Clamp future-dated timestamps (e.g. clock skew) onto today
    const effectiveKey = key > lastKey ? lastKey : key;

    dailyReviewsMap.set(
      effectiveKey,
      (dailyReviewsMap.get(effectiveKey) ?? 0) + Math.max(1, card.reviewCount)
    );
    dailyCorrectMap.set(
      effectiveKey,
      (dailyCorrectMap.get(effectiveKey) ?? 0) + Math.max(0, card.correctCount)
    );
    dailyTotalReviewEventsMap.set(
      effectiveKey,
      (dailyTotalReviewEventsMap.get(effectiveKey) ?? 0) + Math.max(1, card.reviewCount)
    );
    if (isMastered) {
      dailyMasteredCardsMap.set(
        effectiveKey,
        (dailyMasteredCardsMap.get(effectiveKey) ?? 0) + 1
      );
    }
  }

  let runningCorrect = preWindowCorrect;
  let runningReviews = preWindowReviews;
  let runningMastered = preWindowMastered;

  let totalReviews30d = 0;
  let activeDays30d = 0;
  let peakDailyReviews = 0;

  const points: KanjiMasteryTrendPoint[] = dayKeys.map(({ date, label }) => {
    const reviewsToday = dailyReviewsMap.get(date) ?? 0;
    const correctToday = dailyCorrectMap.get(date) ?? 0;
    const reviewEventsToday = dailyTotalReviewEventsMap.get(date) ?? 0;
    const masteredToday = dailyMasteredCardsMap.get(date) ?? 0;

    runningCorrect += correctToday;
    runningReviews += reviewEventsToday;
    runningMastered += masteredToday;

    if (reviewsToday > 0) {
      totalReviews30d += reviewsToday;
      activeDays30d += 1;
      if (reviewsToday > peakDailyReviews) {
        peakDailyReviews = reviewsToday;
      }
    }

    const masteryRate =
      runningReviews > 0
        ? Math.min(100, Math.max(0, Math.round((runningCorrect / runningReviews) * 100)))
        : 0;

    return {
      date,
      label,
      reviews: reviewsToday,
      masteryRate,
      masteredCount: runningMastered,
    };
  });

  const currentMasteryRate =
    points.length > 0 ? points[points.length - 1].masteryRate : 0;

  return {
    points,
    summary: {
      totalReviews30d,
      currentMasteryRate,
      activeDays30d,
      masteredCardsCount: runningMastered,
      totalTrackedCards: reviewedCards.length,
      peakDailyReviews,
    },
  };
}
