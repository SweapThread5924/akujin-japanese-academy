export const STREAK_FREEZE_COST_XP = 150;
export const MAX_ACTIVE_STREAK_FREEZES = 3;

export type StreakFreezeLogType = 'purchased' | 'consumed';

export interface StreakFreezeLogEntry {
  id: string;
  type: StreakFreezeLogType;
  timestampIso: string;
  xpDelta: number;
  balanceAfter: number;
  note: string;
  protectedDate?: string;
}

export interface StreakFreezeState {
  xp: number;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
}

export interface StreakFreezeEligibility {
  allowed: boolean;
  reason?: string;
}

export function canPurchaseStreakFreeze(
  xp: number,
  activeFreezes: number
): StreakFreezeEligibility {
  if (activeFreezes >= MAX_ACTIVE_STREAK_FREEZES) {
    return {
      allowed: false,
      reason: `Inventory full (max ${MAX_ACTIVE_STREAK_FREEZES} active freezes)`,
    };
  }
  if (xp < STREAK_FREEZE_COST_XP) {
    const needed = STREAK_FREEZE_COST_XP - Math.max(0, xp);
    return {
      allowed: false,
      reason: `Need ${needed} more XP (${STREAK_FREEZE_COST_XP} XP per freeze)`,
    };
  }
  return { allowed: true };
}

export function purchaseStreakFreeze(
  state: StreakFreezeState,
  nowIso = new Date().toISOString()
): {
  ok: boolean;
  error?: string;
  nextState: StreakFreezeState;
  entry?: StreakFreezeLogEntry;
} {
  const check = canPurchaseStreakFreeze(state.xp, state.streakFreezes);
  if (!check.allowed) {
    return {
      ok: false,
      error: check.reason,
      nextState: state,
    };
  }

  const nextBalance = state.streakFreezes + 1;
  const nextXp = state.xp - STREAK_FREEZE_COST_XP;
  const entry: StreakFreezeLogEntry = {
    id: `sf-buy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'purchased',
    timestampIso: nowIso,
    xpDelta: -STREAK_FREEZE_COST_XP,
    balanceAfter: nextBalance,
    note: 'Purchased 1-day Streak Freeze buffer',
  };

  return {
    ok: true,
    entry,
    nextState: {
      xp: nextXp,
      streakFreezes: nextBalance,
      streakFreezeHistory: [entry, ...state.streakFreezeHistory],
    },
  };
}

function addDaysUtc(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDaysUtc(fromDate: string, toDate: string): number {
  const prev = new Date(`${fromDate}T00:00:00Z`).getTime();
  const curr = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.round((curr - prev) / (24 * 60 * 60 * 1000));
}

/**
 * Evaluates missed days between `lastStudyDate` and `todayDate` when opening the app
 * (before today's study session). If the learner missed 1+ days and holds enough
 * Streak Freezes to cover each missed day, consumes those freezes, logs them, and
 * advances `lastStudyDate` to yesterday so today's streak remains intact.
 */
export function applyPendingStreakProtection(params: {
  streak: number;
  lastStudyDate: string;
  todayDate: string;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  nowIso?: string;
}): {
  streak: number;
  lastStudyDate: string;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  consumedCount: number;
} {
  const {
    streak,
    lastStudyDate,
    todayDate,
    streakFreezes,
    streakFreezeHistory,
    nowIso = new Date().toISOString(),
  } = params;

  if (!lastStudyDate || streak <= 0) {
    return {
      streak,
      lastStudyDate,
      streakFreezes,
      streakFreezeHistory,
      consumedCount: 0,
    };
  }

  const diffDays = diffDaysUtc(lastStudyDate, todayDate);
  if (diffDays <= 1) {
    return {
      streak,
      lastStudyDate,
      streakFreezes,
      streakFreezeHistory,
      consumedCount: 0,
    };
  }

  const missedDays = diffDays - 1;
  if (streakFreezes >= missedDays) {
    let remaining = streakFreezes;
    const newLogs: StreakFreezeLogEntry[] = [];
    for (let i = 1; i <= missedDays; i++) {
      const protectedDate = addDaysUtc(lastStudyDate, i);
      remaining -= 1;
      newLogs.push({
        id: `sf-use-${protectedDate}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'consumed',
        timestampIso: nowIso,
        xpDelta: 0,
        balanceAfter: remaining,
        protectedDate,
        note: `1-day buffer protected streak on ${protectedDate}`,
      });
    }

    return {
      streak,
      lastStudyDate: addDaysUtc(todayDate, -1),
      streakFreezes: remaining,
      streakFreezeHistory: [...newLogs.reverse(), ...streakFreezeHistory],
      consumedCount: missedDays,
    };
  }

  // More missed days than freezes available: streak lapses without wasting shields
  return {
    streak: 0,
    lastStudyDate,
    streakFreezes,
    streakFreezeHistory,
    consumedCount: 0,
  };
}

/**
 * Resolves the new streak when completing a study action on `todayDate`,
 * automatically applying any available Streak Freeze buffers for missed days.
 */
export function resolveStreakOnStudy(params: {
  streak: number;
  lastStudyDate: string;
  todayDate: string;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  nowIso?: string;
}): {
  streak: number;
  lastStudyDate: string;
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  consumedCount: number;
} {
  const {
    streak,
    lastStudyDate,
    todayDate,
    streakFreezes,
    streakFreezeHistory,
    nowIso = new Date().toISOString(),
  } = params;

  if (!lastStudyDate) {
    return {
      streak: Math.max(1, streak),
      lastStudyDate: todayDate,
      streakFreezes,
      streakFreezeHistory,
      consumedCount: 0,
    };
  }

  const diffDays = diffDaysUtc(lastStudyDate, todayDate);
  if (diffDays <= 0) {
    return {
      streak: Math.max(1, streak),
      lastStudyDate: todayDate,
      streakFreezes,
      streakFreezeHistory,
      consumedCount: 0,
    };
  }

  if (diffDays === 1) {
    return {
      streak: streak + 1,
      lastStudyDate: todayDate,
      streakFreezes,
      streakFreezeHistory,
      consumedCount: 0,
    };
  }

  const protection = applyPendingStreakProtection({
    streak,
    lastStudyDate,
    todayDate,
    streakFreezes,
    streakFreezeHistory,
    nowIso,
  });

  if (protection.consumedCount > 0) {
    return {
      streak: protection.streak + 1,
      lastStudyDate: todayDate,
      streakFreezes: protection.streakFreezes,
      streakFreezeHistory: protection.streakFreezeHistory,
      consumedCount: protection.consumedCount,
    };
  }

  return {
    streak: 1,
    lastStudyDate: todayDate,
    streakFreezes,
    streakFreezeHistory,
    consumedCount: 0,
  };
}
