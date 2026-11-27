import { ACHIEVEMENTS, type AchievementDef } from '../data/curriculumData';
import { MAX_ACTIVE_STREAK_FREEZES } from './streakFreeze';

export interface QuickActionSummaryInput {
  streak: number;
  streakFreezes: number;
  lastStudyDate: string;
  todayDateKey: string;
  unlockedAchievementIds: string[];
  xp: number;
  dailyGoalMinutes: number;
  todayMinutesStudied: number;
  isGmailConnected: boolean;
  gmailEmail?: string | null;
  catalog?: AchievementDef[];
}

export type StreakQuickState = 'active-today' | 'freeze-ready' | 'needs-study' | 'inactive';

export interface QuickActionSummary {
  gmail: {
    connected: boolean;
    statusLabel: string;
    detailText: string;
  };
  achievements: {
    unlockedCount: number;
    totalCount: number;
    completionPct: number;
    latestUnlockedTitle: string | null;
    summaryText: string;
  };
  streak: {
    days: number;
    headline: string;
    state: StreakQuickState;
    statusLabel: string;
    freezesEquipped: number;
    maxFreezes: number;
    detailText: string;
  };
  xp: number;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildQuickActionSummary(input: QuickActionSummaryInput): QuickActionSummary {
  const catalog = input.catalog ?? ACHIEVEMENTS;
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));

  const validUnlockedIds: string[] = [];
  const seen = new Set<string>();
  for (const id of input.unlockedAchievementIds) {
    if (!id || seen.has(id) || !catalogMap.has(id)) continue;
    seen.add(id);
    validUnlockedIds.push(id);
  }

  const totalCount = catalog.length;
  const unlockedCount = validUnlockedIds.length;
  const completionPct =
    totalCount > 0 ? Math.min(100, Math.round((unlockedCount / totalCount) * 100)) : 0;

  const latestId =
    validUnlockedIds.length > 0 ? validUnlockedIds[validUnlockedIds.length - 1] : null;
  const latestUnlockedTitle = latestId ? catalogMap.get(latestId)?.title ?? null : null;

  const days = Math.max(0, Math.floor(input.streak));
  const freezesEquipped = Math.max(
    0,
    Math.min(MAX_ACTIVE_STREAK_FREEZES, Math.floor(input.streakFreezes))
  );
  const studiedToday = Boolean(
    input.lastStudyDate && input.todayDateKey && input.lastStudyDate === input.todayDateKey
  );

  let state: StreakQuickState = 'inactive';
  let statusLabel = 'Start today';
  if (days > 0 && studiedToday) {
    state = 'active-today';
    statusLabel = 'Active today';
  } else if (days > 0 && freezesEquipped > 0) {
    state = 'freeze-ready';
    statusLabel = 'Freeze ready';
  } else if (days > 0) {
    state = 'needs-study';
    statusLabel = 'Study today';
  }

  const headline = `${days} ${days === 1 ? 'day' : 'days'}`;
  const todayMins = Math.max(0, Math.round(input.todayMinutesStudied));
  const goalMins = Math.max(1, Math.round(input.dailyGoalMinutes));
  const detailText = `${freezesEquipped}/${MAX_ACTIVE_STREAK_FREEZES} freezes · ${todayMins}/${goalMins}m today`;

  const email = input.gmailEmail?.trim() || null;
  const connected = Boolean(input.isGmailConnected || email);

  return {
    gmail: {
      connected,
      statusLabel: connected ? 'Connected' : 'Ready',
      detailText: email ? email : 'Send study reports & message Sensei',
    },
    achievements: {
      unlockedCount,
      totalCount,
      completionPct,
      latestUnlockedTitle,
      summaryText: latestUnlockedTitle
        ? `Latest: ${latestUnlockedTitle}`
        : `0 of ${totalCount} Hanko seals stamped`,
    },
    streak: {
      days,
      headline,
      state,
      statusLabel,
      freezesEquipped,
      maxFreezes: MAX_ACTIVE_STREAK_FREEZES,
      detailText,
    },
    xp: Math.max(0, Math.round(input.xp)),
  };
}
