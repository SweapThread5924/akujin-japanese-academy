import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Cloud,
  DownloadCloud,
  Bell,
  Wifi,
  WifiOff,
  CheckCircle2,
  Award,
  RefreshCw,
  Snowflake,
  ShieldCheck,
  History,
  Flame,
  Clock,
  Heart,
  BookOpen,
  Bookmark,
  Layers,
  UserCheck,
  LogIn,
  LogOut,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  Compass,
  Edit3,
  Check,
} from 'lucide-react';
import { ACHIEVEMENTS } from '../data/curriculumData';
import {
  triggerStreakNotification,
  useOnlineStatus,
} from '../utils/speechAndPwa';
import { getLearnerRank, type JlptLevel } from '../utils/srsEngine';
import {
  MAX_ACTIVE_STREAK_FREEZES,
  STREAK_FREEZE_COST_XP,
  canPurchaseStreakFreeze,
  type StreakFreezeLogEntry,
} from '../utils/streakFreeze';
import { JLPT_LEVEL_ORDER } from '../utils/jlptBadge';
import {
  buildRealLeaderboard,
  getAchievementSealProgress,
} from '../utils/profileAndLeaderboard';
import {
  getStartingTrackMeta,
  type OnboardingAnswers,
  type StartingTrackId,
} from '../utils/onboardingProfile';
import { formatAudioSpeedLabel } from '../utils/audioSpeed';

export interface LeaderboardRow {
  id: string;
  name: string;
  targetLevel: string;
  xp: number;
  streak: number;
  kanjiLearned: number;
}

interface LeaderboardSyncSectionProps {
  profileId: string;
  learnerName: string;
  learnerEmail?: string;
  authType?: 'email' | 'google';
  onUpdateLearnerName: (name: string) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  onRestoreHearts: () => void;
  kanjiLearnedCount: number;
  masteredItemsCount: number;
  bookmarkedCount: number;
  quizCorrectTotal: number;
  targetLevel: JlptLevel;
  onChangeTargetLevel: (level: JlptLevel) => void;
  startingTrack: StartingTrackId | null;
  onboardingAnswers?: Partial<OnboardingAnswers>;
  onEditStudyPlan: () => void;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  onBuyStreakFreeze: () => Promise<{ ok: boolean; error?: string }>;
  unlockedAchievements: string[];
  leaderboard: LeaderboardRow[];
  lastOfflineSyncAt: string | null;
  onTriggerOfflineSync: () => void;
  onSaveCloudBackup: (customCode?: string) => Promise<{ syncCode: string; savedAt: string }>;
  onRestoreCloudBackup: (syncCode: string) => Promise<void>;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  showRomaji: boolean;
  onToggleRomaji: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  audioSpeed: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'GL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const LeaderboardSyncSection: React.FC<LeaderboardSyncSectionProps> = ({
  profileId,
  learnerName,
  learnerEmail,
  authType,
  onUpdateLearnerName,
  onOpenAuth,
  onSignOut,
  xp,
  streak,
  hearts,
  maxHearts,
  onRestoreHearts,
  kanjiLearnedCount,
  masteredItemsCount,
  bookmarkedCount,
  quizCorrectTotal,
  targetLevel,
  onChangeTargetLevel,
  startingTrack,
  onboardingAnswers,
  onEditStudyPlan,
  streakFreezes,
  streakFreezeHistory,
  onBuyStreakFreeze,
  unlockedAchievements,
  leaderboard,
  lastOfflineSyncAt,
  onTriggerOfflineSync,
  onSaveCloudBackup,
  onRestoreCloudBackup,
  showFurigana,
  onToggleFurigana,
  showRomaji,
  onToggleRomaji,
  soundEnabled,
  onToggleSound,
  darkMode,
  onToggleDarkMode,
  audioSpeed,
}) => {
  const isOnline = useOnlineStatus();
  const [nameDraft, setNameDraft] = useState(learnerName);
  const [nameSavedFlash, setNameSavedFlash] = useState(false);
  useEffect(() => {
    setNameDraft(learnerName);
  }, [learnerName]);

  const [sealFilter, setSealFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [generatedSyncCode, setGeneratedSyncCode] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [savingBackup, setSavingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [freezeStatus, setFreezeStatus] = useState<string | null>(null);
  const [freezeError, setFreezeError] = useState<string | null>(null);

  const [reminderTime, setReminderTime] = useState('20:00');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const rank = getLearnerRank(xp);
  const displayRankTitle = rank.title === 'Zero Starter' ? 'JLPT Learner' : rank.title;
  const rankSpan = Math.max(1, rank.nextXp - rank.minXp);
  const rankProgressPct = Math.min(
    100,
    Math.max(0, Math.round(((xp - rank.minXp) / rankSpan) * 100))
  );

  const freezeEligibility = canPurchaseStreakFreeze(xp, streakFreezes);

  const trackMeta = useMemo(
    () => getStartingTrackMeta(startingTrack ?? targetLevel),
    [startingTrack, targetLevel]
  );

  const realLeaderboard = useMemo(
    () =>
      buildRealLeaderboard(leaderboard, {
        id: profileId,
        name: learnerName,
        targetLevel,
        xp,
        streak,
        kanjiLearned: kanjiLearnedCount,
      }),
    [leaderboard, profileId, learnerName, targetLevel, xp, streak, kanjiLearnedCount]
  );

  const myRankPosition = useMemo(() => {
    const idx = realLeaderboard.findIndex((r) => r.id === profileId);
    return idx >= 0 ? idx + 1 : 1;
  }, [realLeaderboard, profileId]);

  const achievementCards = useMemo(() => {
    const metrics = {
      xp,
      streak,
      learnedKanjiCount: kanjiLearnedCount,
      bookmarkedCount,
      quizCorrectTotal,
    };
    return ACHIEVEMENTS.map((ach) => {
      const unlocked = unlockedAchievements.includes(ach.id);
      const progress = getAchievementSealProgress(ach.id, metrics);
      return {
        ...ach,
        unlocked,
        progress,
      };
    });
  }, [xp, streak, kanjiLearnedCount, bookmarkedCount, quizCorrectTotal, unlockedAchievements]);

  const visibleAchievements = useMemo(() => {
    if (sealFilter === 'unlocked') return achievementCards.filter((a) => a.unlocked);
    if (sealFilter === 'locked') return achievementCards.filter((a) => !a.unlocked);
    return achievementCards;
  }, [achievementCards, sealFilter]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameDraft.trim();
    if (!cleaned) return;
    onUpdateLearnerName(cleaned);
    setNameSavedFlash(true);
    window.setTimeout(() => setNameSavedFlash(false), 1800);
  };

  const handlePurchaseFreeze = async () => {
    setBuyingFreeze(true);
    setFreezeError(null);
    setFreezeStatus(null);
    try {
      const result = await onBuyStreakFreeze();
      if (!result.ok) {
        setFreezeError(result.error || 'Unable to buy a Streak Freeze.');
      } else {
        setFreezeStatus(
          `1-Day Streak Freeze equipped (-${STREAK_FREEZE_COST_XP} XP).`
        );
      }
    } catch (err) {
      setFreezeError(
        err instanceof Error ? err.message : 'Unable to buy a Streak Freeze.'
      );
    } finally {
      setBuyingFreeze(false);
    }
  };

  const formatLogTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveBackup = async () => {
    setSavingBackup(true);
    setBackupError(null);
    try {
      const result = await onSaveCloudBackup(syncCodeInput.trim() || undefined);
      setGeneratedSyncCode(result.syncCode);
      setSyncCodeInput(result.syncCode);
      setBackupStatus(
        `Cloud snapshot saved (${result.savedAt.slice(0, 16).replace('T', ' ')} UTC).`
      );
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Cloud backup failed.');
    } finally {
      setSavingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!syncCodeInput.trim()) {
      setBackupError('Enter a sync code to restore your saved snapshot.');
      return;
    }
    setRestoringBackup(true);
    setBackupError(null);
    try {
      await onRestoreCloudBackup(syncCodeInput.trim());
      setBackupStatus(`Restored progress from cloud code ${syncCodeInput.trim().toUpperCase()}.`);
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Could not restore backup.');
    } finally {
      setRestoringBackup(false);
    }
  };

  const handleEnableNotifications = async () => {
    const sent = await triggerStreakNotification(
      'AkuJin Daily Streak Reminder',
      `Keep your ${streak}-day streak alive! Your ${reminderTime} JLPT drill is ready.`
    );
    if (sent) {
      setNotificationStatus(`Daily reminder scheduled for ${reminderTime} and test alert sent.`);
    } else {
      setNotificationStatus(
        `In-app streak reminder active for ${reminderTime} (browser notifications blocked or unavailable).`
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            学習プロフィール・番付 · Learner Profile, Hanko Seals &amp; Real Rankings
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Your Profile,{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Seals &amp; Leaderboard.
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {learnerEmail ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-stone-700 dark:text-zinc-200 hover:border-[#D92525] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              Sign Up / Log In to Cloud Sync
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: COMPLETE LEARNER PROFILE HUB */}
      <section
        aria-label="Learner Profile"
        data-testid="learner-profile-card"
        className="rounded-3xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-6"
      >
        {/* Top Row: Identity + Rank + Track & Daily Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left (7 cols): Avatar, Editable Display Name, Account Status, Rank Progress */}
          <div className="lg:col-span-7 space-y-5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Clean Circular Profile Avatar */}
              <div className="relative h-18 w-18 shrink-0">
                <div className="h-18 w-18 rounded-full border-2 border-[#D92525]/35 bg-[#141413] dark:bg-zinc-900 text-white flex items-center justify-center font-bold text-xl tracking-wide shadow-sm">
                  {getInitials(learnerName)}
                </div>
                <span
                  title={`Rank #${myRankPosition}`}
                  className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#D92525] text-white text-[10px] font-mono-nums font-bold shadow"
                >
                  #{myRankPosition}
                </span>
              </div>

              {/* Name Form + Account Status */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[11px] font-semibold text-[#D92525] dark:text-rose-300">
                    <span className="font-jp">{rank.japaneseTitle}</span>
                    <span>·</span>
                    <span>{displayRankTitle}</span>
                  </span>
                  {learnerEmail ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      {learnerEmail} ({authType === 'google' ? 'Google' : 'Email'})
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                      Local Guest Profile · Saved on this device
                    </span>
                  )}
                </div>

                <form
                  onSubmit={handleSaveName}
                  className="flex flex-wrap items-center gap-2"
                >
                  <label htmlFor="learner-name-input" className="sr-only">
                    Display name
                  </label>
                  <input
                    id="learner-name-input"
                    data-testid="profile-name-input"
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Your display name"
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm font-semibold text-[#141413] dark:text-white w-48 sm:w-56"
                  />
                  <button
                    type="submit"
                    data-testid="profile-save-name-btn"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer hover:opacity-90"
                  >
                    {nameSavedFlash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" aria-hidden="true" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Update Name
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* XP Progress Bar toward Next Rank */}
            <div className="rounded-2xl bg-stone-50 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#141413] dark:text-white">
                  Rank Ascent · {displayRankTitle}
                </span>
                <span className="font-mono-nums text-stone-600 dark:text-zinc-300">
                  {xp.toLocaleString()} / {rank.nextXp.toLocaleString()} XP ({rankProgressPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D92525] transition-all duration-500"
                  style={{ width: `${rankProgressPct}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
                <span>
                  Starting Path: <strong className="text-[#141413] dark:text-zinc-200">{trackMeta.shortBadgeLabel}</strong>
                  {onboardingAnswers?.aim ? ` · ${onboardingAnswers.aim}` : ''}
                </span>
                <button
                  type="button"
                  onClick={onEditStudyPlan}
                  className="text-[#D92525] dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                >
                  Edit 7-Question Study Plan →
                </button>
              </div>
            </div>
          </div>

          {/* Right (5 cols): Target JLPT Track + Daily Study Goal */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            {/* Target JLPT Level Selector */}
            <div className="rounded-2xl bg-stone-50 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#141413] dark:text-white inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                  Target JLPT Level
                </span>
                <span className="text-[11px] font-mono-nums font-bold text-[#D92525] dark:text-rose-400">
                  Active: JLPT {targetLevel}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Target JLPT level">
                {JLPT_LEVEL_ORDER.map((lvl) => {
                  const active = targetLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      data-testid={`profile-jlpt-${lvl}`}
                      aria-pressed={active}
                      onClick={() => onChangeTargetLevel(lvl)}
                      className={`py-2 rounded-lg text-xs font-mono-nums font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#D92525] border-[#D92525] text-white'
                          : 'bg-white dark:bg-[#16181F] border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:border-[#D92525]/60'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                Switching your target level immediately aligns your JLPT Roadmap, Kanji SRS deck focus, and skill labs.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Live Real Profile Metrics */}
        <div
          data-reveal-stagger="true"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-stone-200/80 dark:border-zinc-800"
        >
          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Total XP</span>
              <Sparkles className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            </div>
            <p
              data-testid="freeze-vault-xp"
              className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white mt-1"
            >
              {xp.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Daily Streak</span>
              <Flame className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {streak}d
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Hearts</span>
              <Heart className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between mt-1 gap-1">
              <p className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white">
                {hearts}/{maxHearts}
              </p>
              {hearts < maxHearts && (
                <button
                  type="button"
                  onClick={onRestoreHearts}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-[#D92525] dark:text-rose-300 cursor-pointer"
                >
                  Refill
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Kanji SRS</span>
              <Layers className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {kanjiLearnedCount}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Mastered</span>
              <BookOpen className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {masteredItemsCount}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>Saved Phrases</span>
              <Bookmark className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
              {bookmarkedCount}
            </p>
          </div>
        </div>

        {/* Study Preferences Quick Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200/80 dark:border-zinc-800">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-zinc-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            Profile Preferences
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleFurigana}
              aria-pressed={showFurigana}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                showFurigana
                  ? 'border-[#D92525]/50 bg-rose-50/70 dark:bg-rose-950/30 text-[#D92525] dark:text-rose-300'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              Furigana: {showFurigana ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={onToggleRomaji}
              aria-pressed={showRomaji}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                showRomaji
                  ? 'border-[#D92525]/50 bg-rose-50/70 dark:bg-rose-950/30 text-[#D92525] dark:text-rose-300'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              Romaji: {showRomaji ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                soundEnabled
                  ? 'border-[#D92525]/50 bg-rose-50/70 dark:bg-rose-950/30 text-[#D92525] dark:text-rose-300'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Sound: {soundEnabled ? 'On' : 'Muted'}
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:border-[#D92525]/60 cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-stone-600" aria-hidden="true" />
              )}
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </button>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono-nums font-medium border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300">
              Audio Tempo: {formatAudioSpeedLabel(audioSpeed)}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: REAL STUDY LEADERBOARD + RENEWED HANKO ACHIEVEMENT SEALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (6 cols): Real AkuJin Study Leaderboard (NO FAKE RANKINGS) */}
        <section
          aria-label="AkuJin Study Leaderboard"
          data-testid="real-study-leaderboard"
          className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                  Real Study Leaderboard
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Verified active learners only — zero fake or placeholder rankings.
              </p>
            </div>
            <span
              data-testid="real-leaderboard-count"
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-700 text-xs font-mono-nums font-semibold text-[#141413] dark:text-zinc-200"
            >
              {realLeaderboard.length}{' '}
              {realLeaderboard.length === 1 ? 'Real Learner' : 'Real Learners'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                  <th className="py-2.5 pr-3 font-semibold">Rank</th>
                  <th className="py-2.5 pr-3 font-semibold">Learner</th>
                  <th className="py-2.5 pr-3 font-semibold">Track</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Streak</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Kanji</th>
                  <th className="py-2.5 font-semibold text-right">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/70 text-sm">
                {realLeaderboard.map((row, idx) => {
                  const isMe = row.id === profileId;
                  return (
                    <tr
                      key={row.id}
                      data-testid={isMe ? 'leaderboard-row-self' : `leaderboard-row-${row.id}`}
                      className={
                        isMe
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 font-semibold'
                          : ''
                      }
                    >
                      <td className="py-3 pr-3 font-mono-nums text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold ${
                            idx === 0
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : idx === 1
                              ? 'bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-200'
                              : idx === 2
                              ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300'
                              : 'text-stone-500 dark:text-zinc-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-[#141413] dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">
                            {row.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-[#D92525] text-white text-[10px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs font-mono-nums text-[#D92525] dark:text-rose-400 whitespace-nowrap">
                        JLPT {row.targetLevel}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono-nums text-xs text-stone-600 dark:text-zinc-300 whitespace-nowrap">
                        {row.streak}d
                      </td>
                      <td className="py-3 pr-3 text-right font-mono-nums text-xs text-stone-600 dark:text-zinc-300">
                        {row.kanjiLearned}
                      </td>
                      <td className="py-3 text-right font-mono-nums font-bold text-[#141413] dark:text-white">
                        {row.xp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {realLeaderboard.length === 1 && (
            <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-dashed border-stone-200 dark:border-zinc-800 p-4 text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
              You are currently ranked <strong className="text-[#141413] dark:text-white">#1</strong> among real learners on this AkuJin instance. Every study session, Kanji review, and JLPT drill updates your live standing here automatically.
            </div>
          )}
        </section>

        {/* Right (6 cols): Renewed Japanese Hanko Achievement Seals */}
        <section
          aria-label="Achievement Seals"
          data-testid="achievement-seals-section"
          className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                  Hanko Achievement Seals
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Earn traditional vermilion ink stamps as you master Kanji, streaks &amp; exams.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800">
              {(
                [
                  { id: 'all', label: `All (${ACHIEVEMENTS.length})` },
                  { id: 'unlocked', label: `Earned (${unlockedAchievements.length})` },
                  { id: 'locked', label: `Locked (${Math.max(0, ACHIEVEMENTS.length - unlockedAchievements.length)})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`seal-filter-${tab.id}`}
                  aria-pressed={sealFilter === tab.id}
                  onClick={() => setSealFilter(tab.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    sealFilter === tab.id
                      ? 'bg-[#D92525] text-white'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-[#141413] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {visibleAchievements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#101218] p-6 text-center text-xs text-stone-500 dark:text-zinc-400">
              No seals in this category yet. Complete Kanji SRS reviews or daily drills to stamp your first Hanko seal!
            </div>
          ) : (
            <div
              data-testid="achievement-seals-grid"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              {visibleAchievements.map((ach) => (
                <div
                  key={ach.id}
                  data-testid={`hanko-seal-${ach.id}`}
                  data-unlocked={ach.unlocked ? 'true' : 'false'}
                  className={`rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-rose-50/75 via-white to-amber-50/40 dark:from-rose-950/35 dark:via-[#16181F] dark:to-amber-950/15 border-[#D92525]/45 shadow-sm'
                      : 'bg-stone-50/80 dark:bg-[#101218] border-stone-200/80 dark:border-zinc-800'
                  }`}
                >
                  {/* Tactile Japanese Hanko Stamp Emblem */}
                  <div
                    className={`relative h-14 w-14 shrink-0 flex items-center justify-center transition-transform ${
                      ach.unlocked ? '-rotate-3' : 'opacity-60'
                    }`}
                  >
                    <svg
                      viewBox="0 0 60 60"
                      className="h-14 w-14"
                      aria-hidden="true"
                    >
                      {ach.progress.sealShape === 'circle' ? (
                        <>
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill={ach.unlocked ? '#D92525' : 'none'}
                            fillOpacity={ach.unlocked ? '0.12' : '0'}
                            stroke={ach.unlocked ? '#D92525' : '#A8A29E'}
                            strokeWidth="2.5"
                          />
                          <circle
                            cx="30"
                            cy="30"
                            r="22"
                            fill="none"
                            stroke={ach.unlocked ? '#D92525' : '#A8A29E'}
                            strokeWidth="1"
                            strokeDasharray={ach.unlocked ? undefined : '2 2'}
                          />
                        </>
                      ) : (
                        <>
                          <rect
                            x="5"
                            y="5"
                            width="50"
                            height="50"
                            rx="9"
                            fill={ach.unlocked ? '#D92525' : 'none'}
                            fillOpacity={ach.unlocked ? '0.12' : '0'}
                            stroke={ach.unlocked ? '#D92525' : '#A8A29E'}
                            strokeWidth="2.5"
                          />
                          <rect
                            x="9"
                            y="9"
                            width="42"
                            height="42"
                            rx="6"
                            fill="none"
                            stroke={ach.unlocked ? '#D92525' : '#A8A29E'}
                            strokeWidth="1"
                            strokeDasharray={ach.unlocked ? undefined : '2 2'}
                          />
                        </>
                      )}
                    </svg>
                    <span
                      className={`absolute font-jp text-sm font-black tracking-tight ${
                        ach.unlocked
                          ? 'text-[#D92525] dark:text-rose-400'
                          : 'text-stone-400 dark:text-zinc-500'
                      }`}
                    >
                      {ach.japaneseStamp}
                    </span>
                  </div>

                  {/* Seal Details + Live Progress Bar */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#141413] dark:text-white leading-snug">
                        {ach.title}
                      </p>
                      <span
                        className={`text-[10px] font-mono-nums font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          ach.unlocked
                            ? 'bg-[#D92525] text-white'
                            : 'bg-stone-200/80 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                        }`}
                      >
                        +{ach.xpBonus} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-snug">
                      {ach.description}
                    </p>
                    <div className="space-y-1 pt-0.5">
                      <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ach.unlocked ? 'bg-[#D92525]' : 'bg-stone-400 dark:bg-zinc-600'
                          }`}
                          style={{ width: `${ach.unlocked ? 100 : ach.progress.pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono-nums">
                        <span className="text-stone-500 dark:text-zinc-400">
                          {ach.progress.progressLabel}
                        </span>
                        <span
                          className={
                            ach.unlocked
                              ? 'font-bold text-[#D92525] dark:text-rose-400'
                              : 'text-stone-400 dark:text-zinc-500'
                          }
                        >
                          {ach.unlocked ? 'Stamped ✓' : `${ach.progress.pct}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* SECTION 3: REFINED STREAK FREEZE VAULT + FREEZE HISTORY LOG (ZERO OVERLAP) */}
      <section
        aria-label="Profile Streak Freeze Vault"
        data-testid="streak-freeze-vault-section"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* Left (7 cols): Streak Freeze Vault */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            {/* Strictly stacked clean header — never squeezed or overlapped */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center shrink-0">
                    <Snowflake className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                    Streak Freeze Vault
                  </h2>
                </div>
                <span
                  data-testid="freeze-inventory-summary"
                  className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/35 border border-sky-200 dark:border-sky-500/30 text-xs font-mono-nums font-semibold text-sky-800 dark:text-sky-300"
                >
                  {streakFreezes} / {MAX_ACTIVE_STREAK_FREEZES} Equipped
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                Spend earned XP to equip a 1-day streak buffer. If you miss a daily Japanese study session, an active freeze is automatically consumed to keep your streak intact.
              </p>
            </div>

            {/* 3 Visual Inventory Slots */}
            <div
              data-testid="freeze-inventory-slots"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {Array.from({ length: MAX_ACTIVE_STREAK_FREEZES }).map((_, idx) => {
                const isActive = idx < streakFreezes;
                return (
                  <div
                    key={idx}
                    data-testid={`freeze-slot-${idx + 1}`}
                    data-slot-active={isActive ? 'true' : 'false'}
                    className={`rounded-xl p-3.5 border flex items-center gap-3 transition-colors ${
                      isActive
                        ? 'bg-sky-50/85 dark:bg-sky-950/35 border-sky-300 dark:border-sky-500/45'
                        : 'bg-stone-50/70 dark:bg-[#101218] border-dashed border-stone-200 dark:border-zinc-800'
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isActive
                          ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 dark:border-sky-400'
                          : 'bg-stone-100 dark:bg-zinc-900 text-stone-400 dark:text-zinc-600 border-stone-200 dark:border-zinc-800'
                      }`}
                    >
                      {isActive ? (
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Snowflake className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive
                            ? 'text-sky-950 dark:text-sky-100'
                            : 'text-stone-600 dark:text-zinc-400'
                        }`}
                      >
                        Slot {idx + 1} · {isActive ? 'Active' : 'Empty'}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          isActive
                            ? 'text-sky-700 dark:text-sky-300'
                            : 'text-stone-400 dark:text-zinc-500'
                        }`}
                      >
                        {isActive ? '1-Day Buffer Ready' : 'Available Slot'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purchase Bar */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-[#141413] dark:text-zinc-200">
                1-Day Streak Freeze ·{' '}
                <span className="font-mono-nums font-bold text-[#D92525] dark:text-rose-400">
                  {STREAK_FREEZE_COST_XP} XP
                </span>
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                {freezeEligibility.allowed
                  ? `You can equip ${MAX_ACTIVE_STREAK_FREEZES - streakFreezes} more ${
                      MAX_ACTIVE_STREAK_FREEZES - streakFreezes === 1 ? 'shield' : 'shields'
                    }.`
                  : freezeEligibility.reason}
              </p>
              {freezeStatus && (
                <p
                  role="status"
                  className="text-xs font-medium text-sky-700 dark:text-sky-300 flex items-center gap-1 pt-0.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {freezeStatus}
                </p>
              )}
              {freezeError && (
                <p role="alert" className="text-xs font-medium text-[#D92525] dark:text-rose-400 pt-0.5">
                  {freezeError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handlePurchaseFreeze}
              disabled={!freezeEligibility.allowed || buyingFreeze}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] disabled:bg-stone-200 dark:disabled:bg-zinc-800 disabled:text-stone-500 dark:disabled:text-zinc-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />
              {buyingFreeze
                ? 'Equipping…'
                : streakFreezes >= MAX_ACTIVE_STREAK_FREEZES
                ? `Inventory Full (${MAX_ACTIVE_STREAK_FREEZES}/${MAX_ACTIVE_STREAK_FREEZES})`
                : `Buy 1-Day Freeze · ${STREAK_FREEZE_COST_XP} XP`}
            </button>
          </div>
        </div>

        {/* Right (5 cols): Freeze History Log */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                Freeze History Log
              </h2>
            </div>
            <span className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
              {streakFreezeHistory.length}{' '}
              {streakFreezeHistory.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {streakFreezeHistory.length === 0 ? (
            <div
              data-testid="freeze-history-empty"
              className="flex-1 rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#101218] p-5 flex flex-col items-center justify-center text-center gap-2"
            >
              <Snowflake className="w-5 h-5 text-stone-400 dark:text-zinc-500" aria-hidden="true" />
              <p className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                No streak freeze activity yet
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Purchases and automatic 1-day streak protections will be recorded here with timestamps and XP changes.
              </p>
            </div>
          ) : (
            <ul
              data-testid="freeze-history-list"
              className="divide-y divide-stone-100 dark:divide-zinc-800/80 max-h-[250px] overflow-y-auto pr-1"
            >
              {streakFreezeHistory.map((entry) => {
                const isPurchase = entry.type === 'purchased';
                return (
                  <li
                    key={entry.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isPurchase
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isPurchase ? (
                          <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#141413] dark:text-white truncate">
                          {isPurchase
                            ? 'Purchased 1-Day Streak Freeze'
                            : `Protected Streak (${entry.protectedDate || 'Missed Day'})`}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono-nums mt-0.5">
                          {formatLogTimestamp(entry.timestampIso)} · Stock {entry.balanceAfter}/{MAX_ACTIVE_STREAK_FREEZES}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono-nums font-semibold whitespace-nowrap shrink-0 ${
                        entry.xpDelta < 0
                          ? 'text-[#D92525] dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {entry.xpDelta < 0 ? `${entry.xpDelta} XP` : 'Auto-Used'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* SECTION 4: CLOUD BACKUP, OFFLINE SYNC & DAILY REMINDERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cloud Backup */}
        <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#141413] dark:text-white">
              Cloud Backup &amp; Restore
            </h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
            Sync your {xp.toLocaleString()} XP, SRS Kanji intervals, and phrasebook across devices using a portable sync code.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="sync-code-input" className="text-xs font-medium text-stone-600 dark:text-zinc-400 block">
              Sync Code (leave blank to generate a new code)
            </label>
            <input
              id="sync-code-input"
              type="text"
              value={syncCodeInput}
              onChange={(e) => setSyncCodeInput(e.target.value)}
              placeholder="AKUJIN-XXXX"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs font-mono-nums text-[#141413] dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveBackup}
              disabled={savingBackup}
              className="flex-1 px-3 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {savingBackup ? 'Saving…' : 'Save Cloud Backup'}
            </button>
            <button
              type="button"
              onClick={handleRestoreBackup}
              disabled={restoringBackup}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-60"
            >
              {restoringBackup ? 'Restoring…' : 'Restore Code'}
            </button>
          </div>

          {generatedSyncCode && (
            <p className="text-xs font-mono-nums text-[#141413] dark:text-white">
              Active Sync Code: <strong>{generatedSyncCode}</strong>
            </p>
          )}
          {backupStatus && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {backupStatus}
            </p>
          )}
          {backupError && <p className="text-xs text-[#D92525]">{backupError}</p>}
        </section>

        {/* Offline Synchronization */}
        <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#141413] dark:text-white">
              Offline Study Pack Sync
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700 dark:text-emerald-400">
                  Connected · Ready to cache offline decks
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span className="text-amber-700 dark:text-amber-400">
                  Offline Mode · Running from local cache
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
            Cache all N5–N1 Kanji decks, Japan dialogue scripts, and your bookmarked phrasebook locally for offline study.
          </p>

          <button
            type="button"
            onClick={onTriggerOfflineSync}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Sync Offline Study Pack
          </button>

          {lastOfflineSyncAt && (
            <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
              Last cached locally: {lastOfflineSyncAt.slice(0, 19).replace('T', ' ')}
            </p>
          )}
        </section>

        {/* Daily Streak Push Reminders */}
        <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#141413] dark:text-white">
              Daily Streak Reminders
            </h2>
          </div>

          <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
            Protect your {streak}-day streak and JLPT pacing with reminders at your preferred daily study hour.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="reminder-time" className="text-xs font-medium text-stone-600 dark:text-zinc-400 block">
              Preferred Study Time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs font-mono-nums text-[#141413] dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleEnableNotifications}
            className="w-full px-4 py-2.5 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
          >
            Enable &amp; Test Reminder
          </button>

          {notificationStatus && (
            <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
              {notificationStatus}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
