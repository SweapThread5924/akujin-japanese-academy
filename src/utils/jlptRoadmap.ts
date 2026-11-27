import type { JlptLevel, SrsCardProgress } from './srsEngine';
import { computePerLevelKanjiBreakdown } from './joyoProgress';
import { buildFullJoyoKanjiDeck } from './joyoDeckBuilder';
import { KANJI_DECK } from '../data/curriculumData';
import { ALL_JLPT_KANJI_CATALOG } from '../data/jlptUpperData';

const FULL_ROADMAP_SRS_DECK = buildFullJoyoKanjiDeck(KANJI_DECK, ALL_JLPT_KANJI_CATALOG);

export type MilestoneStatus = 'mastered' | 'in-progress' | 'unlocked' | 'locked';

export interface JlptRoadmapMilestone {
  level: JlptLevel;
  order: number;
  japaneseSeal: string;
  title: string;
  subtitle: string;
  studyHours: string;
  kanjiTarget: number;
  vocabTarget: number;
  xpUnlockThreshold: number;
  status: MilestoneStatus;
  isUnlocked: boolean;
  isCurrentTarget: boolean;
  masteryPct: number;
  kanjiMasteredCount: number;
  kanjiDeckTotal: number;
  unlockRequirement: string;
  skillsChecklist: {
    label: string;
    detail: string;
    completed: boolean;
  }[];
}

export interface JlptRoadmapSummary {
  milestones: JlptRoadmapMilestone[];
  unlockedCount: number;
  masteredCount: number;
  overallMasteryPct: number;
}

const LEVEL_ORDER: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_BLUEPRINTS: Record<
  JlptLevel,
  {
    japaneseSeal: string;
    title: string;
    subtitle: string;
    studyHours: string;
    kanjiTarget: number;
    vocabTarget: number;
    xpUnlockThreshold: number;
    skills: { label: string; detail: string }[];
  }
> = {
  N5: {
    japaneseSeal: '初級',
    title: 'Foundations & Daily Survival',
    subtitle: 'Hiragana, Katakana, core particles (は・が・を・に・で), polite ます/です forms, and daily errands.',
    studyHours: '150 hrs',
    kanjiTarget: 100,
    vocabTarget: 800,
    xpUnlockThreshold: 0,
    skills: [
      { label: 'Kana Fluency', detail: 'Read & write all 46 Hiragana and 46 Katakana cleanly.' },
      { label: 'Core Particles & Polite Forms', detail: 'Build natural です/ます sentences and te-form requests.' },
      { label: 'First 100 Essential Kanji', detail: 'Recognize daily signs, numbers, days, and station names.' },
      { label: 'Everyday Listening', detail: 'Follow slow introductions, shopping, and transit announcements.' },
    ],
  },
  N4: {
    japaneseSeal: '基礎',
    title: 'Everyday Conversation & Travel',
    subtitle: 'Plain/casual speech, potential & passive forms, expressing reasons, and independent travel across Japan.',
    studyHours: '300 hrs',
    kanjiTarget: 300,
    vocabTarget: 1500,
    xpUnlockThreshold: 150,
    skills: [
      { label: 'Casual & Plain Speech', detail: 'Shift smoothly between polite です/ます and natural plain forms.' },
      { label: '300 Cumulative Kanji', detail: 'Read restaurant menus, clinic notices, and travel itineraries.' },
      { label: 'Complex Verb Conjugations', detail: 'Master potential, passive, volitional, and giving/receiving verbs.' },
      { label: 'Real-Life Dialogues', detail: 'Handle izakaya orders, hotel check-ins, and train transfers.' },
    ],
  },
  N3: {
    japaneseSeal: '中級',
    title: 'Bridge to Natural Media',
    subtitle: 'Intermediate grammar nuances, newspaper headlines, everyday workplace Japanese, and unscripted podcasts.',
    studyHours: '450 hrs',
    kanjiTarget: 650,
    vocabTarget: 3750,
    xpUnlockThreshold: 450,
    skills: [
      { label: '650 Intermediate Kanji', detail: 'Read short essays, manga, and daily Japanese web articles.' },
      { label: 'Nuance & Register Shifting', detail: 'Express assumptions, regrets, and natural spoken contractions.' },
      { label: 'Longer Reading Passages', detail: 'Identify author intent and main arguments under exam timing.' },
      { label: 'Natural Speed Listening', detail: 'Follow everyday conversations at full native tempo.' },
    ],
  },
  N2: {
    japaneseSeal: '上級',
    title: 'Business Keigo & Career Fluency',
    subtitle: 'Professional meetings, honorific/humble Keigo, university lectures, and Japanese tech/corporate roles.',
    studyHours: '600 hrs',
    kanjiTarget: 1000,
    vocabTarget: 6000,
    xpUnlockThreshold: 1000,
    skills: [
      { label: '1,000+ Business & News Kanji', detail: 'Navigate news reports, technical specs, and formal emails.' },
      { label: 'Sonkeigo & Kenjougo (Keigo)', detail: 'Communicate politely with clients, professors, and managers.' },
      { label: 'Abstract Grammar Patterns', detail: 'Connect multi-clause arguments with formal written transitions.' },
      { label: 'Interview & Workplace Readiness', detail: 'Handle job interviews and university scholarship panels.' },
    ],
  },
  N1: {
    japaneseSeal: '達人',
    title: 'Academic & Near-Native Mastery',
    subtitle: 'Full 2,136 Jōyō Kanji literacy, literary essays, legal/editorial nuance, and native-grade comprehension.',
    studyHours: '900+ hrs',
    kanjiTarget: 2136,
    vocabTarget: 10000,
    xpUnlockThreshold: 2000,
    skills: [
      { label: 'All 2,136 Jōyō Kanji', detail: 'Read novels, editorials, and academic research papers fluently.' },
      { label: 'Literary & Formal Rhetoric', detail: 'Grasp subtle classical expressions and idiomatic compounds.' },
      { label: 'High-Speed Critical Reading', detail: 'Compare multiple editorial viewpoints under strict N1 timing.' },
      { label: 'Native-Level Listening', detail: 'Comprehend lectures, debates, and rapid panel broadcasts.' },
    ],
  },
};

export function buildJlptRoadmapMilestones(params: {
  xp: number;
  targetLevel: JlptLevel;
  srsProgress: Record<string, SrsCardProgress>;
  masteredItemIds: string[];
  quizCorrectTotal: number;
}): JlptRoadmapSummary {
  const breakdown = computePerLevelKanjiBreakdown({
    joyoCatalog: ALL_JLPT_KANJI_CATALOG,
    masteredItemIds: params.masteredItemIds,
    srsProgress: params.srsProgress,
    srsDeck: FULL_ROADMAP_SRS_DECK,
  });
  const breakdownByLevel = new Map(breakdown.map((b) => [b.level, b]));
  const targetIndex = LEVEL_ORDER.indexOf(params.targetLevel);

  const milestones: JlptRoadmapMilestone[] = [];
  let prevMasteryPct = 100;

  for (let i = 0; i < LEVEL_ORDER.length; i += 1) {
    const level = LEVEL_ORDER[i];
    const bp = LEVEL_BLUEPRINTS[level];
    const kanjiStats = breakdownByLevel.get(level);
    const kanjiMasteredCount = kanjiStats?.masteredCount ?? 0;
    const kanjiLearningCount = kanjiStats?.learningCount ?? 0;
    const kanjiDeckTotal = kanjiStats?.totalCount ?? 1;

    // Combine Kanji SRS mastery + XP progress into a truthful 0-100% mastery percentage
    const kanjiScore =
      kanjiDeckTotal > 0
        ? ((kanjiMasteredCount + kanjiLearningCount * 0.4) / kanjiDeckTotal) * 70
        : 0;
    const nextThreshold =
      i < LEVEL_ORDER.length - 1
        ? LEVEL_BLUEPRINTS[LEVEL_ORDER[i + 1]].xpUnlockThreshold
        : bp.xpUnlockThreshold + 1500;
    const xpSpan = Math.max(150, nextThreshold - bp.xpUnlockThreshold);
    const xpProgressRatio = Math.min(
      1,
      Math.max(0, (params.xp - bp.xpUnlockThreshold) / xpSpan)
    );
    const xpScore = xpProgressRatio * 30;
    const masteryPct = Math.min(100, Math.round(kanjiScore + xpScore));

    const isUnlocked =
      i === 0 ||
      i <= targetIndex ||
      params.xp >= bp.xpUnlockThreshold ||
      prevMasteryPct >= 70;

    let status: MilestoneStatus = 'locked';
    if (isUnlocked) {
      if (masteryPct >= 80) {
        status = 'mastered';
      } else if (
        masteryPct > 0 ||
        level === params.targetLevel ||
        kanjiLearningCount > 0
      ) {
        status = 'in-progress';
      } else {
        status = 'unlocked';
      }
    }

    const prevLevel = i > 0 ? LEVEL_ORDER[i - 1] : null;
    const unlockRequirement =
      i === 0
        ? 'Unlocked from Day 1'
        : `Reach ${bp.xpUnlockThreshold.toLocaleString()} XP or 70% mastery in JLPT ${prevLevel}`;

    const skillsChecklist = bp.skills.map((skill, idx) => ({
      ...skill,
      completed: isUnlocked && masteryPct >= (idx + 1) * 25,
    }));

    milestones.push({
      level,
      order: i + 1,
      japaneseSeal: bp.japaneseSeal,
      title: bp.title,
      subtitle: bp.subtitle,
      studyHours: bp.studyHours,
      kanjiTarget: bp.kanjiTarget,
      vocabTarget: bp.vocabTarget,
      xpUnlockThreshold: bp.xpUnlockThreshold,
      status,
      isUnlocked,
      isCurrentTarget: level === params.targetLevel,
      masteryPct: isUnlocked ? masteryPct : 0,
      kanjiMasteredCount,
      kanjiDeckTotal,
      unlockRequirement,
      skillsChecklist,
    });

    prevMasteryPct = isUnlocked ? masteryPct : 0;
  }

  const unlockedCount = milestones.filter((m) => m.isUnlocked).length;
  const masteredCount = milestones.filter((m) => m.status === 'mastered').length;
  const overallMasteryPct = Math.round(
    milestones.reduce((acc, m) => acc + m.masteryPct, 0) / milestones.length
  );

  return {
    milestones,
    unlockedCount,
    masteredCount,
    overallMasteryPct,
  };
}
