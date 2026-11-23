import type {
  JapanRegion,
  RegionalScenario,
  RegionalScenarioCategory,
} from '../data/japanRegionalScenarios';
import type {
  FundingType,
  StudyOpportunity,
  StudyOpportunityCategory,
  TargetDegreeLevel,
} from '../data/studyInJapanData';

export interface RegionalScenarioFilter {
  region: JapanRegion | 'ALL';
  category: RegionalScenarioCategory | 'ALL';
  query: string;
}

export function filterRegionalScenarios(
  scenarios: RegionalScenario[],
  filter: RegionalScenarioFilter
): RegionalScenario[] {
  const q = filter.query.trim().toLowerCase();
  return scenarios.filter((item) => {
    if (filter.region !== 'ALL' && item.region !== filter.region) return false;
    if (filter.category !== 'ALL' && item.category !== filter.category) return false;
    if (!q) return true;
    const haystack = [
      item.title,
      item.japaneseTitle,
      item.city,
      item.prefecture,
      item.region,
      item.category,
      item.summary,
      item.etiquette.doRule,
      item.etiquette.dontRule,
      item.etiquette.localTip,
      ...item.dialogue.flatMap((d) => [d.japanese, d.romaji, d.english]),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function countScenariosByRegion(
  scenarios: RegionalScenario[]
): Record<JapanRegion, number> {
  const counts: Record<JapanRegion, number> = {
    Hokkaido: 0,
    Tohoku: 0,
    Kanto: 0,
    Chubu: 0,
    Kansai: 0,
    Chugoku: 0,
    Shikoku: 0,
    'Kyushu & Okinawa': 0,
  };
  for (const s of scenarios) {
    counts[s.region] = (counts[s.region] ?? 0) + 1;
  }
  return counts;
}

export interface StudyOpportunityFilter {
  category: StudyOpportunityCategory | 'ALL';
  fundingType: FundingType | 'ALL';
  targetDegree: TargetDegreeLevel | 'ALL';
  query: string;
}

export function filterStudyOpportunities(
  opportunities: StudyOpportunity[],
  filter: StudyOpportunityFilter
): StudyOpportunity[] {
  const q = filter.query.trim().toLowerCase();
  return opportunities.filter((item) => {
    if (filter.category !== 'ALL' && item.category !== filter.category) return false;
    if (filter.fundingType !== 'ALL' && item.fundingType !== filter.fundingType) return false;
    if (
      filter.targetDegree !== 'ALL' &&
      item.targetDegree !== filter.targetDegree &&
      item.targetDegree !== 'All Levels'
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      item.name,
      item.provider,
      item.category,
      item.fundingType,
      item.targetDegree,
      item.jlptRequired,
      item.estimatedBenefit,
      item.region,
      item.eligibilitySummary,
      ...item.highlights,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function countOpportunitiesByCategory(
  opportunities: StudyOpportunity[]
): Record<StudyOpportunityCategory, number> {
  const counts: Record<StudyOpportunityCategory, number> = {
    'Government & Multilateral Scholarships': 0,
    'Private & Corporate Foundations': 0,
    'Prefectural & City Grants': 0,
    'English-Taught University Degrees': 0,
    'Japanese Language Schools': 0,
    'Vocational & Work-Study Routes': 0,
  };
  for (const opp of opportunities) {
    counts[opp.category] = (counts[opp.category] ?? 0) + 1;
  }
  return counts;
}
