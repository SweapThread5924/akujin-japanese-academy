import React, { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wallet,
  Globe2,
  Briefcase,
} from 'lucide-react';
import {
  FUNDING_TYPES,
  STUDY_IN_JAPAN_OPPORTUNITIES,
  STUDY_OPPORTUNITY_CATEGORIES,
  STUDY_PATHWAY_BLUEPRINTS,
  TARGET_DEGREE_LEVELS,
  type FundingType,
  type StudyOpportunityCategory,
  type TargetDegreeLevel,
} from '../data/studyInJapanData';
import {
  countOpportunitiesByCategory,
  filterStudyOpportunities,
} from '../utils/studyAndScenarios';

const ITEMS_PER_PAGE = 12;

export const StudyInJapanSection: React.FC = () => {
  const [selectedPathwayId, setSelectedPathwayId] = useState(
    STUDY_PATHWAY_BLUEPRINTS[0].id
  );
  const [selectedCategory, setSelectedCategory] = useState<
    StudyOpportunityCategory | 'ALL'
  >('ALL');
  const [selectedFunding, setSelectedFunding] = useState<FundingType | 'ALL'>('ALL');
  const [selectedDegree, setSelectedDegree] = useState<TargetDegreeLevel | 'ALL'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const activePathway =
    STUDY_PATHWAY_BLUEPRINTS.find((p) => p.id === selectedPathwayId) ??
    STUDY_PATHWAY_BLUEPRINTS[0];

  const categoryCounts = useMemo(
    () => countOpportunitiesByCategory(STUDY_IN_JAPAN_OPPORTUNITIES),
    []
  );

  const filteredOpportunities = useMemo(
    () =>
      filterStudyOpportunities(STUDY_IN_JAPAN_OPPORTUNITIES, {
        category: selectedCategory,
        fundingType: selectedFunding,
        targetDegree: selectedDegree,
        query: searchQuery,
      }),
    [selectedCategory, selectedFunding, selectedDegree, searchQuery]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(page, totalPages);
  const pagedOpportunities = filteredOpportunities.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedFunding !== 'ALL' ||
    selectedDegree !== 'ALL' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedFunding('ALL');
    setSelectedDegree('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const jumpFromPathwayToDirectory = (pathwayId: string) => {
    setPage(1);
    setSearchQuery('');
    setSelectedFunding('ALL');
    setSelectedDegree('ALL');
    if (pathwayId === 'pathway-mext') {
      setSelectedCategory('Government & Multilateral Scholarships');
    } else if (pathwayId === 'pathway-language-school') {
      setSelectedCategory('Japanese Language Schools');
    } else if (pathwayId === 'pathway-english-g30') {
      setSelectedCategory('English-Taught University Degrees');
    } else if (pathwayId === 'pathway-senmon') {
      setSelectedCategory('Vocational & Work-Study Routes');
    } else if (pathwayId === 'pathway-graduate-research') {
      setSelectedCategory('ALL');
      setSelectedDegree('Master’s / PhD');
    } else {
      setSelectedCategory('ALL');
    }
    document
      .getElementById('study-opportunities-directory')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-stone-200 dark:border-zinc-800">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            日本留学完全ガイド · Complete Student Pathways &amp; Scholarships Directory
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white tracking-tight text-balance">
            Study in Japan{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Guide &amp; {STUDY_IN_JAPAN_OPPORTUNITIES.length} Opportunities.
            </span>
          </h1>
          <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
            Compare every real pathway to study in Japan — MEXT &amp; JASSO scholarships, private corporate foundations, prefectural grants, English-taught G30/SGU degrees, accredited Japanese language schools, and vocational colleges.
          </p>
        </div>

        {/* Clean Unboxed Tabular Summary */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 shrink-0 pt-2 lg:pt-0">
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono-nums text-[#141413] dark:text-white">
              {STUDY_IN_JAPAN_OPPORTUNITIES.length}
            </p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Verified Programs
            </p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono-nums text-[#D92525] dark:text-rose-400">
              {STUDY_PATHWAY_BLUEPRINTS.length}
            </p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Entry Pathways
            </p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono-nums text-[#141413] dark:text-white">
              28h/wk
            </p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Student Work Limit
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: 6 Core Pathways to Study in Japan */}
      <section aria-labelledby="pathways-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="pathways-heading"
              className="text-lg sm:text-xl font-bold text-[#141413] dark:text-white"
            >
              Choose Your Study Route to Japan
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Select a pathway below to inspect timelines, annual budgets, JLPT benchmarks, and exact steps.
            </p>
          </div>
        </div>

        {/* Pathway Selector Tabs */}
        <div
          role="tablist"
          aria-label="Study in Japan pathways"
          data-reveal-stagger="true"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
        >
          {STUDY_PATHWAY_BLUEPRINTS.map((pathway) => {
            const active = pathway.id === activePathway.id;
            return (
              <button
                key={pathway.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`pathway-tab-${pathway.id}`}
                onClick={() => setSelectedPathwayId(pathway.id)}
                className={`akujin-card-lift akujin-btn-press p-4 rounded-xl border text-left cursor-pointer ${
                  active
                    ? 'border-[#D92525] bg-white dark:bg-[#1B1D26] shadow-xs'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] hover:border-stone-300 dark:hover:border-zinc-700'
                }`}
              >
                <p className="text-[11px] font-jp text-[#D92525] dark:text-rose-400">
                  {pathway.japaneseName}
                </p>
                <p className="text-sm font-bold text-[#141413] dark:text-white mt-0.5">
                  {pathway.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Pathway Detail Card */}
        <div
          key={activePathway.id}
          data-testid="active-pathway-panel"
          className="animate-panel-swap rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-7 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-stone-200 dark:border-zinc-800">
            <div className="space-y-1.5 max-w-3xl">
              <p className="text-xs font-jp font-medium text-[#D92525] dark:text-rose-400">
                {activePathway.japaneseName}
              </p>
              <h3 className="text-xl font-bold text-[#141413] dark:text-white">
                {activePathway.title}
              </h3>
              <p className="text-sm text-stone-600 dark:text-zinc-300">
                {activePathway.bestFor}
              </p>
            </div>
            <button
              type="button"
              onClick={() => jumpFromPathwayToDirectory(activePathway.id)}
              className="px-4 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer akujin-btn-press"
            >
              Filter Matching Programs
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#141413] dark:text-white">
                <Clock className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                Application Timeline
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activePathway.typicalTimeline}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#141413] dark:text-white">
                <Wallet className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                Estimated Annual Cost
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed font-mono-nums">
                {activePathway.estimatedAnnualCost}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#141413] dark:text-white">
                <Globe2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                JLPT / Language Level
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activePathway.jlptBenchmark}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#141413] dark:text-white">
                <Briefcase className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                Visa &amp; Work Rules
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                {activePathway.visaAndWorkNote}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-2.5">
            <p className="text-xs font-semibold text-[#141413] dark:text-white">
              Step-by-Step Roadmap
            </p>
            <ol className="grid md:grid-cols-3 gap-4">
              {activePathway.steps.map((step, i) => (
                <li
                  key={i}
                  className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed flex items-start gap-2"
                >
                  <span className="font-mono-nums font-bold text-[#D92525] dark:text-rose-400 shrink-0">
                    0{i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Section 2: Searchable Directory of 92 Opportunities */}
      <section
        id="study-opportunities-directory"
        aria-labelledby="opportunities-heading"
        className="space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="opportunities-heading"
              className="text-lg sm:text-xl font-bold text-[#141413] dark:text-white"
            >
              Scholarships, Universities, Language Schools &amp; Vocational Directory
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Showing{' '}
              <span
                data-testid="study-results-count"
                className="font-mono-nums font-semibold text-[#141413] dark:text-white"
              >
                {filteredOpportunities.length}
              </span>{' '}
              of {STUDY_IN_JAPAN_OPPORTUNITIES.length} verified Study in Japan opportunities.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Segmented Filter Bar */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            data-testid="study-cat-ALL"
            onClick={() => {
              setSelectedCategory('ALL');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'border-[#D92525] bg-[#D92525] text-white'
                : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-300 hover:border-stone-300'
            }`}
          >
            All ({STUDY_IN_JAPAN_OPPORTUNITIES.length})
          </button>
          {STUDY_OPPORTUNITY_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`study-cat-${cat}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#D92525] bg-[#D92525] text-white'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-300 hover:border-stone-300'
                }`}
              >
                {cat} ({categoryCounts[cat]})
              </button>
            );
          })}
        </div>

        {/* Search + Funding + Degree Controls */}
        <div className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <label htmlFor="study-search-input" className="sr-only">
              Search scholarships, universities, language schools, or cities
            </label>
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="study-search-input"
              data-testid="study-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search MEXT, Honjo, Waseda, APU, Kyoto, language school, PhD…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs sm:text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="study-funding-select" className="sr-only">
              Filter by funding type
            </label>
            <select
              id="study-funding-select"
              data-testid="study-funding-select"
              value={selectedFunding}
              onChange={(e) => {
                setSelectedFunding(e.target.value as FundingType | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs sm:text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525] cursor-pointer"
            >
              <option value="ALL">All Funding Types</option>
              {FUNDING_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="study-degree-select" className="sr-only">
              Filter by target degree level
            </label>
            <select
              id="study-degree-select"
              data-testid="study-degree-select"
              value={selectedDegree}
              onChange={(e) => {
                setSelectedDegree(e.target.value as TargetDegreeLevel | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs sm:text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525] cursor-pointer"
            >
              <option value="ALL">All Education Levels</option>
              {TARGET_DEGREE_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunity Cards Grid */}
        {pagedOpportunities.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-10 text-center space-y-2">
            <GraduationCap
              className="w-8 h-8 text-stone-400 mx-auto"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-[#141413] dark:text-white">
              No opportunities matched your current filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline cursor-pointer"
            >
              Show all {STUDY_IN_JAPAN_OPPORTUNITIES.length} opportunities
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pagedOpportunities.map((opp) => (
              <article
                key={opp.id}
                data-testid={`study-card-${opp.id}`}
                className="akujin-card-lift rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-stone-300 dark:hover:border-zinc-700"
              >
                <div className="space-y-3">
                  {/* Unboxed Typographic Metadata */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500 dark:text-zinc-400">
                    <span className="font-semibold text-[#D92525] dark:text-rose-400">
                      {opp.fundingType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.targetDegree}</span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.region}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#141413] dark:text-white leading-snug">
                      {opp.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                      {opp.provider}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                    {opp.eligibilitySummary}
                  </p>

                  {/* Key Facts Table-Like Strip */}
                  <div className="grid sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-100 dark:border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-zinc-400 block">
                        Funding / Tuition Benefit
                      </span>
                      <span className="font-mono-nums font-semibold text-[#141413] dark:text-zinc-100">
                        {opp.estimatedBenefit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-zinc-400 block">
                        Language &amp; Window
                      </span>
                      <span className="text-stone-700 dark:text-zinc-200">
                        {opp.jlptRequired} · {opp.applicationWindow}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1 pt-1">
                    {opp.highlights.map((h, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-zinc-300"
                      >
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400 dark:text-zinc-500 truncate">
                    {opp.category}
                  </span>
                  <a
                    href={opp.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Official Portal
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs font-medium text-[#141413] dark:text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#16181F] text-xs font-medium text-[#141413] dark:text-white disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Essential Student Visa & Monthly Budget Quick Reference */}
      <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#141413] dark:text-white">
            Essential Student Visa, Part-Time Work &amp; Living Cost Facts
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Key practical rules every international student in Japan should plan around before departure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="space-y-1.5">
            <p className="font-bold text-[#141413] dark:text-white">
              28 Hours / Week Work Rule
            </p>
            <p className="text-stone-600 dark:text-zinc-300 leading-relaxed">
              Apply for 資格外活動許可 at airport immigration upon arrival. Work up to 28 hrs/wk during terms (40 hrs/wk during breaks), typically earning ¥100,000–¥135,000/month.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-[#141413] dark:text-white">
              Monthly Living Cost (JPY)
            </p>
            <p className="text-stone-600 dark:text-zinc-300 leading-relaxed font-mono-nums">
              Tokyo: ¥110,000–¥140,000/mo · Osaka/Kyoto: ¥90,000–¥115,000/mo · Fukuoka/Sapporo/Sendai: ¥75,000–¥100,000/mo (dorm + food + transit).
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-[#141413] dark:text-white">
              National Health Insurance (70%)
            </p>
            <p className="text-stone-600 dark:text-zinc-300 leading-relaxed">
              Mandatory for all 3+ month residents (~¥1,500–¥2,200/mo for students with income reduction). Covers 70% of hospital, clinic, dental, and prescription bills.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-[#141413] dark:text-white">
              Key Annual Exam Dates
            </p>
            <p className="text-stone-600 dark:text-zinc-300 leading-relaxed">
              JLPT: Early July &amp; Early December · EJU (University Admission): Mid-June &amp; Mid-November · MEXT Embassy Track: April–May every year.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
