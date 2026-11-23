import type { JlptLevel } from './srsEngine';
import type { DailyStudyGoalMinutes } from './dailyStudyGoal';

export type StartingTrackId =
  | 'zero'
  | 'kana'
  | 'pre-n5'
  | 'N5'
  | 'N4'
  | 'N3'
  | 'N2'
  | 'N1';

export interface StartingTrackMeta {
  id: StartingTrackId;
  label: string;
  shortBadgeLabel: string;
  japaneseSeal: string;
  description: string;
  mappedJlptLevel: JlptLevel;
  recommendedTab: 'foundations' | 'lessons';
  tier: 1 | 2 | 3 | 4 | 5;
  badgeContainerClass: string;
  badgeSealClass: string;
  badgeAccentClass: string;
}

export const STARTING_TRACK_OPTIONS: StartingTrackMeta[] = [
  {
    id: 'zero',
    label: 'Zero Knowledge (Complete Beginner)',
    shortBadgeLabel: 'Zero Knowledge',
    japaneseSeal: '零',
    description: 'Start from zero with all 46 Hiragana, 46 Katakana, greetings & numbers.',
    mappedJlptLevel: 'N5',
    recommendedTab: 'foundations',
    tier: 1,
    badgeContainerClass: 'bg-stone-100/90 dark:bg-zinc-800/80 border-stone-300 dark:border-zinc-700',
    badgeSealClass: 'bg-[#141413] dark:bg-zinc-200 text-white dark:text-[#141413]',
    badgeAccentClass: 'text-[#141413] dark:text-zinc-100',
  },
  {
    id: 'kana',
    label: 'Knows Basic Hiragana & Katakana',
    shortBadgeLabel: 'Knows Basic Kana',
    japaneseSeal: '仮',
    description: 'Review kana fluency, greetings & time expressions before stepping into N5.',
    mappedJlptLevel: 'N5',
    recommendedTab: 'foundations',
    tier: 1,
    badgeContainerClass: 'bg-teal-50/90 dark:bg-teal-950/30 border-teal-300 dark:border-teal-600/40',
    badgeSealClass: 'bg-teal-600 text-white',
    badgeAccentClass: 'text-teal-800 dark:text-teal-300',
  },
  {
    id: 'pre-n5',
    label: 'Just Below JLPT N5 Level',
    shortBadgeLabel: 'Pre-N5 Bridge',
    japaneseSeal: '基',
    description: 'Bridge basic sentences, particles & first kanji into full JLPT N5.',
    mappedJlptLevel: 'N5',
    recommendedTab: 'foundations',
    tier: 1,
    badgeContainerClass: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40',
    badgeSealClass: 'bg-emerald-600 text-white',
    badgeAccentClass: 'text-emerald-800 dark:text-emerald-300',
  },
  {
    id: 'N5',
    label: 'JLPT N5 (Beginner Exam Track)',
    shortBadgeLabel: 'JLPT N5',
    japaneseSeal: '入門',
    description: '~800 core words, ~100 kanji, daily conversations & polite grammar.',
    mappedJlptLevel: 'N5',
    recommendedTab: 'lessons',
    tier: 1,
    badgeContainerClass: 'bg-emerald-50/85 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-500/40',
    badgeSealClass: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    badgeAccentClass: 'text-emerald-800 dark:text-emerald-300',
  },
  {
    id: 'N4',
    label: 'JLPT N4 (Elementary Track)',
    shortBadgeLabel: 'JLPT N4',
    japaneseSeal: '基礎',
    description: '~1,500 cumulative words, ~300 kanji, everyday casual & travel fluency.',
    mappedJlptLevel: 'N4',
    recommendedTab: 'lessons',
    tier: 2,
    badgeContainerClass: 'bg-sky-50/85 dark:bg-sky-950/30 border-sky-300/80 dark:border-sky-500/40',
    badgeSealClass: 'bg-sky-600 dark:bg-sky-500 text-white',
    badgeAccentClass: 'text-sky-800 dark:text-sky-300',
  },
  {
    id: 'N3',
    label: 'JLPT N3 (Intermediate Track)',
    shortBadgeLabel: 'JLPT N3',
    japaneseSeal: '中級',
    description: '~3,750 cumulative words, ~650 kanji, natural media & abstract concepts.',
    mappedJlptLevel: 'N3',
    recommendedTab: 'lessons',
    tier: 3,
    badgeContainerClass: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300/85 dark:border-amber-500/45',
    badgeSealClass: 'bg-amber-600 dark:bg-amber-500 text-white',
    badgeAccentClass: 'text-amber-900 dark:text-amber-300',
  },
  {
    id: 'N2',
    label: 'JLPT N2 (Upper-Intermediate Track)',
    shortBadgeLabel: 'JLPT N2',
    japaneseSeal: '上級',
    description: '~6,000 cumulative words, ~1,000 kanji, news articles & business Keigo.',
    mappedJlptLevel: 'N2',
    recommendedTab: 'lessons',
    tier: 4,
    badgeContainerClass: 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-300/85 dark:border-orange-500/45',
    badgeSealClass: 'bg-orange-600 dark:bg-orange-500 text-white',
    badgeAccentClass: 'text-orange-900 dark:text-orange-300',
  },
  {
    id: 'N1',
    label: 'JLPT N1 / Near-Native Level',
    shortBadgeLabel: 'JLPT N1 / Native',
    japaneseSeal: '達人',
    description: '~10,000 words & all 2,136 Jōyō kanji for academic & editorial mastery.',
    mappedJlptLevel: 'N1',
    recommendedTab: 'lessons',
    tier: 5,
    badgeContainerClass: 'bg-rose-50/90 dark:bg-rose-950/30 border-[#D92525]/45 dark:border-rose-500/45',
    badgeSealClass: 'bg-[#D92525] text-white',
    badgeAccentClass: 'text-[#B91C1C] dark:text-rose-300',
  },
];

export interface OnboardingAnswers {
  aim: string;
  whyJapanese: string;
  futureGoal: string;
  japanPlan: string;
  startingTrack: StartingTrackId;
  dailyGoalMinutes: DailyStudyGoalMinutes;
  prioritySkill: string;
}

export const DEFAULT_ONBOARDING_ANSWERS: OnboardingAnswers = {
  aim: 'Pass JLPT & speak naturally',
  whyJapanese: 'Career growth & love for Japanese culture',
  futureGoal: 'Work or study in Japan confidently',
  japanPlan: 'Yes — Career & Work in Japan',
  startingTrack: 'zero',
  dailyGoalMinutes: 15,
  prioritySkill: 'Speaking, Kana & Core Vocabulary',
};

export interface OnboardingQuestionDef {
  key: keyof OnboardingAnswers;
  number: number;
  question: string;
  subtitle: string;
  options: string[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestionDef[] = [
  {
    key: 'aim',
    number: 1,
    question: 'What is your main aim for learning Japanese?',
    subtitle: 'Helps us highlight the best practice labs first.',
    options: [
      'Pass JLPT & speak naturally',
      'Build a full-time career in Japan',
      'Study at a Japanese university (MEXT / EJU)',
      'Travel across Japan & enjoy anime/manga raw',
    ],
  },
  {
    key: 'whyJapanese',
    number: 2,
    question: 'Why do you want to learn Japanese right now?',
    subtitle: 'Your personal motivation keeps daily consistency stress-free.',
    options: [
      'Career growth & love for Japanese culture',
      'Preparing to move or relocate to Japan',
      'Dream to converse fluently with native speakers',
      'Mastering reading books, news, and scripts',
    ],
  },
  {
    key: 'futureGoal',
    number: 3,
    question: 'What is your future goal after learning Japanese?',
    subtitle: 'We tailor examples and scenarios around where you want to go.',
    options: [
      'Work or study in Japan confidently',
      'Join a Japanese tech / global engineering team',
      'Win an academic scholarship in Tokyo or Kyoto',
      'Travel solo cleanly without translation apps',
    ],
  },
  {
    key: 'japanPlan',
    number: 4,
    question: 'Do you want to make a career in Japan or study in Japan?',
    subtitle: 'Choose whichever matches your current plan.',
    options: [
      'Yes — Career & Work in Japan',
      'Yes — Study / University in Japan',
      'Both Career & Higher Study in Japan',
      'Exploring options / Learning for personal joy',
    ],
  },
  {
    key: 'dailyGoalMinutes',
    number: 6,
    question: 'How many calm minutes can you practice every day?',
    subtitle: 'Updates your live progress ring cleanly.',
    options: ['5', '15', '30'],
  },
  {
    key: 'prioritySkill',
    number: 7,
    question: 'Which Japanese skill do you want to focus on most first?',
    subtitle: 'Remember every skill is unlocked free inside AkuJin.',
    options: [
      'Speaking, Kana & Core Vocabulary',
      'Kanji Stroke Order & 2,136 Jōyō Reading',
      'Grammar Particles & Natural Nuances',
      'Listening & Real JLPT Exam Comprehension',
    ],
  },
];

export function getStartingTrackMeta(track?: string | null): StartingTrackMeta {
  const normalized = String(track || '').trim();
  const found = STARTING_TRACK_OPTIONS.find(
    (opt) => opt.id.toLowerCase() === normalized.toLowerCase()
  );
  return found ?? STARTING_TRACK_OPTIONS[0];
}

export function resolveTopBarBadgeDisplay(params: {
  onboardingCompleted: boolean;
  startingTrack?: StartingTrackId | null;
  targetLevel: JlptLevel;
}): {
  isSet: boolean;
  japaneseSeal: string;
  labelText: string;
  meta: StartingTrackMeta;
} {
  if (!params.onboardingCompleted) {
    const fallbackMeta = STARTING_TRACK_OPTIONS[0];
    return {
      isSet: false,
      japaneseSeal: '始',
      labelText: 'Set Your Level',
      meta: fallbackMeta,
    };
  }
  const resolvedTrack = params.startingTrack || params.targetLevel || 'zero';
  const meta = getStartingTrackMeta(resolvedTrack);
  return {
    isSet: true,
    japaneseSeal: meta.japaneseSeal,
    labelText: meta.shortBadgeLabel,
    meta,
  };
}

export const TOTAL_ONBOARDING_QUESTIONS = 7;

export function countAnsweredOnboardingQuestions(
  answers: Partial<OnboardingAnswers> | undefined
): number {
  if (!answers) return 0;
  let count = 0;
  if (typeof answers.aim === 'string' && answers.aim.trim().length > 0) count += 1;
  if (typeof answers.whyJapanese === 'string' && answers.whyJapanese.trim().length > 0) count += 1;
  if (typeof answers.futureGoal === 'string' && answers.futureGoal.trim().length > 0) count += 1;
  if (typeof answers.japanPlan === 'string' && answers.japanPlan.trim().length > 0) count += 1;
  if (typeof answers.startingTrack === 'string' && answers.startingTrack.trim().length > 0) count += 1;
  if (typeof answers.dailyGoalMinutes === 'number' && answers.dailyGoalMinutes > 0) count += 1;
  if (typeof answers.prioritySkill === 'string' && answers.prioritySkill.trim().length > 0) count += 1;
  return count;
}

export function isOnboardingComplete(
  answers: Partial<OnboardingAnswers> | undefined
): answers is OnboardingAnswers {
  return countAnsweredOnboardingQuestions(answers) === TOTAL_ONBOARDING_QUESTIONS;
}

