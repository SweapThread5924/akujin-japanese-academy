import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Film,
  Sparkles,
} from 'lucide-react';
import { VIDEO_LESSONS, type VideoLessonChapter } from '../data/foundationsData';
import { speakJapanese } from '../utils/speechAndPwa';

interface InteractiveVideoStudioProps {
  onCompleteChapter?: (chapterId: string, xp: number) => void;
  masteredItemIds?: string[];
  onNavigateFoundations?: () => void;
}

export const InteractiveVideoStudio: React.FC<InteractiveVideoStudioProps> = ({
  onCompleteChapter,
  masteredItemIds = [],
  onNavigateFoundations,
}) => {
  const [activeId, setActiveId] = useState<string>(VIDEO_LESSONS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<0.75 | 1 | 1.25>(1);
  const timerRef = useRef<number | null>(null);
  const lastStepSpokenRef = useRef<number>(-1);

  const chapter: VideoLessonChapter =
    VIDEO_LESSONS.find((v) => v.id === activeId) ?? VIDEO_LESSONS[0];
  const currentStepIndex = Math.min(
    chapter.slides.length - 1,
    Math.floor((progressPct / 100) * chapter.slides.length)
  );
  const currentSlide = chapter.slides[currentStepIndex];
  const isCompleted = masteredItemIds.includes(`video-${chapter.id}`);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setProgressPct((prev) => {
        const increment = 0.85 * playbackRate;
        const next = prev + increment;
        if (next >= 100) {
          setIsPlaying(false);
          if (onCompleteChapter && !masteredItemIds.includes(`video-${chapter.id}`)) {
            onCompleteChapter(`video-${chapter.id}`, 15);
          }
          return 100;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackRate, chapter.id, onCompleteChapter, masteredItemIds]);

  useEffect(() => {
    if (isPlaying && lastStepSpokenRef.current !== currentStepIndex) {
      lastStepSpokenRef.current = currentStepIndex;
      speakJapanese(currentSlide.japanese, playbackRate);
    }
  }, [isPlaying, currentStepIndex, currentSlide.japanese, playbackRate]);

  const handleSelectChapter = (id: string) => {
    setActiveId(id);
    setProgressPct(0);
    setIsPlaying(false);
    lastStepSpokenRef.current = -1;
  };

  const handleTogglePlay = () => {
    if (progressPct >= 100) {
      setProgressPct(0);
      lastStepSpokenRef.current = -1;
    }
    setIsPlaying((p) => {
      const next = !p;
      if (next) {
        lastStepSpokenRef.current = -1;
      }
      return next;
    });
  };

  return (
    <section
      aria-label="Interactive Japanese Video Academy"
      className="mx-auto max-w-[1280px] px-4 sm:px-6 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            動画講座 · Animated Video Lessons with Native Voice
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-white mt-1">
            Watch, Listen &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Practice Live.
            </span>
          </h2>
        </div>
        {onNavigateFoundations && (
          <button
            type="button"
            onClick={onNavigateFoundations}
            className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-zinc-100 hover:border-[#D92525] cursor-pointer transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
            Open Full Foundations Track
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Interactive Video Stage */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-[#141413] text-white flex flex-col">
          <div className="relative aspect-video w-full overflow-hidden">
            {/* Ambient background thumbnail */}
            <img
              src={chapter.thumbnailUrl}
              alt={chapter.title}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                isPlaying ? 'scale-105 opacity-30' : 'opacity-50'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-[#0D0E12]/70 to-[#0D0E12]/40" />

            {/* Top Chapter Pill */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/55 border border-white/15 font-mono-nums text-stone-200">
                <Sparkles className="w-3 h-3 text-rose-400" aria-hidden="true" />
                {chapter.levelTag} · {chapter.durationLabel}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Completed
                </span>
              )}
            </div>

            {/* Center Animated Chalkboard Frame */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 sm:px-10 h-[calc(100%-3rem)]">
              <p className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold">
                Slide {currentStepIndex + 1} / {chapter.slides.length} · {chapter.title}
              </p>
              <div
                key={`${chapter.id}-${currentStepIndex}`}
                className="mt-3 font-jp text-2xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-white drop-shadow-sm transition-all duration-300"
              >
                {currentSlide.japanese}
              </div>
              <p className="mt-2 font-mono-nums text-xs sm:text-sm text-amber-200/95">
                {currentSlide.romaji}
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-medium text-stone-100 max-w-xl">
                {currentSlide.english}
              </p>
              <p className="mt-3 text-xs text-stone-300/90 max-w-lg bg-black/45 px-3.5 py-1.5 rounded-lg border border-white/10">
                {currentSlide.focusPoint}
              </p>
            </div>
          </div>

          {/* Player Controls Bar */}
          <div className="bg-[#181A22] px-4 sm:px-5 py-3.5 space-y-2.5 border-t border-white/10">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(progressPct)}
              aria-label="Seek lesson timeline"
              onChange={(e) => {
                setProgressPct(Number(e.target.value));
                lastStepSpokenRef.current = -1;
              }}
              className="w-full accent-[#D92525] cursor-pointer h-1.5"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  data-testid="video-play-toggle"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      {progressPct > 0 && progressPct < 100 ? 'Resume' : 'Play Video Lesson'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgressPct(0);
                    lastStepSpokenRef.current = -1;
                    speakJapanese(chapter.slides[0].japanese, playbackRate);
                  }}
                  aria-label="Restart video chapter"
                  className="p-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-stone-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => speakJapanese(currentSlide.japanese, playbackRate)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-xs text-stone-200 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  Speak Line
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {([0.75, 1, 1.25] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-1 rounded font-mono-nums cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-white text-[#141413] font-bold'
                        : 'text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video Chapter Playlist */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {VIDEO_LESSONS.map((item, idx) => {
            const active = item.id === chapter.id;
            const done = masteredItemIds.includes(`video-${item.id}`);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectChapter(item.id)}
                className={`group flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#1B1E28] border-[#D92525] shadow-xs'
                    : 'bg-white dark:bg-[#16181F] border-stone-200 dark:border-zinc-800 hover:border-[#D92525]/50'
                }`}
              >
                <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0 bg-stone-200 dark:bg-zinc-900">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-[10px] font-mono-nums text-white">
                    {item.durationLabel}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-nums">
                    <span className="text-[#D92525] dark:text-rose-400 font-semibold">
                      0{idx + 1} · {item.levelTag}
                    </span>
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-xs font-bold text-[#141413] dark:text-white line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 leading-snug">
                    {item.instructorNote}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
