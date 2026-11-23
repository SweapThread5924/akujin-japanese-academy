import React, { useState } from 'react';
import { Flame, Moon, Sun, Trophy, BookOpen, Download, Volume2, VolumeX, LogIn, LogOut, Sparkles } from 'lucide-react';
import { getLearnerRank, isStreakOnFire, type JlptLevel } from '../utils/srsEngine';
import { usePWAInstall, useOnlineStatus } from '../utils/speechAndPwa';
import { JlptLevelBadge } from './JlptLevelBadge';
import {
  getLearnerInitials,
  type DailyStudyGoalMinutes,
} from '../utils/dailyStudyGoal';
import { getQuoteOfTheDay } from '../utils/dailyQuotes';
import type { StartingTrackId } from '../utils/onboardingProfile';

export type AppTab =
  | 'overview'
  | 'roadmap'
  | 'foundations'
  | 'lessons'
  | 'kanji'
  | 'scenarios'
  | 'study-japan'
  | 'resources'
  | 'leaderboard'
  | 'gmail';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  showRomaji: boolean;
  onToggleRomaji: () => void;
  onRestoreHearts: () => void;
  streakFreezes?: number;
  targetLevel: JlptLevel;
  startingTrack?: StartingTrackId | null;
  onboardingCompleted?: boolean;
  onOpenOnboarding: () => void;
  learnerName: string;
  dailyStudyGoalMinutes: DailyStudyGoalMinutes;
  todayMinutesStudied: number;
  authEmail?: string | null;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'foundations', label: 'Foundations' },
  { id: 'lessons', label: 'JLPT N5–N1' },
  { id: 'kanji', label: 'Kanji SRS' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'study-japan', label: 'Study in Japan' },
  { id: 'resources', label: 'Resources' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'gmail', label: 'Gmail' },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  xp,
  streak,
  hearts,
  maxHearts,
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
  showFurigana,
  onToggleFurigana,
  showRomaji,
  onToggleRomaji,
  onRestoreHearts,
  streakFreezes = 0,
  targetLevel,
  startingTrack = null,
  onboardingCompleted = false,
  onOpenOnboarding,
  learnerName,
  dailyStudyGoalMinutes,
  todayMinutesStudied,
  authEmail,
  onOpenAuthModal,
  onLogout,
}) => {
  const rank = getLearnerRank(xp);
  const streakOnFire = isStreakOnFire(streak);
  const avatarInitials = getLearnerInitials(learnerName);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = React.useRef<HTMLElement | null>(null);
  const dailyQuote = getQuoteOfTheDay();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof document === 'undefined') return;
    const syncHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--akujin-header-height', `${h}px`);
      }
    };
    syncHeight();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-stone-200/80 dark:border-zinc-800 bg-[#FCFBF8]/95 dark:bg-[#0D0E12]/95 backdrop-blur-md transition-all duration-300 ${
        scrolled ? 'shadow-md shadow-stone-900/5 dark:shadow-black/30' : ''
      }`}
    >
      {/* Primary 3-zone Top Bar */}
      <div className="mx-auto max-w-[1280px] px-2.5 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="group flex items-center gap-1.5 sm:gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D92525] rounded-md cursor-pointer akujin-btn-press"
        >
          <span className="inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-[#D92525] text-white font-jp font-bold text-xs sm:text-sm transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
            学
          </span>
          <span className="text-sm sm:text-lg font-bold tracking-tight text-[#141413] dark:text-white transition-colors group-hover:text-[#D92525] dark:group-hover:text-rose-400">
            AkuJin
          </span>
        </button>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-2 2xl:gap-3 min-w-0">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative py-2 text-[11px] lg:text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer akujin-btn-press ${
                  active
                    ? 'text-[#D92525] dark:text-rose-400 font-semibold'
                    : 'text-stone-600 hover:text-[#141413] dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="animate-nav-underline absolute inset-x-0 bottom-0 h-0.5 bg-[#D92525] dark:bg-rose-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Gamified HUD + Primary Action */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          {/* Streak Counter */}
          <div
            data-testid="streak-counter"
            data-streak-fire={streakOnFire ? 'true' : 'false'}
            className={`relative flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-mono-nums whitespace-nowrap transition-colors ${
              streakOnFire
                ? 'streak-fire-badge border-amber-400/80 dark:border-amber-500/45 bg-gradient-to-r from-amber-50 via-rose-50/80 to-amber-50 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-950/40'
                : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F]'
            }`}
            title={
              `${
                streakOnFire
                  ? `${streak}-day study streak — On fire!`
                  : 'Daily study streak'
              }${streakFreezes > 0 ? ` · ${streakFreezes} Streak Freeze equipped` : ''}`
            }
          >
            <span className="relative inline-flex items-center justify-center" aria-hidden="true">
              <Flame
                className={`w-3.5 h-3.5 ${
                  streakOnFire
                    ? 'animate-streak-flame fill-amber-400 text-[#D92525] dark:fill-amber-400 dark:text-rose-400'
                    : 'text-[#D92525]'
                }`}
              />
              {streakOnFire && (
                <>
                  <span className="animate-streak-ember pointer-events-none absolute -top-0.5 left-0.5 h-1 w-1 rounded-full bg-amber-400" />
                  <span className="animate-streak-ember-delayed pointer-events-none absolute -top-0.5 right-0.5 h-1 w-1 rounded-full bg-[#D92525]" />
                </>
              )}
            </span>
            <span
              className={`font-semibold ${
                streakOnFire
                  ? 'text-[#B91C1C] dark:text-amber-300'
                  : 'text-[#141413] dark:text-zinc-100'
              }`}
            >
              {streak}d
            </span>
          </div>

          {/* XP Points Bar */}
          <div
            className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] whitespace-nowrap"
            title={`${rank.title} (${xp} XP / ${rank.nextXp} XP)`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span className="text-xs font-mono-nums font-semibold text-[#141413] dark:text-zinc-100">
              {xp} XP
            </span>
            <div className="w-14 h-1.5 rounded-full bg-stone-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full bg-[#D92525] transition-all duration-300"
                style={{ width: `${rank.progressPct}%` }}
              />
            </div>
          </div>

          {/* Global Sound FX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Sound effects on' : 'Sound effects muted'}
            className={`p-1 sm:p-2 rounded-lg border akujin-btn-press cursor-pointer ${
              soundEnabled
                ? 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200 hover:border-[#D92525]/50'
                : 'border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-[#16181F] text-stone-400 dark:text-zinc-500 hover:border-stone-300 dark:hover:border-zinc-700'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            data-testid="topnav-darkmode-toggle"
            data-theme={darkMode ? 'dark' : 'light'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={darkMode}
            className="group p-1 sm:p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200 hover:border-[#D92525]/50 akujin-btn-press cursor-pointer"
          >
            <span className="relative inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4">
              <Sun
                data-testid="topnav-icon-sun"
                aria-hidden="true"
                className={`akujin-theme-icon absolute inset-0 w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  darkMode
                    ? 'opacity-100 rotate-0 scale-100 text-amber-400 group-hover:rotate-45'
                    : 'opacity-0 -rotate-90 scale-50 pointer-events-none'
                }`}
              />
              <Moon
                data-testid="topnav-icon-moon"
                aria-hidden="true"
                className={`akujin-theme-icon absolute inset-0 w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  !darkMode
                    ? 'opacity-100 rotate-0 scale-100 group-hover:-rotate-12'
                    : 'opacity-0 rotate-90 scale-50 pointer-events-none'
                }`}
              />
            </span>
          </button>

          {/* Log In / Sign Up or Signed-in Status */}
          {authEmail ? (
            <button
              type="button"
              onClick={onLogout}
              data-testid="topnav-logout-btn"
              aria-label="Log out"
              title={`Signed in as ${authEmail}. Click to sign out.`}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-[11px] sm:text-xs font-semibold text-[#141413] dark:text-zinc-100 hover:border-[#D92525] whitespace-nowrap shrink-0 cursor-pointer akujin-btn-press"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              data-testid="topnav-login-btn"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-[11px] sm:text-xs font-semibold text-[#141413] dark:text-zinc-100 hover:border-[#D92525] whitespace-nowrap shrink-0 cursor-pointer akujin-btn-press"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              <span>Log in</span>
            </button>
          )}

          {/* User Profile Avatar Button */}
          <button
            type="button"
            onClick={() => onSelectTab('leaderboard')}
            data-testid="topnav-profile-avatar"
            aria-label={`Profile (${learnerName})`}
            title={`Open Profile (${learnerName})`}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 border-stone-200 dark:border-zinc-700 bg-[#141413] dark:bg-zinc-100 text-white dark:text-[#141413] text-[10px] sm:text-[11px] font-bold font-mono-nums shrink-0 cursor-pointer hover:border-[#D92525] hover:scale-105 akujin-btn-press focus-visible:outline-2 focus-visible:outline-[#D92525]"
          >
            {avatarInitials}
          </button>
        </div>
      </div>

      {/* Compact Inspiring Quote Strip & Mobile Tab Navigation */}
      <div className="border-t border-stone-200/70 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-[#121319]">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-6 py-1.5 flex items-center justify-between gap-3">
          {/* Mobile & Tablet Tab Strip fitted cleanly below xl */}
          <nav aria-label="Mobile navigation" className="flex xl:hidden flex-wrap items-center justify-center w-full gap-1 sm:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 akujin-btn-press ${
                    active
                      ? 'bg-[#D92525] text-white shadow-xs'
                      : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-200/60 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Dynamic Track Badge + Famous Personality Daily Quote */}
          <div className="hidden xl:flex items-center gap-3 min-w-0 text-xs text-stone-600 dark:text-zinc-300">
            <JlptLevelBadge
              level={targetLevel}
              startingTrack={startingTrack}
              onboardingCompleted={onboardingCompleted}
              variant="compact"
              testId="topnav-jlpt-badge"
              onClick={onOpenOnboarding}
            />
            <span
              data-testid="topnav-inspiring-quote"
              className="inline-flex items-center gap-1.5 truncate text-stone-700 dark:text-zinc-200"
              title={`${dailyQuote.quote} — ${dailyQuote.author}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D92525] shrink-0" aria-hidden="true" />
              <span className="italic truncate">“{dailyQuote.quote}”</span>
              <span className="font-semibold text-[#141413] dark:text-white whitespace-nowrap shrink-0">
                — {dailyQuote.author}
              </span>
            </span>
            {!isOnline && (
              <span className="text-[11px] font-mono-nums text-amber-700 dark:text-amber-300 whitespace-nowrap shrink-0">
                · Offline Mode
              </span>
            )}
          </div>

          {/* Reading Aids: Furigana & Romaji Toggles + PWA Install */}
          <div className="hidden xl:flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={onToggleFurigana}
              aria-pressed={showFurigana}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                showFurigana
                  ? 'bg-white dark:bg-[#1E2029] border-[#D92525]/50 text-[#D92525] dark:text-rose-400'
                  : 'bg-transparent border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Furigana: {showFurigana ? 'On' : 'Off'}
            </button>

            <button
              type="button"
              onClick={onToggleRomaji}
              aria-pressed={showRomaji}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                showRomaji
                  ? 'bg-white dark:bg-[#1E2029] border-[#D92525]/50 text-[#D92525] dark:text-rose-400'
                  : 'bg-transparent border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              Romaji: {showRomaji ? 'On' : 'Off'}
            </button>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#141413] text-white dark:bg-white dark:text-[#141413] whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3 h-3" aria-hidden="true" />
                Install App
              </button>
            )}

            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 whitespace-nowrap cursor-pointer"
              >
                Install iOS
              </button>
            )}
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#16181F] p-6 border border-stone-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-[#141413] dark:text-white">
              Install AkuJin on iOS
            </h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
              1. Tap Share in Safari.
              <br />
              2. Choose Add to Home Screen to study offline anytime.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-[#D92525] py-2 text-sm font-semibold text-white cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
