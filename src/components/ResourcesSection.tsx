import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Printer,
  Video,
  CheckCircle2,
} from 'lucide-react';
import { PDF_BOOK_RESOURCES, VIDEO_CHANNELS, type VideoChannelItem } from '../data/resourcesCatalog';
import { SYLLABUS_TOTALS } from '../utils/datasetLoader';
import type { JlptLevel } from '../utils/srsEngine';
import {
  isAllJlptLevelsVisible,
  matchesJlptLevelSpan,
  normalizeVisibleJlptLevels,
} from '../utils/jlptVisibility';

interface ResourcesSectionProps {
  visibleLevels?: JlptLevel[];
  onResetVisibleLevels?: () => void;
}

const VIDEO_CATEGORIES: ('ALL' | VideoChannelItem['category'])[] = [
  'ALL',
  'Beginners & Kana',
  'Grammar & Nuances',
  'JLPT N5–N1 Prep',
  'Listening & Pitch Accent',
];

export const ResourcesSection: React.FC<ResourcesSectionProps> = ({
  visibleLevels,
  onResetVisibleLevels,
}) => {
  const [videoFilter, setVideoFilter] = useState<'ALL' | VideoChannelItem['category']>('ALL');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeVisibleLevels = useMemo(
    () => normalizeVisibleJlptLevels(visibleLevels),
    [visibleLevels]
  );
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);

  const visiblePdfBooks = useMemo(
    () =>
      PDF_BOOK_RESOURCES.filter((book) =>
        matchesJlptLevelSpan(book.levelRange, activeVisibleLevels)
      ),
    [activeVisibleLevels]
  );

  const visibleChannels = useMemo(
    () =>
      VIDEO_CHANNELS.filter((v) =>
        matchesJlptLevelSpan(v.levelSpan, activeVisibleLevels)
      ),
    [activeVisibleLevels]
  );

  const filteredVideos = useMemo(() => {
    if (videoFilter === 'ALL') return visibleChannels;
    return visibleChannels.filter((v) => v.category === videoFilter);
  }, [visibleChannels, videoFilter]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-14">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            無料教材図書館 · Free Textbooks, PDFs &amp; Curated Japanese Lectures
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white">
            Free Books, Printable PDFs &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Video Resources.
            </span>
          </h1>
          <p className="text-sm text-stone-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
            Download structured PDFs aligned with Genki I &amp; II, Minna no Nihongo, all 2,136 Jōyō kanji, and all 10,000 JLPT N5–N1 words—plus watch the top-rated YouTube teachers in one distraction-free hub.
          </p>
        </div>

        {!allVisible && onResetVisibleLevels && (
          <button
            type="button"
            data-testid="resources-filter-notice"
            onClick={onResetVisibleLevels}
            className="self-start lg:self-end px-3.5 py-2 rounded-xl border border-[#D92525]/35 bg-rose-50/70 dark:bg-rose-950/30 text-xs font-semibold text-[#D92525] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 cursor-pointer transition-colors shrink-0"
          >
            Filtered: {activeVisibleLevels.join(', ')} · Show All (N5–N1)
          </button>
        )}
      </div>

      {/* Section 1: Free Books & Downloadable PDF Resources */}
      <section aria-label="Free Book and PDF Resources" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#D92525]" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-[#141413] dark:text-white">
                Free Book &amp; PDF Study Library
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Direct downloadable study PDFs, printable kanji/kana sheets &amp; official free publisher portals.
              </p>
            </div>
          </div>

          {/* Direct Level Vocab & Kanji PDF Downloads */}
          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="flex flex-wrap items-center gap-1.5" data-testid="quick-vocab-pdfs">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 mr-1">
                Quick Vocab PDFs:
              </span>
              {activeVisibleLevels.map((lvl) => (
                <a
                  key={`vocab-${lvl}`}
                  href={`/api/resources/pdf/vocab-${lvl.toLowerCase()}`}
                  download={`akujin-${lvl.toLowerCase()}-vocabulary-${SYLLABUS_TOTALS[lvl].addedVocab}-words.pdf`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] hover:border-[#D92525] text-[11px] font-mono-nums font-semibold text-[#141413] dark:text-zinc-200 transition-colors"
                >
                  <Download className="w-3 h-3 text-[#D92525]" aria-hidden="true" />
                  {lvl} ({SYLLABUS_TOTALS[lvl].addedVocab.toLocaleString()})
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5" data-testid="quick-kanji-pdfs">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 mr-1">
                Quick Kanji PDFs:
              </span>
              {activeVisibleLevels.map((lvl) => (
                <a
                  key={`kanji-${lvl}`}
                  href={`/api/resources/pdf/kanji-${lvl.toLowerCase()}`}
                  download={`akujin-${lvl.toLowerCase()}-kanji-${SYLLABUS_TOTALS[lvl].levelKanji}.pdf`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] hover:border-[#D92525] text-[11px] font-mono-nums font-semibold text-[#141413] dark:text-zinc-200 transition-colors"
                >
                  <Download className="w-3 h-3 text-[#D92525]" aria-hidden="true" />
                  {lvl} ({SYLLABUS_TOTALS[lvl].levelKanji.toLocaleString()})
                </a>
              ))}
            </div>
          </div>
        </div>

        <div data-reveal-stagger="true" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePdfBooks.map((book) => (
            <article
              key={book.id}
              data-testid={`pdf-card-${book.slug}`}
              className="akujin-card-lift rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4 hover:border-[#D92525]/50"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                  <span className="font-semibold text-[#D92525] dark:text-rose-400">
                    {book.category}
                  </span>
                  <span>{book.levelRange}</span>
                </div>

                <h3 className="text-base font-bold text-[#141413] dark:text-white leading-snug">
                  {book.title}
                </h3>

                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {book.summary}
                </p>

                <ul className="space-y-1.5 pt-1">
                  {book.highlights.map((hl) => (
                    <li
                      key={hl}
                      className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-zinc-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-stone-200/80 dark:border-zinc-800 flex flex-wrap gap-2">
                {book.pdfEndpoint && (
                  <a
                    href={book.pdfEndpoint}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download PDF
                  </a>
                )}

                {book.sheetEndpoint && (
                  <a
                    href={book.sheetEndpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] hover:border-[#D92525] text-xs font-semibold text-[#141413] dark:text-zinc-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                    Print Sheet
                  </a>
                )}

                <a
                  href={book.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-300 hover:text-[#D92525] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  {book.officialLabel}
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Free Video Resources — Masonry Grid */}
      <section aria-label="Video Resources Masonry Grid" data-testid="video-resources-section" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Video className="w-5 h-5 text-[#D92525] mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
                無料動画講座 · Curated YouTube Japanese Teachers
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white mt-0.5">
                Video Resources &amp; Channel Directory
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                Top community-verified YouTube channels covering Hiragana, Genki, Minna no Nihongo, particles, JLPT N5–N1 prep, and pitch accent.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter video channels by category">
            {VIDEO_CATEGORIES.map((cat) => {
              const active = videoFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setVideoFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#D92525] text-white'
                      : 'bg-stone-100 dark:bg-[#1E2029] text-stone-700 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? `All Channels (${visibleChannels.length})` : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Masonry Grid Layout */}
        {filteredVideos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#16181F] p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#141413] dark:text-white">
              No channels match “{videoFilter}” for JLPT {activeVisibleLevels.join(', ')}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {videoFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setVideoFilter('ALL')}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
              {!allVisible && onResetVisibleLevels && (
                <button
                  type="button"
                  onClick={onResetVisibleLevels}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D92525] text-white text-xs font-semibold hover:bg-[#B91C1C] cursor-pointer"
                >
                  Show All JLPT Levels (N5–N1)
                </button>
              )}
            </div>
          </div>
        ) : (
        <div
          data-testid="video-resources-masonry"
          className="columns-1 md:columns-2 lg:columns-3 gap-5"
        >
          {filteredVideos.map((channel) => (
            <article
              key={channel.id}
              data-testid={`video-channel-${channel.id}`}
              className="break-inside-avoid mb-5 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 overflow-hidden hover:border-[#D92525]/60 transition-colors"
            >
              {channel.image && !failedImages[channel.id] && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-zinc-900">
                  <img
                    src={channel.image}
                    alt={`${channel.name} Japanese study video preview`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [channel.id]: true }))
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono-nums font-semibold text-[#D92525] dark:text-rose-400">
                      {channel.category} · {channel.levelSpan}
                    </p>
                    <h3 className="text-lg font-bold text-[#141413] dark:text-white leading-snug">
                      {channel.name}
                    </h3>
                    <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                      {channel.handle}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[#D92525] dark:text-rose-400 font-jp font-bold text-lg flex items-center justify-center shrink-0"
                  >
                    {channel.accentKanji}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {channel.summary}
                </p>

                <div className="rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 p-3">
                  <p className="text-[11px] text-stone-600 dark:text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-[#141413] dark:text-white">Guide Note: </span>
                    {channel.communityConsensus}
                  </p>
                </div>

                <ul className="space-y-1">
                  {channel.recommendedFor.map((item) => (
                    <li
                      key={item}
                      className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-1.5"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#D92525]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-stone-200/70 dark:border-zinc-800">
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D92525] dark:text-rose-400 hover:underline"
                  >
                    Watch on YouTube
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>
    </div>
  );
};
