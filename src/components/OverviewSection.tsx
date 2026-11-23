import React, { useState } from 'react';
import {
  ArrowUpRight,
  Volume2,
  CheckCircle2,
  Compass,
  Layers,
  MessageSquare,
  ChevronDown,
  Play,
  GraduationCap,
  Award,
  Briefcase,
  Globe,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { JLPT_TRACKS } from '../data/curriculumData';
import { HIRAGANA_46, KATAKANA_46 } from '../data/foundationsData';
import type { JlptLevel, SrsCardProgress } from '../utils/srsEngine';
import {
  ALL_JLPT_LEVELS,
  isAllJlptLevelsVisible,
  normalizeVisibleJlptLevels,
  resolveActiveVisibleLevel,
} from '../utils/jlptVisibility';
import { speakJapanese } from '../utils/speechAndPwa';
import type { AppTab } from './TopNav';
import { InteractiveVideoStudio } from './InteractiveVideoStudio';
import { ContactSection } from './ContactSection';
import { QuoteOfTheDaySection } from './QuoteOfTheDaySection';
import { KanjiMasteryTrendChart } from './KanjiMasteryTrendChart';

interface OverviewSectionProps {
  selectedLevel: JlptLevel;
  targetLevel?: JlptLevel;
  visibleLevels?: JlptLevel[];
  onToggleVisibleLevel?: (level: JlptLevel) => void;
  onShowAllVisibleLevels?: () => void;
  onFocusOnlyLevel?: (level: JlptLevel) => void;
  onSelectLevel: (level: JlptLevel) => void;
  onNavigateTab: (tab: AppTab) => void;
  showRomaji: boolean;
  darkMode: boolean;
  srsProgress: Record<string, SrsCardProgress>;
  masteredItemIds: string[];
  onMasterItem: (itemId: string, xp: number) => void;
  userEmail?: string;
  learnerName?: string;
}

const MARQUEE_TERMS = [
  'Start From Zero ✦',
  '46 Hiragana & 46 Katakana ✦',
  'JLPT N5 · 103 Kanji & 800+ Vocab ✦',
  'JLPT N4 Conversations ✦',
  'JLPT N3 Media Fluency ✦',
  'JLPT N2 Business Keigo ✦',
  'JLPT N1 Critical Reading ✦',
  'Kanji Radical Trees ✦',
  'Reading · Writing · Speaking · Listening ✦',
];

const FAQ_ITEMS = [
  {
    q: 'Can I start learning Japanese on AkuJin with zero prior knowledge?',
    a: 'Yes! Start in the Foundations tab to learn all 46 Hiragana and 46 Katakana with native audio, mnemonics, Dakuten/Yōon combinations, essential daily greetings, numbers, and interactive handwriting trace practice before moving to JLPT N5.',
  },
  {
    q: 'How does the JLPT N5 to N1 Roadmap track my progression?',
    a: 'The Roadmap tab visualizes your full journey from JLPT N5 to N1 with clickable level milestones, circular SVG mastery rings, and live mastery popovers showing how many items you have completed out of each level’s total.',
  },
  {
    q: 'Does Kanji SRS really include all 2,136 Jōyō Kanji (常用漢字)?',
    a: 'Yes! Both the SM-2 Spaced Repetition Flashcards and the 筆順練習 HTML5 Canvas Stroke Practice board include the complete collection of all 2,136 official Jōyō Kanji across JLPT N5 through N1, complete with readings, meanings, radicals, and example sentences.',
  },
  {
    q: 'How does the HTML5 Canvas Stroke Practice board work?',
    a: 'Select any of the 2,136 Jōyō Kanji (or filter by JLPT level or search directly), toggle the guided stroke outline watermark, and trace each stroke with your mouse, stylus, or finger. You can also switch into Focus Mode for distraction-free Kanji drills.',
  },
  {
    q: 'What are Kanji Radical Trees and how do they help me memorize faster?',
    a: 'Inside Kanji SRS, every Kanji breaks down into interactive visual radical components showing meaning and phonetic building blocks. Learning shared radicals makes recognizing hundreds of N3–N1 Kanji dramatically easier.',
  },
  {
    q: 'What is included inside the JLPT N5–N1 Skill Labs?',
    a: 'Each JLPT tier (N5, N4, N3, N2, and N1) features 6 dedicated practice labs: Vocabulary (~10,000 words total), Grammar (526+ structured patterns), Reading passages, Writing drills, Listening audio exercises, and Speaking prompts—plus a Formal/Casual Register Slider.',
  },
  {
    q: 'Can I slow down or speed up Japanese audio playback while practicing?',
    a: 'Yes! Both Kanji SRS and Scenarios include a global Audio Speed Slider ranging from 0.5x (slow, clear articulation for beginners) up to 1.5x (fast native conversation tempo), alongside top-bar toggles for Furigana and Romaji.',
  },
  {
    q: 'What real-life Japanese conversations can I practice in Scenarios?',
    a: 'The Scenarios tab offers Tokyo immersion dialogues (Izakaya, Shinkansen, Konbini, and Stations) plus 80+ regional scenarios spanning Hokkaido, Kyoto, Osaka, Kyushu, Okinawa, and more—each with clickable word breakdowns and cultural etiquette notes.',
  },
  {
    q: 'How does the Study in Japan tab help with scholarships and universities?',
    a: 'Study in Japan curates 80+ verified opportunities across MEXT scholarships, JASSO support, top Japanese universities, language schools, exchange programs, and tech career pathways—filterable by degree level, funding type, and category.',
  },
  {
    q: 'Are there free downloadable study PDFs, books, and YouTube guides?',
    a: 'Yes! Visit the Resources tab for downloadable study PDFs and printable UTF-8 study sheets (46 Kana workbook, Genki & Minna no Nihongo companions, JLPT N5–N1 grammar, vocabulary, and 2,136 Kanji sheets), plus curated Japanese YouTube channels.',
  },
  {
    q: 'How can I monitor my Kanji review consistency over time?',
    a: 'On the Overview tab, the 30-Day Kanji Mastery Trend chart visualizes your daily Kanji review frequency alongside your cumulative SRS mastery percentage, updating automatically as you rate cards in Kanji SRS.',
  },
  {
    q: 'How do the Leaderboard, Achievement Seals, and Streak Freeze Vault work?',
    a: 'The Leaderboard displays only real learner profiles ranked by earned XP, streak, and Kanji learned—never fake bots. You can inspect your live Achievement Seals and equip Streak Freezes using XP to protect your study streak if you miss a day.',
  },
  {
    q: 'How is my learning progress saved, and where can I ask doubts?',
    a: 'Your progress saves automatically on your device and syncs permanently when you Sign Up or Log In with your email (or use Cloud Sync backup codes). For any JLPT syllabus, grammar, or Japan study questions, message us anytime in the Contact & Student Support form below or email kumaranshul6467@gmail.com.',
  },
];

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  selectedLevel,
  targetLevel = selectedLevel,
  visibleLevels,
  onToggleVisibleLevel,
  onShowAllVisibleLevels,
  onFocusOnlyLevel,
  onSelectLevel,
  onNavigateTab,
  showRomaji,
  darkMode,
  srsProgress,
  masteredItemIds,
  onMasterItem,
  userEmail,
  learnerName,
}) => {
  const [kanaScript, setKanaScript] = useState<'hiragana' | 'katakana'>('hiragana');
  const [activeKana, setActiveKana] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const activeVisibleLevels = normalizeVisibleJlptLevels(visibleLevels);
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);
  const effectiveSelectedLevel = resolveActiveVisibleLevel(selectedLevel, activeVisibleLevels);
  const visibleTracks = JLPT_TRACKS.filter((t) => activeVisibleLevels.includes(t.level));
  const activeTrack =
    visibleTracks.find((t) => t.level === effectiveSelectedLevel) ??
    visibleTracks[0] ??
    JLPT_TRACKS[0];
  const isTargetOnlyActive =
    activeVisibleLevels.length === 1 && activeVisibleLevels[0] === targetLevel;

  const kanaList =
    kanaScript === 'hiragana' ? HIRAGANA_46.slice(0, 15) : KATAKANA_46.slice(0, 15);

  const handlePlayKana = (kana: string) => {
    setActiveKana(kana);
    speakJapanese(kana, 0.85, () => setActiveKana(null));
  };

  return (
    <div className="space-y-16 pb-16 overflow-x-clip">
      {/* Editorial Hero inspired by Japan With Adi */}
      <section className="relative overflow-hidden border-b border-stone-200/80 dark:border-zinc-800 bg-gradient-to-br from-[#FCFBF8] via-[#FDF5F3] to-[#FAF3E8] dark:from-[#0D0E12] dark:via-[#141218] dark:to-[#101218]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 lg:py-16 grid lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Copy Column */}
          <div
            data-reveal="true"
            data-reveal-variant="blur-up"
            className="lg:col-span-7 flex flex-col justify-center space-y-6"
          >
            <p className="text-xs font-medium tracking-wide text-stone-600 dark:text-zinc-400">
              Zero to JLPT N1 Complete Japanese Academy · Kana · Reading · Writing · Speaking · Listening
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.55rem] font-bold tracking-tight leading-[1.06] text-[#141413] dark:text-white text-balance">
              Fluency in Japanese is{' '}
              <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
                closer than you think.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Begin from complete zero with all 46 Hiragana, 46 Katakana, greetings, and numbers—then master every JLPT N5 through N1 module in one interactive studio with animated video lessons, Canvas kanji tracing, and real-world Tokyo simulations.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigateTab('foundations')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white font-semibold text-sm shadow-sm hover:shadow-md cursor-pointer akujin-btn-press"
              >
                Start From Zero (Hiragana &amp; Basics)
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('lessons')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-[#141413] dark:text-zinc-100 font-semibold text-sm hover:border-[#D92525]/60 cursor-pointer akujin-btn-press akujin-card-lift"
              >
                Explore JLPT N5–N1 Studio
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200/80 dark:border-zinc-800 text-xs text-stone-600 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => onNavigateTab('foundations')}
                className="text-left hover:text-[#D92525] dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#141413] dark:text-zinc-100 block">
                  01. Kana &amp; Basics
                </span>
                All 46 Hiragana, 46 Katakana, greetings &amp; numbers
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('lessons')}
                className="text-left hover:text-[#D92525] dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#141413] dark:text-zinc-100 block">
                  02. JLPT N5–N1 Labs
                </span>
                Separate Vocab, Grammar, Reading, Listening, Writing &amp; Speaking
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('kanji')}
                className="text-left hover:text-[#D92525] dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#141413] dark:text-zinc-100 block">
                  03. Full 2,136 Jōyō Kanji SRS
                </span>
                All 2,136 Jōyō Kanji, 10,000 N5–N1 words &amp; radical trees
              </button>
            </div>
          </div>

          {/* Right Framed Editorial Card */}
          <div
            data-reveal="true"
            data-reveal-variant="scale-in"
            className="lg:col-span-5 flex items-center justify-center pt-4 lg:pt-0"
          >
            <div className="relative w-full max-w-md">
              <div className="akujin-img-zoom rounded-2xl bg-white dark:bg-[#16181F] p-2.5 border border-stone-200 dark:border-zinc-800 shadow-sm lg:rotate-[1.2deg] transition-transform duration-300 hover:rotate-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-900">
                  {!heroImgFailed ? (
                    <img
                      src="/images/hero_sakura_campus_1794838253788.jpg"
                      alt="Cherry blossoms in Tokyo overlooking students walking across a university campus"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800 p-6 text-center">
                      <span className="font-jp text-5xl font-bold text-[#D92525]">日本語</span>
                      <span className="mt-2 text-sm text-stone-600 dark:text-zinc-300">
                        AkuJin Japanese Academy
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-end text-right text-white">
                    <div>
                      <p className="text-[11px] opacity-90">All-in-One Japanese Path</p>
                      <p className="text-sm font-semibold">Foundations → JLPT N5 → N1</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crimson Hanko Seal Stamp */}
              <div
                aria-hidden="true"
                className="animate-float-gentle absolute -top-3 right-1.5 sm:-right-2 h-14 w-14 rounded-xl bg-[#D92525] text-white flex items-center justify-center font-jp text-2xl font-bold shadow-md"
              >
                夢
              </div>

              {/* Floating Shortcut Card */}
              <button
                type="button"
                onClick={() => onNavigateTab('foundations')}
                className="akujin-card-lift mt-3 sm:mt-0 sm:absolute sm:-bottom-4 sm:-left-4 rounded-xl bg-white dark:bg-[#1B1D26] border border-stone-200 dark:border-zinc-700 px-4 py-3 text-left shadow-sm hover:border-[#D92525] cursor-pointer"
              >
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Start At Zero · Interactive
                </p>
                <p className="text-sm font-semibold text-[#141413] dark:text-white flex items-center gap-1.5">
                  46 Hiragana &amp; Katakana Lab
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Persistent Dashboard JLPT N5–N1 Content Visibility Bar */}
      <section
        aria-label="Global JLPT N5 to N1 Dashboard Content Filter"
        data-testid="overview-jlpt-visibility-bar"
        className="!mt-0 md:sticky md:top-[var(--akujin-header-height,108px)] z-30 border-b border-stone-200/85 dark:border-zinc-800 bg-[#FCFBF8]/95 dark:bg-[#0D0E12]/95 backdrop-blur-md shadow-xs"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <span className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[#D92525] dark:text-rose-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 className="text-xs sm:text-sm font-bold text-[#141413] dark:text-white">
                  Dashboard JLPT Filter
                </h2>
                <span
                  data-testid="jlpt-visibility-status"
                  className="text-[11px] font-mono-nums font-semibold text-[#D92525] dark:text-rose-400"
                >
                  {allVisible
                    ? 'All 5 levels visible (N5–N1)'
                    : `Showing ${activeVisibleLevels.length}/5: ${activeVisibleLevels.join(', ')}`}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                Syncs Overview, Roadmap, JLPT Labs, Kanji SRS &amp; Resources — saved automatically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div
              role="group"
              aria-label="Toggle JLPT N5 through N1 content visibility"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800"
            >
              {ALL_JLPT_LEVELS.map((lvl) => {
                const isVisible = activeVisibleLevels.includes(lvl);
                const isTarget = lvl === targetLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    data-testid={`jlpt-visibility-toggle-${lvl}`}
                    aria-pressed={isVisible}
                    aria-label={`${isVisible ? 'Hide' : 'Show'} JLPT ${lvl} content`}
                    title={
                      isTarget
                        ? `JLPT ${lvl} (Your target level) — click to ${isVisible ? 'hide' : 'show'}`
                        : `Click to ${isVisible ? 'hide' : 'show'} JLPT ${lvl} across dashboard`
                    }
                    onClick={() => onToggleVisibleLevel?.(lvl)}
                    className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono-nums font-bold transition-colors cursor-pointer akujin-btn-press focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#D92525] ${
                      isVisible
                        ? 'bg-[#D92525] text-white shadow-xs hover:bg-[#B91C1C]'
                        : 'bg-transparent text-stone-400 dark:text-zinc-500 hover:text-[#141413] dark:hover:text-zinc-200 line-through'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            {onFocusOnlyLevel && (
              <button
                type="button"
                data-testid="jlpt-visibility-target-only"
                aria-pressed={isTargetOnlyActive}
                onClick={() => onFocusOnlyLevel(targetLevel)}
                className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl border text-xs font-semibold transition-colors cursor-pointer akujin-btn-press ${
                  isTargetOnlyActive
                    ? 'bg-[#141413] dark:bg-white text-white dark:text-[#141413] border-[#141413] dark:border-white'
                    : 'bg-white dark:bg-[#16181F] border-stone-200 dark:border-zinc-800 text-[#141413] dark:text-zinc-200 hover:border-[#D92525]'
                }`}
              >
                Only {targetLevel}
              </button>
            )}

            {onShowAllVisibleLevels && (
              <button
                type="button"
                data-testid="jlpt-visibility-all"
                disabled={allVisible}
                onClick={onShowAllVisibleLevels}
                className={`min-h-[34px] inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl border text-xs font-semibold transition-colors ${
                  allVisible
                    ? 'bg-stone-50 dark:bg-[#14161D] border-stone-200/70 dark:border-zinc-800/80 text-stone-400 dark:text-zinc-500 cursor-default'
                    : 'bg-white dark:bg-[#16181F] border-[#D92525]/40 text-[#D92525] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer akujin-btn-press'
                }`}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Show All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Scrolling Marquee Strip */}
      <div className="!mt-0 overflow-hidden border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#13141A] py-3">
        <div className="animate-akujin-marquee gap-6 text-sm font-medium text-stone-600 dark:text-zinc-300">
          {[...MARQUEE_TERMS, ...MARQUEE_TERMS].map((term, idx) => (
            <span key={idx} className="whitespace-nowrap px-2">
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* Start Learning Free — 4 Cards Inspired by JapanWithAdi */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 space-y-5">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            無料体験 · Start Learning Free Today
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Four Instant Ways to{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Begin Japanese.
            </span>
          </h2>
        </div>

        <div
          data-reveal-stagger="true"
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              glyph: <Play className="w-5 h-5" />,
              title: 'Animated Video Academy',
              desc: 'Watch synced Japanese strokes, voice narration, and real dialogues.',
              actionLabel: 'Watch Below',
              onClick: () =>
                document.getElementById('video-academy')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              glyph: <span className="font-jp text-2xl font-bold">あ</span>,
              title: '46 Hiragana + Canvas',
              desc: 'Tap every character for audio, mnemonics, and handwriting trace practice.',
              actionLabel: 'Open Hiragana',
              onClick: () => onNavigateTab('foundations'),
            },
            {
              glyph: <span className="font-jp text-2xl font-bold">ア</span>,
              title: '46 Katakana & Loanwords',
              desc: 'Master menu & Tokyo loanwords plus Dakuten and Yōon combos.',
              actionLabel: 'Open Katakana',
              onClick: () => onNavigateTab('foundations'),
            },
            {
              glyph: <span className="font-jp text-2xl font-bold">五</span>,
              title: 'JLPT N5–N1 All Skills',
              desc: 'Train 800+ vocab, grammar, reading, writing, listening & speaking.',
              actionLabel: 'Open JLPT Studio',
              onClick: () => onNavigateTab('lessons'),
            },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="group akujin-card-lift akujin-btn-press rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525] p-5 text-left flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#D92525] dark:text-rose-400 flex items-center justify-center border border-[#D92525]/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  {card.glyph}
                </div>
                <h3 className="text-base font-bold text-[#141413] dark:text-white group-hover:text-[#D92525] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92525] dark:text-rose-400">
                {card.actionLabel}
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Video Lessons Studio */}
      <div id="video-academy">
        <InteractiveVideoStudio
          masteredItemIds={masteredItemIds}
          onCompleteChapter={onMasterItem}
          onNavigateFoundations={() => onNavigateTab('foundations')}
        />
      </div>

      {/* Every Way to Japan — Pathways Grid */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 grid lg:grid-cols-12 gap-6 items-center">
        <div
          data-reveal="true"
          data-reveal-variant="fade-left"
          className="lg:col-span-5 space-y-4"
        >
          <div className="akujin-img-zoom rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] p-2 shadow-xs">
            <div className="overflow-hidden rounded-xl">
              <img
                src="/images/guide_japan_pathways_1794838255462.jpg"
                alt="Shinkansen bullet train passing Mount Fuji beneath clear blue skies"
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover rounded-xl"
              />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
            Built for university applicants, MEXT scholars, global engineers, and anime lovers aiming for real Japanese fluency.
          </p>
        </div>

        <div
          data-reveal="true"
          data-reveal-variant="fade-right"
          className="lg:col-span-7 space-y-5"
        >
          <div>
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              進路ガイド · Every Way to Japan
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
              Structured Goals From{' '}
              <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
                Classroom to Tokyo.
              </span>
            </h2>
          </div>

          <div data-reveal-stagger="true" className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: <GraduationCap className="w-4 h-4 text-[#D92525]" />,
                stamp: '学',
                title: 'Study at Japanese Universities',
                text: 'Master N5–N3 foundations and EJU/JLPT academic reading comprehension.',
              },
              {
                icon: <Award className="w-4 h-4 text-[#D92525]" />,
                stamp: '奨',
                title: 'MEXT & Scholarship Readiness',
                text: 'Build interview-grade Keigo speaking fluency and formal essay writing skills.',
              },
              {
                icon: <Briefcase className="w-4 h-4 text-[#D92525]" />,
                stamp: '働',
                title: 'Engineering & Tech Careers',
                text: 'Advance to JLPT N2/N1 business vocabulary, email etiquette, and meetings.',
              },
              {
                icon: <Globe className="w-4 h-4 text-[#D92525]" />,
                stamp: '語',
                title: 'Travel & Cultural Immersion',
                text: 'Practice real Izakaya, Konbini, and Shinkansen dialogues with native pitch cadence.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="akujin-card-lift rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#141413] dark:text-white">
                    {item.icon}
                    {item.title}
                  </span>
                  <span className="font-jp text-sm font-bold text-[#D92525]">{item.stamp}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JLPT N5 to N1 Complete Roadmap & Exam Strategy */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              道 · Complete N5 to N1 Curriculum
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-white mt-1">
              Your JLPT Roadmap &amp;{' '}
              <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
                Exam Score Playbook.
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {!allVisible && onShowAllVisibleLevels && (
              <button
                type="button"
                onClick={onShowAllVisibleLevels}
                className="px-2.5 py-1.5 rounded-lg border border-[#D92525]/35 bg-rose-50/70 dark:bg-rose-950/30 text-[11px] font-semibold text-[#D92525] dark:text-rose-300 hover:bg-rose-100/80 cursor-pointer transition-colors"
              >
                Show All N5–N1
              </button>
            )}
            <div
              role="tablist"
              aria-label="Select JLPT track level"
              data-testid="overview-playbook-tablist"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800"
            >
              {visibleTracks.map((track) => {
                const active = activeTrack.level === track.level;
                return (
                  <button
                    key={track.level}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => onSelectLevel(track.level)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#D92525] text-white'
                        : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                    }`}
                  >
                    {track.level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
                <span className="font-jp font-semibold text-[#D92525] dark:text-rose-400">
                  {activeTrack.japaneseName}
                </span>
                <span className="font-mono-nums">
                  {activeTrack.targetHours} · {activeTrack.kanjiGoal} Kanji ·{' '}
                  {activeTrack.vocabGoal.toLocaleString()} Words
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#141413] dark:text-white">
                {activeTrack.level}: {activeTrack.title}
              </h3>

              <p className="text-sm sm:text-base text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activeTrack.summary}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {activeTrack.skillPillars.map((pillar) => (
                  <div
                    key={pillar.skill}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1C1F28] border border-stone-200/70 dark:border-zinc-800"
                  >
                    <p className="text-xs font-semibold text-[#141413] dark:text-white">
                      {pillar.skill}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      {pillar.focus}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-600 dark:text-zinc-400">
                Ready to practice {activeTrack.level} drills?
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('lessons')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Practice {activeTrack.level} Now
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-4">
              <h3 className="text-base font-bold text-[#141413] dark:text-white">
                JLPT {activeTrack.level} High-Score Tactics
              </h3>
              <ul className="space-y-3">
                {activeTrack.examTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-zinc-300 leading-relaxed"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-[#D92525] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('lessons')}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413] dark:text-white">
                      6 Separate Skill Labs + Nuance Slider
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Vocab, Grammar, Reading, Writing, Listening &amp; Speaking
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('kanji')}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413] dark:text-white">
                      Spaced Repetition Kanji + Full 2,136 Jōyō Directory
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Stroke order canvas &amp; interactive radical trees
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('resources')}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413] dark:text-white">
                      Free Books, PDFs &amp; YouTube Video Hub
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Genki, Minna no Nihongo, NihonGoal, ToKini Andy, Misa, Dogen &amp; more
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('scenarios')}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413] dark:text-white">
                      Izakaya, Station &amp; Konbini
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Interactive word-clickable dialogues
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 30-Day Kanji Mastery Trend (Recharts) */}
      <KanjiMasteryTrendChart
        srsProgress={srsProgress}
        darkMode={darkMode}
        visibleLevels={activeVisibleLevels}
        onOpenKanjiSrs={() => onNavigateTab('kanji')}
      />

      {/* Script Audio Quick Preview */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white">
              Script Audio Preview — Tap Any Character
            </h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400">
              Preview the first 15 kana here, or open Foundations to practice all 46 Hiragana &amp; 46 Katakana with tracing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setKanaScript('hiragana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  kanaScript === 'hiragana'
                    ? 'bg-white dark:bg-[#232632] text-[#141413] dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                Hiragana (あ)
              </button>
              <button
                type="button"
                onClick={() => setKanaScript('katakana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  kanaScript === 'katakana'
                    ? 'bg-white dark:bg-[#232632] text-[#141413] dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                Katakana (ア)
              </button>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('foundations')}
              className="px-3.5 py-2 rounded-xl bg-[#D92525] text-white text-xs font-semibold cursor-pointer"
            >
              View All 46 →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-15 gap-2">
          {kanaList.map((item) => {
            const playing = activeKana === item.kana;
            return (
              <button
                key={item.kana}
                type="button"
                onClick={() => handlePlayKana(item.kana)}
                aria-label={`Play ${item.kana} (${item.romaji})`}
                className={`group flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all cursor-pointer ${
                  playing
                    ? 'border-[#D92525] bg-[#D92525]/10 scale-[1.03]'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] hover:border-[#D92525]/50'
                }`}
              >
                <span className="font-jp text-2xl font-bold text-[#141413] dark:text-white">
                  {item.kana}
                </span>
                <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400 mt-0.5">
                  {showRomaji ? item.romaji : '···'}
                </span>
                <Volume2
                  className={`w-3 h-3 mt-1 transition-opacity ${
                    playing
                      ? 'text-[#D92525] opacity-100'
                      : 'text-stone-400 opacity-0 group-hover:opacity-100'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 space-y-5">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            よくある質問 · Questions People Ask
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Answers Before You Start.
          </h2>
        </div>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((faq, idx) => {
            const open = openFaqIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaqIdx(open ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-bold text-[#141413] dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
                      open ? 'rotate-180 text-[#D92525]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <p className="px-5 pb-4 text-xs sm:text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Section ("Still have queries or doubts?") */}
      <ContactSection defaultEmail={userEmail} defaultName={learnerName} />

      {/* Daily Changing Motivational Quote of the Day */}
      <QuoteOfTheDaySection />
    </div>
  );
};

