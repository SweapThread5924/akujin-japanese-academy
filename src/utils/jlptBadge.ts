import type { JlptLevel } from './srsEngine';

export interface JlptBadgeConfig {
  level: JlptLevel;
  tier: 1 | 2 | 3 | 4 | 5;
  japaneseSeal: string;
  title: string;
  shortTitle: string;
  kanjiGoal: number;
  containerClass: string;
  sealClass: string;
  accentTextClass: string;
  pipActiveClass: string;
}

export const JLPT_LEVEL_ORDER: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const JLPT_BADGE_META: Record<JlptLevel, JlptBadgeConfig> = {
  N5: {
    level: 'N5',
    tier: 1,
    japaneseSeal: '入門',
    title: 'Beginner',
    shortTitle: 'Beginner',
    kanjiGoal: 100,
    containerClass:
      'bg-emerald-50/85 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-500/40',
    sealClass:
      'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-700/20 dark:border-emerald-400/30',
    accentTextClass: 'text-emerald-800 dark:text-emerald-300',
    pipActiveClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  N4: {
    level: 'N4',
    tier: 2,
    japaneseSeal: '基礎',
    title: 'Elementary',
    shortTitle: 'Elementary',
    kanjiGoal: 300,
    containerClass:
      'bg-sky-50/85 dark:bg-sky-950/30 border-sky-300/80 dark:border-sky-500/40',
    sealClass:
      'bg-sky-600 dark:bg-sky-500 text-white border-sky-700/20 dark:border-sky-400/30',
    accentTextClass: 'text-sky-800 dark:text-sky-300',
    pipActiveClass: 'bg-sky-600 dark:bg-sky-400',
  },
  N3: {
    level: 'N3',
    tier: 3,
    japaneseSeal: '中級',
    title: 'Intermediate',
    shortTitle: 'Intermediate',
    kanjiGoal: 650,
    containerClass:
      'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300/85 dark:border-amber-500/45',
    sealClass:
      'bg-amber-600 dark:bg-amber-500 text-white border-amber-700/20 dark:border-amber-400/30',
    accentTextClass: 'text-amber-900 dark:text-amber-300',
    pipActiveClass: 'bg-amber-600 dark:bg-amber-400',
  },
  N2: {
    level: 'N2',
    tier: 4,
    japaneseSeal: '上級',
    title: 'Upper-Intermediate',
    shortTitle: 'Upper-Int',
    kanjiGoal: 1000,
    containerClass:
      'bg-orange-50/90 dark:bg-orange-950/30 border-orange-300/85 dark:border-orange-500/45',
    sealClass:
      'bg-orange-600 dark:bg-orange-500 text-white border-orange-700/20 dark:border-orange-400/30',
    accentTextClass: 'text-orange-900 dark:text-orange-300',
    pipActiveClass: 'bg-orange-600 dark:bg-orange-400',
  },
  N1: {
    level: 'N1',
    tier: 5,
    japaneseSeal: '達人',
    title: 'Near-Native Mastery',
    shortTitle: 'Mastery',
    kanjiGoal: 2136,
    containerClass:
      'bg-rose-50/90 dark:bg-rose-950/30 border-[#D92525]/45 dark:border-rose-500/45',
    sealClass:
      'bg-[#D92525] text-white border-[#B91C1C]/30',
    accentTextClass: 'text-[#B91C1C] dark:text-rose-300',
    pipActiveClass: 'bg-[#D92525] dark:bg-rose-400',
  },
};

export function getJlptBadgeConfig(level?: string | null): JlptBadgeConfig {
  const normalized = String(level || '')
    .trim()
    .toUpperCase() as JlptLevel;
  return JLPT_BADGE_META[normalized] ?? JLPT_BADGE_META.N5;
}
