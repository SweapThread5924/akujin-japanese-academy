import type { JlptLevel } from './srsEngine';
import type { GrammarPointItem, KanjiCatalogItem, VocabLexiconItem } from '../data/jlptTypes';

export interface JoyoKanjiEntry extends KanjiCatalogItem {
  grade?: number;
  freq?: number;
}

export const SYLLABUS_TOTALS: Record<
  JlptLevel,
  { addedVocab: number; cumulativeVocab: number; levelKanji: number; cumulativeKanji: number }
> = {
  N5: { addedVocab: 800, cumulativeVocab: 800, levelKanji: 104, cumulativeKanji: 104 },
  N4: { addedVocab: 700, cumulativeVocab: 1500, levelKanji: 144, cumulativeKanji: 248 },
  N3: { addedVocab: 2250, cumulativeVocab: 3750, levelKanji: 365, cumulativeKanji: 613 },
  N2: { addedVocab: 2250, cumulativeVocab: 6000, levelKanji: 367, cumulativeKanji: 980 },
  N1: { addedVocab: 4000, cumulativeVocab: 10000, levelKanji: 1156, cumulativeKanji: 2136 },
};

let joyoKanjiCache: JoyoKanjiEntry[] | null = null;
const vocabCache = new Map<JlptLevel, VocabLexiconItem[]>();
let grammarCache: Record<JlptLevel, GrammarPointItem[]> | null = null;

export async function loadJoyoKanji2136(): Promise<JoyoKanjiEntry[]> {
  if (joyoKanjiCache) return joyoKanjiCache;
  const res = await fetch('/data/joyo-kanji-2136.json');
  if (!res.ok) throw new Error('Failed to load 2,136 Joyo Kanji dataset');
  const data = (await res.json()) as JoyoKanjiEntry[];
  joyoKanjiCache = data;
  return data;
}

export async function loadLevelVocab(level: JlptLevel): Promise<VocabLexiconItem[]> {
  const cached = vocabCache.get(level);
  if (cached) return cached;
  const res = await fetch(`/data/jlpt-vocab-${level.toLowerCase()}.json`);
  if (!res.ok) throw new Error(`Failed to load JLPT ${level} vocabulary`);
  const data = (await res.json()) as VocabLexiconItem[];
  vocabCache.set(level, data);
  return data;
}

export async function loadAllGrammarMap(): Promise<Record<JlptLevel, GrammarPointItem[]>> {
  if (grammarCache) return grammarCache;
  const res = await fetch('/data/jlpt-grammar-all.json');
  if (!res.ok) throw new Error('Failed to load complete JLPT grammar catalog');
  const data = (await res.json()) as Record<JlptLevel, GrammarPointItem[]>;
  grammarCache = data;
  return data;
}
