import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Ear,
  Eraser,
  FileText,
  Languages,
  Mic,
  PenTool,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Timer,
  Volume2,
} from 'lucide-react';
import { getJlptLevelPack } from '../data/jlptUpperData';
import type { GrammarPointItem, VocabLexiconItem } from '../data/jlptTypes';
import {
  loadAllGrammarMap,
  loadLevelVocab,
  SYLLABUS_TOTALS,
} from '../utils/datasetLoader';
import type { JlptLevel } from '../utils/srsEngine';
import { speakJapanese } from '../utils/speechAndPwa';
import { playQuizFeedbackSound } from '../utils/soundEffects';
import {
  calculateReadingCpm,
  classifyReadingPace,
  countJapaneseReadingCharacters,
  formatDurationMmSs,
  JLPT_TARGET_CPM,
  type ReadingSpeedRecord,
} from '../utils/readingSpeed';

export type JlptSkillTab =
  | 'vocab'
  | 'grammar'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'speaking';

interface JlptSkillLabsPanelProps {
  selectedLevel: JlptLevel;
  showRomaji: boolean;
  soundEnabled: boolean;
  masteredItemIds: string[];
  onMasterItem: (itemId: string, xp: number) => void;
  onRecordQuizAnswer: (isCorrect: boolean, xpEarned: number) => void;
  onRecordReadingSpeed?: (record: ReadingSpeedRecord) => void;
  onPracticeSpeakingPhrase?: (phrase: string, reading: string, romaji: string) => void;
}

const VOCAB_PAGE_SIZE = 24;

export const JlptSkillLabsPanel: React.FC<JlptSkillLabsPanelProps> = ({
  selectedLevel,
  showRomaji,
  soundEnabled,
  masteredItemIds,
  onMasterItem,
  onRecordQuizAnswer,
  onRecordReadingSpeed,
  onPracticeSpeakingPhrase,
}) => {
  const [skillTab, setSkillTab] = useState<JlptSkillTab>('vocab');
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCategory, setVocabCategory] = useState<string>('ALL');
  const [vocabPage, setVocabPage] = useState(0);

  // Reading state & CPM speed stopwatch
  const [readingIdx, setReadingIdx] = useState(0);
  const [showReadingTranslation, setShowReadingTranslation] = useState(false);
  const [readingChoice, setReadingChoice] = useState<string | null>(null);
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const [readingTimerStatus, setReadingTimerStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [readingElapsedMs, setReadingElapsedMs] = useState(0);
  const [readingSpeedResult, setReadingSpeedResult] = useState<ReadingSpeedRecord | null>(null);
  const readingStartRef = useRef<number | null>(null);
  const readingRecordedRunRef = useRef(false);

  // Listening state
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningRate, setListeningRate] = useState<0.75 | 1 | 1.15>(1);
  const [showListeningScript, setShowListeningScript] = useState(false);
  const [listeningChoice, setListeningChoice] = useState<string | null>(null);
  const [listeningSubmitted, setListeningSubmitted] = useState(false);

  // Writing state
  const [writingIdx, setWritingIdx] = useState(0);
  const [writingDraft, setWritingDraft] = useState('');
  const [showWritingModel, setShowWritingModel] = useState(false);
  const writeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingWriteRef = useRef(false);

  const pack = useMemo(() => getJlptLevelPack(selectedLevel), [selectedLevel]);
  const [loadedVocab, setLoadedVocab] = useState<VocabLexiconItem[] | null>(null);
  const [loadedGrammarMap, setLoadedGrammarMap] = useState<Record<JlptLevel, GrammarPointItem[]> | null>(null);
  const [grammarSearch, setGrammarSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoadedVocab(null);
    loadLevelVocab(selectedLevel)
      .then((rows) => {
        if (active && Array.isArray(rows) && rows.length > 0) {
          setLoadedVocab(rows);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [selectedLevel]);

  useEffect(() => {
    let active = true;
    loadAllGrammarMap()
      .then((map) => {
        if (active && map) {
          setLoadedGrammarMap(map);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeVocabList = loadedVocab ?? pack.vocab;
  const activeGrammarList = useMemo(() => {
    const extra = loadedGrammarMap?.[selectedLevel] ?? [];
    if (extra.length === 0) return pack.grammar;
    const seen = new Set(pack.grammar.map((g) => g.pattern));
    const merged = [...pack.grammar];
    for (const item of extra) {
      if (!seen.has(item.pattern)) {
        seen.add(item.pattern);
        merged.push(item);
      }
    }
    return merged;
  }, [loadedGrammarMap, selectedLevel, pack.grammar]);

  const filteredGrammar = useMemo(() => {
    const q = grammarSearch.trim().toLowerCase();
    if (!q) return activeGrammarList;
    return activeGrammarList.filter(
      (g) =>
        g.pattern.toLowerCase().includes(q) ||
        g.romaji.toLowerCase().includes(q) ||
        g.meaning.toLowerCase().includes(q) ||
        g.structure.toLowerCase().includes(q)
    );
  }, [activeGrammarList, grammarSearch]);

  const categories = useMemo(() => {
    const set = new Set(activeVocabList.map((v) => v.category));
    return ['ALL', ...Array.from(set)];
  }, [activeVocabList]);

  const filteredVocab = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    return activeVocabList.filter((item) => {
      const catOk = vocabCategory === 'ALL' || item.category === vocabCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        item.word.toLowerCase().includes(q) ||
        item.reading.toLowerCase().includes(q) ||
        item.romaji.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q)
      );
    });
  }, [activeVocabList, vocabSearch, vocabCategory]);

  const totalVocabPages = Math.max(1, Math.ceil(filteredVocab.length / VOCAB_PAGE_SIZE));
  const safeVocabPage = Math.min(vocabPage, totalVocabPages - 1);
  const pagedVocab = filteredVocab.slice(
    safeVocabPage * VOCAB_PAGE_SIZE,
    (safeVocabPage + 1) * VOCAB_PAGE_SIZE
  );

  const activeReading = pack.reading[readingIdx % pack.reading.length] ?? pack.reading[0];
  const activeListening = pack.listening[listeningIdx % pack.listening.length] ?? pack.listening[0];
  const activeWriting = pack.writing[writingIdx % pack.writing.length] ?? pack.writing[0];

  const activeReadingCharCount = useMemo(
    () => (activeReading ? countJapaneseReadingCharacters(activeReading.japaneseText) : 0),
    [activeReading]
  );
  const activeReadingTargetCpm = JLPT_TARGET_CPM[selectedLevel];

  useEffect(() => {
    if (readingTimerStatus !== 'running') return;
    const interval = window.setInterval(() => {
      if (readingStartRef.current !== null) {
        setReadingElapsedMs(Date.now() - readingStartRef.current);
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [readingTimerStatus]);

  const resetReadingTimer = () => {
    readingStartRef.current = null;
    readingRecordedRunRef.current = false;
    setReadingTimerStatus('idle');
    setReadingElapsedMs(0);
    setReadingSpeedResult(null);
  };

  const handleStartReadingTimer = () => {
    readingStartRef.current = Date.now();
    readingRecordedRunRef.current = false;
    setReadingSpeedResult(null);
    setReadingElapsedMs(0);
    setReadingTimerStatus('running');
  };

  const handleCompleteReadingTimer = (comprehensionCorrect?: boolean) => {
    if (!activeReading || readingTimerStatus !== 'running') return;
    const elapsedMs =
      readingStartRef.current !== null
        ? Math.max(1000, Date.now() - readingStartRef.current)
        : Math.max(1000, readingElapsedMs);
    const { elapsedSeconds, cpm } = calculateReadingCpm(activeReadingCharCount, elapsedMs);
    const record: ReadingSpeedRecord = {
      id: `rs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      passageId: activeReading.id,
      passageTitle: activeReading.title,
      level: selectedLevel,
      charCount: activeReadingCharCount,
      elapsedSeconds,
      cpm,
      ...(typeof comprehensionCorrect === 'boolean' ? { comprehensionCorrect } : {}),
      recordedAt: new Date().toISOString(),
    };
    setReadingElapsedMs(elapsedMs);
    setReadingTimerStatus('completed');
    setReadingSpeedResult(record);
    if (!readingRecordedRunRef.current) {
      readingRecordedRunRef.current = true;
      onRecordReadingSpeed?.(record);
    }
  };

  const getWriteCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = writeCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const clearWriteCanvas = () => {
    const canvas = writeCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    setVocabCategory('ALL');
    setVocabSearch('');
    setVocabPage(0);
    setReadingIdx(0);
    setShowReadingTranslation(false);
    setReadingChoice(null);
    setReadingSubmitted(false);
    resetReadingTimer();
    setListeningIdx(0);
    setShowListeningScript(false);
    setListeningChoice(null);
    setListeningSubmitted(false);
    setWritingIdx(0);
    setWritingDraft('');
    setShowWritingModel(false);
    clearWriteCanvas();
  }, [selectedLevel]);

  const levelMeta = SYLLABUS_TOTALS[selectedLevel];

  const SKILL_TABS: { id: JlptSkillTab; label: string; jp: string; icon: React.ReactNode; count: number }[] = [
    { id: 'vocab', label: 'Vocabulary', jp: '語彙', icon: <Languages className="w-3.5 h-3.5" />, count: activeVocabList.length },
    { id: 'grammar', label: 'Grammar', jp: '文法', icon: <BookOpen className="w-3.5 h-3.5" />, count: activeGrammarList.length },
    { id: 'reading', label: 'Reading', jp: '読解', icon: <FileText className="w-3.5 h-3.5" />, count: pack.reading.length },
    { id: 'writing', label: 'Writing', jp: '筆記', icon: <PenTool className="w-3.5 h-3.5" />, count: pack.writing.length },
    { id: 'listening', label: 'Listening', jp: '聴解', icon: <Ear className="w-3.5 h-3.5" />, count: pack.listening.length },
    { id: 'speaking', label: 'Speaking', jp: '会話', icon: <Mic className="w-3.5 h-3.5" />, count: pack.speaking.length },
  ];

  return (
    <section
      aria-label={`JLPT ${selectedLevel} Separate Skill Sections`}
      data-testid="jlpt-skill-labs"
      data-vocab-count={activeVocabList.length}
      data-grammar-count={activeGrammarList.length}
      className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 space-y-6"
    >
      {/* Header + 6 Skill Selector Tabs */}
      <div className="flex flex-col gap-3.5 border-b border-stone-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              JLPT {selectedLevel} Exam-Style Complete Syllabus · {levelMeta.levelKanji.toLocaleString()} Level Kanji ({levelMeta.cumulativeKanji.toLocaleString()} cum.) · {activeVocabList.length.toLocaleString()} Level Words ({levelMeta.cumulativeVocab.toLocaleString()} cum.)
            </p>
            <h2 className="text-xl font-bold text-[#141413] dark:text-white mt-0.5">
              All-in-One JLPT {selectedLevel} Skill Labs
            </h2>
          </div>
        </div>

        <div role="tablist" aria-label="JLPT skill tabs" className="flex flex-wrap gap-2">
          {SKILL_TABS.map((tab) => {
            const active = skillTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                data-testid={`skill-tab-${tab.id}`}
                type="button"
                onClick={() => setSkillTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D92525] text-white'
                    : 'bg-stone-100 dark:bg-[#1E2029] text-stone-700 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`font-mono-nums text-[10px] ${active ? 'text-rose-100' : 'text-stone-400'}`}>
                  {tab.jp} ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. VOCABULARY SECTION */}
      {skillTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={vocabSearch}
                onChange={(e) => {
                  setVocabSearch(e.target.value);
                  setVocabPage(0);
                }}
                placeholder={`Search ${selectedLevel} Japanese, kana, romaji, or English...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setVocabCategory(cat);
                    setVocabPage(0);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    vocabCategory === cat
                      ? 'bg-[#141413] dark:bg-white text-white dark:text-[#141413]'
                      : 'bg-stone-100 dark:bg-[#1E2029] text-stone-600 dark:text-zinc-300'
                  }`}
                >
                  {cat === 'ALL' ? `All (${activeVocabList.length.toLocaleString()})` : cat}
                </button>
              ))}
            </div>
          </div>

          {pagedVocab.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#101218] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[#141413] dark:text-white">
                No {selectedLevel} vocabulary matches your search
              </p>
              <button
                type="button"
                onClick={() => {
                  setVocabSearch('');
                  setVocabCategory('ALL');
                  setVocabPage(0);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pagedVocab.map((item) => {
                const mastered = masteredItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-stone-50/70 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono-nums text-stone-500 dark:text-zinc-400">
                          {item.pos} · {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakJapanese(item.word)}
                          aria-label={`Pronounce ${item.word}`}
                          className="p-1 rounded-md hover:bg-white dark:hover:bg-zinc-800 text-[#D92525] cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="font-jp text-lg font-bold text-[#141413] dark:text-white">
                        {item.word}
                      </p>
                      <p className="text-xs font-jp text-stone-600 dark:text-zinc-300">
                        {item.reading} {showRomaji ? `· ${item.romaji}` : ''}
                      </p>
                      <p className="text-xs font-semibold text-[#D92525] dark:text-rose-400">
                        {item.english}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={mastered}
                      onClick={() => onMasterItem(item.id, 5)}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                        mastered
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#141413] dark:text-zinc-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {mastered ? 'Learned' : 'Mark Learned (+5 XP)'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-xs text-stone-500 dark:text-zinc-400">
            <span className="font-mono-nums">
              Showing {pagedVocab.length} of {filteredVocab.length} matching {selectedLevel} words (Page {safeVocabPage + 1} / {totalVocabPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeVocabPage === 0}
                onClick={() => setVocabPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={safeVocabPage >= totalVocabPages - 1}
                onClick={() => setVocabPage((p) => Math.min(totalVocabPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GRAMMAR SECTION */}
      {skillTab === 'grammar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Showing {filteredGrammar.length} JLPT {selectedLevel} grammar structures
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={grammarSearch}
                onChange={(e) => setGrammarSearch(e.target.value)}
                placeholder={`Search ${selectedLevel} grammar pattern or meaning...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredGrammar.map((g) => {
            const mastered = masteredItemIds.includes(g.id);
            return (
              <div
                key={g.id}
                className="rounded-xl bg-stone-50/70 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-jp text-base font-bold text-[#141413] dark:text-white">
                        {g.pattern}
                      </h3>
                      {showRomaji && (
                        <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                          {g.romaji}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => speakJapanese(g.exampleJp)}
                      aria-label={`Hear example for ${g.pattern}`}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 text-[#D92525] cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#D92525] dark:text-rose-400">
                    {g.meaning}
                  </p>
                  <p className="text-xs font-mono-nums bg-white dark:bg-[#101218] px-2.5 py-1.5 rounded-lg border border-stone-200/70 dark:border-zinc-800 text-stone-700 dark:text-zinc-300">
                    {g.structure}
                  </p>
                  <div className="text-xs space-y-1">
                    <p className="font-jp font-semibold text-[#141413] dark:text-white">
                      例: {g.exampleJp}
                    </p>
                    <p className="text-stone-600 dark:text-zinc-300">{g.exampleEn}</p>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg">
                    Exam Tip: {g.examTip}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={mastered}
                  onClick={() => onMasterItem(g.id, 10)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    mastered
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-[#141413] dark:bg-white text-white dark:text-[#141413]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {mastered ? 'Grammar Mastered' : 'Mark Mastered (+10 XP)'}
                </button>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* 3. READING COMPREHENSION (読解) */}
      {skillTab === 'reading' && activeReading && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono-nums text-[#D92525] dark:text-rose-400 font-semibold">
                  {activeReading.styleTag}
                </span>
                <h3 className="text-base font-bold text-[#141413] dark:text-white">
                  {activeReading.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakJapanese(activeReading.japaneseText, 0.9)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 text-xs font-medium text-[#141413] dark:text-white cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                  Read Aloud
                </button>
                <button
                  type="button"
                  onClick={() => setShowReadingTranslation((v) => !v)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-600 dark:text-zinc-300 cursor-pointer"
                >
                  {showReadingTranslation ? 'Hide English' : 'Show Translation'}
                </button>
              </div>
            </div>

            {/* Reading Speed (CPM) Stopwatch Bar */}
            <div
              data-testid="reading-speed-bar"
              className="rounded-xl bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-800 p-3.5 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4 text-[#D92525] dark:text-rose-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#141413] dark:text-white">
                    Reading Speed Meter (CPM)
                  </p>
                  <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                    {activeReadingCharCount} Japanese chars · {selectedLevel} Target {activeReadingTargetCpm} CPM
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {readingTimerStatus === 'idle' && (
                  <button
                    type="button"
                    data-testid="reading-start-timer-btn"
                    onClick={handleStartReadingTimer}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    Start Reading Timer
                  </button>
                )}

                {readingTimerStatus === 'running' && (
                  <>
                    <span
                      data-testid="reading-live-timer"
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/35 font-mono-nums text-xs font-bold text-[#D92525] dark:text-rose-300"
                    >
                      {formatDurationMmSs(Math.floor(readingElapsedMs / 1000))}
                    </span>
                    <button
                      type="button"
                      data-testid="reading-finish-timer-btn"
                      onClick={() => handleCompleteReadingTimer()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Square className="w-3 h-3" aria-hidden="true" />
                      Finish &amp; Measure CPM
                    </button>
                    <button
                      type="button"
                      onClick={resetReadingTimer}
                      aria-label="Reset reading timer"
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:text-[#141413] dark:hover:text-white cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </>
                )}

                {readingTimerStatus === 'completed' && (
                  <button
                    type="button"
                    data-testid="reading-retake-btn"
                    onClick={resetReadingTimer}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#1B1E28] text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                    Retake Timing
                  </button>
                )}
              </div>
            </div>

            {readingSpeedResult && (() => {
              const pace = classifyReadingPace(readingSpeedResult.cpm, readingSpeedResult.level);
              return (
                <div
                  data-testid="reading-speed-result"
                  className="rounded-xl bg-white dark:bg-[#101218] border border-emerald-500/35 p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono-nums text-[#141413] dark:text-white">
                        {readingSpeedResult.cpm} CPM
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${pace.badgeColorClass}`}
                      >
                        {pace.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                      Read {readingSpeedResult.charCount} chars in {readingSpeedResult.elapsedSeconds}s · Saved to your Progress Report (+10 XP)
                    </p>
                  </div>
                  <span className="text-xs font-mono-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {pace.deltaFromTarget >= 0
                      ? `+${pace.deltaFromTarget} vs ${readingSpeedResult.level} target`
                      : `${pace.deltaFromTarget} vs ${readingSpeedResult.level} target`}
                  </span>
                </div>
              );
            })()}

            <p className="font-jp text-base sm:text-lg leading-loose text-[#141413] dark:text-white bg-white dark:bg-[#101218] p-4 rounded-xl border border-stone-200/70 dark:border-zinc-800">
              {activeReading.japaneseText}
            </p>
            <p className="font-jp text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
              Reading guide: {activeReading.readingText}
            </p>
            {showReadingTranslation && (
              <p className="text-xs text-stone-700 dark:text-zinc-200 bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200/60 dark:border-rose-900">
                {activeReading.englishTranslation}
              </p>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-sm font-bold text-[#141413] dark:text-white">
              Exam Question: {activeReading.question}
            </h4>
            <div className="space-y-2">
              {activeReading.options.map((opt) => {
                const selected = readingChoice === opt.id;
                const correct = opt.id === activeReading.correctOptionId;
                let style =
                  'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] hover:border-[#D92525]';
                if (readingSubmitted) {
                  if (correct) style = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
                  else if (selected) style = 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525]';
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={readingSubmitted}
                    onClick={() => {
                      setReadingChoice(opt.id);
                      setReadingSubmitted(true);
                      const ok = opt.id === activeReading.correctOptionId;
                      if (readingTimerStatus === 'running') {
                        handleCompleteReadingTimer(ok);
                      }
                      playQuizFeedbackSound(soundEnabled, ok);
                      onRecordQuizAnswer(ok, ok ? 25 : 0);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-jp font-semibold transition-colors cursor-pointer ${style}`}
                  >
                    {opt.id.toUpperCase()}. {opt.label}
                  </button>
                );
              })}
            </div>

            {readingSubmitted && (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 space-y-2">
                <p className="text-xs text-stone-700 dark:text-zinc-200 leading-relaxed">
                  {activeReading.explanation}
                </p>
                {pack.reading.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setReadingIdx((i) => i + 1);
                      setReadingChoice(null);
                      setReadingSubmitted(false);
                      setShowReadingTranslation(false);
                      resetReadingTimer();
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#D92525] text-white text-xs font-semibold cursor-pointer"
                  >
                    Next Reading Passage →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. WRITING SECTION (作文・筆記) */}
      {skillTab === 'writing' && activeWriting && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono-nums text-[#D92525] dark:text-rose-400 font-semibold">
                JLPT {selectedLevel} Guided Writing Task
              </span>
              <h3 className="text-base font-bold text-[#141413] dark:text-white">
                {activeWriting.taskTitle}
              </h3>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activeWriting.promptEn}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-stone-500 dark:text-zinc-400 mr-1">
                Insert target kanji:
              </span>
              {activeWriting.targetCharacters.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setWritingDraft((d) => `${d}${ch}`)}
                  className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] font-jp text-sm font-bold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
                >
                  {ch}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={writingDraft}
              onChange={(e) => setWritingDraft(e.target.value)}
              placeholder="Write your Japanese response here (e.g. 私は毎日日本語を勉強します。)"
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] font-jp text-sm text-[#141413] dark:text-white"
            />

            <ul className="space-y-1 text-xs text-stone-600 dark:text-zinc-300">
              {activeWriting.grammarChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowWritingModel(true);
                  onMasterItem(`write-${activeWriting.id}`, 15);
                }}
                className="px-4 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
              >
                Check Against Model Answer (+15 XP)
              </button>
              {pack.writing.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setWritingIdx((i) => i + 1);
                    setWritingDraft('');
                    setShowWritingModel(false);
                    clearWriteCanvas();
                  }}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Next Task
                </button>
              )}
            </div>

            {showWritingModel && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Model JLPT {selectedLevel} Response
                  </span>
                  <button
                    type="button"
                    onClick={() => speakJapanese(activeWriting.modelJapanese)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Play Audio
                  </button>
                </div>
                <p className="font-jp text-sm font-bold text-[#141413] dark:text-white">
                  {activeWriting.modelJapanese}
                </p>
                {showRomaji && (
                  <p className="text-xs font-mono-nums text-stone-600 dark:text-zinc-300">
                    {activeWriting.modelRomaji}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#141413] dark:text-white">
                Handwriting Scratchpad (Practice Target Characters)
              </span>
              <button
                type="button"
                onClick={clearWriteCanvas}
                className="inline-flex items-center gap-1 text-stone-500 hover:text-[#D92525] cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
            <div className="relative rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#FCFBF8] dark:bg-[#101218] overflow-hidden h-[220px]">
              <canvas
                ref={writeCanvasRef}
                width={520}
                height={220}
                onPointerDown={(e) => {
                  const canvas = writeCanvasRef.current;
                  const ctx = canvas?.getContext('2d');
                  if (!canvas || !ctx) return;
                  isDrawingWriteRef.current = true;
                  canvas.setPointerCapture(e.pointerId);
                  const { x, y } = getWriteCanvasPos(e);
                  ctx.strokeStyle = '#D92525';
                  ctx.lineWidth = 5;
                  ctx.lineCap = 'round';
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                }}
                onPointerMove={(e) => {
                  if (!isDrawingWriteRef.current) return;
                  const ctx = writeCanvasRef.current?.getContext('2d');
                  if (!ctx) return;
                  const { x, y } = getWriteCanvasPos(e);
                  ctx.lineTo(x, y);
                  ctx.stroke();
                }}
                onPointerUp={() => {
                  isDrawingWriteRef.current = false;
                }}
                onPointerLeave={() => {
                  isDrawingWriteRef.current = false;
                }}
                className="h-full w-full touch-none cursor-crosshair"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. LISTENING SECTION (聴解) */}
      {skillTab === 'listening' && activeListening && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono-nums font-semibold text-[#D92525] dark:text-rose-400">
                {activeListening.sectionType}
              </span>
              <div className="flex items-center gap-1">
                {([0.75, 1, 1.15] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setListeningRate(r)}
                    className={`px-2 py-0.5 rounded font-mono-nums cursor-pointer ${
                      listeningRate === r
                        ? 'bg-[#D92525] text-white font-bold'
                        : 'bg-white dark:bg-[#101218] text-stone-600 dark:text-zinc-300'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            <h3 className="text-base font-bold text-[#141413] dark:text-white">
              {activeListening.title}
            </h3>
            <p className="text-xs text-stone-600 dark:text-zinc-300">
              Situation: {activeListening.contextHint}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => speakJapanese(activeListening.audioScriptJp, listeningRate)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                Play Listening Audio ({listeningRate}x)
              </button>
              <button
                type="button"
                onClick={() => setShowListeningScript((s) => !s)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white cursor-pointer"
              >
                {showListeningScript ? 'Hide Transcript' : 'Reveal Script'}
              </button>
            </div>

            {showListeningScript && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <p className="font-jp font-semibold text-[#141413] dark:text-white leading-relaxed">
                  {activeListening.audioScriptJp}
                </p>
                {showRomaji && (
                  <p className="font-mono-nums text-stone-500 dark:text-zinc-400">
                    {activeListening.audioScriptRomaji}
                  </p>
                )}
                <p className="text-stone-600 dark:text-zinc-300 pt-1 border-t border-stone-200/70 dark:border-zinc-800">
                  {activeListening.englishSummary}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h4 className="text-sm font-bold text-[#141413] dark:text-white">
              Question: {activeListening.question}
            </h4>
            <div className="space-y-2">
              {activeListening.options.map((opt) => {
                const selected = listeningChoice === opt.id;
                const correct = opt.id === activeListening.correctOptionId;
                let style =
                  'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] hover:border-[#D92525]';
                if (listeningSubmitted) {
                  if (correct) style = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
                  else if (selected) style = 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525]';
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={listeningSubmitted}
                    onClick={() => {
                      setListeningChoice(opt.id);
                      setListeningSubmitted(true);
                      const ok = opt.id === activeListening.correctOptionId;
                      playQuizFeedbackSound(soundEnabled, ok);
                      onRecordQuizAnswer(ok, ok ? 25 : 0);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-jp font-semibold cursor-pointer ${style}`}
                  >
                    {opt.id.toUpperCase()}. {opt.label}
                  </button>
                );
              })}
            </div>

            {listeningSubmitted && (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 space-y-2">
                <p className="text-xs text-stone-700 dark:text-zinc-200">
                  {activeListening.explanation}
                </p>
                {pack.listening.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setListeningIdx((i) => i + 1);
                      setListeningChoice(null);
                      setListeningSubmitted(false);
                      setShowListeningScript(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#D92525] text-white text-xs font-semibold cursor-pointer"
                  >
                    Next Listening Track →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SPEAKING SECTION (会話・発音) */}
      {skillTab === 'speaking' && (
        <div className="grid md:grid-cols-2 gap-4">
          {pack.speaking.map((sp) => {
            const mastered = masteredItemIds.includes(`speak-${sp.id}`);
            return (
              <div
                key={sp.id}
                className="rounded-xl bg-stone-50/70 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#D92525] dark:text-rose-400">
                      {sp.situation}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakJapanese(sp.targetJapanese, 0.9)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 text-xs font-medium text-[#141413] dark:text-white cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                      Shadow Audio
                    </button>
                  </div>
                  <p className="font-jp text-lg font-bold text-[#141413] dark:text-white">
                    {sp.targetJapanese}
                  </p>
                  <p className="text-xs font-jp text-stone-500 dark:text-zinc-400">
                    {sp.targetReading} {showRomaji ? `· ${sp.targetRomaji}` : ''}
                  </p>
                  <p className="text-xs font-semibold text-stone-700 dark:text-zinc-200">
                    “{sp.englishMeaning}”
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Coaching: {sp.coachingTip}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onPracticeSpeakingPhrase && (
                    <button
                      type="button"
                      onClick={() =>
                        onPracticeSpeakingPhrase(sp.targetJapanese, sp.targetReading, sp.targetRomaji)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      Score in Speech Coach
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={mastered}
                    onClick={() => onMasterItem(`speak-${sp.id}`, 10)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      mastered
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'border border-stone-300 dark:border-zinc-700 text-[#141413] dark:text-zinc-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {mastered ? 'Practiced' : 'Complete (+10 XP)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
