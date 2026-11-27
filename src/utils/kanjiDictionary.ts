import type { JlptLevel } from './srsEngine';
import type { JoyoKanjiEntry } from './datasetLoader';
import { kanaToRomaji } from './joyoProgress';

export type DictionarySortBy = 'frequency' | 'strokes-asc' | 'strokes-desc' | 'jlpt';

export interface KanjiDictionaryFilter {
  readingQuery: string;
  strokeCount: number | 'ALL';
  radical: string | 'ALL';
  level: JlptLevel | 'ALL';
  sortBy: DictionarySortBy;
}

export interface RadicalFacet {
  name: string;
  count: number;
}

export interface StrokeFacet {
  strokes: number;
  count: number;
}

export interface DictionaryFacets {
  radicals: RadicalFacet[];
  strokes: StrokeFacet[];
}

export const DEFAULT_DICTIONARY_FILTER: KanjiDictionaryFilter = {
  readingQuery: '',
  strokeCount: 'ALL',
  radical: 'ALL',
  level: 'ALL',
  sortBy: 'frequency',
};

const JLPT_ORDER: Record<JlptLevel, number> = {
  N5: 0,
  N4: 1,
  N3: 2,
  N2: 3,
  N1: 4,
};

/**
 * Converts Katakana characters (ァ-ヶ) into Hiragana so searches in either
 * script match Japanese Kanji On'yomi & Kun'yomi seamlessly.
 */
export function normalizeReadingToHiragana(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += input[i];
    }
  }
  return out;
}

interface ParsedReadingVariant {
  plain: string;
  stem: string;
  romaji: string;
  stemRomaji: string;
}

function extractReadingVariants(rawReading: string): ParsedReadingVariant[] {
  const trimmed = rawReading.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return [];

  const tokens = trimmed
    .split(/[・、,/／\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== '—' && part !== '-');

  return tokens.map((token) => {
    const hira = normalizeReadingToHiragana(token).toLowerCase();
    const stemRaw = hira.split('.')[0] ?? hira;
    const plain = hira.replace(/[().\-・\s]/g, '');
    const stem = stemRaw.replace(/[().\-・\s]/g, '');
    return {
      plain,
      stem,
      romaji: kanaToRomaji(plain).toLowerCase(),
      stemRomaji: kanaToRomaji(stem).toLowerCase(),
    };
  });
}

/**
 * Extracts distinct radical and stroke-count facets (with item counts)
 * across the loaded 2,136 Joyo Kanji catalog.
 */
export function extractDictionaryFacets(
  entries: ReadonlyArray<JoyoKanjiEntry>
): DictionaryFacets {
  const radicalCounts = new Map<string, number>();
  const strokeCounts = new Map<number, number>();

  for (const entry of entries) {
    const rad = entry.radical?.trim();
    if (rad) {
      radicalCounts.set(rad, (radicalCounts.get(rad) ?? 0) + 1);
    }
    if (typeof entry.strokes === 'number' && entry.strokes > 0) {
      strokeCounts.set(entry.strokes, (strokeCounts.get(entry.strokes) ?? 0) + 1);
    }
  }

  const radicals: RadicalFacet[] = Array.from(radicalCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const strokes: StrokeFacet[] = Array.from(strokeCounts.entries())
    .map(([strokes, count]) => ({ strokes, count }))
    .sort((a, b) => a.strokes - b.strokes);

  return { radicals, strokes };
}

function scoreEntryAgainstQuery(entry: JoyoKanjiEntry, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 1;

  const qHira = normalizeReadingToHiragana(q);
  const qPlain = qHira.replace(/[().\-・\s]/g, '');
  const qAlnum = q.replace(/[().\-・\s]/g, '');

  if (entry.kanji === rawQuery.trim()) return 120;
  if (entry.kanji.includes(rawQuery.trim())) return 105;

  const variants = [
    ...extractReadingVariants(entry.onyomi),
    ...extractReadingVariants(entry.kunyomi),
  ];

  let bestScore = 0;

  for (const v of variants) {
    if (
      (qPlain && (v.plain === qPlain || v.stem === qPlain)) ||
      (qAlnum && (v.romaji === qAlnum || v.stemRomaji === qAlnum))
    ) {
      bestScore = Math.max(bestScore, 100);
    } else if (
      (qPlain && (v.plain.startsWith(qPlain) || v.stem.startsWith(qPlain))) ||
      (qAlnum && (v.romaji.startsWith(qAlnum) || v.stemRomaji.startsWith(qAlnum)))
    ) {
      bestScore = Math.max(bestScore, 85);
    } else if (
      (qPlain && v.plain.includes(qPlain)) ||
      (qAlnum && v.romaji.includes(qAlnum))
    ) {
      bestScore = Math.max(bestScore, 65);
    }
  }

  // Also check meaning, sampleWord, and sampleReading (+ romaji)
  const meaningLower = entry.meaning.toLowerCase();
  if (meaningLower === q) {
    bestScore = Math.max(bestScore, 80);
  } else if (meaningLower.startsWith(q)) {
    bestScore = Math.max(bestScore, 70);
  } else if (meaningLower.includes(q)) {
    bestScore = Math.max(bestScore, 55);
  }

  const sampleReadingHira = normalizeReadingToHiragana(entry.sampleReading || '').toLowerCase();
  const sampleReadingRomaji = kanaToRomaji(sampleReadingHira).toLowerCase();
  if (
    (entry.sampleWord && entry.sampleWord.toLowerCase().includes(q)) ||
    (qPlain && sampleReadingHira.includes(qPlain)) ||
    (qAlnum && sampleReadingRomaji.includes(qAlnum)) ||
    (entry.sampleMeaning && entry.sampleMeaning.toLowerCase().includes(q))
  ) {
    bestScore = Math.max(bestScore, 45);
  }

  return bestScore;
}

function compareBySortMode(
  a: JoyoKanjiEntry,
  b: JoyoKanjiEntry,
  sortBy: DictionarySortBy
): number {
  const freqA = a.freq ?? 99999;
  const freqB = b.freq ?? 99999;

  switch (sortBy) {
    case 'strokes-asc':
      return a.strokes !== b.strokes ? a.strokes - b.strokes : freqA - freqB;
    case 'strokes-desc':
      return a.strokes !== b.strokes ? b.strokes - a.strokes : freqA - freqB;
    case 'jlpt':
      return JLPT_ORDER[a.level] !== JLPT_ORDER[b.level]
        ? JLPT_ORDER[a.level] - JLPT_ORDER[b.level]
        : freqA - freqB;
    case 'frequency':
    default:
      return freqA !== freqB ? freqA - freqB : a.strokes - b.strokes;
  }
}

/**
 * Filters and deterministically sorts all 2,136 Joyo Kanji by reading
 * (Hiragana, Katakana, Romaji, meaning, or character), exact stroke count,
 * radical name, and JLPT level.
 */
export function filterKanjiDictionary(
  entries: ReadonlyArray<JoyoKanjiEntry>,
  filter: KanjiDictionaryFilter
): JoyoKanjiEntry[] {
  const normalizedRadical =
    filter.radical === 'ALL' ? null : filter.radical.trim().toLowerCase();
  const targetStroke = filter.strokeCount === 'ALL' ? null : filter.strokeCount;
  const hasQuery = filter.readingQuery.trim().length > 0;

  const scored: Array<{ entry: JoyoKanjiEntry; score: number }> = [];

  for (const entry of entries) {
    if (filter.level !== 'ALL' && entry.level !== filter.level) continue;
    if (targetStroke !== null && entry.strokes !== targetStroke) continue;
    if (
      normalizedRadical !== null &&
      entry.radical.trim().toLowerCase() !== normalizedRadical
    ) {
      continue;
    }

    const score = hasQuery ? scoreEntryAgainstQuery(entry, filter.readingQuery) : 1;
    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => {
    if (hasQuery && b.score !== a.score) {
      return b.score - a.score;
    }
    return compareBySortMode(a.entry, b.entry, filter.sortBy);
  });

  return scored.map((item) => item.entry);
}

export function hasActiveDictionaryFilters(filter: KanjiDictionaryFilter): boolean {
  return (
    filter.readingQuery.trim().length > 0 ||
    filter.strokeCount !== 'ALL' ||
    filter.radical !== 'ALL' ||
    filter.level !== 'ALL'
  );
}

export function paginateDictionary<T>(
  items: ReadonlyArray<T>,
  page: number,
  pageSize: number
): {
  items: T[];
  safePage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
} {
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * safeSize;
  const slice = items.slice(start, start + safeSize);

  return {
    items: slice,
    safePage,
    totalPages,
    startItem: items.length === 0 ? 0 : start + 1,
    endItem: start + slice.length,
  };
}
