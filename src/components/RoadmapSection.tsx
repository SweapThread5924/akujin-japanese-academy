import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  Target,
  Award,
  Clock,
  PartyPopper,
  X,
} from 'lucide-react';
import type { JlptLevel, SrsCardProgress } from '../utils/srsEngine';
import {
  isAllJlptLevelsVisible,
  normalizeVisibleJlptLevels,
  resolveActiveVisibleLevel,
} from '../utils/jlptVisibility';
import {
  buildJlptRoadmapMilestones,
  type JlptRoadmapMilestone,
} from '../utils/jlptRoadmap';
import { ConfettiBurst } from './ConfettiBurst';
import {
  detectNewRoadmapAchievements,
  pickHeadlineAchievement,
  readCelebratedMilestones,
  writeCelebratedMilestones,
  type CelebratedMilestonesRecord,
  type RoadmapCelebrationEvent,
} from '../utils/roadmapCelebration';

interface RoadmapSectionProps {
  xp: number;
  targetLevel: JlptLevel;
  visibleLevels?: JlptLevel[];
  onResetVisibleLevels?: () => void;
  srsProgress: Record<string, SrsCardProgress>;
  masteredItemIds: string[];
  quizCorrectTotal: number;
  onSelectTargetLevel: (level: JlptLevel) => void;
  onOpenLessonsForLevel: (level: JlptLevel) => void;
  onOpenKanjiSrs: () => void;
}

const ROADMAP_GRID_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1 lg:grid-cols-1 max-w-md mx-auto',
  2: 'sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-5',
};

const STATUS_STYLES: Record<
  JlptRoadmapMilestone['status'],
  { label: string; badgeClass: string; nodeRingClass: string }
> = {
  mastered: {
    label: 'Mastered',
    badgeClass:
      'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    nodeRingClass:
      'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/25',
  },
  'in-progress': {
    label: 'In Progress',
    badgeClass:
      'bg-rose-100 dark:bg-rose-950/50 text-[#D92525] dark:text-rose-300 border-[#D92525]/40',
    nodeRingClass:
      'border-[#D92525] bg-rose-50/60 dark:bg-rose-950/25',
  },
  unlocked: {
    label: 'Unlocked',
    badgeClass:
      'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
    nodeRingClass:
      'border-sky-400 dark:border-sky-600 bg-white dark:bg-[#16181F]',
  },
  locked: {
    label: 'Locked',
    badgeClass:
      'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border-stone-200 dark:border-zinc-700',
    nodeRingClass:
      'border-dashed border-stone-300 dark:border-zinc-700 bg-stone-50/70 dark:bg-[#101218] opacity-80',
  },
};

interface LevelMasteryRingProps {
  level: JlptLevel;
  japaneseSeal: string;
  masteryPct: number;
  status: JlptRoadmapMilestone['status'];
  isUnlocked: boolean;
}

const RING_SIZE = 56;
const RING_STROKE = 3.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2 - 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const LevelMasteryRing: React.FC<LevelMasteryRingProps> = ({
  level,
  japaneseSeal,
  masteryPct,
  status,
  isUnlocked,
}) => {
  const clampedPct = isUnlocked
    ? Math.max(0, Math.min(100, Math.round(masteryPct)))
    : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - clampedPct / 100);

  const progressStrokeClass =
    status === 'mastered'
      ? 'stroke-emerald-500 dark:stroke-emerald-400'
      : isUnlocked
      ? 'stroke-[#D92525] dark:stroke-rose-400'
      : 'stroke-stone-300 dark:stroke-zinc-700';

  const sealClass =
    status === 'mastered'
      ? 'bg-emerald-600 text-white border-emerald-600'
      : isUnlocked
      ? 'bg-[#D92525] text-white border-[#D92525]'
      : 'bg-stone-200 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border-stone-300 dark:border-zinc-700';

  return (
    <div
      role="progressbar"
      aria-label={`JLPT ${level} mastery ${clampedPct}%`}
      aria-valuenow={clampedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid={`roadmap-ring-${level}`}
      data-progress={clampedPct}
      title={`JLPT ${level}: ${clampedPct}% mastery`}
      className="relative h-14 w-14 shrink-0 flex items-center justify-center"
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="w-14 h-14 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
          className="stroke-stone-200 dark:stroke-zinc-800"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={`${progressStrokeClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <span
        className={`absolute h-10 w-10 rounded-full font-jp text-xs font-black flex items-center justify-center border shadow-xs ${sealClass}`}
      >
        {japaneseSeal}
      </span>
    </div>
  );
};

let nextGlobalBurstId = 1;

export const RoadmapSection: React.FC<RoadmapSectionProps> = ({
  xp,
  targetLevel,
  visibleLevels,
  onResetVisibleLevels,
  srsProgress,
  masteredItemIds,
  quizCorrectTotal,
  onSelectTargetLevel,
  onOpenLessonsForLevel,
  onOpenKanjiSrs,
}) => {
  const activeVisibleLevels = useMemo(
    () => normalizeVisibleJlptLevels(visibleLevels),
    [visibleLevels]
  );
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);

  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>(() =>
    resolveActiveVisibleLevel(targetLevel, activeVisibleLevels)
  );
  const [hoveredLevel, setHoveredLevel] = useState<JlptLevel | null>(null);
  const [tappedPopoverLevel, setTappedPopoverLevel] = useState<JlptLevel | null>(null);
  const [activeBurstId, setActiveBurstId] = useState<number>(0);
  const [celebrationBanner, setCelebrationBanner] = useState<RoadmapCelebrationEvent | null>(null);
  const pathContainerRef = useRef<HTMLDivElement | null>(null);
  const celebratedRef = useRef<CelebratedMilestonesRecord>(readCelebratedMilestones());

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (
        pathContainerRef.current &&
        !pathContainerRef.current.contains(event.target as Node)
      ) {
        setTappedPopoverLevel(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTappedPopoverLevel(null);
        setHoveredLevel(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roadmap = useMemo(
    () =>
      buildJlptRoadmapMilestones({
        xp,
        targetLevel,
        srsProgress,
        masteredItemIds,
        quizCorrectTotal,
      }),
    [xp, targetLevel, srsProgress, masteredItemIds, quizCorrectTotal]
  );

  useEffect(() => {
    const { events, nextCelebrated } = detectNewRoadmapAchievements(
      roadmap.milestones,
      celebratedRef.current
    );
    if (events.length === 0) return;

    celebratedRef.current = nextCelebrated;
    writeCelebratedMilestones(nextCelebrated);

    const headline = pickHeadlineAchievement(events);
    if (headline) {
      setCelebrationBanner(headline);
      setSelectedLevel(headline.level);
    }
    setActiveBurstId(nextGlobalBurstId++);
  }, [roadmap.milestones]);

  useEffect(() => {
    if (!celebrationBanner) return;
    const timer = window.setTimeout(() => {
      setCelebrationBanner(null);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [celebrationBanner]);

  useEffect(() => {
    setSelectedLevel((curr) => resolveActiveVisibleLevel(curr, activeVisibleLevels));
  }, [activeVisibleLevels]);

  const visibleMilestones = useMemo(
    () => roadmap.milestones.filter((m) => activeVisibleLevels.includes(m.level)),
    [roadmap.milestones, activeVisibleLevels]
  );

  const effectiveSelectedLevel = resolveActiveVisibleLevel(selectedLevel, activeVisibleLevels);

  const activeMilestone =
    visibleMilestones.find((m) => m.level === effectiveSelectedLevel) ??
    visibleMilestones[0] ??
    roadmap.milestones[0];

  const visibleUnlockedCount = visibleMilestones.filter((m) => m.isUnlocked).length;

  const progressTrackWidthPct =
    visibleMilestones.length > 1
      ? Math.round(
          ((Math.max(1, visibleUnlockedCount) - 1) / (visibleMilestones.length - 1)) * 100
        )
      : 100;

  return (
    <div
      data-testid="roadmap-section"
      className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-8"
    >
      <ConfettiBurst
        burstKey={activeBurstId}
        onComplete={() => setActiveBurstId(0)}
      />

      {celebrationBanner && (
        <div
          role="status"
          aria-live="polite"
          data-testid="roadmap-celebration-banner"
          className="animate-welcome-pop rounded-2xl border border-emerald-300/80 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50 via-white to-rose-50 dark:from-emerald-950/40 dark:via-[#16181F] dark:to-rose-950/30 px-4 py-3.5 shadow-sm flex items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="h-9 w-9 shrink-0 rounded-xl bg-[#D92525] text-white flex items-center justify-center shadow-xs">
              <PartyPopper className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-[#141413] dark:text-white">
                {celebrationBanner.headline}
              </p>
              <p className="text-xs text-stone-600 dark:text-zinc-300">
                {celebrationBanner.subtext}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="roadmap-celebration-dismiss"
            aria-label="Dismiss milestone celebration"
            onClick={() => setCelebrationBanner(null)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#141413] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header + Overall Mastery Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            道程・JLPT N5 → N1 Progression Path
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white">
            Interactive JLPT{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Mastery Roadmap.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 max-w-2xl">
            Hover or tap any milestone from JLPT N5 through N1 to inspect item mastery counts, unlock requirements, and jump straight into focused practice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!allVisible && onResetVisibleLevels && (
            <button
              type="button"
              data-testid="roadmap-filter-notice"
              onClick={onResetVisibleLevels}
              className="px-3.5 py-2 rounded-xl border border-[#D92525]/35 bg-rose-50/70 dark:bg-rose-950/30 text-xs font-semibold text-[#D92525] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
            >
              Filtered: {activeVisibleLevels.join(', ')} · Show All (N5–N1)
            </button>
          )}
          <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 px-3.5 py-2 text-xs">
            <span className="text-stone-500 dark:text-zinc-400">Unlocked</span>
            <p
              data-testid="roadmap-unlocked-count"
              className="font-mono-nums font-bold text-[#141413] dark:text-white text-sm"
            >
              {allVisible
                ? `${roadmap.unlockedCount} / 5 Levels`
                : `${visibleUnlockedCount} / ${visibleMilestones.length} Shown`}
            </p>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 px-3.5 py-2 text-xs">
            <span className="text-stone-500 dark:text-zinc-400">Overall Mastery</span>
            <p
              data-testid="roadmap-overall-mastery"
              className="font-mono-nums font-bold text-[#D92525] dark:text-rose-400 text-sm"
            >
              {roadmap.overallMasteryPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Visual Connected Progression Path (N5 -> N4 -> N3 -> N2 -> N1) */}
      <section
        aria-label="JLPT N5 to N1 Milestone Path"
        className="rounded-3xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-6"
      >
        <div ref={pathContainerRef} className="relative">
          {/* Desktop horizontal connecting track line */}
          {visibleMilestones.length >= 2 && (
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-11 left-[10%] right-[10%] h-1 rounded-full bg-stone-200 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D92525] to-emerald-500 transition-all duration-500"
                style={{ width: `${progressTrackWidthPct}%` }}
              />
            </div>
          )}

          <div
            data-reveal-stagger="true"
            className={`grid grid-cols-1 ${
              ROADMAP_GRID_COLS[visibleMilestones.length] ?? 'sm:grid-cols-2 lg:grid-cols-5'
            } gap-4 relative z-10`}
          >
            {visibleMilestones.map((m, idx) => {
              const selected = m.level === activeMilestone.level;
              const style = STATUS_STYLES[m.status];
              const isPopoverOpen =
                hoveredLevel === m.level || tappedPopoverLevel === m.level;

              const popoverAlignClass =
                idx === 0
                  ? 'left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0'
                  : idx === visibleMilestones.length - 1
                  ? 'left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0'
                  : 'left-1/2 -translate-x-1/2';

              const arrowAlignClass =
                idx === 0
                  ? 'left-1/2 -translate-x-1/2 lg:left-8 lg:translate-x-0'
                  : idx === visibleMilestones.length - 1
                  ? 'left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <div
                  key={m.level}
                  className="relative flex flex-col"
                  onMouseEnter={() => setHoveredLevel(m.level)}
                  onMouseLeave={() =>
                    setHoveredLevel((prev) => (prev === m.level ? null : prev))
                  }
                >
                  {/* Tooltip-like Popover (hover on desktop, focus, or tap on mobile) */}
                  {isPopoverOpen && (
                    <div
                      id={`roadmap-popover-${m.level}`}
                      role="tooltip"
                      data-testid={`roadmap-popover-${m.level}`}
                      className={`animate-popover-in pointer-events-none absolute bottom-full mb-2.5 z-30 w-56 max-w-[calc(100vw-2.5rem)] rounded-xl bg-[#141413] dark:bg-zinc-900 text-white border border-zinc-700/80 shadow-xl p-3 text-left ${popoverAlignClass}`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
                        <span className="text-[11px] font-bold tracking-wide text-white">
                          JLPT {m.level} Mastery
                        </span>
                        <span
                          className={`text-xs font-mono-nums font-bold ${
                            m.status === 'mastered'
                              ? 'text-emerald-400'
                              : m.isUnlocked
                              ? 'text-rose-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {m.masteryPct}%
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">Mastered items</span>
                          <span className="font-mono-nums font-semibold text-white">
                            {m.kanjiMasteredCount.toLocaleString()} /{' '}
                            {m.kanjiDeckTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.status === 'mastered'
                                ? 'bg-emerald-400'
                                : m.isUnlocked
                                ? 'bg-[#D92525]'
                                : 'bg-zinc-500'
                            }`}
                            style={{
                              width: `${m.isUnlocked ? Math.max(0, Math.min(100, m.masteryPct)) : 0}%`,
                            }}
                          />
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-snug pt-0.5">
                          {m.isUnlocked
                            ? `${Math.max(0, m.kanjiDeckTotal - m.kanjiMasteredCount).toLocaleString()} items remaining in JLPT ${m.level}.`
                            : `Locked · Unlock at ${m.xpUnlockThreshold.toLocaleString()} XP`}
                        </p>
                      </div>

                      {/* Downward pointer arrow */}
                      <span
                        aria-hidden="true"
                        className={`absolute top-full -mt-1.5 h-3 w-3 rotate-45 bg-[#141413] dark:bg-zinc-900 border-r border-b border-zinc-700/80 ${arrowAlignClass}`}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    data-testid={`roadmap-milestone-${m.level}`}
                    data-status={m.status}
                    data-unlocked={m.isUnlocked ? 'true' : 'false'}
                    aria-pressed={selected}
                    aria-describedby={
                      isPopoverOpen ? `roadmap-popover-${m.level}` : undefined
                    }
                    onFocus={() => setHoveredLevel(m.level)}
                    onBlur={() =>
                      setHoveredLevel((prev) => (prev === m.level ? null : prev))
                    }
                    onClick={() => {
                      setSelectedLevel(m.level);
                      setTappedPopoverLevel((prev) =>
                        prev === m.level ? null : m.level
                      );
                    }}
                    className={`w-full h-full text-left rounded-2xl border-2 p-4 cursor-pointer flex flex-col justify-between gap-3 akujin-card-lift akujin-btn-press ${
                      style.nodeRingClass
                    } ${
                      selected
                        ? 'ring-2 ring-[#D92525]/35 shadow-md'
                        : 'hover:border-[#D92525]/60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Circular Mastery Progress Ring + Lock/Unlock Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <LevelMasteryRing
                          level={m.level}
                          japaneseSeal={m.japaneseSeal}
                          masteryPct={m.masteryPct}
                          status={m.status}
                          isUnlocked={m.isUnlocked}
                        />

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${style.badgeClass}`}
                        >
                          {m.status === 'mastered' ? (
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          ) : m.status === 'locked' ? (
                            <Lock className="w-3 h-3" aria-hidden="true" />
                          ) : m.status === 'in-progress' ? (
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <Unlock className="w-3 h-3" aria-hidden="true" />
                          )}
                          {style.label}
                        </span>
                      </div>

                      {/* Title & Active Target Tag */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-bold font-mono-nums text-[#141413] dark:text-white">
                            JLPT {m.level}
                          </span>
                          {m.isCurrentTarget && (
                            <span className="px-1.5 py-0.5 rounded bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-[9px] font-bold uppercase">
                              Target
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-stone-600 dark:text-zinc-300 mt-0.5 line-clamp-2">
                          {m.title}
                        </p>
                      </div>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono-nums">
                        <span className="text-stone-500 dark:text-zinc-400">
                          {m.isUnlocked ? 'Mastery' : 'Unlock'}
                        </span>
                        <span className="font-bold text-[#141413] dark:text-zinc-200">
                          {m.isUnlocked ? `${m.masteryPct}%` : `${m.xpUnlockThreshold} XP`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            m.status === 'mastered'
                              ? 'bg-emerald-600'
                              : m.isUnlocked
                              ? 'bg-[#D92525]'
                              : 'bg-stone-300 dark:bg-zinc-700'
                          }`}
                          style={{ width: `${m.isUnlocked ? Math.max(4, m.masteryPct) : 0}%` }}
                        />
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Milestone Inspector Panel */}
      <section
        aria-label={`JLPT ${activeMilestone.level} Milestone Details`}
        data-testid="roadmap-detail-panel"
        className="rounded-3xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-6"
      >
        <div
          key={activeMilestone.level}
          className="animate-panel-swap grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left (7 cols): Overview + 4 Skill Milestones */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D92525] text-white text-xs font-mono-nums font-bold">
                  Step {activeMilestone.order} of 5 · JLPT {activeMilestone.level}
                </span>
                <span
                  data-testid="roadmap-detail-status"
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${
                    STATUS_STYLES[activeMilestone.status].badgeClass
                  }`}
                >
                  {activeMilestone.isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {STATUS_STYLES[activeMilestone.status].label}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white">
                JLPT {activeMilestone.level}: {activeMilestone.title}
              </h2>
              <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activeMilestone.subtitle}
              </p>
            </div>

            {/* 4 Core Skill Milestones */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                Core Mastery Checkpoints
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeMilestone.skillsChecklist.map((skill) => (
                  <div
                    key={skill.label}
                    className={`rounded-xl border p-3.5 flex items-start gap-2.5 ${
                      skill.completed
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700/50'
                        : 'bg-stone-50 dark:bg-[#101218] border-stone-200/80 dark:border-zinc-800'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        skill.completed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-300 dark:text-zinc-600'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#141413] dark:text-white">
                        {skill.label}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-snug">
                        {skill.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right (5 cols): Live Level Metrics & Actions */}
          <div className="lg:col-span-5 rounded-2xl bg-stone-50 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#141413] dark:text-white">
                  JLPT {activeMilestone.level} Mastery Progress
                </span>
                <span className="font-mono-nums font-bold text-[#D92525] dark:text-rose-400">
                  {activeMilestone.masteryPct}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeMilestone.status === 'mastered'
                      ? 'bg-emerald-600'
                      : 'bg-[#D92525]'
                  }`}
                  style={{ width: `${activeMilestone.masteryPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-3">
                <Clock className="w-3.5 h-3.5 text-[#D92525] mx-auto" aria-hidden="true" />
                <p className="text-xs font-mono-nums font-bold text-[#141413] dark:text-white mt-1">
                  {activeMilestone.studyHours}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400">Study Est.</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-3">
                <Layers className="w-3.5 h-3.5 text-emerald-600 mx-auto" aria-hidden="true" />
                <p className="text-xs font-mono-nums font-bold text-[#141413] dark:text-white mt-1">
                  {activeMilestone.kanjiTarget.toLocaleString()}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400">Kanji Target</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-3">
                <BookOpen className="w-3.5 h-3.5 text-sky-600 mx-auto" aria-hidden="true" />
                <p className="text-xs font-mono-nums font-bold text-[#141413] dark:text-white mt-1">
                  {activeMilestone.vocabTarget.toLocaleString()}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-zinc-400">Vocab Words</p>
              </div>
            </div>

            {activeMilestone.isUnlocked ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  data-testid="roadmap-study-level-btn"
                  onClick={() => onOpenLessonsForLevel(activeMilestone.level)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Study JLPT {activeMilestone.level} Skill Labs
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenKanjiSrs}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                    Kanji SRS
                  </button>
                  <button
                    type="button"
                    disabled={activeMilestone.isCurrentTarget}
                    onClick={() => onSelectTargetLevel(activeMilestone.level)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] disabled:opacity-55 cursor-pointer disabled:cursor-default"
                  >
                    <Target className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                    {activeMilestone.isCurrentTarget ? 'Active Target' : 'Set as Target'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-white dark:bg-[#16181F] border border-dashed border-stone-300 dark:border-zinc-700 p-3.5 text-xs text-stone-600 dark:text-zinc-300 space-y-1">
                  <p className="font-bold text-[#141413] dark:text-white inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                    Milestone Locked
                  </p>
                  <p>{activeMilestone.unlockRequirement}.</p>
                </div>
                <button
                  type="button"
                  data-testid="roadmap-unlock-target-btn"
                  onClick={() => onSelectTargetLevel(activeMilestone.level)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                  Unlock Now &amp; Set Target to JLPT {activeMilestone.level}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
