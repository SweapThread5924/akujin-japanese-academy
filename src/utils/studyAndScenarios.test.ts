import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JAPAN_REGIONAL_SCENARIOS,
  JAPAN_REGIONS,
} from '../data/japanRegionalScenarios.ts';
import {
  STUDY_IN_JAPAN_OPPORTUNITIES,
  STUDY_OPPORTUNITY_CATEGORIES,
  STUDY_PATHWAY_BLUEPRINTS,
} from '../data/studyInJapanData.ts';
import {
  countOpportunitiesByCategory,
  countScenariosByRegion,
  filterRegionalScenarios,
  filterStudyOpportunities,
} from './studyAndScenarios.ts';

test('JAPAN_REGIONAL_SCENARIOS provides 80+ unique scenarios covering every region of Japan with dialogue and etiquette', () => {
  assert.ok(
    JAPAN_REGIONAL_SCENARIOS.length >= 80,
    `Expected at least 80 regional scenarios, got ${JAPAN_REGIONAL_SCENARIOS.length}`
  );
  const ids = new Set(JAPAN_REGIONAL_SCENARIOS.map((s) => s.id));
  assert.equal(ids.size, JAPAN_REGIONAL_SCENARIOS.length, 'All regional scenario IDs must be unique');

  const counts = countScenariosByRegion(JAPAN_REGIONAL_SCENARIOS);
  for (const region of JAPAN_REGIONS) {
    assert.ok(
      counts[region] >= 8,
      `Expected at least 8 scenarios in ${region}, got ${counts[region]}`
    );
  }

  for (const s of JAPAN_REGIONAL_SCENARIOS) {
    assert.ok(s.dialogue.length >= 2, `Scenario ${s.id} should have at least 2 dialogue lines`);
    assert.ok(s.etiquette.doRule.length > 10, `Scenario ${s.id} missing doRule`);
    assert.ok(s.etiquette.dontRule.length > 10, `Scenario ${s.id} missing dontRule`);
  }
});

test('filterRegionalScenarios filters accurately by region, category, and free-text query', () => {
  const kansaiDining = filterRegionalScenarios(JAPAN_REGIONAL_SCENARIOS, {
    region: 'Kansai',
    category: 'Dining & Food',
    query: '',
  });
  assert.ok(kansaiDining.length >= 3);
  assert.ok(kansaiDining.every((s) => s.region === 'Kansai' && s.category === 'Dining & Food'));

  const izumo = filterRegionalScenarios(JAPAN_REGIONAL_SCENARIOS, {
    region: 'ALL',
    category: 'ALL',
    query: '4-clap',
  });
  assert.equal(izumo.length, 1);
  assert.equal(izumo[0].id, 'cg-izumo-taisha');
});

test('STUDY_IN_JAPAN_OPPORTUNITIES provides 80+ unique verified opportunities across all 6 categories', () => {
  assert.ok(
    STUDY_IN_JAPAN_OPPORTUNITIES.length >= 80,
    `Expected at least 80 Study in Japan opportunities, got ${STUDY_IN_JAPAN_OPPORTUNITIES.length}`
  );
  assert.equal(STUDY_PATHWAY_BLUEPRINTS.length, 6);

  const ids = new Set(STUDY_IN_JAPAN_OPPORTUNITIES.map((o) => o.id));
  assert.equal(ids.size, STUDY_IN_JAPAN_OPPORTUNITIES.length, 'All opportunity IDs must be unique');

  const counts = countOpportunitiesByCategory(STUDY_IN_JAPAN_OPPORTUNITIES);
  for (const cat of STUDY_OPPORTUNITY_CATEGORIES) {
    assert.ok(counts[cat] >= 8, `Expected at least 8 items in ${cat}, got ${counts[cat]}`);
  }

  for (const opp of STUDY_IN_JAPAN_OPPORTUNITIES) {
    assert.ok(
      opp.officialUrl.startsWith('http://') || opp.officialUrl.startsWith('https://'),
      `Opportunity ${opp.id} must have a valid http(s) URL`
    );
  }
});

test('filterStudyOpportunities filters by category, funding type, target degree, and keyword', () => {
  const fullyFundedPhd = filterStudyOpportunities(STUDY_IN_JAPAN_OPPORTUNITIES, {
    category: 'ALL',
    fundingType: 'Fully Funded',
    targetDegree: 'Master’s / PhD',
    query: '',
  });
  assert.ok(fullyFundedPhd.length >= 10);
  assert.ok(fullyFundedPhd.every((o) => o.fundingType === 'Fully Funded'));

  const mextSearch = filterStudyOpportunities(STUDY_IN_JAPAN_OPPORTUNITIES, {
    category: 'Government & Multilateral Scholarships',
    fundingType: 'ALL',
    targetDegree: 'ALL',
    query: 'MEXT',
  });
  assert.ok(mextSearch.length >= 7);
});
