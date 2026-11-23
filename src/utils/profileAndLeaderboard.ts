import type { LeaderboardRow } from '../components/LeaderboardSyncSection';

export const FAKE_SEEDED_LEADERBOARD_IDS = new Set([
  'lb-1',
  'lb-2',
  'lb-3',
  'lb-4',
]);

export interface RealLeaderboardCurrentUser {
  id: string;
  name: string;
  targetLevel: string;
  xp: number;
  streak: number;
  kanjiLearned: number;
}

/**
 * Removes legacy fake/placeholder leaderboard entries and merges the live
 * current learner profile, returning real learners sorted by XP -> streak -> kanji.
 */
export function buildRealLeaderboard(
  rawRows: LeaderboardRow[],
  currentUser: RealLeaderboardCurrentUser
): LeaderboardRow[] {
  const realMap = new Map<string, LeaderboardRow>();

  for (const row of rawRows) {
    if (!row || !row.id || FAKE_SEEDED_LEADERBOARD_IDS.has(row.id)) continue;
    realMap.set(row.id, {
      id: row.id,
      name: row.name?.trim() || 'AkuJin Learner',
      targetLevel: row.targetLevel || 'N5',
      xp: Math.max(0, Number(row.xp) || 0),
      streak: Math.max(0, Number(row.streak) || 0),
      kanjiLearned: Math.max(0, Number(row.kanjiLearned) || 0),
    });
  }

  // Always ensure the active learner's live stats are reflected accurately
  realMap.set(currentUser.id, {
    id: currentUser.id,
    name: currentUser.name.trim() || 'Guest Learner',
    targetLevel: currentUser.targetLevel || 'N5',
    xp: Math.max(0, currentUser.xp),
    streak: Math.max(0, currentUser.streak),
    kanjiLearned: Math.max(0, currentUser.kanjiLearned),
  });

  return Array.from(realMap.values()).sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.streak !== a.streak) return b.streak - a.streak;
    if (b.kanjiLearned !== a.kanjiLearned) return b.kanjiLearned - a.kanjiLearned;
    return a.name.localeCompare(b.name);
  });
}

export interface AchievementMetrics {
  xp: number;
  streak: number;
  learnedKanjiCount: number;
  bookmarkedCount: number;
  quizCorrectTotal: number;
}

export interface AchievementSealProgress {
  current: number;
  target: number;
  pct: number;
  progressLabel: string;
  sealShape: 'circle' | 'square';
  category: 'Kanji' | 'Streak' | 'Exam' | 'Immersion' | 'Mastery';
}

export function getAchievementSealProgress(
  achievementId: string,
  metrics: AchievementMetrics
): AchievementSealProgress {
  const clampPct = (cur: number, target: number) =>
    Math.min(100, Math.max(0, Math.round((cur / Math.max(1, target)) * 100)));

  switch (achievementId) {
    case 'first_kanji': {
      const cur = Math.min(1, metrics.learnedKanjiCount);
      return {
        current: cur,
        target: 1,
        pct: clampPct(cur, 1),
        progressLabel: `${cur} / 1 Kanji`,
        sealShape: 'circle',
        category: 'Kanji',
      };
    }
    case 'kanji_5': {
      const cur = Math.min(5, metrics.learnedKanjiCount);
      return {
        current: cur,
        target: 5,
        pct: clampPct(cur, 5),
        progressLabel: `${cur} / 5 Kanji`,
        sealShape: 'square',
        category: 'Kanji',
      };
    }
    case 'streak_3': {
      const cur = Math.min(3, metrics.streak);
      return {
        current: cur,
        target: 3,
        pct: clampPct(cur, 3),
        progressLabel: `${cur} / 3 days`,
        sealShape: 'circle',
        category: 'Streak',
      };
    }
    case 'streak_7': {
      const cur = Math.min(7, metrics.streak);
      return {
        current: cur,
        target: 7,
        pct: clampPct(cur, 7),
        progressLabel: `${cur} / 7 days`,
        sealShape: 'square',
        category: 'Streak',
      };
    }
    case 'quiz_5': {
      const cur = Math.min(5, metrics.quizCorrectTotal);
      return {
        current: cur,
        target: 5,
        pct: clampPct(cur, 5),
        progressLabel: `${cur} / 5 correct`,
        sealShape: 'circle',
        category: 'Exam',
      };
    }
    case 'phrasebook_3': {
      const cur = Math.min(3, metrics.bookmarkedCount);
      return {
        current: cur,
        target: 3,
        pct: clampPct(cur, 3),
        progressLabel: `${cur} / 3 phrases`,
        sealShape: 'square',
        category: 'Immersion',
      };
    }
    case 'xp_500': {
      const cur = Math.min(500, metrics.xp);
      return {
        current: cur,
        target: 500,
        pct: clampPct(cur, 500),
        progressLabel: `${cur.toLocaleString()} / 500 XP`,
        sealShape: 'circle',
        category: 'Mastery',
      };
    }
    case 'xp_1500':
    default: {
      const cur = Math.min(1500, metrics.xp);
      return {
        current: cur,
        target: 1500,
        pct: clampPct(cur, 1500),
        progressLabel: `${cur.toLocaleString()} / 1,500 XP`,
        sealShape: 'square',
        category: 'Mastery',
      };
    }
  }
}
