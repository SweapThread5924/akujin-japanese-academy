import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJlptRoadmapMilestones } from './jlptRoadmap';

test('buildJlptRoadmapMilestones unlocks N5 by default and locks N4-N1 at 0 XP', () => {
  const result = buildJlptRoadmapMilestones({
    xp: 0,
    targetLevel: 'N5',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 0,
  });

  assert.equal(result.milestones.length, 5);
  assert.equal(result.unlockedCount, 1);
  assert.equal(result.masteredCount, 0);
  assert.equal(result.milestones[0].level, 'N5');
  assert.equal(result.milestones[0].isUnlocked, true);
  assert.equal(result.milestones[0].status, 'in-progress');
  assert.equal(result.milestones[1].level, 'N4');
  assert.equal(result.milestones[1].isUnlocked, false);
  assert.equal(result.milestones[1].status, 'locked');
  assert.equal(result.milestones[4].level, 'N1');
  assert.equal(result.milestones[4].isUnlocked, false);
});

test('buildJlptRoadmapMilestones unlocks higher tiers via XP thresholds or targetLevel', () => {
  const result = buildJlptRoadmapMilestones({
    xp: 520,
    targetLevel: 'N4',
    srsProgress: {},
    masteredItemIds: [],
    quizCorrectTotal: 8,
  });

  // N5 (0), N4 (150), N3 (450) unlocked; N2 (1000) & N1 (2000) locked
  assert.equal(result.unlockedCount, 3);
  assert.equal(result.milestones[0].isUnlocked, true);
  assert.equal(result.milestones[1].isUnlocked, true);
  assert.equal(result.milestones[2].isUnlocked, true);
  assert.equal(result.milestones[3].isUnlocked, false);
  assert.equal(result.milestones[4].isUnlocked, false);
});
