import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, ArrowUpRight, Flame, Award, Calendar, Layers } from 'lucide-react';
import type { JlptLevel, SrsCardProgress } from '../utils/srsEngine';
import { KANJI_DECK } from '../data/curriculumData';
import { ALL_JLPT_KANJI_CATALOG } from '../data/jlptUpperData';
import {
  isAllJlptLevelsVisible,
  normalizeVisibleJlptLevels,
} from '../utils/jlptVisibility';
import {
  buildKanjiMasteryTrend,
  type KanjiMasteryTrendPoint,
} from '../utils/kanjiMasteryTrend';

interface KanjiMasteryTrendChartProps {
  srsProgress: Record<string, SrsCardProgress>;
  darkMode: boolean;
  onOpenKanjiSrs: () => void;
  visibleLevels?: JlptLevel[];
}

type MetricView = 'both' | 'reviews' | 'mastery';

interface TooltipEntry {
  dataKey?: string;
  value?: number;
  payload?: KanjiMasteryTrendPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const MasteryTrendTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-700 px-3.5 py-2.5 shadow-lg text-xs space-y-1.5">
      <p className="font-bold text-[#141413] dark:text-white">
        {label} <span className="font-mono-nums font-normal text-stone-400">({point.date})</span>
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#D92525]" aria-hidden="true" />
            Review Frequency
          </span>
          <span className="font-mono-nums font-bold text-[#141413] dark:text-white">
            {point.reviews} {point.reviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
            Mastery Rate
          </span>
          <span className="font-mono-nums font-bold text-emerald-700 dark:text-emerald-400">
            {point.masteryRate}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-stone-100 dark:border-zinc-800">
          <span className="text-stone-500 dark:text-zinc-400">Cumulative Mastered</span>
          <span className="font-mono-nums font-semibold text-[#141413] dark:text-zinc-200">
            {point.masteredCount} Kanji
          </span>
        </div>
      </div>
    </div>
  );
};

export const KanjiMasteryTrendChart: React.FC<KanjiMasteryTrendChartProps> = ({
  srsProgress,
  darkMode,
  onOpenKanjiSrs,
  visibleLevels,
}) => {
  const [metricView, setMetricView] = useState<MetricView>('both');

  const activeVisibleLevels = useMemo(
    () => normalizeVisibleJlptLevels(visibleLevels),
    [visibleLevels]
  );
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);

  const kanjiLevelById = useMemo(() => {
    const map = new Map<string, JlptLevel>();
    for (const card of KANJI_DECK) {
      map.set(card.id, card.level);
    }
    for (const entry of ALL_JLPT_KANJI_CATALOG) {
      if (!map.has(entry.id)) {
        map.set(entry.id, entry.level);
      }
    }
    return map;
  }, []);

  const scopedProgress = useMemo(() => {
    if (allVisible) return srsProgress;
    const allowed = new Set<JlptLevel>(activeVisibleLevels);
    const filtered: Record<string, SrsCardProgress> = {};
    for (const [id, stat] of Object.entries(srsProgress)) {
      const lvl = kanjiLevelById.get(id);
      if (lvl && allowed.has(lvl)) {
        filtered[id] = stat;
      }
    }
    return filtered;
  }, [allVisible, activeVisibleLevels, srsProgress, kanjiLevelById]);

  const { points, summary } = useMemo(
    () => buildKanjiMasteryTrend(scopedProgress, 30),
    [scopedProgress]
  );

  const axisTickColor = darkMode ? '#A1A1AA' : '#78716C';
  const gridStrokeColor = darkMode ? '#27272A' : '#E7E5E4';

  return (
    <section
      aria-label="Kanji Mastery Trend"
      data-testid="kanji-mastery-trend-section"
      className="mx-auto max-w-[1280px] px-4 sm:px-6 min-w-0 overflow-hidden"
    >
      <div className="rounded-3xl bg-white dark:bg-[#16181F] border border-stone-200/90 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-6 min-w-0 overflow-hidden">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400 inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              漢字習熟推移 · 30-Day SRS Analytics
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white">
              Kanji Mastery{' '}
              <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
                Trend.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 max-w-2xl">
              Track your daily Kanji review frequency alongside your cumulative SRS mastery rate over the last 30 days.
              {!allVisible && (
                <span className="ml-1.5 font-semibold text-[#D92525] dark:text-rose-400">
                  (Filtered: {activeVisibleLevels.join(', ')})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              role="group"
              aria-label="Chart series filter"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800"
            >
              {(
                [
                  { id: 'both', label: 'Both' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'mastery', label: 'Mastery %' },
                ] as { id: MetricView; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`trend-view-${tab.id}`}
                  aria-pressed={metricView === tab.id}
                  onClick={() => setMetricView(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    metricView === tab.id
                      ? 'bg-[#D92525] text-white'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenKanjiSrs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Practice Kanji SRS
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-zinc-400">
              <span>30-Day Reviews</span>
              <Flame className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            </div>
            <p
              data-testid="trend-total-reviews"
              className="text-xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1"
            >
              {summary.totalReviews30d}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              Peak {summary.peakDailyReviews}/day
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-zinc-400">
              <span>Mastery Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            </div>
            <p
              data-testid="trend-mastery-rate"
              className="text-xl font-bold font-mono-nums text-emerald-700 dark:text-emerald-400 mt-1"
            >
              {summary.currentMasteryRate}%
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              SRS retention accuracy
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-zinc-400">
              <span>Mastered Kanji</span>
              <Award className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            </div>
            <p
              data-testid="trend-mastered-count"
              className="text-xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1"
            >
              {summary.masteredCardsCount}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              of {summary.totalTrackedCards} reviewed cards
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-zinc-400">
              <span>Active Study Days</span>
              <Calendar className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            </div>
            <p
              data-testid="trend-active-days"
              className="text-xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1"
            >
              {summary.activeDays30d}{' '}
              <span className="text-xs font-normal text-stone-500 dark:text-zinc-400">/ 30</span>
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              Last 30-day window
            </p>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div
          data-testid="kanji-mastery-trend-chart"
          className="w-full min-w-0 overflow-hidden h-[280px] sm:h-[320px] rounded-2xl bg-[#FCFBF8] dark:bg-[#111319] border border-stone-200/70 dark:border-zinc-800/80 p-3 sm:p-4"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart
              data={points}
              margin={{ top: 10, right: 14, left: -12, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStrokeColor}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
                axisLine={{ stroke: gridStrokeColor }}
                interval={4}
              />
              {(metricView === 'both' || metricView === 'reviews') && (
                <YAxis
                  yAxisId="reviews"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: axisTickColor }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax * 1.2))]}
                />
              )}
              {(metricView === 'both' || metricView === 'mastery') && (
                <YAxis
                  yAxisId="mastery"
                  orientation={metricView === 'mastery' ? 'left' : 'right'}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: axisTickColor }}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              <Tooltip content={<MasteryTrendTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                iconType="circle"
              />
              {(metricView === 'both' || metricView === 'reviews') && (
                <Line
                  yAxisId="reviews"
                  type="monotone"
                  dataKey="reviews"
                  name="Review Frequency (Reviews/Day)"
                  stroke="#D92525"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#D92525', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#D92525', stroke: '#FFFFFF', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={550}
                />
              )}
              {(metricView === 'both' || metricView === 'mastery') && (
                <Line
                  yAxisId="mastery"
                  type="monotone"
                  dataKey="masteryRate"
                  name="Mastery Rate (%)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#059669', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={550}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Empty-State Guidance Banner */}
        {summary.totalReviews30d === 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/80 dark:border-zinc-800 px-4 py-3 text-xs">
            <div className="flex items-center gap-2.5 text-stone-600 dark:text-zinc-300">
              <Layers className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
              <span>
                No Kanji SRS reviews logged in the last 30 days yet. Rate your first Kanji card in{' '}
                <strong className="text-[#141413] dark:text-white">Kanji SRS</strong> to plot your live review frequency &amp; mastery curve.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenKanjiSrs}
              className="text-[#D92525] dark:text-rose-400 font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start First Review →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
