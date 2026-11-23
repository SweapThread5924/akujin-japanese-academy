import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { getQuoteOfTheDay } from '../utils/dailyQuotes';
import { speakJapanese } from '../utils/speechAndPwa';

export const QuoteOfTheDaySection: React.FC = () => {
  const quote = getQuoteOfTheDay();

  return (
    <section
      aria-label="Quote of the Day"
      data-testid="quote-of-the-day"
      data-quote-date={quote.dateKey}
      className="mx-auto max-w-[1280px] px-4 sm:px-6"
    >
      <div className="rounded-2xl bg-gradient-to-br from-[#FCFBF8] via-[#FDF4F2] to-[#FAF3E8] dark:from-[#16181F] dark:via-[#1C1821] dark:to-[#13151D] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 grid lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#D92525] dark:text-rose-400">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              今日の名言 · Quote of the Day
            </span>
            <span aria-hidden="true" className="text-stone-400">·</span>
            <span className="font-mono-nums text-stone-500 dark:text-zinc-400">
              Updated Daily ({quote.dateKey})
            </span>
          </div>

          <blockquote className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white leading-snug">
            “{quote.quote}”
          </blockquote>

          <p className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-zinc-300">
            — {quote.author}{' '}
            <span className="font-normal text-stone-500 dark:text-zinc-400">
              ({quote.role})
            </span>
          </p>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 leading-relaxed pt-1">
            {quote.encouragement}
          </p>
        </div>

        <div className="lg:col-span-4 rounded-xl bg-white/85 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-5 space-y-2.5">
          {quote.japaneseProverb ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#D92525] dark:text-rose-400">
                  Daily Japanese Proverb
                </span>
                <button
                  type="button"
                  onClick={() => speakJapanese(quote.japaneseProverb!)}
                  aria-label="Listen to daily Japanese proverb"
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-zinc-300 hover:text-[#D92525] cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                  Listen
                </button>
              </div>
              <p className="font-jp text-lg font-bold text-[#141413] dark:text-white">
                {quote.japaneseProverb}
              </p>
              {quote.japaneseProverbReading && (
                <p className="text-xs font-jp text-stone-500 dark:text-zinc-400">
                  {quote.japaneseProverbReading}
                </p>
              )}
              {quote.japaneseProverbMeaning && (
                <p className="text-xs text-stone-600 dark:text-zinc-300">
                  “{quote.japaneseProverbMeaning}”
                </p>
              )}
            </>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#D92525] dark:text-rose-400">
                Calm Daily Study Reminder
              </p>
              <p className="font-jp text-lg font-bold text-[#141413] dark:text-white">
                一歩ずつ、焦らず。
              </p>
              <p className="text-xs text-stone-600 dark:text-zinc-300">
                Ippozutsu, aserazu — One step at a time, without rush or stress.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
