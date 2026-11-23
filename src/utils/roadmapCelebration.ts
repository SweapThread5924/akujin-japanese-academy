import type { JlptLevel } from './srsEngine';
import type { JlptRoadmapMilestone } from './jlptRoadmap';

export const ROADMAP_CELEBRATED_STORAGE_KEY = 'akujin_roadmap_celebrated_v1';

export type RoadmapCelebrationKind =
  | 'level-completed'
  | 'level-mastered'
  | 'level-unlocked';

export interface RoadmapCelebrationEvent {
  level: JlptLevel;
  kind: RoadmapCelebrationKind;
  headline: string;
  subtext: string;
  masteryPct: number;
}

export interface CelebratedMilestonesRecord {
  unlockedLevels: JlptLevel[];
  masteredLevels: JlptLevel[];
  completedLevels: JlptLevel[];
}

export const DEFAULT_CELEBRATED_RECORD: CelebratedMilestonesRecord = {
  // N5 is unlocked on Day 1 by default so initial Roadmap visit never fires spurious confetti
  unlockedLevels: ['N5'],
  masteredLevels: [],
  completedLevels: [],
};

const VALID_LEVELS = new Set<JlptLevel>(['N5', 'N4', 'N3', 'N2', 'N1']);

function sanitizeLevelArray(value: unknown, fallback: JlptLevel[] = []): JlptLevel[] {
  if (!Array.isArray(value)) return [...fallback];
  const seen = new Set<JlptLevel>();
  for (const item of value) {
    if (typeof item === 'string' && VALID_LEVELS.has(item as JlptLevel)) {
      seen.add(item as JlptLevel);
    }
  }
  return Array.from(seen);
}

export function normalizeCelebratedRecord(raw: unknown): CelebratedMilestonesRecord {
  if (!raw || typeof raw !== 'object') {
    return {
      unlockedLevels: [...DEFAULT_CELEBRATED_RECORD.unlockedLevels],
      masteredLevels: [],
      completedLevels: [],
    };
  }
  const obj = raw as Record<string, unknown>;
  const unlocked = sanitizeLevelArray(obj.unlockedLevels, DEFAULT_CELEBRATED_RECORD.unlockedLevels);
  if (!unlocked.includes('N5')) {
    unlocked.unshift('N5');
  }
  return {
    unlockedLevels: unlocked,
    masteredLevels: sanitizeLevelArray(obj.masteredLevels),
    completedLevels: sanitizeLevelArray(obj.completedLevels),
  };
}

export function readCelebratedMilestones(storage?: Pick<Storage, 'getItem'> | null): CelebratedMilestonesRecord {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) {
    return normalizeCelebratedRecord(null);
  }

  try {
    const raw = targetStorage.getItem(ROADMAP_CELEBRATED_STORAGE_KEY);
    if (!raw) return normalizeCelebratedRecord(null);
    return normalizeCelebratedRecord(JSON.parse(raw));
  } catch {
    return normalizeCelebratedRecord(null);
  }
}

export function writeCelebratedMilestones(
  record: CelebratedMilestonesRecord,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) return;
  try {
    targetStorage.setItem(ROADMAP_CELEBRATED_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function detectNewRoadmapAchievements(
  milestones: JlptRoadmapMilestone[],
  celebrated: CelebratedMilestonesRecord
): {
  events: RoadmapCelebrationEvent[];
  nextCelebrated: CelebratedMilestonesRecord;
} {
  const unlockedSet = new Set<JlptLevel>(celebrated.unlockedLevels);
  const masteredSet = new Set<JlptLevel>(celebrated.masteredLevels);
  const completedSet = new Set<JlptLevel>(celebrated.completedLevels);

  // Baseline N5 unlock silently
  unlockedSet.add('N5');

  const events: RoadmapCelebrationEvent[] = [];

  for (const m of milestones) {
    const isCompleted = m.isUnlocked && m.masteryPct >= 100;
    const isMastered = m.isUnlocked && m.status === 'mastered';

    if (isCompleted && !completedSet.has(m.level)) {
      completedSet.add(m.level);
      masteredSet.add(m.level);
      unlockedSet.add(m.level);
      events.push({
        level: m.level,
        kind: 'level-completed',
        headline: `100% Complete — JLPT ${m.level}!`,
        subtext: `Incredible! You mastered every checkpoint in JLPT ${m.level}: ${m.title}.`,
        masteryPct: m.masteryPct,
      });
      continue;
    }

    if (isMastered && !masteredSet.has(m.level)) {
      masteredSet.add(m.level);
      unlockedSet.add(m.level);
      events.push({
        level: m.level,
        kind: 'level-mastered',
        headline: `Milestone Mastered — JLPT ${m.level}!`,
        subtext: `You reached ${m.masteryPct}% mastery in JLPT ${m.level}. Next tier progress is underway.`,
        masteryPct: m.masteryPct,
      });
      continue;
    }

    if (m.isUnlocked && !unlockedSet.has(m.level)) {
      unlockedSet.add(m.level);
      events.push({
        level: m.level,
        kind: 'level-unlocked',
        headline: `Milestone Unlocked — JLPT ${m.level}!`,
        subtext: `JLPT ${m.level} (${m.title}) is now open. Keep building momentum!`,
        masteryPct: m.masteryPct,
      });
    }
  }

  return {
    events,
    nextCelebrated: {
      unlockedLevels: Array.from(unlockedSet),
      masteredLevels: Array.from(masteredSet),
      completedLevels: Array.from(completedSet),
    },
  };
}

const KIND_PRIORITY: Record<RoadmapCelebrationKind, number> = {
  'level-completed': 3,
  'level-mastered': 2,
  'level-unlocked': 1,
};

const LEVEL_PRIORITY: Record<JlptLevel, number> = {
  N1: 5,
  N2: 4,
  N3: 3,
  N4: 2,
  N5: 1,
};

export function pickHeadlineAchievement(
  events: RoadmapCelebrationEvent[]
): RoadmapCelebrationEvent | null {
  if (events.length === 0) return null;
  return [...events].sort((a, b) => {
    const kindDiff = KIND_PRIORITY[b.kind] - KIND_PRIORITY[a.kind];
    if (kindDiff !== 0) return kindDiff;
    return LEVEL_PRIORITY[b.level] - LEVEL_PRIORITY[a.level];
  })[0];
}

// --- Pure Confetti Particle Physics ---

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'ribbon';
  wobblePhase: number;
  wobbleSpeed: number;
}

export const CONFETTI_PALETTE = [
  '#D92525', // AkuJin Crimson
  '#FB7185', // Sakura Rose
  '#F59E0B', // Gold Seal Amber
  '#10B981', // Mastery Emerald
  '#38BDF8', // Sky Accent
  '#FCFBF8', // Washi Cream
] as const;

export function createConfettiParticles(
  width: number,
  height: number,
  count = 110,
  rng: () => number = Math.random
): ConfettiParticle[] {
  const safeW = Math.max(320, width);
  const safeH = Math.max(320, height);
  const clampedCount = Math.max(12, Math.min(240, Math.round(count)));

  const emitters = [
    { x: safeW * 0.5, y: safeH * 0.28, spread: Math.PI * 0.95, baseAngle: -Math.PI / 2 },
    { x: safeW * 0.18, y: safeH * 0.42, spread: Math.PI * 0.55, baseAngle: -Math.PI / 3 },
    { x: safeW * 0.82, y: safeH * 0.42, spread: Math.PI * 0.55, baseAngle: (-2 * Math.PI) / 3 },
  ];

  const shapes: ConfettiParticle['shape'][] = ['rect', 'ribbon', 'circle'];
  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < clampedCount; i++) {
    const emitter = emitters[i % emitters.length];
    const angle = emitter.baseAngle + (rng() - 0.5) * emitter.spread;
    const speed = 260 + rng() * 520;
    const size = 6 + rng() * 7;

    particles.push({
      x: emitter.x + (rng() - 0.5) * 32,
      y: emitter.y + (rng() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      width: size,
      height: shapes[i % shapes.length] === 'ribbon' ? size * 1.9 : size * 0.65,
      color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
      rotation: rng() * Math.PI * 2,
      rotationSpeed: (rng() - 0.5) * 11,
      opacity: 1,
      shape: shapes[i % shapes.length],
      wobblePhase: rng() * Math.PI * 2,
      wobbleSpeed: 4 + rng() * 6,
    });
  }

  return particles;
}

export function stepConfettiParticles(
  particles: ConfettiParticle[],
  dtSeconds: number,
  viewportHeight: number,
  fadeProgress = 0
): ConfettiParticle[] {
  const dt = Math.max(0.001, Math.min(0.05, dtSeconds));
  const gravity = 640;
  const drag = Math.pow(0.985, dt * 60);
  const fadeFactor = Math.max(0, Math.min(1, fadeProgress));

  const next: ConfettiParticle[] = [];
  for (const p of particles) {
    const wobble = Math.sin(p.wobblePhase) * 28;
    const vx = (p.vx + wobble * dt) * drag;
    const vy = p.vy * drag + gravity * dt;
    const x = p.x + vx * dt;
    const y = p.y + vy * dt;
    const opacity = Math.max(0, 1 - fadeFactor);

    if (y <= viewportHeight + 60 && opacity > 0.01) {
      next.push({
        ...p,
        x,
        y,
        vx,
        vy,
        rotation: p.rotation + p.rotationSpeed * dt,
        wobblePhase: p.wobblePhase + p.wobbleSpeed * dt,
        opacity,
      });
    }
  }
  return next;
}
