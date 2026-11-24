import { ACHIEVEMENTS, type AchievementDef } from '../data/curriculumData';
import { getAchievementSealProgress } from './profileAndLeaderboard';
import { evaluateUnlockedAchievements } from './srsEngine';

export const DEFAULT_INFO_TOAST_DURATION_MS = 3400;
export const ACHIEVEMENT_TOAST_DURATION_MS = 6500;
export const MAX_VISIBLE_TOASTS = 4;

export interface MilestoneDetectionInput {
  xp: number;
  streak: number;
  learnedKanjiCount: number;
  bookmarkedCount: number;
  quizCorrectTotal: number;
  existingUnlockedIds: string[];
  catalog?: AchievementDef[];
}

export interface MilestoneDetectionResult {
  nextUnlockedIds: string[];
  newlyUnlockedIds: string[];
  newlyUnlockedDefs: AchievementDef[];
  xpBonusEarned: number;
  finalXp: number;
}

export function sanitizeUnlockedAchievements(
  raw: unknown,
  catalog: AchievementDef[] = ACHIEVEMENTS
): string[] {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set(catalog.map((a) => a.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    if (validIds.size > 0 && !validIds.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= 50) break;
  }
  return out;
}

/**
 * Evaluates milestone thresholds against current learner metrics,
 * awards XP bonuses for newly unlocked achievements (including chained XP tiers),
 * and guarantees zero duplicate entries in learner.unlockedAchievements.
 */
export function detectNewMilestoneAchievements(
  input: MilestoneDetectionInput
): MilestoneDetectionResult {
  const catalog = input.catalog ?? ACHIEVEMENTS;
  const catalogMap = new Map(catalog.map((a) => [a.id, a]));
  const unlockedSet = new Set(sanitizeUnlockedAchievements(input.existingUnlockedIds, catalog));

  let runningXp = Math.max(0, Math.round(input.xp));
  let xpBonusEarned = 0;
  const newlyUnlockedIds: string[] = [];

  for (let pass = 0; pass <= catalog.length; pass++) {
    const qualified = evaluateUnlockedAchievements({
      xp: runningXp,
      streak: input.streak,
      learnedKanjiCount: input.learnedKanjiCount,
      bookmarkedCount: input.bookmarkedCount,
      quizCorrectTotal: input.quizCorrectTotal,
    });

    let unlockedOnPass = false;
    for (const id of qualified) {
      if (unlockedSet.has(id)) continue;
      const def = catalogMap.get(id);
      if (!def) continue;
      unlockedSet.add(id);
      newlyUnlockedIds.push(id);
      xpBonusEarned += Math.max(0, def.xpBonus);
      runningXp += Math.max(0, def.xpBonus);
      unlockedOnPass = true;
    }

    if (!unlockedOnPass) break;
  }

  const newlyUnlockedDefs = newlyUnlockedIds
    .map((id) => catalogMap.get(id))
    .filter((def): def is AchievementDef => Boolean(def));

  return {
    nextUnlockedIds: Array.from(unlockedSet).slice(0, 50),
    newlyUnlockedIds,
    newlyUnlockedDefs,
    xpBonusEarned,
    finalXp: runningXp,
  };
}

export interface ToastNotificationItem {
  id: string;
  kind: 'achievement' | 'info';
  message: string;
  achievement?: AchievementDef;
  sealShape?: 'circle' | 'square';
  category?: string;
  createdAt: number;
  durationMs: number;
}

let toastSeq = 0;

function nextToastId(prefix: string, nowMs: number): string {
  toastSeq = (toastSeq + 1) % 100000;
  return `${prefix}-${nowMs}-${toastSeq}`;
}

export function createStandardToastItem(
  message: string,
  nowMs: number = Date.now()
): ToastNotificationItem {
  return {
    id: nextToastId('toast', nowMs),
    kind: 'info',
    message,
    createdAt: nowMs,
    durationMs: DEFAULT_INFO_TOAST_DURATION_MS,
  };
}

export function createAchievementToastItem(
  achievement: AchievementDef,
  nowMs: number = Date.now()
): ToastNotificationItem {
  const sealMeta = getAchievementSealProgress(achievement.id, {
    xp: 0,
    streak: 0,
    learnedKanjiCount: 0,
    bookmarkedCount: 0,
    quizCorrectTotal: 0,
  });
  return {
    id: nextToastId(`ach-${achievement.id}`, nowMs),
    kind: 'achievement',
    message: `${achievement.title} (+${achievement.xpBonus} XP)`,
    achievement,
    sealShape: sealMeta.sealShape,
    category: sealMeta.category,
    createdAt: nowMs,
    durationMs: ACHIEVEMENT_TOAST_DURATION_MS,
  };
}

export function enqueueToastItems(
  currentQueue: ToastNotificationItem[],
  incoming: ToastNotificationItem[],
  maxVisible: number = MAX_VISIBLE_TOASTS
): ToastNotificationItem[] {
  if (incoming.length === 0) return currentQueue;
  const activeAchievementIds = new Set(
    currentQueue
      .filter((t) => t.kind === 'achievement' && t.achievement?.id)
      .map((t) => t.achievement!.id)
  );

  const next = [...currentQueue];
  for (const item of incoming) {
    if (item.kind === 'achievement' && item.achievement?.id) {
      if (activeAchievementIds.has(item.achievement.id)) continue;
      activeAchievementIds.add(item.achievement.id);
    }
    next.push(item);
  }

  while (next.length > maxVisible) {
    const oldestInfoIdx = next.findIndex((t) => t.kind === 'info');
    if (oldestInfoIdx >= 0) {
      next.splice(oldestInfoIdx, 1);
    } else {
      next.shift();
    }
  }
  return next;
}

export function dismissToastItem(
  currentQueue: ToastNotificationItem[],
  id: string
): ToastNotificationItem[] {
  return currentQueue.filter((t) => t.id !== id);
}
