import { SYLLABUS_TOTALS, type JoyoKanjiEntry } from './datasetLoader';
import type { JlptLevel, SrsCardProgress } from './srsEngine';

export interface JoyoLevelProgressSummary {
  targetLevel: JlptLevel;
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  percentage: number;
  formattedPercentage: string;
}

export interface JoyoProgressInput {
  targetLevel: JlptLevel;
  joyoCatalog: Pick<JoyoKanjiEntry, 'id' | 'kanji' | 'level'>[];
  masteredItemIds: string[];
  srsProgress: Record<string, SrsCardProgress>;
  srsDeck: ReadonlyArray<{ id: string; kanji: string; level: JlptLevel }>;
}

/**
 * Computes the learner's completed Joyo Kanji count and percentage
 * for their current target JLPT level, unifying directory mastery
 * (`masteredItemIds`) and SRS card reviews (`repetitions >= 1`) without double-counting.
 */
export function computeTargetLevelJoyoProgress({
  targetLevel,
  joyoCatalog,
  masteredItemIds,
  srsProgress,
  srsDeck,
}: JoyoProgressInput): JoyoLevelProgressSummary {
  const masteredSet = new Set(masteredItemIds);
  const learnedSrsKanjiChars = new Set<string>();

  for (const card of srsDeck) {
    if (card.level === targetLevel && (srsProgress[card.id]?.repetitions ?? 0) >= 1) {
      learnedSrsKanjiChars.add(card.kanji);
    }
  }

  const levelEntries = joyoCatalog.filter((entry) => entry.level === targetLevel);
  const completedChars = new Set<string>();

  for (const entry of levelEntries) {
    if (masteredSet.has(entry.id) || learnedSrsKanjiChars.has(entry.kanji)) {
      completedChars.add(entry.kanji);
    }
  }

  // Include any SRS-learned target-level kanji even if catalog hasn't finished loading
  for (const ch of learnedSrsKanjiChars) {
    completedChars.add(ch);
  }

  const syllabusTotal = SYLLABUS_TOTALS[targetLevel].levelKanji;
  const totalCount = Math.max(levelEntries.length, syllabusTotal);
  const completedCount = Math.min(completedChars.size, totalCount);
  const remainingCount = Math.max(0, totalCount - completedCount);

  const rawPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, Number(rawPct.toFixed(1))));

  const formattedPercentage =
    completedCount === 0
      ? '0'
      : completedCount >= totalCount
      ? '100'
      : percentage < 10
      ? percentage.toFixed(1)
      : String(Math.round(percentage));

  return {
    targetLevel,
    completedCount,
    totalCount,
    remainingCount,
    percentage,
    formattedPercentage,
  };
}

export const MASTERY_STREAK_TARGET = 5;

export interface MasteryStreakUpdate {
  streak: number;
  badgeUnlocked: boolean;
  justTriggeredCelebration: boolean;
}

/**
 * Updates consecutive perfect (rating 5) Kanji SRS review streak.
 * Triggers celebratory state every 5 consecutive rating-5 reviews.
 */
export function updateMasteryStreak(
  currentStreak: number,
  rating: number
): MasteryStreakUpdate {
  if (rating === 5) {
    const nextStreak = Math.max(0, currentStreak) + 1;
    return {
      streak: nextStreak,
      badgeUnlocked: nextStreak >= MASTERY_STREAK_TARGET,
      justTriggeredCelebration: nextStreak % MASTERY_STREAK_TARGET === 0,
    };
  }
  return {
    streak: 0,
    badgeUnlocked: false,
    justTriggeredCelebration: false,
  };
}

export interface JlptKanjiLevelBreakdown {
  level: JlptLevel;
  masteredCount: number;
  learningCount: number;
  unseenCount: number;
  totalCount: number;
  masteredPct: number;
  learningPct: number;
}

export interface PerLevelKanjiBreakdownInput {
  joyoCatalog: Pick<JoyoKanjiEntry, 'id' | 'kanji' | 'level'>[];
  masteredItemIds: string[];
  srsProgress: Record<string, SrsCardProgress>;
  srsDeck: ReadonlyArray<{ id: string; kanji: string; level: JlptLevel }>;
}

const JLPT_LEVEL_ORDER: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

/**
 * Computes mutually exclusive Mastered vs. Learning vs. Unseen Kanji counts
 * for each JLPT level (N5–N1).
 *
 * - Mastered: explicitly marked learned in the 2,136 Joyo directory OR SRS repetitions >= 2
 * - Learning: reviewed in SRS (reviewCount >= 1 or repetitions === 1) and not yet mastered
 * - Unseen: remaining kanji in that JLPT level's syllabus
 */
export function computePerLevelKanjiBreakdown({
  joyoCatalog,
  masteredItemIds,
  srsProgress,
  srsDeck,
}: PerLevelKanjiBreakdownInput): JlptKanjiLevelBreakdown[] {
  const masteredIdSet = new Set(masteredItemIds);

  return JLPT_LEVEL_ORDER.map((level) => {
    const masteredChars = new Set<string>();
    const learningChars = new Set<string>();

    const levelCatalog = joyoCatalog.filter((entry) => entry.level === level);
    for (const entry of levelCatalog) {
      if (masteredIdSet.has(entry.id)) {
        masteredChars.add(entry.kanji);
      }
    }

    for (const card of srsDeck) {
      if (card.level !== level) continue;
      const stat = srsProgress[card.id];
      if (!stat) continue;
      if (stat.repetitions >= 2) {
        masteredChars.add(card.kanji);
      } else if (stat.reviewCount >= 1 || stat.repetitions >= 1) {
        learningChars.add(card.kanji);
      }
    }

    // Ensure mutual exclusivity: mastered takes precedence over learning
    for (const ch of masteredChars) {
      learningChars.delete(ch);
    }

    const syllabusTotal = SYLLABUS_TOTALS[level].levelKanji;
    const totalCount = Math.max(levelCatalog.length, syllabusTotal);
    const masteredCount = Math.min(masteredChars.size, totalCount);
    const learningCount = Math.min(learningChars.size, Math.max(0, totalCount - masteredCount));
    const unseenCount = Math.max(0, totalCount - masteredCount - learningCount);

    const masteredPct =
      totalCount > 0 ? Number(((masteredCount / totalCount) * 100).toFixed(1)) : 0;
    const learningPct =
      totalCount > 0 ? Number(((learningCount / totalCount) * 100).toFixed(1)) : 0;

    return {
      level,
      masteredCount,
      learningCount,
      unseenCount,
      totalCount,
      masteredPct,
      learningPct,
    };
  });
}

export interface SearchableKanjiCard {
  id: string;
  kanji: string;
  meaning: string;
  level: JlptLevel;
  strokes: number;
  onyomi: ReadonlyArray<{ kana: string; romaji: string }>;
  kunyomi: ReadonlyArray<{ kana: string; romaji: string }>;
}

/**
 * Searches the SRS Kanji deck by kanji character, English meaning,
 * or On'yomi / Kun'yomi readings (kana or romaji), ranking exact
 * character and prefix matches highest.
 */
export function searchKanjiDeck<T extends SearchableKanjiCard>(
  deck: ReadonlyArray<T>,
  rawQuery: string,
  limit = 8
): T[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const scored: Array<{ card: T; score: number }> = [];

  for (const card of deck) {
    const meaningLower = card.meaning.toLowerCase();
    const readings = [...card.onyomi, ...card.kunyomi];
    let score = 0;

    if (card.kanji === q) {
      score = 100;
    } else if (card.kanji.includes(q)) {
      score = 90;
    } else if (meaningLower === q) {
      score = 85;
    } else if (meaningLower.startsWith(q)) {
      score = 75;
    } else if (meaningLower.includes(q)) {
      score = 60;
    } else {
      for (const r of readings) {
        const kanaLower = r.kana.toLowerCase();
        const romajiLower = r.romaji.toLowerCase();
        const kanaPlain = kanaLower.replace(/[.\-・]/g, '');
        const romajiPlain = romajiLower.replace(/[.\-・\s]/g, '');
        if (
          kanaLower === q ||
          kanaPlain === q ||
          romajiLower === q ||
          romajiPlain === q
        ) {
          score = Math.max(score, 80);
        } else if (
          kanaLower.startsWith(q) ||
          kanaPlain.startsWith(q) ||
          romajiLower.startsWith(q) ||
          romajiPlain.startsWith(q)
        ) {
          score = Math.max(score, 70);
        } else if (
          kanaLower.includes(q) ||
          kanaPlain.includes(q) ||
          romajiLower.includes(q) ||
          romajiPlain.includes(q)
        ) {
          score = Math.max(score, 55);
        }
      }
    }

    if (score > 0) {
      scored.push({ card, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, limit)).map((s) => s.card);
}

const KANA_DIGRAPHS: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
};

const KANA_MONOGRAPHS: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', ゐ: 'wi', ゑ: 'we', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゔ: 'vu',
};

function katakanaToHiragana(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += input[i];
    }
  }
  return out;
}

/**
 * Converts a Hiragana or Katakana reading string into Hepburn Romaji.
 * Strips okurigana punctuation like dots/parentheses cleanly.
 */
export function kanaToRomaji(rawKana: string): string {
  const cleaned = katakanaToHiragana(rawKana).replace(/[().\-]/g, '').trim();
  if (!cleaned) return '';

  let result = '';
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];

    // Small tsu (gemination)
    if (ch === 'っ') {
      const nextPair = cleaned.slice(i + 1, i + 3);
      const nextRomaji =
        KANA_DIGRAPHS[nextPair] ?? KANA_MONOGRAPHS[cleaned[i + 1]] ?? '';
      if (nextRomaji) {
        result += nextRomaji.startsWith('ch') ? 't' : nextRomaji[0];
      }
      i += 1;
      continue;
    }

    // Long vowel mark ー
    if (ch === 'ー') {
      const lastChar = result[result.length - 1];
      if (lastChar && 'aeiou'.includes(lastChar)) {
        result += lastChar;
      }
      i += 1;
      continue;
    }

    const pair = cleaned.slice(i, i + 2);
    if (KANA_DIGRAPHS[pair]) {
      result += KANA_DIGRAPHS[pair];
      i += 2;
      continue;
    }

    if (KANA_MONOGRAPHS[ch]) {
      result += KANA_MONOGRAPHS[ch];
      i += 1;
      continue;
    }

    result += ch;
    i += 1;
  }

  return result;
}

/**
 * Formats structured SRS card readings with Romaji in brackets beside each kana reading.
 */
export function formatKanjiCardReadingsWithRomaji(
  readings: ReadonlyArray<{ kana: string; romaji: string }>
): string {
  if (!readings || readings.length === 0) return '—';
  return readings
    .map((r) => {
      const romaji = (r.romaji || kanaToRomaji(r.kana)).replace(/[()]/g, '').trim();
      return romaji ? `${r.kana} (${romaji})` : r.kana;
    })
    .join(' · ');
}

/**
 * Formats a raw kana reading string (such as from the 2,136 Joyo Kanji directory,
 * e.g. "ニチ、ジツ" or "ひ、-び") with Hepburn Romaji in brackets beside each reading.
 */
export function formatKanaReadingsWithRomaji(rawReading: string): string {
  const trimmed = rawReading.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return '—';

  const parts = trimmed
    .split(/[、,・/]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return '—';

  return parts
    .map((part) => {
      if (/[a-zA-Z]/.test(part)) return part;
      const romaji = kanaToRomaji(part);
      return romaji ? `${part} (${romaji})` : part;
    })
    .join(' · ');
}

/**
 * Builds a clear Japanese Web Speech API utterance reading aloud a Kanji's
 * On'yomi and Kun'yomi readings cleanly.
 */
export function buildKanjiPronunciationScript(
  onyomiKana: ReadonlyArray<string>,
  kunyomiKana: ReadonlyArray<string>,
  fallbackKanji: string
): string {
  const sanitize = (list: ReadonlyArray<string>) =>
    list
      .flatMap((item) => item.split(/[、,・/]+/))
      .map((s) => s.replace(/[().\-]/g, '').trim())
      .filter((s) => s.length > 0 && s !== '—');

  const onList = sanitize(onyomiKana);
  const kunList = sanitize(kunyomiKana);

  const segments: string[] = [];
  if (onList.length > 0) {
    segments.push(`おんよみ、${onList.join('、')}`);
  }
  if (kunList.length > 0) {
    segments.push(`くんよみ、${kunList.join('、')}`);
  }

  return segments.length > 0 ? segments.join('。') : fallbackKanji;
}

export interface FocusModeCardItem<T extends { id: string }> {
  card: T;
  struggleScore: number;
  lapses: number;
  accuracyPct: number | null;
  reason: string;
  hasSrsHistory: boolean;
}

export interface FocusModeDeckResult<T extends { id: string }> {
  items: FocusModeCardItem<T>[];
  struggledCount: number;
}

/**
 * Generates a customized Focus Mode study session of up to `limit` (default 10)
 * Kanji ranked by struggle severity from the learner's SM-2 SRS history
 * (lapses, low accuracy, low ease factor, short interval, and due status).
 */
export function buildFocusModeDeck<T extends { id: string }>(
  deck: ReadonlyArray<T>,
  srsProgress: Record<string, SrsCardProgress>,
  limit = 10,
  nowMs: number = Date.now()
): FocusModeDeckResult<T> {
  const scored: Array<FocusModeCardItem<T> & { originalIndex: number }> = deck.map(
    (card, originalIndex) => {
      const stat = srsProgress[card.id];
      if (!stat || stat.reviewCount <= 0) {
        return {
          card,
          struggleScore: 5,
          lapses: 0,
          accuracyPct: null,
          reason: 'Not yet practiced',
          hasSrsHistory: false,
          originalIndex,
        };
      }

      const accuracy = stat.correctCount / Math.max(1, stat.reviewCount);
      const accuracyPct = Math.round(accuracy * 100);
      const missRate = 1 - accuracy;

      const lapsesWeight = stat.lapses * 40;
      const missRateWeight = missRate * 35;
      const lowEaseWeight = Math.max(0, 2.5 - stat.easeFactor) * 30;
      const lowIntervalWeight =
        stat.intervalDays <= 1 ? 12 : stat.intervalDays <= 3 ? 6 : 0;
      const dueMs = Date.parse(stat.nextReviewIso);
      const overdueBonus = Number.isFinite(dueMs) && dueMs <= nowMs ? 10 : 0;

      const struggleScore = Number(
        (
          lapsesWeight +
          missRateWeight +
          lowEaseWeight +
          lowIntervalWeight +
          overdueBonus
        ).toFixed(2)
      );

      let reason = 'Reinforcement review';
      if (stat.lapses > 0) {
        reason = `${stat.lapses} lapse${stat.lapses === 1 ? '' : 's'} · ${accuracyPct}% accuracy`;
      } else if (accuracyPct < 80) {
        reason = `${accuracyPct}% recall accuracy`;
      } else if (stat.easeFactor < 2.3) {
        reason = `Low ease (${stat.easeFactor.toFixed(2)})`;
      } else if (overdueBonus > 0) {
        reason = 'Due for review';
      }

      return {
        card,
        struggleScore,
        lapses: stat.lapses,
        accuracyPct,
        reason,
        hasSrsHistory: true,
        originalIndex,
      };
    }
  );

  scored.sort((a, b) => {
    if (b.struggleScore !== a.struggleScore) {
      return b.struggleScore - a.struggleScore;
    }
    return a.originalIndex - b.originalIndex;
  });

  const items = scored
    .slice(0, Math.max(1, Math.min(limit, deck.length)))
    .map(({ originalIndex: _idx, ...item }) => item);

  const struggledCount = items.filter(
    (item) => item.hasSrsHistory && (item.lapses > 0 || (item.accuracyPct ?? 100) < 85 || item.struggleScore >= 12)
  ).length;

  return { items, struggledCount };
}
