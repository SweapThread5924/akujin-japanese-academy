import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  PenTool,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { ALL_JLPT_KANJI_CATALOG } from '../data/jlptUpperData';
import {
  getCachedJoyoKanji2136,
  loadJoyoKanji2136,
  type JoyoKanjiEntry,
} from '../utils/datasetLoader';
import {
  buildKanjiPronunciationScript,
  formatKanaReadingsWithRomaji,
} from '../utils/joyoProgress';
import {
  DEFAULT_DICTIONARY_FILTER,
  extractDictionaryFacets,
  filterKanjiDictionary,
  hasActiveDictionaryFilters,
  paginateDictionary,
  type DictionarySortBy,
  type KanjiDictionaryFilter,
} from '../utils/kanjiDictionary';
import type { JlptLevel, SrsCardProgress } from '../utils/srsEngine';
import { speakJapanese } from '../utils/speechAndPwa';
import { AudioSpeedControl } from './AudioSpeedControl';

interface KanjiDictionarySectionProps {
  srsProgress: Record<string, SrsCardProgress>;
  masteredItemIds: string[];
  showRomaji: boolean;
  audioSpeed: number;
  onChangeAudioSpeed: (nextSpeed: number) => void;
  onOpenSrsCard: (entry: JoyoKanjiEntry) => void;
  onOpenStrokePractice: (entry: JoyoKanjiEntry) => void;
}

const JLPT_LEVEL_OPTIONS: readonly ('ALL' | JlptLevel)[] = [
  'ALL',
  'N5',
  'N4',
  'N3',
  'N2',
  'N1',
];

const PAGE_SIZE = 40;

function formatRawKanaList(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return '—';
  return trimmed
    .split(/[、,・/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' · ');
}

function getGradeLabel(grade?: number): string {
  if (!grade) return 'Jōyō';
  if (grade <= 6) return `Grade ${grade}`;
  return 'Secondary';
}

export const KanjiDictionarySection: React.FC<KanjiDictionarySectionProps> = ({
  srsProgress,
  masteredItemIds,
  showRomaji,
  audioSpeed,
  onChangeAudioSpeed,
  onOpenSrsCard,
  onOpenStrokePractice,
}) => {
  const [catalog, setCatalog] = useState<JoyoKanjiEntry[]>(
    () => getCachedJoyoKanji2136() ?? ALL_JLPT_KANJI_CATALOG
  );
  const [isLoadingFullCatalog, setIsLoadingFullCatalog] = useState(
    () => !getCachedJoyoKanji2136()
  );
  const [filter, setFilter] = useState<KanjiDictionaryFilter>(DEFAULT_DICTIONARY_FILTER);
  const [page, setPage] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadJoyoKanji2136()
      .then((rows) => {
        if (mounted && Array.isArray(rows) && rows.length > 0) {
          setCatalog(rows);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingFullCatalog(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const facets = useMemo(() => extractDictionaryFacets(catalog), [catalog]);

  const filteredEntries = useMemo(
    () => filterKanjiDictionary(catalog, filter),
    [catalog, filter]
  );

  const paged = useMemo(
    () => paginateDictionary(filteredEntries, page, PAGE_SIZE),
    [filteredEntries, page]
  );

  const srsByChar = useMemo(() => {
    const map = new Map<string, SrsCardProgress>();
    for (const [id, stat] of Object.entries(srsProgress)) {
      if (id.startsWith('joyo-')) {
        map.set(id, stat);
      }
    }
    return map;
  }, [srsProgress]);

  const masteredSet = useMemo(() => new Set(masteredItemIds), [masteredItemIds]);
  const filtersActive = hasActiveDictionaryFilters(filter);
  const maxStrokes = facets.strokes[facets.strokes.length - 1]?.strokes ?? 29;

  const updateFilter = (patch: Partial<KanjiDictionaryFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    setPage(0);
  };

  const handleResetFilters = () => {
    setFilter(DEFAULT_DICTIONARY_FILTER);
    setPage(0);
  };

  return (
    <div
      data-testid="kanji-dictionary-section"
      data-total-joyo-count={catalog.length}
      className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-6"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            常用漢字辞典 · Complete {catalog.length.toLocaleString()} Jōyō Kanji Index
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Jōyō Kanji Dictionary &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Stroke Finder.
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-stone-600 dark:text-zinc-400 max-w-2xl">
            Search all {catalog.length.toLocaleString()} official Jōyō Kanji by On’yomi or Kun’yomi reading (Hiragana, Katakana, or Romaji), exact stroke count, or radical, then jump straight into SRS flashcards or HTML5 stroke practice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-nums text-stone-600 dark:text-zinc-300 self-start md:self-end">
          <span>
            <strong className="text-[#141413] dark:text-white">{catalog.length.toLocaleString()}</strong> Kanji
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-[#141413] dark:text-white">{facets.radicals.length}</strong> Radicals
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-[#141413] dark:text-white">1–{maxStrokes}</strong> Strokes
          </span>
        </div>
      </div>

      <AudioSpeedControl
        speed={audioSpeed}
        onChange={onChangeAudioSpeed}
        contextLabel="Applies to Kanji pronunciation & reading playback in the dictionary"
      />

      {/* Search & Multi-Facet Filter Bar */}
      <section
        aria-label="Dictionary Search and Filters"
        className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* Search by Reading / Kanji / Meaning */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
            <label
              htmlFor="dict-reading-search"
              className="block text-xs font-semibold text-[#141413] dark:text-zinc-200"
            >
              Reading (Kana / Romaji), Kanji, or Meaning
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="dict-reading-search"
                data-testid="dict-reading-search"
                type="search"
                value={filter.readingQuery}
                onChange={(e) => updateFilter({ readingQuery: e.target.value })}
                placeholder="e.g. にち, ニチ, yasu, mizu, rest, 日..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#D92525]"
              />
              {filter.readingQuery && (
                <button
                  type="button"
                  onClick={() => updateFilter({ readingQuery: '' })}
                  aria-label="Clear reading search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-[#141413] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Stroke Count Filter */}
          <div className="lg:col-span-3 space-y-1.5">
            <label
              htmlFor="dict-stroke-filter"
              className="block text-xs font-semibold text-[#141413] dark:text-zinc-200"
            >
              Stroke Count
            </label>
            <select
              id="dict-stroke-filter"
              data-testid="dict-stroke-filter"
              value={filter.strokeCount === 'ALL' ? 'ALL' : String(filter.strokeCount)}
              onChange={(e) => {
                const v = e.target.value;
                updateFilter({ strokeCount: v === 'ALL' ? 'ALL' : Number(v) });
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm font-mono-nums text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            >
              <option value="ALL">All Strokes ({catalog.length.toLocaleString()})</option>
              {facets.strokes.map((s) => (
                <option key={s.strokes} value={String(s.strokes)}>
                  {s.strokes} {s.strokes === 1 ? 'stroke' : 'strokes'} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {/* Radical Filter */}
          <div className="lg:col-span-3 space-y-1.5">
            <label
              htmlFor="dict-radical-filter"
              className="block text-xs font-semibold text-[#141413] dark:text-zinc-200"
            >
              Radical
            </label>
            <select
              id="dict-radical-filter"
              data-testid="dict-radical-filter"
              value={filter.radical}
              onChange={(e) => updateFilter({ radical: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            >
              <option value="ALL">All Radicals ({facets.radicals.length})</option>
              {facets.radicals.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.count})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
            <label
              htmlFor="dict-sort-select"
              className="block text-xs font-semibold text-[#141413] dark:text-zinc-200"
            >
              Sort Order
            </label>
            <select
              id="dict-sort-select"
              data-testid="dict-sort-select"
              value={filter.sortBy}
              onChange={(e) => updateFilter({ sortBy: e.target.value as DictionarySortBy })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            >
              <option value="frequency">Frequency</option>
              <option value="strokes-asc">Strokes: Low → High</option>
              <option value="strokes-desc">Strokes: High → Low</option>
              <option value="jlpt">JLPT: N5 → N1</option>
            </select>
          </div>
        </div>

        {/* JLPT Level Filter + Result Summary Strip */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter dictionary by JLPT level"
            className="inline-flex max-w-full overflow-x-auto items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800"
          >
            {JLPT_LEVEL_OPTIONS.map((lvl) => {
              const active = filter.level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => updateFilter({ level: lvl })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#D92525] text-white'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                  }`}
                >
                  {lvl === 'ALL' ? `All (${catalog.length.toLocaleString()})` : lvl}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {isLoadingFullCatalog && (
              <span className="text-stone-500 dark:text-zinc-400">
                Loading full 2,136 index…
              </span>
            )}
            <span
              data-testid="dictionary-match-count"
              className="font-mono-nums text-stone-600 dark:text-zinc-300"
            >
              {filteredEntries.length === 0
                ? '0 matching Kanji'
                : `Showing ${paged.startItem.toLocaleString()}–${paged.endItem.toLocaleString()} of ${filteredEntries.length.toLocaleString()} Kanji`}
            </span>
            {filtersActive && (
              <button
                type="button"
                data-testid="dict-reset-filters"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-zinc-200 hover:border-[#D92525] hover:text-[#D92525] cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filterable List View */}
      {paged.items.length === 0 ? (
        <section
          data-testid="dictionary-empty-state"
          className="rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#16181F] p-10 text-center space-y-3"
        >
          <BookOpen
            className="w-8 h-8 text-stone-400 dark:text-zinc-500 mx-auto"
            aria-hidden="true"
          />
          <h2 className="text-base font-bold text-[#141413] dark:text-white">
            No Jōyō Kanji match your current filters
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-md mx-auto">
            Try clearing the stroke count, radical, or JLPT level constraint, or search using Hiragana, Katakana, or Hepburn Romaji.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset All Filters
          </button>
        </section>
      ) : (
        <section aria-label="Filtered Joyo Kanji list">
          <ul
            data-testid="kanji-dictionary-list"
            className="divide-y divide-stone-200 dark:divide-zinc-800 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] overflow-hidden"
          >
            {paged.items.map((item) => {
              const srsStat = srsByChar.get(item.id);
              const isMastered =
                masteredSet.has(item.id) || (srsStat?.repetitions ?? 0) >= 2;
              const isLearning =
                !isMastered && ((srsStat?.reviewCount ?? 0) >= 1 || (srsStat?.repetitions ?? 0) >= 1);
              const isSpeaking = speakingId === item.id;

              const onReadingText = showRomaji
                ? formatKanaReadingsWithRomaji(item.onyomi)
                : formatRawKanaList(item.onyomi);
              const kunReadingText = showRomaji
                ? formatKanaReadingsWithRomaji(item.kunyomi)
                : formatRawKanaList(item.kunyomi);

              return (
                <li
                  key={item.id}
                  data-testid={`dictionary-row-${item.id}`}
                  data-kanji={item.kanji}
                  className="px-4 sm:px-6 py-4 hover:bg-stone-50/75 dark:hover:bg-[#1B1E28]/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Glyph + Core Meaning + Unboxed Metadata */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 lg:w-[34%]">
                    <div className="h-14 w-14 rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#FCFBF8] dark:bg-[#101218] flex items-center justify-center font-jp text-3xl font-bold text-[#141413] dark:text-white shrink-0 select-all">
                      {item.kanji}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <h2 className="text-base font-bold text-[#141413] dark:text-white leading-snug">
                          {item.meaning}
                        </h2>
                        {isMastered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            Mastered
                          </span>
                        ) : isLearning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            In SRS
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs font-mono-nums text-stone-600 dark:text-zinc-300">
                        <span className="font-semibold text-[#D92525] dark:text-rose-400">
                          JLPT {item.level}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.strokes}画</span>
                        <span aria-hidden="true"> · </span>
                        <span>Radical: {item.radical}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{getGradeLabel(item.grade)}</span>
                        {typeof item.freq === 'number' && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>#{item.freq}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Readings + Sample Compound + Audio */}
                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p className="font-jp text-stone-700 dark:text-zinc-200">
                        <span className="font-sans font-semibold text-stone-500 dark:text-zinc-400 mr-1">
                          On:
                        </span>
                        {onReadingText}
                      </p>
                      <p className="font-jp text-stone-700 dark:text-zinc-200">
                        <span className="font-sans font-semibold text-stone-500 dark:text-zinc-400 mr-1">
                          Kun:
                        </span>
                        {kunReadingText}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-stone-500 dark:text-zinc-400">
                      <span className="font-jp truncate max-w-full">
                        Word: <strong className="font-medium text-[#141413] dark:text-zinc-200">{item.sampleWord}</strong>{' '}
                        {item.sampleReading ? `(${item.sampleReading})` : ''} — {item.sampleMeaning}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSpeakingId(item.id);
                          speakJapanese(
                            buildKanjiPronunciationScript([item.onyomi], [item.kunyomi], item.kanji),
                            audioSpeed,
                            () => setSpeakingId((curr) => (curr === item.id ? null : curr))
                          );
                        }}
                        aria-label={`Play pronunciation for ${item.kanji}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
                          isSpeaking
                            ? 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525] dark:text-rose-300'
                            : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-[#D92525] hover:text-[#D92525]'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" aria-hidden="true" />
                        <span>{isSpeaking ? 'Playing' : 'Listen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Direct Links to SRS Card & Stroke Practice */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid={`dict-open-srs-${item.id}`}
                      onClick={() => onOpenSrsCard(item)}
                      aria-label={`Open ${item.kanji} in SRS Card Mode`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#101218] text-xs font-semibold text-[#141413] dark:text-zinc-100 hover:border-[#D92525] hover:text-[#D92525] dark:hover:text-rose-400 whitespace-nowrap cursor-pointer transition-colors akujin-btn-press"
                    >
                      <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>SRS Card</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`dict-open-stroke-${item.id}`}
                      onClick={() => onOpenStrokePractice(item)}
                      aria-label={`Practice stroke order for ${item.kanji}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors akujin-btn-press"
                    >
                      <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Stroke Practice</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Pagination Footer */}
      {paged.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
            Page {paged.safePage + 1} of {paged.totalPages} ({filteredEntries.length.toLocaleString()} results)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paged.safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-zinc-200 hover:border-[#D92525] disabled:opacity-45 cursor-pointer disabled:cursor-default"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              disabled={paged.safePage + 1 >= paged.totalPages}
              onClick={() => setPage((p) => Math.min(paged.totalPages - 1, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-zinc-200 hover:border-[#D92525] disabled:opacity-45 cursor-pointer disabled:cursor-default"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
