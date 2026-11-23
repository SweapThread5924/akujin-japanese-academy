import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJlptRoadmapMilestones } from './jlptRoadmap';
import {
  DEFAULT_CELEBRATED_RECORD,
  detectNewRoadmapAchievements,
  normalizeCelebratedRecord,
  pickHeadlineAchievement,
  createConfettiParticles,
  stepConfettiParticles,
  readCelebratedMilestones,
  writeCelebratedMilestones,
} from './roadmapCelebration';

test('Day-1 starter roadmap does not trigger confetti when N5 is baseline unlocked', () => {
  const summary = buildJlptRoadmapMilestones({
    xp: 0,
    targetLevel: 'N5',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 0,
  });

  const { events, nextCelebrated } = detectNewRoadmapAchievements(
    summary.milestones,
    DEFAULT_CELEBRATED_RECORD
  );

  assert.equal(events.length, 0);
  assert.deepEqual(nextCelebrated.unlockedLevels, ['N5']);
  assert.deepEqual(nextCelebrated.masteredLevels, []);
  assert.deepEqual(nextCelebrated.completedLevels, []);
});

test('Unlocking JLPT N4 emits level-unlocked celebration and deduplicates on repeat check', () => {
  const summary = buildJlptRoadmapMilestones({
    xp: 200,
    targetLevel: 'N4',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 0,
  });

  const first = detectNewRoadmapAchievements(summary.milestones, DEFAULT_CELEBRATED_RECORD);
  assert.equal(first.events.length, 1);
  assert.equal(first.events[0].level, 'N4');
  assert.equal(first.events[0].kind, 'level-unlocked');

  // Re-running with persisted nextCelebrated yields 0 duplicate events
  const second = detectNewRoadmapAchievements(summary.milestones, first.nextCelebrated);
  assert.equal(second.events.length, 0);
});

test('Setting target directly to JLPT N3 celebrates unlocking N4 and N3 and picks N3 headline', () => {
  const summary = buildJlptRoadmapMilestones({
    xp: 0,
    targetLevel: 'N3',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 0,
  });

  const { events } = detectNewRoadmapAchievements(summary.milestones, DEFAULT_CELEBRATED_RECORD);
  const levels = events.map((e) => e.level);
  assert.deepEqual(levels, ['N4', 'N3']);

  const headline = pickHeadlineAchievement(events);
  assert.ok(headline);
  assert.equal(headline.level, 'N3');
  assert.equal(headline.kind, 'level-unlocked');
});

test('Mastered (80%+) and completed (100%) milestones prioritize completed headline', () => {
  const base = buildJlptRoadmapMilestones({
    xp: 300,
    targetLevel: 'N4',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 0,
  });

  const customMilestones = base.milestones.map((m) => {
    if (m.level === 'N5') {
      return { ...m, masteryPct: 100, status: 'mastered' as const, isUnlocked: true };
    }
    if (m.level === 'N4') {
      return { ...m, masteryPct: 85, status: 'mastered' as const, isUnlocked: true };
    }
    return m;
  });

  const { events, nextCelebrated } = detectNewRoadmapAchievements(customMilestones, {
    unlockedLevels: ['N5', 'N4'],
    masteredLevels: [],
    completedLevels: [],
  });

  assert.equal(events.length, 2);
  const headline = pickHeadlineAchievement(events);
  assert.ok(headline);
  assert.equal(headline.level, 'N5');
  assert.equal(headline.kind, 'level-completed');
  assert.ok(nextCelebrated.completedLevels.includes('N5'));
  assert.ok(nextCelebrated.masteredLevels.includes('N4'));
});

test('readCelebratedMilestones and writeCelebratedMilestones round-trip safely with fallback sanitization', () => {
  const mem = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
  };

  const initial = readCelebratedMilestones(mockStorage);
  assert.deepEqual(initial.unlockedLevels, ['N5']);

  writeCelebratedMilestones(
    normalizeCelebratedRecord({
      unlockedLevels: ['N4', 'INVALID_TIER'],
      masteredLevels: ['N5'],
      completedLevels: [],
    }),
    mockStorage
  );

  const loaded = readCelebratedMilestones(mockStorage);
  assert.deepEqual(loaded.unlockedLevels, ['N5', 'N4']);
  assert.deepEqual(loaded.masteredLevels, ['N5']);
});

test('createConfettiParticles and stepConfettiParticles advance physics and cull faded particles', () => {
  let seed = 0.25;
  const deterministicRng = () => {
    seed = (seed + 0.17) % 1;
    return seed;
  };

  const particles = createConfettiParticles(1280, 800, 60, deterministicRng);
  assert.equal(particles.length, 60);
  for (const p of particles) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.opacity === 1);
  }

  const stepped = stepConfettiParticles(particles, 0.016, 800, 0.2);
  assert.equal(stepped.length, 60);
  assert.ok(stepped.every((p) => p.opacity < 1 && p.opacity > 0.7));

  const fadedOut = stepConfettiParticles(stepped, 0.016, 800, 1);
  assert.equal(fadedOut.length, 0);
});
