import React, { useEffect, useMemo, useState } from 'react';
import {
  RotateCw,
  Play,
  Volume2,
  BarChart3,
  Search,
  CheckCircle2,
  Target,
  Flame,
  Sparkles,
  Award,
  X,
  ArrowRight,
  Crosshair,
  RefreshCw,
} from 'lucide-react';
import { KANJI_DECK, type KanjiCard } from '../data/curriculumData';
import { getKanjiExampleSentences } from '../data/kanjiExamples';
import { ALL_JLPT_KANJI_CATALOG } from '../data/jlptUpperData';
import { loadJoyoKanji2136, type JoyoKanjiEntry } from '../utils/datasetLoader';
import {
  buildFocusModeDeck,
  buildKanjiPronunciationScript,
  computePerLevelKanjiBreakdown,
  computeTargetLevelJoyoProgress,
  formatKanaReadingsWithRomaji,
  formatKanjiCardReadingsWithRomaji,
  MASTERY_STREAK_TARGET,
  searchKanjiDeck,
  updateMasteryStreak,
  type FocusModeCardItem,
} from '../utils/joyoProgress';
import { buildFullJoyoKanjiDeck } from '../utils/joyoDeckBuilder';
import {
  buildHeatmapDays,
  computeRetentionAndStats,
  type JlptLevel,
  type SrsCardProgress,
  type SrsRating,
} from '../utils/srsEngine';
import {
  isAllJlptLevelsVisible,
  normalizeVisibleJlptLevels,
  resolveActiveVisibleLevel,
} from '../utils/jlptVisibility';
import { speakJapanese } from '../utils/speechAndPwa';
import { playCardFlipSound, playSrsRatingSound } from '../utils/soundEffects';
import { JapaneseText } from './JapaneseText';
import { KanjiDrawingBoard, type KanjiPracticeMode } from './KanjiDrawingBoard';
import { RadicalTree } from './RadicalTree';
import { AudioSpeedControl } from './AudioSpeedControl';

interface KanjiSrsSectionProps {
  targetLevel: JlptLevel;
  visibleLevels?: JlptLevel[];
  onResetVisibleLevels?: () => void;
  srsProgress: Record<string, SrsCardProgress>;
  heatmapHistory: Record<string, number>;
  onReviewKanji: (kanjiId: string, rating: SrsRating) => void;
  onGainXp: (amount: number) => void;
  showFurigana: boolean;
  showRomaji: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  initialPracticeMode?: KanjiPracticeMode;
  masteredItemIds: string[];
  onMasterItem: (itemId: string, xp: number) => void;
  audioSpeed: number;
  onChangeAudioSpeed: (nextSpeed: number) => void;
}

export const KanjiSrsSection: React.FC<KanjiSrsSectionProps> = ({
  targetLevel,
  visibleLevels,
  onResetVisibleLevels,
  srsProgress,
  heatmapHistory,
  onReviewKanji,
  onGainXp,
  showFurigana,
  showRomaji,
  soundEnabled,
  darkMode,
  initialPracticeMode,
  masteredItemIds,
  onMasterItem,
  audioSpeed,
  onChangeAudioSpeed,
}) => {
  const activeVisibleLevels = useMemo(
    () => normalizeVisibleJlptLevels(visibleLevels),
    [visibleLevels]
  );
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);

  const [levelFilter, setLevelFilter] = useState<'ALL' | JlptLevel>('ALL');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [strokeReplayKey, setStrokeReplayKey] = useState(0);
  const [activeStrokeStep, setActiveStrokeStep] = useState<number | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const [fullJoyoCatalog, setFullJoyoCatalog] = useState<JoyoKanjiEntry[]>(ALL_JLPT_KANJI_CATALOG);
  const [gradeFilter, setGradeFilter] = useState<'ALL' | number>('ALL');
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [srsSearchQuery, setSrsSearchQuery] = useState('');
  const [studySessionNotice, setStudySessionNotice] = useState<string | null>(null);
  const [isSpeakingReadings, setIsSpeakingReadings] = useState(false);
  const [speakingSentenceId, setSpeakingSentenceId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusQueue, setFocusQueue] = useState<FocusModeCardItem<KanjiCard>[]>([]);
  const [focusReviewedIds, setFocusReviewedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!showCelebration) return;
    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 3800);
    return () => window.clearTimeout(timer);
  }, [showCelebration, celebrationKey]);

  useEffect(() => {
    if (!studySessionNotice) return;
    const timer = window.setTimeout(() => {
      setStudySessionNotice(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [studySessionNotice]);

  useEffect(() => {
    let mounted = true;
    loadJoyoKanji2136()
      .then((rows) => {
        if (mounted && Array.isArray(rows) && rows.length > 0) {
          setFullJoyoCatalog(rows);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (levelFilter !== 'ALL' && !activeVisibleLevels.includes(levelFilter)) {
      setLevelFilter('ALL');
      setCardIdx(0);
      setCatalogPage(0);
    }
  }, [activeVisibleLevels, levelFilter]);

  const visibleJoyoCatalog = useMemo(
    () => fullJoyoCatalog.filter((item) => activeVisibleLevels.includes(item.level)),
    [fullJoyoCatalog, activeVisibleLevels]
  );

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return visibleJoyoCatalog.filter((item) => {
      if (levelFilter !== 'ALL' && item.level !== levelFilter) return false;
      if (gradeFilter !== 'ALL' && item.grade !== gradeFilter) return false;
      if (!q) return true;
      return (
        item.kanji.includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.onyomi.toLowerCase().includes(q) ||
        item.kunyomi.toLowerCase().includes(q) ||
        item.sampleWord.toLowerCase().includes(q) ||
        item.sampleMeaning.toLowerCase().includes(q)
      );
    });
  }, [visibleJoyoCatalog, levelFilter, gradeFilter, catalogSearch]);

  const CATALOG_PAGE_SIZE = 24;
  const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalog.length / CATALOG_PAGE_SIZE));
  const safeCatalogPage = Math.min(catalogPage, totalCatalogPages - 1);
  const pagedCatalog = filteredCatalog.slice(
    safeCatalogPage * CATALOG_PAGE_SIZE,
    (safeCatalogPage + 1) * CATALOG_PAGE_SIZE
  );

  const fullSrsDeck = useMemo(
    () => buildFullJoyoKanjiDeck(KANJI_DECK, fullJoyoCatalog),
    [fullJoyoCatalog]
  );

  const visibleSrsDeck = useMemo(
    () => fullSrsDeck.filter((k) => activeVisibleLevels.includes(k.level)),
    [fullSrsDeck, activeVisibleLevels]
  );

  const filteredDeck = useMemo(() => {
    if (levelFilter === 'ALL') return visibleSrsDeck;
    return visibleSrsDeck.filter((k) => k.level === levelFilter);
  }, [visibleSrsDeck, levelFilter]);

  const activeDeck = useMemo(() => {
    if (focusMode && focusQueue.length > 0) {
      return focusQueue.map((item) => item.card);
    }
    return filteredDeck;
  }, [focusMode, focusQueue, filteredDeck]);

  const safeDeckLength = Math.max(1, activeDeck.length);
  const activeCardIndex = cardIdx % safeDeckLength;
  const currentKanji = activeDeck[activeCardIndex] ?? visibleSrsDeck[0] ?? KANJI_DECK[0];
  const currentFocusItem = focusMode
    ? focusQueue[cardIdx % Math.max(1, focusQueue.length)] ?? null
    : null;
  const cardStat = srsProgress[currentKanji.id];
  const currentExampleSentences = useMemo(
    () => getKanjiExampleSentences(currentKanji),
    [currentKanji]
  );

  const analytics = useMemo(
    () => computeRetentionAndStats(srsProgress, visibleSrsDeck.length),
    [srsProgress, visibleSrsDeck.length]
  );

  const effectiveTargetLevel = resolveActiveVisibleLevel(targetLevel, activeVisibleLevels);

  const targetJoyoProgress = useMemo(
    () =>
      computeTargetLevelJoyoProgress({
        targetLevel: effectiveTargetLevel,
        joyoCatalog: fullJoyoCatalog,
        masteredItemIds,
        srsProgress,
        srsDeck: KANJI_DECK,
      }),
    [effectiveTargetLevel, fullJoyoCatalog, masteredItemIds, srsProgress]
  );

  const perLevelBreakdown = useMemo(
    () =>
      computePerLevelKanjiBreakdown({
        joyoCatalog: fullJoyoCatalog,
        masteredItemIds,
        srsProgress,
        srsDeck: KANJI_DECK,
      }).filter((row) => activeVisibleLevels.includes(row.level)),
    [fullJoyoCatalog, masteredItemIds, srsProgress, activeVisibleLevels]
  );

  const totalBreakdownSummary = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let total = 0;
    for (const row of perLevelBreakdown) {
      mastered += row.masteredCount;
      learning += row.learningCount;
      total += row.totalCount;
    }
    return { mastered, learning, total };
  }, [perLevelBreakdown]);

  const heatmapDays = useMemo(
    () => buildHeatmapDays(heatmapHistory, 56),
    [heatmapHistory]
  );

  const handleRate = (rating: SrsRating) => {
    playSrsRatingSound(soundEnabled, rating >= 3);
    const streakResult = updateMasteryStreak(perfectStreak, rating);
    setPerfectStreak(streakResult.streak);
    if (streakResult.justTriggeredCelebration) {
      setCelebrationKey((k) => k + 1);
      setShowCelebration(true);
    }
    if (focusMode) {
      setFocusReviewedIds((prev) =>
        prev.includes(currentKanji.id) ? prev : [...prev, currentKanji.id]
      );
    }
    onReviewKanji(currentKanji.id, rating);
    setFlipped(false);
    setActiveStrokeStep(null);
    setCardIdx((prev) => (prev + 1) % activeDeck.length);
  };

  const handleToggleFocusMode = () => {
    if (focusMode) {
      setFocusMode(false);
      setCardIdx(0);
      setFlipped(false);
      setActiveStrokeStep(null);
      return;
    }
    const built = buildFocusModeDeck(visibleSrsDeck, srsProgress, 10);
    setFocusQueue(built.items);
    setFocusReviewedIds([]);
    setFocusMode(true);
    setCardIdx(0);
    setFlipped(false);
    setActiveStrokeStep(null);
  };

  const handleRefreshFocusQueue = () => {
    const built = buildFocusModeDeck(visibleSrsDeck, srsProgress, 10);
    setFocusQueue(built.items);
    setFocusReviewedIds([]);
    setCardIdx(0);
    setFlipped(false);
    setActiveStrokeStep(null);
  };

  const srsSearchMatches = useMemo(
    () => searchKanjiDeck(visibleSrsDeck, srsSearchQuery, 12),
    [visibleSrsDeck, srsSearchQuery]
  );

  const handleStartStudyForKanji = (kanjiIdOrChar: string) => {
    const targetCard = visibleSrsDeck.find(
      (k) => k.id === kanjiIdOrChar || k.kanji === kanjiIdOrChar
    );
    if (!targetCard) return;

    if (focusMode) {
      setFocusMode(false);
    }
    const needsFilterReset = levelFilter !== 'ALL' && levelFilter !== targetCard.level;
    const targetDeck = needsFilterReset
      ? visibleSrsDeck
      : levelFilter === 'ALL'
      ? visibleSrsDeck
      : visibleSrsDeck.filter((k) => k.level === levelFilter);

    const nextIdx = targetDeck.findIndex((k) => k.id === targetCard.id);
    if (needsFilterReset) {
      setLevelFilter('ALL');
    }
    setCardIdx(nextIdx >= 0 ? nextIdx : 0);
    setFlipped(false);
    setActiveStrokeStep(null);
    setSrsSearchQuery('');
    setStudySessionNotice(
      `Loaded in Flashcards & Canvas: ${targetCard.kanji} (${targetCard.meaning} · JLPT ${targetCard.level})`
    );
  };

  const handlePlayStrokes = () => {
    setStrokeReplayKey((k) => k + 1);
    setActiveStrokeStep(null);
  };

  const handlePlayKanjiPronunciation = () => {
    const script = buildKanjiPronunciationScript(
      currentKanji.onyomi.map((r) => r.kana),
      currentKanji.kunyomi.map((r) => r.kana),
      currentKanji.kanji
    );
    setIsSpeakingReadings(true);
    speakJapanese(script, audioSpeed, () => setIsSpeakingReadings(false));
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-10">
      {/* Header + JLPT Deck Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            漢字道場 · Spaced Repetition &amp; Radical Breakdown
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Kanji SRS Studio &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Radical Trees.
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {!allVisible && onResetVisibleLevels && (
            <button
              type="button"
              data-testid="kanji-filter-notice"
              onClick={onResetVisibleLevels}
              className="px-3 py-2 rounded-xl border border-[#D92525]/35 bg-rose-50/70 dark:bg-rose-950/30 text-xs font-semibold text-[#D92525] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
            >
              Filtered: {activeVisibleLevels.join(', ')} · Show All
            </button>
          )}
          <button
            type="button"
            data-testid="focus-mode-toggle"
            aria-pressed={focusMode}
            onClick={handleToggleFocusMode}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              focusMode
                ? 'bg-[#D92525] border-[#D92525] text-white shadow-xs'
                : 'bg-white dark:bg-[#16181F] border-stone-200 dark:border-zinc-800 text-[#141413] dark:text-zinc-200 hover:border-[#D92525]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
            {focusMode ? 'Exit Focus Mode' : 'Focus Mode (Top 10)'}
          </button>

          <div
            role="tablist"
            aria-label="Filter Kanji deck by JLPT level"
            data-testid="kanji-jlpt-tablist"
            className="inline-flex max-w-full overflow-x-auto items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800"
          >
            {(['ALL', ...activeVisibleLevels] as const).map((lvl) => (
              <button
                key={lvl}
                role="tab"
                aria-selected={!focusMode && levelFilter === lvl}
                type="button"
                onClick={() => {
                  setFocusMode(false);
                  setLevelFilter(lvl);
                  setCardIdx(0);
                  setCatalogPage(0);
                  setActiveStrokeStep(null);
                  setFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  !focusMode && levelFilter === lvl
                    ? 'bg-[#D92525] text-white'
                    : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? (allVisible ? 'All Levels' : 'All Visible') : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AudioSpeedControl
        speed={audioSpeed}
        onChange={onChangeAudioSpeed}
        contextLabel="Applies to Kanji readings, example sentences, Radical Tree & Jōyō directory"
      />

      {/* Target JLPT Level Jōyō Kanji Progress Bar */}
      <section
        aria-label={`JLPT ${targetJoyoProgress.targetLevel} Joyo Kanji Progress`}
        data-testid="target-joyo-progress"
        data-target-level={targetJoyoProgress.targetLevel}
        data-completed-count={targetJoyoProgress.completedCount}
        data-total-count={targetJoyoProgress.totalCount}
        className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[#D92525] dark:text-rose-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#D92525] dark:text-rose-400">
                Your Current Target Track · JLPT {targetJoyoProgress.targetLevel}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-[#141413] dark:text-white">
                JLPT {targetJoyoProgress.targetLevel} Jōyō Kanji Mastery
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                data-testid="target-joyo-progress-pct"
                className="text-lg sm:text-xl font-bold font-mono-nums leading-none text-[#141413] dark:text-white"
              >
                {targetJoyoProgress.formattedPercentage}%
              </p>
              <p
                data-testid="target-joyo-progress-counts"
                className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400 mt-1"
              >
                {targetJoyoProgress.completedCount.toLocaleString()} /{' '}
                {targetJoyoProgress.totalCount.toLocaleString()} Kanji Completed
              </p>
            </div>
            {activeVisibleLevels.includes(effectiveTargetLevel) &&
              levelFilter !== effectiveTargetLevel && (
                <button
                  type="button"
                  onClick={() => {
                    setLevelFilter(effectiveTargetLevel);
                    setCardIdx(0);
                    setCatalogPage(0);
                    setActiveStrokeStep(null);
                    setFlipped(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] hover:border-[#D92525] text-xs font-semibold text-[#141413] dark:text-zinc-200 whitespace-nowrap cursor-pointer transition-colors"
                >
                  Focus {effectiveTargetLevel}
                </button>
              )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={`JLPT ${targetJoyoProgress.targetLevel} Joyo Kanji completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(targetJoyoProgress.percentage)}
          className="h-3 w-full rounded-full bg-stone-200/80 dark:bg-zinc-800 overflow-hidden"
        >
          <div
            data-testid="target-joyo-progress-fill"
            className={`h-full rounded-full transition-all duration-500 ${
              targetJoyoProgress.percentage >= 100
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-[#D92525]'
            }`}
            style={{ width: `${targetJoyoProgress.percentage}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
          <span>
            Tracks both SRS flashcard reviews and kanji marked learned in the 2,136 Jōyō Directory.
          </span>
          <span className="font-mono-nums font-medium text-stone-600 dark:text-zinc-300">
            {targetJoyoProgress.remainingCount === 0
              ? `All JLPT ${targetJoyoProgress.targetLevel} Jōyō Kanji mastered!`
              : `${targetJoyoProgress.remainingCount.toLocaleString()} remaining for JLPT ${targetJoyoProgress.targetLevel}`}
          </span>
        </div>
      </section>

      {/* Quick Kanji Study Search Bar */}
      <section
        aria-label="Quick Kanji Study Search"
        data-testid="srs-kanji-search-section"
        className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              data-testid="srs-kanji-search-input"
              aria-label="Search Kanji by reading, meaning, or character to start a study session"
              value={srsSearchQuery}
              onChange={(e) => setSrsSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && srsSearchMatches.length > 0) {
                  e.preventDefault();
                  handleStartStudyForKanji(srsSearchMatches[0].id);
                } else if (e.key === 'Escape') {
                  setSrsSearchQuery('');
                }
              }}
              placeholder="Find Kanji to study by reading, meaning, or character (e.g. 休, rest, やすむ, eki, bright)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs sm:text-sm text-[#141413] dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#D92525]"
            />
            {srsSearchQuery.trim().length > 0 && (
              <button
                type="button"
                aria-label="Clear Kanji study search"
                onClick={() => setSrsSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-[#141413] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {studySessionNotice && (
            <div
              data-testid="srs-study-session-notice"
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{studySessionNotice}</span>
            </div>
          )}
        </div>

        {srsSearchQuery.trim().length > 0 && (
          <div
            data-testid="srs-kanji-search-results"
            className="pt-1 border-t border-stone-100 dark:border-zinc-800/80"
          >
            {srsSearchMatches.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-stone-500 dark:text-zinc-400">
                <span>
                  No SRS flashcard matches “{srsSearchQuery.trim()}”. Try searching the full 2,136 Jōyō Directory below.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch(srsSearchQuery.trim());
                    setCatalogPage(0);
                    setSrsSearchQuery('');
                    document
                      .querySelector('[data-testid="joyo-kanji-directory"]')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-3 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:border-[#D92525] cursor-pointer"
                >
                  Search 2,136 Jōyō Directory →
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                {srsSearchMatches.map((card) => {
                  const readingsPreview = formatKanjiCardReadingsWithRomaji([
                    ...card.onyomi.slice(0, 1),
                    ...card.kunyomi.slice(0, 1),
                  ]);

                  return (
                    <button
                      key={card.id}
                      type="button"
                      data-testid={`srs-search-result-${card.id}`}
                      onClick={() => handleStartStudyForKanji(card.id)}
                      className="akujin-card-lift akujin-btn-press group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50/80 dark:bg-[#1B1E28] hover:border-[#D92525] dark:hover:border-rose-500 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-10 w-10 rounded-lg bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 font-jp text-2xl font-bold text-[#141413] dark:text-white flex items-center justify-center shrink-0">
                          {card.kanji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#141413] dark:text-white truncate">
                              {card.meaning}
                            </span>
                            <span className="text-[10px] font-mono-nums font-semibold text-[#D92525] dark:text-rose-400 shrink-0">
                              {card.level}
                            </span>
                          </div>
                          <p className="text-[11px] font-jp text-stone-500 dark:text-zinc-400 truncate">
                            {readingsPreview || `${card.strokes}画`}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#D92525] shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Active Focus Mode Session Panel */}
      {focusMode && focusQueue.length > 0 && (
        <section
          aria-label="Focus Mode Customized Study Session"
          data-testid="focus-mode-banner"
          className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-[#D92525]/35 p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-xl bg-[#D92525] text-white flex items-center justify-center shrink-0">
                <Crosshair className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-[#141413] dark:text-white">
                    Focus Mode · Top {focusQueue.length} Most Struggled Kanji
                  </h2>
                  {currentFocusItem && (
                    <span
                      data-testid="focus-mode-reason"
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-[#101218] border border-[#D92525]/30 text-[11px] font-semibold text-[#D92525] dark:text-rose-400"
                    >
                      {currentFocusItem.reason}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 dark:text-zinc-300">
                  Ranked by SRS lapses, recall accuracy, and SM-2 ease factor ·{' '}
                  <span className="font-mono-nums font-semibold">
                    {focusReviewedIds.length} / {focusQueue.length} reviewed this session
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="focus-mode-refresh"
                onClick={handleRefreshFocusQueue}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#101218] text-xs font-semibold text-[#141413] dark:text-zinc-200 hover:border-[#D92525] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Re-rank Queue
              </button>
              <button
                type="button"
                onClick={handleToggleFocusMode}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#101218] text-xs font-semibold text-stone-600 dark:text-zinc-300 hover:text-[#D92525] cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>

          <div
            data-testid="focus-mode-queue"
            className="flex flex-wrap items-center gap-1.5"
          >
            {focusQueue.map((item, idx) => {
              const isCurrent = idx === cardIdx % focusQueue.length;
              const isDone = focusReviewedIds.includes(item.card.id);
              return (
                <button
                  key={item.card.id}
                  type="button"
                  data-testid={`focus-queue-item-${idx}`}
                  data-kanji-id={item.card.id}
                  title={`${item.card.kanji} (${item.card.meaning}) — ${item.reason}`}
                  onClick={() => {
                    setCardIdx(idx);
                    setFlipped(false);
                    setActiveStrokeStep(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-[#D92525] border-[#D92525] text-white'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/35 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-[#101218] border-stone-200 dark:border-zinc-700 text-[#141413] dark:text-zinc-200 hover:border-[#D92525]'
                  }`}
                >
                  <span className="font-mono-nums text-[10px] opacity-75">#{idx + 1}</span>
                  <span className="font-jp text-sm font-bold">{item.card.kanji}</span>
                  {item.lapses > 0 && (
                    <span
                      className={`text-[10px] font-mono-nums ${
                        isCurrent ? 'text-rose-100' : 'text-[#D92525] dark:text-rose-400'
                      }`}
                    >
                      {item.lapses}L
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Split: SRS Flip Card & Radical Breakdown Visual Tree */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: SRS Flip Deck */}
        <div className="lg:col-span-7 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
            <span data-testid="flashcard-deck-counter" className="font-mono-nums">
              {focusMode ? 'Focus ' : ''}Card {activeDeck.length > 0 ? (activeCardIndex + 1).toLocaleString() : 0} of {activeDeck.length.toLocaleString()} ·{' '}
              {currentKanji.level} · {currentKanji.strokes} Strokes
            </span>

            <div className="flex items-center gap-3">
              {/* Mastery Streak Badge (5 consecutive rating-5 reviews) */}
              <div
                key={celebrationKey}
                data-testid="mastery-streak-badge"
                data-streak={perfectStreak}
                data-unlocked={perfectStreak >= MASTERY_STREAK_TARGET ? 'true' : 'false'}
                title="Achieve 5 consecutive Easy (rating 5) reviews to unlock the Mastery Streak badge"
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                  showCelebration ? 'animate-mastery-pop' : ''
                } ${
                  perfectStreak >= MASTERY_STREAK_TARGET
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400/70 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 shadow-xs'
                    : 'bg-stone-50 dark:bg-[#16181F] border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-300'
                }`}
              >
                {perfectStreak >= MASTERY_STREAK_TARGET ? (
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                ) : (
                  <Flame
                    className={`w-3.5 h-3.5 shrink-0 ${
                      perfectStreak > 0 ? 'text-[#D92525] dark:text-rose-400' : 'text-stone-400 dark:text-zinc-500'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="whitespace-nowrap">
                  {perfectStreak >= MASTERY_STREAK_TARGET
                    ? `Mastery Streak · ${perfectStreak}×`
                    : 'Mastery Streak'}
                </span>
                <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: MASTERY_STREAK_TARGET }).map((_, idx) => {
                    const filled = idx < Math.min(perfectStreak, MASTERY_STREAK_TARGET);
                    return (
                      <span
                        key={idx}
                        className={`h-1.5 w-2.5 rounded-xs transition-colors ${
                          filled
                            ? perfectStreak >= MASTERY_STREAK_TARGET
                              ? 'bg-amber-500'
                              : 'bg-[#D92525]'
                            : 'bg-stone-200 dark:bg-zinc-700'
                        }`}
                      />
                    );
                  })}
                </span>
                <span className="font-mono-nums text-[10px] opacity-80">
                  {Math.min(perfectStreak, MASTERY_STREAK_TARGET)}/{MASTERY_STREAK_TARGET}
                </span>
              </div>

              <span className="font-mono-nums hidden sm:inline">
                {cardStat
                  ? `Interval: ${cardStat.intervalDays}d · Reps: ${cardStat.repetitions}`
                  : 'New Card'}
              </span>
            </div>
          </div>

          {/* Celebratory Mastery Streak Banner */}
          {showCelebration && (
            <div
              key={`celebrate-${celebrationKey}`}
              data-testid="mastery-streak-celebration"
              role="status"
              aria-live="polite"
              className="animate-mastery-banner relative overflow-hidden rounded-xl border border-amber-400/70 dark:border-amber-500/50 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 dark:from-amber-950/50 dark:via-rose-950/40 dark:to-amber-950/50 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-hanko-stamp">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Mastery Streak Unlocked! ({perfectStreak} Consecutive Perfect Reviews)
                  </p>
                  <p className="text-[11px] text-amber-800/85 dark:text-amber-300/85">
                    Flawless Kanji recall — keep your momentum going!
                  </p>
                </div>
              </div>
              <span
                aria-hidden="true"
                className="font-jp text-lg font-bold text-[#D92525] dark:text-amber-300 shrink-0 select-none animate-hanko-stamp"
              >
                極
              </span>
            </div>
          )}

          <div className="perspective-1000">
            <div
              className={`grid grid-cols-1 w-full preserve-3d transition-transform duration-500 ${
                flipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front: Kanji Recall */}
              <div
                aria-hidden={flipped}
                className={`akujin-card-lift [grid-area:1/1] backface-hidden rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-between min-h-[420px] text-center ${
                  flipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                  <span>JLPT {currentKanji.level}</span>
                  <span className="font-mono-nums">{currentKanji.strokes} Strokes</span>
                </div>

                <div className="my-auto space-y-4">
                  <div className="font-jp text-[7rem] leading-none font-bold text-[#141413] dark:text-white select-none">
                    {currentKanji.kanji}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-zinc-400">
                    Recall On’yomi, Kun’yomi, stroke order, and radicals before flipping.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    data-testid="play-pronunciation-front"
                    onClick={handlePlayKanjiPronunciation}
                    aria-label={`Play pronunciation for ${currentKanji.kanji} On'yomi and Kun'yomi readings`}
                    className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                      isSpeakingReadings
                        ? 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525] dark:text-rose-300'
                        : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#1B1E28] hover:border-[#D92525] text-[#141413] dark:text-zinc-100'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 text-[#D92525] dark:text-rose-400" aria-hidden="true" />
                    {isSpeakingReadings ? 'Playing...' : 'Play Pronunciation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(true);
                      handlePlayStrokes();
                      playCardFlipSound(soundEnabled);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-4 h-4" aria-hidden="true" />
                    Reveal Stroke Order &amp; Readings
                  </button>
                </div>
              </div>

              {/* Back: Stroke Order + Readings + Example */}
              <div
                aria-hidden={!flipped}
                className={`[grid-area:1/1] backface-hidden rotate-y-180 rounded-2xl bg-white dark:bg-[#16181F] border border-[#D92525]/40 p-6 sm:p-8 flex flex-col justify-between min-h-[420px] ${
                  !flipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="grid sm:grid-cols-12 gap-6 items-center">
                  {/* Animated SVG Stroke Order Diagram */}
                  <div className="sm:col-span-5 flex flex-col items-center space-y-2.5">
                    <div className="relative h-44 w-44 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] p-2">
                      {/* Guide crosshair */}
                      <svg
                        viewBox="0 0 100 100"
                        className="h-full w-full"
                        aria-label={`Stroke order diagram for ${currentKanji.kanji}`}
                      >
                        <line
                          x1="50"
                          y1="0"
                          x2="50"
                          y2="100"
                          stroke="currentColor"
                          strokeDasharray="3 3"
                          className="text-stone-300 dark:text-zinc-700"
                          strokeWidth="0.8"
                        />
                        <line
                          x1="0"
                          y1="50"
                          x2="100"
                          y2="50"
                          stroke="currentColor"
                          strokeDasharray="3 3"
                          className="text-stone-300 dark:text-zinc-700"
                          strokeWidth="0.8"
                        />
                        {/* Faint Kanji backdrop */}
                        <text
                          x="50"
                          y="78"
                          textAnchor="middle"
                          className="font-jp fill-stone-200/80 dark:fill-zinc-800/90 text-[76px]"
                        >
                          {currentKanji.kanji}
                        </text>

                        {currentKanji.strokePaths.map((d, idx) => {
                          const highlighted =
                            activeStrokeStep === null || idx <= activeStrokeStep;
                          return (
                            <path
                              key={`${currentKanji.id}-${strokeReplayKey}-${idx}`}
                              d={d}
                              fill="none"
                              stroke={
                                activeStrokeStep === idx ? '#D92525' : 'currentColor'
                              }
                              strokeWidth="4.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`${
                                highlighted
                                  ? 'text-[#141413] dark:text-zinc-100 animate-kanji-stroke'
                                  : 'text-stone-300 dark:text-zinc-700 opacity-30'
                              }`}
                              style={{ animationDelay: `${idx * 160}ms` }}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePlayStrokes}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 text-xs font-medium text-[#141413] dark:text-zinc-200 hover:border-[#D92525] cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-[#D92525]" aria-hidden="true" />
                        Replay Strokes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveStrokeStep((prev) =>
                            prev === null
                              ? 0
                              : (prev + 1) % currentKanji.strokePaths.length
                          )
                        }
                        className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 text-xs font-mono-nums text-stone-600 dark:text-zinc-300 cursor-pointer"
                      >
                        Step {activeStrokeStep === null ? 'All' : activeStrokeStep + 1}
                      </button>
                    </div>
                  </div>

                  {/* Readings & Example */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-2xl font-bold text-[#141413] dark:text-white">
                        {currentKanji.meaning}
                      </h2>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          data-testid="play-pronunciation-back"
                          onClick={handlePlayKanjiPronunciation}
                          aria-label={`Play pronunciation for ${currentKanji.kanji} On'yomi and Kun'yomi readings`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            isSpeakingReadings
                              ? 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525] dark:text-rose-300'
                              : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#1B1E28] hover:border-[#D92525] text-[#141413] dark:text-zinc-100'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#D92525] dark:text-rose-400" aria-hidden="true" />
                          {isSpeakingReadings ? 'Playing...' : 'Play Pronunciation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFlipped(false);
                            playCardFlipSound(soundEnabled);
                          }}
                          className="text-xs font-medium text-stone-500 hover:text-[#D92525] cursor-pointer"
                        >
                          Flip Front
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                        <p className="text-stone-500 dark:text-zinc-400 font-semibold">
                          On’yomi (音読み)
                        </p>
                        <p
                          data-testid="kanji-onyomi-readings"
                          className="font-jp text-sm font-bold text-[#141413] dark:text-white mt-1"
                        >
                          {formatKanjiCardReadingsWithRomaji(currentKanji.onyomi)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                        <p className="text-stone-500 dark:text-zinc-400 font-semibold">
                          Kun’yomi (訓読み)
                        </p>
                        <p
                          data-testid="kanji-kunyomi-readings"
                          className="font-jp text-sm font-bold text-[#141413] dark:text-white mt-1"
                        >
                          {formatKanjiCardReadingsWithRomaji(currentKanji.kunyomi)}
                        </p>
                      </div>
                    </div>

                    <div
                      data-testid="kanji-example-sentences"
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#D92525] dark:text-rose-400">
                          Example Sentences ({currentExampleSentences.length} · JLPT {currentKanji.level} Vocab)
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentExampleSentences.map((sentence, idx) => {
                          const isPlaying = speakingSentenceId === sentence.id;
                          return (
                            <div
                              key={sentence.id}
                              data-testid={`kanji-example-sentence-${idx}`}
                              className="akujin-card-lift p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-1"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <JapaneseText
                                    segments={sentence.segments}
                                    plainText={sentence.plain}
                                    romaji={sentence.romaji}
                                    showFurigana={true}
                                    showRomaji={true}
                                    className="text-sm sm:text-[15px] font-bold text-[#141413] dark:text-white leading-relaxed"
                                  />
                                </div>
                                <button
                                  type="button"
                                  data-testid={`play-example-sentence-${idx}`}
                                  onClick={() => {
                                    setSpeakingSentenceId(sentence.id);
                                    speakJapanese(sentence.plain, audioSpeed, () =>
                                      setSpeakingSentenceId((prev) =>
                                        prev === sentence.id ? null : prev
                                      )
                                    );
                                  }}
                                  aria-label={`Play example sentence ${idx + 1} for ${currentKanji.kanji}`}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold shrink-0 cursor-pointer transition-colors ${
                                    isPlaying
                                      ? 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525] dark:text-rose-300'
                                      : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#101218] text-stone-600 dark:text-zinc-300 hover:border-[#D92525] hover:text-[#D92525]'
                                  }`}
                                >
                                  <Volume2 className="w-3 h-3" aria-hidden="true" />
                                  {isPlaying ? 'Playing...' : 'Listen'}
                                </button>
                              </div>
                              <p
                                data-testid={`kanji-example-english-${idx}`}
                                className="text-xs text-stone-600 dark:text-zinc-300"
                              >
                                {sentence.english}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SM-2 Rating Controls */}
                <div className="pt-4 mt-4 border-t border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-stone-500 dark:text-zinc-400">
                    Rate your recall to schedule SM-2 review:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRate(1)}
                      className="px-3.5 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      Again (1d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(3)}
                      className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Hard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(4)}
                      className="px-3.5 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                    >
                      Good (+20 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(5)}
                      className="px-3.5 py-2 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer"
                    >
                      Easy (+30 XP)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recursive SVG Radical Breakdown Visual Tree */}
        <RadicalTree kanji={currentKanji} darkMode={darkMode} audioSpeed={audioSpeed} />
      </div>

      {/* HTML5 Canvas Kanji Stroke-Order & Precision Trace Board */}
      <KanjiDrawingBoard
        kanji={currentKanji}
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        initialMode={initialPracticeMode}
        deckIndex={activeCardIndex}
        deckTotal={activeDeck.length}
        onGainXp={onGainXp}
        onPrevKanji={() => {
          setFlipped(false);
          setActiveStrokeStep(null);
          setCardIdx((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
        }}
        onNextKanji={() => {
          setFlipped(false);
          setActiveStrokeStep(null);
          setCardIdx((prev) => (prev + 1) % activeDeck.length);
        }}
      />

      {/* Progress Analytics & Daily Review Heatmap */}
      <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                Kanji Retention Analytics &amp; Daily Review Heatmap
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Real-time SM-2 memory stability across all {fullSrsDeck.length.toLocaleString()} Jōyō Kanji (JLPT N5–N1).
              </p>
            </div>
          </div>
        </div>

        {/* 4-column Analytics Strip */}
        <div data-reveal-stagger="true" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="akujin-card-lift p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Retention Rate</p>
            <p className="text-2xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {analytics.retentionRate}%
            </p>
          </div>
          <div className="akujin-card-lift p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Learned Kanji</p>
            <p className="text-2xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {analytics.learnedCount.toLocaleString()} / {fullSrsDeck.length.toLocaleString()}
            </p>
          </div>
          <div className="akujin-card-lift p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Total SRS Reviews</p>
            <p className="text-2xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {analytics.totalReviews}
            </p>
          </div>
          <div className="akujin-card-lift p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Deck Coverage</p>
            <p className="text-2xl font-bold font-mono-nums text-[#D92525] dark:text-rose-400 mt-1">
              {analytics.deckCoveragePct}%
            </p>
          </div>
        </div>

        {/* Per-Level JLPT Mastered vs. Learning Kanji Breakdown */}
        <div
          data-testid="jlpt-kanji-breakdown"
          className="rounded-xl bg-stone-50/80 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#141413] dark:text-white">
                JLPT Level Kanji Breakdown (Mastered vs. Learning)
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                Click any level row to filter the SRS deck &amp; Jōyō directory.{' '}
                <span className="font-mono-nums font-medium text-stone-700 dark:text-zinc-300">
                  {totalBreakdownSummary.mastered.toLocaleString()} mastered ·{' '}
                  {totalBreakdownSummary.learning.toLocaleString()} learning /{' '}
                  {totalBreakdownSummary.total.toLocaleString()} total
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-stone-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                Mastered
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 dark:bg-amber-400" />
                Learning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-stone-200 dark:bg-zinc-700" />
                Unseen
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {perLevelBreakdown.map((row) => {
              const isTarget = row.level === targetLevel;
              const isFiltered = levelFilter === row.level;
              return (
                <button
                  key={row.level}
                  type="button"
                  data-testid={`jlpt-breakdown-row-${row.level}`}
                  data-mastered={row.masteredCount}
                  data-learning={row.learningCount}
                  data-total={row.totalCount}
                  onClick={() => {
                    setLevelFilter(row.level);
                    setCardIdx(0);
                    setCatalogPage(0);
                    setFlipped(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors cursor-pointer ${
                    isFiltered
                      ? 'bg-white dark:bg-[#101218] border-[#D92525]/60'
                      : 'bg-white/75 dark:bg-[#141720] border-stone-200/70 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-9 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-xs font-bold font-mono-nums text-[#141413] dark:text-white">
                        {row.level}
                      </span>
                      {isTarget && (
                        <span className="text-[10px] font-semibold text-[#D92525] dark:text-rose-400">
                          Target
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono-nums">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {row.masteredCount.toLocaleString()} mastered
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        {row.learningCount.toLocaleString()} learning
                      </span>
                      <span className="text-stone-500 dark:text-zinc-400">
                        / {row.totalCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Dual-Segment Stacked Bar */}
                  <div
                    role="img"
                    aria-label={`JLPT ${row.level}: ${row.masteredCount} mastered, ${row.learningCount} learning out of ${row.totalCount} Kanji`}
                    className="h-2.5 w-full rounded-full bg-stone-200/90 dark:bg-zinc-800 overflow-hidden flex"
                  >
                    {row.masteredPct > 0 && (
                      <div
                        data-testid={`jlpt-breakdown-mastered-bar-${row.level}`}
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(row.masteredPct, 1.2)}%` }}
                      />
                    )}
                    {row.learningPct > 0 && (
                      <div
                        data-testid={`jlpt-breakdown-learning-bar-${row.level}`}
                        className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
                        style={{ width: `${Math.max(row.learningPct, 1.2)}%` }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 56-Day Review Heatmap */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
            <span>Past 8 Weeks Review Cadence</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="h-3 w-3 rounded-xs bg-stone-200 dark:bg-zinc-800" />
              <span className="h-3 w-3 rounded-xs bg-rose-200 dark:bg-rose-900" />
              <span className="h-3 w-3 rounded-xs bg-rose-400 dark:bg-rose-700" />
              <span className="h-3 w-3 rounded-xs bg-[#D92525]" />
              <span>More</span>
            </div>
          </div>

          <div
            data-testid="kanji-heatmap"
            className="grid grid-cols-14 sm:grid-cols-28 gap-1.5"
          >
            {heatmapDays.map((day) => {
              let colorClass = 'bg-stone-200/80 dark:bg-zinc-800';
              if (day.reviews >= 10) colorClass = 'bg-[#D92525]';
              else if (day.reviews >= 5) colorClass = 'bg-rose-400 dark:bg-rose-600';
              else if (day.reviews >= 1) colorClass = 'bg-rose-200 dark:bg-rose-900';

              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.reviews} reviews`}
                  className={`h-5 rounded-xs ${colorClass} transition-colors`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Complete 2,136 Joyo Kanji Reference Directory (JLPT N5–N1) */}
      <section
        data-testid="joyo-kanji-directory"
        data-total-joyo-count={fullJoyoCatalog.length}
        className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              常用漢字全集 ({visibleJoyoCatalog.length.toLocaleString()}字{allVisible ? '' : ' Shown'}) · Complete Official Jōyō Kanji {allVisible ? 'N5–N1' : activeVisibleLevels.join(' · ')} Index
            </p>
            <h2 className="text-lg font-bold text-[#141413] dark:text-white">
              Full Level Kanji Directory ({filteredCatalog.length.toLocaleString()} Kanji Shown)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Kanji by school grade"
              value={gradeFilter === 'ALL' ? 'ALL' : String(gradeFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setGradeFilter(v === 'ALL' ? 'ALL' : Number(v));
                setCatalogPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
            >
              <option value="ALL">All Grades (2,136)</option>
              <option value="1">Grade 1 (80)</option>
              <option value="2">Grade 2 (160)</option>
              <option value="3">Grade 3 (200)</option>
              <option value="4">Grade 4 (200)</option>
              <option value="5">Grade 5 (185)</option>
              <option value="6">Grade 6 (181)</option>
              <option value="8">Secondary / N2–N1 (1,130)</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setCatalogPage(0);
                }}
                placeholder="Search kanji, meaning, or reading..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
              />
            </div>
          </div>
        </div>

        {pagedCatalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#101218] p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#141413] dark:text-white">
              No Kanji match “{catalogSearch}”
            </p>
            <button
              type="button"
              onClick={() => {
                setCatalogSearch('');
                setCatalogPage(0);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div data-reveal-stagger="true" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pagedCatalog.map((item) => {
              const mastered = masteredItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="akujin-card-lift p-4 rounded-xl bg-stone-50/70 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 hover:border-[#D92525]/50 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono-nums font-bold text-[#D92525] dark:text-rose-400">
                        {item.level} · {item.strokes}画 · Radical {item.radical}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          speakJapanese(
                            buildKanjiPronunciationScript([item.onyomi], [item.kunyomi], item.kanji),
                            audioSpeed
                          )
                        }
                        title="Play Pronunciation (On'yomi & Kun'yomi)"
                        aria-label={`Play pronunciation for ${item.kanji}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-800 text-[10px] font-semibold text-[#D92525] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Play</span>
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-jp text-3xl font-bold text-[#141413] dark:text-white">
                        {item.kanji}
                      </span>
                      <span className="text-xs font-bold text-[#141413] dark:text-zinc-100">
                        {item.meaning}
                      </span>
                    </div>
                    <p
                      data-testid="joyo-card-readings"
                      className="text-[11px] font-jp text-stone-600 dark:text-zinc-300 leading-relaxed"
                    >
                      On: {formatKanaReadingsWithRomaji(item.onyomi)} · Kun:{' '}
                      {formatKanaReadingsWithRomaji(item.kunyomi)}
                    </p>
                    <p className="text-[11px] font-jp text-stone-500 dark:text-zinc-400">
                      Word: {item.sampleWord} ({item.sampleReading}) — {item.sampleMeaning}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleStartStudyForKanji(item.kanji);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="akujin-btn-press w-full py-1.5 rounded-lg text-[11px] font-semibold bg-[#D92525] hover:bg-[#B91C1C] text-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Practice Flashcard &amp; Canvas
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={mastered}
                      onClick={() => onMasterItem(item.id, 5)}
                      className={`akujin-btn-press w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                        mastered
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#141413] dark:text-zinc-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {mastered ? 'Learned' : 'Mark Learned (+5 XP)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
          <span className="font-mono-nums">
            Page {safeCatalogPage + 1} / {totalCatalogPages} · Showing {pagedCatalog.length} of {filteredCatalog.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCatalogPage === 0}
              onClick={() => setCatalogPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safeCatalogPage >= totalCatalogPages - 1}
              onClick={() => setCatalogPage((p) => Math.min(totalCatalogPages - 1, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
