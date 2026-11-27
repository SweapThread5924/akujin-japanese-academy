import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  ChevronRight,
  ChevronUp,
  Flame,
  Mail,
  Snowflake,
  X,
  Zap,
} from 'lucide-react';
import { buildQuickActionSummary, getLocalDateKey } from '../utils/quickActions';
import type { DailyStudyGoalMinutes } from '../utils/dailyStudyGoal';

interface QuickActionMenuProps {
  isGmailOpen: boolean;
  isGmailConnected: boolean;
  gmailEmail?: string | null;
  streak: number;
  streakFreezes: number;
  lastStudyDate: string;
  unlockedAchievements: string[];
  xp: number;
  dailyStudyGoalMinutes: DailyStudyGoalMinutes;
  todayMinutesStudied: number;
  onOpenGmail: () => void;
  onOpenAchievements: () => void;
  onOpenStreakStatus: () => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isGmailOpen,
  isGmailConnected,
  gmailEmail,
  streak,
  streakFreezes,
  lastStudyDate,
  unlockedAchievements,
  xp,
  dailyStudyGoalMinutes,
  todayMinutesStudied,
  onOpenGmail,
  onOpenAchievements,
  onOpenStreakStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const summary = useMemo(
    () =>
      buildQuickActionSummary({
        streak,
        streakFreezes,
        lastStudyDate,
        todayDateKey: getLocalDateKey(),
        unlockedAchievementIds: unlockedAchievements,
        xp,
        dailyGoalMinutes: dailyStudyGoalMinutes,
        todayMinutesStudied,
        isGmailConnected,
        gmailEmail,
      }),
    [
      streak,
      streakFreezes,
      lastStudyDate,
      unlockedAchievements,
      xp,
      dailyStudyGoalMinutes,
      todayMinutesStudied,
      isGmailConnected,
      gmailEmail,
    ]
  );

  useEffect(() => {
    if (isGmailOpen) {
      setIsOpen(false);
    }
  }, [isGmailOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const streakBadgeTone =
    summary.streak.state === 'active-today'
      ? 'text-emerald-700 dark:text-emerald-400'
      : summary.streak.state === 'freeze-ready'
      ? 'text-sky-700 dark:text-sky-400'
      : summary.streak.state === 'needs-study'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-stone-500 dark:text-zinc-400';

  return (
    <div
      ref={containerRef}
      data-testid="quick-action-container"
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5"
    >
      {isOpen && (
        <div
          id="quick-action-popover"
          role="region"
          aria-label="Quick Actions menu"
          data-testid="quick-action-menu"
          className="animate-popover-in w-[min(calc(100vw-2.5rem),344px)] rounded-2xl bg-[#FCFBF8] dark:bg-[#16181F] border border-stone-200 dark:border-zinc-700/90 shadow-2xl shadow-stone-900/20 dark:shadow-black/65 overflow-hidden"
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200/80 dark:border-zinc-800 bg-white/85 dark:bg-[#12141B]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-[#D92525] dark:text-rose-400 truncate">
                クイック操作 · Quick Actions
              </p>
            </div>
            <span className="text-xs font-mono-nums font-bold text-[#141413] dark:text-white shrink-0">
              {summary.xp.toLocaleString()} XP
            </span>
          </div>

          {/* Interactive Quick Actions List */}
          <div className="divide-y divide-stone-200/80 dark:divide-zinc-800">
            {/* 1. Gmail Study Workspace */}
            <button
              type="button"
              data-testid="quick-action-gmail"
              onClick={() => {
                setIsOpen(false);
                onOpenGmail();
              }}
              className="w-full min-h-[60px] px-4 py-3 flex items-center gap-3 text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/55 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D92525] transition-colors cursor-pointer"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/45 text-[#D92525] dark:text-rose-400 shrink-0">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#141413] dark:text-white truncate">
                    Gmail Study Inbox
                  </span>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                      summary.gmail.connected
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-[#D92525] dark:text-rose-400'
                    }`}
                  >
                    {summary.gmail.statusLabel}
                  </span>
                </span>
                <span className="block text-xs text-stone-600 dark:text-zinc-300 truncate mt-0.5">
                  {summary.gmail.detailText}
                </span>
              </span>
              <ChevronRight
                className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0"
                aria-hidden="true"
              />
            </button>

            {/* 2. Achievements & Hanko Seals */}
            <button
              type="button"
              data-testid="quick-action-achievements"
              onClick={() => {
                setIsOpen(false);
                onOpenAchievements();
              }}
              className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/55 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D92525] transition-colors cursor-pointer"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0">
                <Award className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#141413] dark:text-white truncate">
                    Achievements
                  </span>
                  <span
                    data-testid="quick-action-achievements-count"
                    className="text-xs font-mono-nums font-bold text-[#141413] dark:text-zinc-200 whitespace-nowrap shrink-0"
                  >
                    {summary.achievements.unlockedCount}/{summary.achievements.totalCount}
                  </span>
                </span>
                <span className="block text-xs text-stone-600 dark:text-zinc-300 truncate">
                  {summary.achievements.summaryText}
                </span>
                <span className="block h-1 w-full rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-[#D92525] transition-all duration-300"
                    style={{ width: `${summary.achievements.completionPct}%` }}
                  />
                </span>
              </span>
              <ChevronRight
                className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0"
                aria-hidden="true"
              />
            </button>

            {/* 3. Study Streak Status & Freeze Vault */}
            <button
              type="button"
              data-testid="quick-action-streak"
              onClick={() => {
                setIsOpen(false);
                onOpenStreakStatus();
              }}
              className="w-full min-h-[62px] px-4 py-3 flex items-center gap-3 text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/55 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D92525] transition-colors cursor-pointer"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  summary.streak.days > 0
                    ? 'bg-orange-50 dark:bg-orange-950/45 text-[#D92525] dark:text-rose-400'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300'
                }`}
              >
                <Flame className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span
                    data-testid="quick-action-streak-headline"
                    className="text-sm font-bold text-[#141413] dark:text-white truncate"
                  >
                    Study Streak · {summary.streak.headline}
                  </span>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${streakBadgeTone}`}
                  >
                    {summary.streak.statusLabel}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs font-mono-nums text-stone-600 dark:text-zinc-300 truncate">
                  <Snowflake className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{summary.streak.detailText}</span>
                </span>
              </span>
              <ChevronRight
                className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      )}

      {/* Prominent Persistent Bottom-Right Quick Action Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-testid="quick-action-trigger"
        aria-expanded={isOpen}
        aria-controls="quick-action-popover"
        aria-label={isOpen ? 'Close Quick Actions menu' : 'Open Quick Actions menu'}
        title="Quick Actions · Gmail, Achievements & Study Streak"
        className="akujin-btn-press inline-flex items-center gap-2.5 h-12 min-h-[44px] pl-2 pr-3.5 rounded-2xl bg-[#141413] dark:bg-[#1B1F2A] border border-stone-800 dark:border-zinc-700 text-white shadow-xl shadow-stone-900/25 dark:shadow-black/60 hover:border-[#D92525] dark:hover:border-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D92525] cursor-pointer transition-colors"
      >
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-[#D92525] text-white shrink-0">
          {isOpen ? (
            <X className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Zap className="w-4 h-4" aria-hidden="true" />
          )}
        </span>

        <span className="text-xs sm:text-[13px] font-bold tracking-tight whitespace-nowrap shrink-0">
          Quick Actions
        </span>

        <span
          aria-hidden="true"
          className="hidden sm:inline-flex items-center gap-2 pl-2.5 border-l border-white/15 text-[11px] font-mono-nums text-zinc-200 whitespace-nowrap shrink-0"
        >
          <Mail
            className={`w-3.5 h-3.5 ${
              summary.gmail.connected ? 'text-emerald-400' : 'text-rose-300'
            }`}
          />
          <span className="inline-flex items-center gap-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {summary.streak.days}d
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Award className="w-3.5 h-3.5 text-rose-300" />
            {summary.achievements.unlockedCount}
          </span>
        </span>

        <ChevronUp
          aria-hidden="true"
          className={`w-4 h-4 text-zinc-300 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
};
