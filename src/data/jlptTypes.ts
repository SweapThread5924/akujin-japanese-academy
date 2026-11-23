import type { JlptLevel } from '../utils/srsEngine';

export interface VocabLexiconItem {
  id: string;
  level: JlptLevel;
  word: string;
  reading: string;
  romaji: string;
  english: string;
  pos: string;
  category: string;
  exampleJp?: string;
  exampleEn?: string;
}

export interface KanjiCatalogItem {
  id: string;
  level: JlptLevel;
  kanji: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  strokes: number;
  radical: string;
  sampleWord: string;
  sampleReading: string;
  sampleMeaning: string;
}

export interface GrammarPointItem {
  id: string;
  level: JlptLevel;
  pattern: string;
  romaji: string;
  meaning: string;
  structure: string;
  examTip: string;
  exampleJp: string;
  exampleReading: string;
  exampleEn: string;
}

export interface ReadingPassageItem {
  id: string;
  level: JlptLevel;
  title: string;
  styleTag: string;
  japaneseText: string;
  readingText: string;
  romajiText: string;
  englishTranslation: string;
  question: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface ListeningDrillItem {
  id: string;
  level: JlptLevel;
  sectionType: 'Task Comprehension' | 'Point Comprehension' | 'Quick Response' | 'Integrated Listening';
  title: string;
  contextHint: string;
  audioScriptJp: string;
  audioScriptReading: string;
  audioScriptRomaji: string;
  englishSummary: string;
  question: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface WritingPromptItem {
  id: string;
  level: JlptLevel;
  taskTitle: string;
  promptEn: string;
  targetCharacters: string[];
  modelJapanese: string;
  modelReading: string;
  modelRomaji: string;
  grammarChecklist: string[];
}

export interface SpeakingPromptItem {
  id: string;
  level: JlptLevel;
  situation: string;
  targetJapanese: string;
  targetReading: string;
  targetRomaji: string;
  englishMeaning: string;
  coachingTip: string;
}

export type VocabTuple = [
  word: string,
  reading: string,
  romaji: string,
  english: string,
  pos: string,
  category: string,
];

export type KanjiTuple = [
  kanji: string,
  meaning: string,
  onyomi: string,
  kunyomi: string,
  strokes: number,
  radical: string,
  sampleWord: string,
  sampleReading: string,
  sampleMeaning: string,
];

export function expandVocabTuples(level: JlptLevel, rows: VocabTuple[]): VocabLexiconItem[] {
  return rows.map(([word, reading, romaji, english, pos, category], index) => ({
    id: `${level.toLowerCase()}-v-${index + 1}`,
    level,
    word,
    reading,
    romaji,
    english,
    pos,
    category,
  }));
}

export function expandKanjiTuples(level: JlptLevel, rows: KanjiTuple[]): KanjiCatalogItem[] {
  return rows.map(([kanji, meaning, onyomi, kunyomi, strokes, radical, sampleWord, sampleReading, sampleMeaning], index) => ({
    id: `${level.toLowerCase()}-k-${index + 1}`,
    level,
    kanji,
    meaning,
    onyomi,
    kunyomi,
    strokes,
    radical,
    sampleWord,
    sampleReading,
    sampleMeaning,
  }));
}
