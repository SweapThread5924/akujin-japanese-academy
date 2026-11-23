import React, { useMemo, useState } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  Lock,
  Compass,
  Trash2,
  Sparkles,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  SCENARIOS,
  type DialogueWordToken,
  type ScenarioLine,
} from '../data/curriculumData';
import {
  JAPAN_REGIONAL_SCENARIOS,
  JAPAN_REGIONS,
  REGIONAL_CATEGORIES,
  type JapanRegion,
  type RegionalScenario,
  type RegionalScenarioCategory,
} from '../data/japanRegionalScenarios';
import {
  countScenariosByRegion,
  filterRegionalScenarios,
} from '../utils/studyAndScenarios';
import { speakJapanese } from '../utils/speechAndPwa';
import { AudioSpeedControl } from './AudioSpeedControl';

export interface BookmarkedPhrase {
  id: string;
  plainJapanese: string;
  reading: string;
  romaji: string;
  english: string;
  scenarioTitle: string;
}

interface ScenariosSectionProps {
  xp: number;
  showRomaji: boolean;
  bookmarkedPhrases: BookmarkedPhrase[];
  onToggleBookmark: (phrase: BookmarkedPhrase) => void;
  onCompleteScenarioLine: () => void;
  audioSpeed: number;
  onChangeAudioSpeed: (nextSpeed: number) => void;
}

export const ScenariosSection: React.FC<ScenariosSectionProps> = ({
  xp,
  showRomaji,
  bookmarkedPhrases,
  onToggleBookmark,
  onCompleteScenarioLine,
  audioSpeed,
  onChangeAudioSpeed,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [activeToken, setActiveToken] = useState<{
    token: DialogueWordToken;
    lineId: string;
  } | null>(null);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [phraseSearch, setPhraseSearch] = useState('');

  // All-Japan Regional Scenarios & Etiquette Atlas state
  const [selectedRegion, setSelectedRegion] = useState<JapanRegion | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<
    RegionalScenarioCategory | 'ALL'
  >('ALL');
  const [regionalSearch, setRegionalSearch] = useState('');
  const [regionalPage, setRegionalPage] = useState(1);
  const [activeRegionalId, setActiveRegionalId] = useState<string>(
    JAPAN_REGIONAL_SCENARIOS[0].id
  );
  const [playingRegionalKey, setPlayingRegionalKey] = useState<string | null>(null);

  const regionCounts = useMemo(
    () => countScenariosByRegion(JAPAN_REGIONAL_SCENARIOS),
    []
  );

  const filteredRegional = useMemo(
    () =>
      filterRegionalScenarios(JAPAN_REGIONAL_SCENARIOS, {
        region: selectedRegion,
        category: selectedCategory,
        query: regionalSearch,
      }),
    [selectedRegion, selectedCategory, regionalSearch]
  );

  const REGIONAL_PAGE_SIZE = 12;
  const totalRegionalPages = Math.max(
    1,
    Math.ceil(filteredRegional.length / REGIONAL_PAGE_SIZE)
  );
  const safeRegionalPage = Math.min(regionalPage, totalRegionalPages);
  const pagedRegional = filteredRegional.slice(
    (safeRegionalPage - 1) * REGIONAL_PAGE_SIZE,
    safeRegionalPage * REGIONAL_PAGE_SIZE
  );

  const activeRegional: RegionalScenario =
    filteredRegional.find((s) => s.id === activeRegionalId) ??
    filteredRegional[0] ??
    JAPAN_REGIONAL_SCENARIOS[0];

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0];

  const isScenarioUnlocked = (unlockXp: number) => xp >= unlockXp;

  const isBookmarked = (lineId: string) =>
    bookmarkedPhrases.some((b) => b.id === lineId);

  const handlePlayLine = (line: ScenarioLine) => {
    setPlayingLineId(line.id);
    speakJapanese(line.plainJapanese, audioSpeed, () => {
      setPlayingLineId(null);
    });
    onCompleteScenarioLine();
  };

  const handlePlayRegionalLine = (key: string, japaneseText: string) => {
    setPlayingRegionalKey(key);
    speakJapanese(japaneseText, audioSpeed, () => {
      setPlayingRegionalKey(null);
    });
    onCompleteScenarioLine();
  };

  const filteredPhrasebook = bookmarkedPhrases.filter(
    (p) =>
      p.plainJapanese.includes(phraseSearch) ||
      p.english.toLowerCase().includes(phraseSearch.toLowerCase()) ||
      p.romaji.toLowerCase().includes(phraseSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            日本全国・現場実践 · {SCENARIOS.length + JAPAN_REGIONAL_SCENARIOS.length} Real-Life Immersion Modules Across All 8 Regions
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            All-Japan Scenarios &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Cultural Etiquette.
            </span>
          </h1>
        </div>
        <a
          href="#all-japan-regional-atlas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline whitespace-nowrap shrink-0"
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          Browse {JAPAN_REGIONAL_SCENARIOS.length} Regional City Scenarios ↓
        </a>
      </div>

      <AudioSpeedControl
        speed={audioSpeed}
        onChange={onChangeAudioSpeed}
        contextLabel="Applies to flagship dialogues, clickable words, saved phrases & all 106 regional scenarios"
      />

      {/* Scenario Category Cards */}
      <div data-reveal-stagger="true" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCENARIOS.map((scn) => {
          const unlocked = isScenarioUnlocked(scn.unlockXp);
          const active = scn.id === activeScenario.id;

          return (
            <button
              key={scn.id}
              type="button"
              onClick={() => {
                if (unlocked) {
                  setSelectedScenarioId(scn.id);
                  setActiveToken(null);
                }
              }}
              className={`akujin-card-lift akujin-btn-press group rounded-2xl overflow-hidden border text-left flex flex-col ${
                active
                  ? 'border-[#D92525] bg-white dark:bg-[#1B1D26]'
                  : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] hover:border-stone-300 dark:hover:border-zinc-700'
              } ${unlocked ? 'cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
            >
              <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-zinc-900 overflow-hidden">
                {!failedImages[scn.id] ? (
                  <img
                    src={scn.imageUrl}
                    alt={scn.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [scn.id]: true }))
                    }
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-stone-100 dark:from-zinc-900 dark:to-zinc-800">
                    <Compass className="w-8 h-8 text-[#D92525]" aria-hidden="true" />
                  </div>
                )}
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-3 text-center">
                    <Lock className="w-5 h-5 mb-1" aria-hidden="true" />
                    <span className="text-xs font-semibold">
                      Unlocks at {scn.unlockXp} XP
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-1 flex-1">
                <p className="text-xs font-mono-nums text-[#D92525] dark:text-rose-400">
                  {scn.level} · {scn.japaneseTitle}
                </p>
                <h2 className="text-sm font-bold text-[#141413] dark:text-white">
                  {scn.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-2">
                  {scn.summary}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Interactive Word-Clickable Dialogue Player + Cultural Notes Sidebar */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Dialogue Player */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-[#141413] dark:text-white">
                {activeScenario.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                Click any Japanese word in the conversation below to inspect its Kanji, Hiragana reading, and meaning.
              </p>
            </div>
            <span className="text-xs font-jp font-semibold text-[#D92525] dark:text-rose-400">
              {activeScenario.japaneseTitle}
            </span>
          </div>

          <div className="space-y-4">
            {activeScenario.lines.map((line) => {
              const saved = isBookmarked(line.id);
              const playing = playingLineId === line.id;

              return (
                <div
                  key={line.id}
                  className={`rounded-xl p-4 sm:p-5 border transition-colors space-y-3 ${
                    line.role === 'You'
                      ? 'bg-rose-50/40 dark:bg-rose-950/15 border-[#D92525]/25'
                      : 'bg-stone-50 dark:bg-[#1B1E28] border-stone-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
                      {line.speaker}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayLine(line)}
                        aria-label={`Play audio for ${line.speaker}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                          playing
                            ? 'border-[#D92525] text-[#D92525] bg-white dark:bg-[#16181F]'
                            : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200 hover:border-[#D92525]'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {playing ? 'Playing…' : 'Listen'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleBookmark({
                            id: line.id,
                            plainJapanese: line.plainJapanese,
                            reading: line.tokens.map((t) => t.reading).join(' '),
                            romaji: line.romaji,
                            english: line.english,
                            scenarioTitle: activeScenario.title,
                          })
                        }
                        aria-label={
                          saved
                            ? `Saved phrase: ${line.english}`
                            : `Save phrase: ${line.english}`
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                          saved
                            ? 'border-[#D92525] bg-[#D92525] text-white'
                            : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200'
                        }`}
                      >
                        {saved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Word-clickable Japanese tokens */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {line.tokens.map((tok) => {
                      const selected =
                        activeToken?.token.id === tok.id && activeToken?.lineId === line.id;
                      return (
                        <button
                          key={tok.id}
                          type="button"
                          onClick={() => {
                            setActiveToken({ token: tok, lineId: line.id });
                            speakJapanese(tok.surface, audioSpeed);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-jp text-lg font-bold border transition-all cursor-pointer ${
                            selected
                              ? 'border-[#D92525] bg-[#D92525] text-white'
                              : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-[#141413] dark:text-white hover:border-[#D92525]'
                          }`}
                        >
                          {tok.surface}
                        </button>
                      );
                    })}
                  </div>

                  {showRomaji && (
                    <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                      {line.romaji}
                    </p>
                  )}
                  <p className="text-sm text-stone-700 dark:text-zinc-200">{line.english}</p>
                </div>
              );
            })}
          </div>

          {/* Word Breakdown Pop-up Card */}
          {activeToken && (
            <div
              role="region"
              aria-label="Selected Japanese word breakdown"
              className="rounded-xl border border-[#D92525] bg-white dark:bg-[#1B1E28] p-5 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-[#D92525] dark:text-rose-400">
                    {activeToken.token.partOfSpeech}
                  </span>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="font-jp text-2xl font-bold text-[#141413] dark:text-white">
                      {activeToken.token.surface}
                    </span>
                    <span className="font-jp text-sm text-stone-600 dark:text-zinc-300">
                      {activeToken.token.reading}
                    </span>
                    {showRomaji && (
                      <span className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                        {activeToken.token.romaji}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveToken(null)}
                  className="text-xs text-stone-500 hover:text-[#141413] dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
              <p className="text-sm font-semibold text-[#141413] dark:text-white">
                Meaning: {activeToken.token.meaning}
              </p>
              <p className="text-xs text-stone-600 dark:text-zinc-300">
                <strong>Kanji Breakdown:</strong> {activeToken.token.kanjiBreakdown}
              </p>
            </div>
          )}
        </div>

        {/* Right: Cultural Notes Sidebar + Built-In Offline Phrasebook */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Cultural Notes */}
          <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#141413] dark:text-white">
                Cultural Notes &amp; Keigo
              </h2>
            </div>

            <div className="space-y-4">
              {activeScenario.culturalNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-1.5"
                >
                  <p className="text-xs font-semibold text-[#D92525] dark:text-rose-400">
                    {note.registerType}
                  </p>
                  <h3 className="text-sm font-bold text-[#141413] dark:text-white">
                    {note.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                    {note.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Built-in Offline Phrasebook */}
          <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#141413] dark:text-white">
                  Offline Phrasebook
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  {bookmarkedPhrases.length} saved for offline Tokyo travel
                </p>
              </div>
            </div>

            <label htmlFor="phrasebook-search" className="sr-only">
              Filter saved phrases
            </label>
            <input
              id="phrasebook-search"
              type="text"
              value={phraseSearch}
              onChange={(e) => setPhraseSearch(e.target.value)}
              placeholder="Search saved phrases…"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            />

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredPhrasebook.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-zinc-400 py-3">
                  Bookmark any dialogue line using Save to keep it ready offline.
                </p>
              ) : (
                filteredPhrasebook.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-jp text-sm font-bold text-[#141413] dark:text-white">
                        {item.plainJapanese}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakJapanese(item.plainJapanese, audioSpeed)}
                          aria-label={`Play saved phrase ${item.english}`}
                          className="p-1 text-stone-500 hover:text-[#D92525] cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(item)}
                          aria-label={`Remove saved phrase ${item.english}`}
                          className="p-1 text-stone-400 hover:text-[#D92525] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {showRomaji && (
                      <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                        {item.romaji}
                      </p>
                    )}
                    <p className="text-xs text-stone-600 dark:text-zinc-300">
                      {item.english}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                      {item.scenarioTitle}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* All-Japan Regional Scenarios & Cultural Etiquette Atlas (96 Scenarios across all 8 Regions) */}
      <section
        id="all-japan-regional-atlas"
        aria-labelledby="regional-atlas-heading"
        className="pt-8 border-t border-stone-200 dark:border-zinc-800 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              北海道から沖縄まで · Hokkaido to Okinawa City-by-City Cultural Atlas
            </p>
            <h2
              id="regional-atlas-heading"
              className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white"
            >
              {JAPAN_REGIONAL_SCENARIOS.length} Regional Scenarios &amp; Local Etiquette Guides
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Showing{' '}
              <span
                data-testid="regional-scenarios-count"
                className="font-mono-nums font-semibold text-[#141413] dark:text-white"
              >
                {filteredRegional.length}
              </span>{' '}
              scenarios across Japan — click any city card to practice its dialogue, listen to native TTS audio, and review exact local etiquette.
            </p>
          </div>
          {(selectedRegion !== 'ALL' ||
            selectedCategory !== 'ALL' ||
            regionalSearch.trim().length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('ALL');
                setSelectedCategory('ALL');
                setRegionalSearch('');
                setRegionalPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline cursor-pointer self-start md:self-auto"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Region Filters
            </button>
          )}
        </div>

        {/* Region Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            data-testid="region-filter-ALL"
            onClick={() => {
              setSelectedRegion('ALL');
              setRegionalPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
              selectedRegion === 'ALL'
                ? 'border-[#D92525] bg-[#D92525] text-white'
                : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-300 hover:border-stone-300'
            }`}
          >
            All Japan ({JAPAN_REGIONAL_SCENARIOS.length})
          </button>
          {JAPAN_REGIONS.map((reg) => {
            const active = selectedRegion === reg;
            return (
              <button
                key={reg}
                type="button"
                data-testid={`region-filter-${reg}`}
                onClick={() => {
                  setSelectedRegion(reg);
                  setRegionalPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#D92525] bg-[#D92525] text-white'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-300 hover:border-stone-300'
                }`}
              >
                {reg} ({regionCounts[reg]})
              </button>
            );
          })}
        </div>

        {/* Search + Category Filter Row */}
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <label htmlFor="regional-scenario-search" className="sr-only">
              Search Japanese cities, prefectures, or cultural etiquette topics
            </label>
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="regional-scenario-search"
              data-testid="regional-scenario-search"
              type="text"
              value={regionalSearch}
              onChange={(e) => {
                setRegionalSearch(e.target.value);
                setRegionalPage(1);
              }}
              placeholder="Search city, prefecture, or etiquette (e.g. Kyoto, Sapporo, Okinawa, onsen, escalator, shrine, udon)…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs sm:text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="regional-category-select" className="sr-only">
              Filter by scenario category
            </label>
            <select
              id="regional-category-select"
              data-testid="regional-category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(
                  e.target.value as RegionalScenarioCategory | 'ALL'
                );
                setRegionalPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs sm:text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {REGIONAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Regional Scenario Interactive Inspector */}
        {filteredRegional.length > 0 && (
          <div
            data-testid="active-regional-inspector"
            className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-7 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-200 dark:border-zinc-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500 dark:text-zinc-400">
                  <span className="font-semibold text-[#D92525] dark:text-rose-400">
                    {activeRegional.region}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeRegional.city}, {activeRegional.prefecture}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeRegional.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-nums">{activeRegional.jlptLevel}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#141413] dark:text-white">
                  {activeRegional.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  {activeRegional.summary}
                </p>
              </div>
              <span className="text-xs font-jp font-semibold text-[#D92525] dark:text-rose-400 whitespace-nowrap shrink-0">
                {activeRegional.japaneseTitle}
              </span>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left: Mini Interactive Dialogue with Audio + Save */}
              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs font-semibold text-[#141413] dark:text-white">
                  Practical Local Dialogue
                </p>
                {activeRegional.dialogue.map((dLine, idx) => {
                  const lineKey = `${activeRegional.id}-line-${idx}`;
                  const saved = isBookmarked(lineKey);
                  const playing = playingRegionalKey === lineKey;
                  return (
                    <div
                      key={lineKey}
                      className={`akujin-card-lift rounded-xl p-4 border space-y-2 ${
                        dLine.speaker === 'You'
                          ? 'bg-rose-50/40 dark:bg-rose-950/15 border-[#D92525]/25'
                          : 'bg-stone-50 dark:bg-[#1B1E28] border-stone-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
                          {dLine.speaker}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handlePlayRegionalLine(lineKey, dLine.japanese)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                              playing
                                ? 'border-[#D92525] text-[#D92525] bg-white dark:bg-[#16181F]'
                                : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200 hover:border-[#D92525]'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                            {playing ? 'Playing…' : 'Listen'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleBookmark({
                                id: lineKey,
                                plainJapanese: dLine.japanese,
                                reading: dLine.reading,
                                romaji: dLine.romaji,
                                english: dLine.english,
                                scenarioTitle: `${activeRegional.city}: ${activeRegional.title}`,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                              saved
                                ? 'border-[#D92525] bg-[#D92525] text-white'
                                : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200'
                            }`}
                          >
                            {saved ? (
                              <>
                                <BookmarkCheck
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="font-jp text-base font-bold text-[#141413] dark:text-white leading-relaxed">
                        {dLine.japanese}
                      </p>
                      <p className="font-jp text-xs text-stone-500 dark:text-zinc-400">
                        {dLine.reading}
                      </p>
                      {showRomaji && (
                        <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                          {dLine.romaji}
                        </p>
                      )}
                      <p className="text-sm text-stone-700 dark:text-zinc-200">
                        {dLine.english}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right: Local Cultural Etiquette Rules */}
              <div className="lg:col-span-5 space-y-3">
                <p className="text-xs font-semibold text-[#141413] dark:text-white">
                  Local Cultural Etiquette &amp; Manners
                </p>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Do (Proper Etiquette)
                    </p>
                    <p className="text-stone-700 dark:text-zinc-300 leading-relaxed">
                      {activeRegional.etiquette.doRule}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 space-y-1">
                    <p className="font-bold text-[#D92525] dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Avoid (Common Mistake)
                    </p>
                    <p className="text-stone-700 dark:text-zinc-300 leading-relaxed">
                      {activeRegional.etiquette.dontRule}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 space-y-1">
                    <p className="font-bold text-[#141413] dark:text-white">
                      Insider Local Tip
                    </p>
                    <p className="text-stone-600 dark:text-zinc-300 leading-relaxed">
                      {activeRegional.etiquette.localTip}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 pt-1">
                      Register: {activeRegional.etiquette.registerNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paginated Regional Scenario Cards Grid */}
        {pagedRegional.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#141413] dark:text-white">
              No regional scenarios matched your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('ALL');
                setSelectedCategory('ALL');
                setRegionalSearch('');
                setRegionalPage(1);
              }}
              className="text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline cursor-pointer"
            >
              Show all {JAPAN_REGIONAL_SCENARIOS.length} regional scenarios
            </button>
          </div>
        ) : (
          <div data-reveal-stagger="true" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedRegional.map((item) => {
              const selected = item.id === activeRegional.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`regional-card-${item.id}`}
                  onClick={() => {
                    setActiveRegionalId(item.id);
                    document
                      .getElementById('all-japan-regional-atlas')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`akujin-card-lift p-4 sm:p-5 rounded-2xl border text-left cursor-pointer space-y-2 flex flex-col justify-between ${
                    selected
                      ? 'border-[#D92525] bg-white dark:bg-[#1B1D26]'
                      : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] hover:border-stone-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-stone-500 dark:text-zinc-400">
                      <span className="font-semibold text-[#D92525] dark:text-rose-400">
                        {item.city}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.region}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-nums">{item.jlptLevel}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#141413] dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="font-jp text-stone-500 dark:text-zinc-400 truncate">
                      {item.japaneseTitle}
                    </span>
                    <span className="text-[#D92525] dark:text-rose-400 font-semibold whitespace-nowrap shrink-0 ml-2">
                      {selected ? 'Inspecting' : 'Open →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Regional Pagination */}
        {totalRegionalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
              Page {safeRegionalPage} of {totalRegionalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeRegionalPage <= 1}
                onClick={() => setRegionalPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs font-medium text-[#141413] dark:text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={safeRegionalPage >= totalRegionalPages}
                onClick={() =>
                  setRegionalPage((p) => Math.min(totalRegionalPages, p + 1))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs font-medium text-[#141413] dark:text-white disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
