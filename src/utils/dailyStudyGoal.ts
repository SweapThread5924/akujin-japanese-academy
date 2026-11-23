export type DailyStudyGoalMinutes = 5 | 15 | 30;

export const DEFAULT_DAILY_STUDY_GOAL_MINUTES: DailyStudyGoalMinutes = 15;

export interface DailyStudyGoalOption {
  minutes: DailyStudyGoalMinutes;
  label: string;
  tierLabel: string;
}

export const DAILY_STUDY_GOAL_OPTIONS: DailyStudyGoalOption[] = [
  { minutes: 5, label: '5 min', tierLabel: 'Casual' },
  { minutes: 15, label: '15 min', tierLabel: 'Regular' },
  { minutes: 30, label: '30 min', tierLabel: 'Intensive' },
];

export function normalizeDailyStudyGoal(value: unknown): DailyStudyGoalMinutes {
  const num = typeof value === 'number' ? value : Number(value);
  if (num === 5 || num === 15 || num === 30) {
    return num;
  }
  return DEFAULT_DAILY_STUDY_GOAL_MINUTES;
}

export function estimateTodayStudyMinutes(
  heatmapHistory: Record<string, number> | undefined,
  todayDate = new Date().toISOString().slice(0, 10)
): number {
  if (!heatmapHistory || typeof heatmapHistory !== 'object') return 0;
  const raw = heatmapHistory[todayDate];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

export function computeDailyStudyProgress(params: {
  minutesStudied: number;
  goalMinutes: DailyStudyGoalMinutes;
  ringRadius?: number;
}): {
  minutesStudied: number;
  goalMinutes: DailyStudyGoalMinutes;
  progressRatio: number;
  progressPct: number;
  goalReached: boolean;
  circumference: number;
  strokeDashoffset: number;
} {
  const goalMinutes = normalizeDailyStudyGoal(params.goalMinutes);
  const minutesStudied = Math.max(0, Math.round(params.minutesStudied));
  const rawRatio = goalMinutes > 0 ? minutesStudied / goalMinutes : 0;
  const progressRatio = Math.max(0, Math.min(1, rawRatio));
  const progressPct = Math.min(100, Math.round(progressRatio * 100));
  const goalReached = minutesStudied >= goalMinutes;

  const radius = params.ringRadius ?? 17;
  const circumference = Number((2 * Math.PI * radius).toFixed(2));
  const strokeDashoffset = Number((circumference * (1 - progressRatio)).toFixed(2));

  return {
    minutesStudied,
    goalMinutes,
    progressRatio,
    progressPct,
    goalReached,
    circumference,
    strokeDashoffset,
  };
}

export function getLearnerInitials(name: string): string {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'AK';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
