import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface SakuraWelcomeCelebrationProps {
  isActive: boolean;
  trackLabel?: string;
  dailyGoalMinutes?: number;
  onFinish: () => void;
}

interface SakuraPetalSpec {
  id: number;
  leftPct: number;
  sizePx: number;
  delaySec: number;
  durationSec: number;
  driftPx: number;
  color: string;
}

const PETAL_COLORS = ['#FDA4AF', '#FBCFE8', '#F9A8D4', '#FECDD3', '#F472B6'];

const SAKURA_PETALS: SakuraPetalSpec[] = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  leftPct: ((i * 29 + 7) % 98) + 1,
  sizePx: 14 + ((i * 7) % 14),
  delaySec: ((i * 17) % 24) * 0.12,
  durationSec: 4.2 + ((i * 11) % 10) * 0.28,
  driftPx: ((i % 2 === 0 ? 1 : -1) * (28 + ((i * 13) % 52))),
  color: PETAL_COLORS[i % PETAL_COLORS.length],
}));

export const SakuraWelcomeCelebration: React.FC<SakuraWelcomeCelebrationProps> = ({
  isActive,
  trackLabel,
  dailyGoalMinutes,
  onFinish,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowPopup(false);
      return;
    }
    setShowPopup(false);
    const timer = window.setTimeout(() => {
      setShowPopup(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Full-viewport Cherry Blossom Shower from Top */}
      <div
        aria-hidden="true"
        data-testid="sakura-shower"
        className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
      >
        {SAKURA_PETALS.map((petal) => (
          <span
            key={petal.id}
            className="akujin-sakura-petal absolute -top-10"
            style={
              {
                left: `${petal.leftPct}%`,
                width: `${petal.sizePx}px`,
                height: `${petal.sizePx}px`,
                animationDelay: `${petal.delaySec}s`,
                animationDuration: `${petal.durationSec}s`,
                '--sakura-drift': `${petal.driftPx}px`,
              } as React.CSSProperties
            }
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              className="w-full h-full drop-shadow-xs"
            >
              <path
                d="M16 3C11 7 5 13.5 6.5 21C7.6 26.2 12.2 29 16 26.5C19.8 29 24.4 26.2 25.5 21C27 13.5 21 7 16 3Z"
                fill={petal.color}
                fillOpacity="0.92"
              />
              <path
                d="M16 3C15.2 7.5 14.8 11.5 16 15.5"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        ))}
      </div>

      {/* Delayed 2-Second Celebratory Welcome Popup */}
      {showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sakura-welcome-title"
          data-testid="sakura-welcome-modal"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
        >
          <div className="animate-welcome-pop relative w-full max-w-md rounded-2xl bg-white dark:bg-[#16181F] border border-rose-200/80 dark:border-zinc-700 p-7 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D92525] to-rose-500 text-white font-jp text-3xl font-bold shadow-md">
              桜
            </div>

            <div className="space-y-2">
              <p className="text-xs font-jp font-semibold text-[#D92525] dark:text-rose-400">
                ようこそ、アクジンへ！
              </p>
              <h2
                id="sakura-welcome-title"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-white"
              >
                Welcome to AkuJin!
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-zinc-300 leading-relaxed">
                Let’s learn Japanese and make it to Japan together!
              </p>
            </div>

            {trackLabel && (
              <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400 pt-1">
                Path ready: <span className="font-semibold text-[#141413] dark:text-zinc-100">{trackLabel}</span>
                {dailyGoalMinutes ? ` · ${dailyGoalMinutes} min/day` : ''}
              </p>
            )}

            <button
              type="button"
              data-testid="sakura-welcome-lets-go-btn"
              onClick={onFinish}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              Let’s Go!
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
