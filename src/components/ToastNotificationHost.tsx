import React, { useState } from 'react';
import { Award, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { ToastNotificationItem } from '../utils/achievementToast';

interface ToastNotificationHostProps {
  toasts: ToastNotificationItem[];
  onDismiss: (id: string) => void;
  onPauseTimer?: (id: string) => void;
  onResumeTimer?: (id: string) => void;
  onViewAchievements?: () => void;
}

const ToastCardWrapper: React.FC<{
  item: ToastNotificationItem;
  onDismiss: (id: string) => void;
  onPauseTimer?: (id: string) => void;
  onResumeTimer?: (id: string) => void;
  onViewAchievements?: () => void;
}> = ({ item, onDismiss, onPauseTimer, onResumeTimer, onViewAchievements }) => {
  const [paused, setPaused] = useState(false);

  const handlePause = () => {
    setPaused(true);
    onPauseTimer?.(item.id);
  };

  const handleResume = () => {
    setPaused(false);
    onResumeTimer?.(item.id);
  };

  if (item.kind === 'achievement' && item.achievement) {
    const ach = item.achievement;
    const isCircle = item.sealShape !== 'square';

    return (
      <article
        role="status"
        aria-live="polite"
        data-testid="achievement-unlocked-card"
        data-achievement-id={ach.id}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onFocus={handlePause}
        onBlur={handleResume}
        className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-[#D92525]/45 bg-gradient-to-br from-[#FFFDF9] via-rose-50/80 to-amber-50/75 dark:from-[#181A23] dark:via-[#1F1720] dark:to-[#181B24] p-4 shadow-xl shadow-stone-900/15 dark:shadow-black/50 animate-achievement-toast-enter"
      >
        {/* Subtle shimmer sweep */}
        <div
          aria-hidden="true"
          className="animate-achievement-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 dark:via-rose-300/10 to-transparent"
        />

        <div className="relative flex items-start gap-3.5">
          {/* Traditional Stamped Japanese Hanko Seal Emblem */}
          <div className="relative h-14 w-14 shrink-0 flex items-center justify-center animate-hanko-stamp">
            <svg viewBox="0 0 60 60" className="h-14 w-14" aria-hidden="true">
              {isCircle ? (
                <>
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    fill="#D92525"
                    fillOpacity="0.14"
                    stroke="#D92525"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="22"
                    fill="none"
                    stroke="#D92525"
                    strokeWidth="1"
                  />
                </>
              ) : (
                <>
                  <rect
                    x="5"
                    y="5"
                    width="50"
                    height="50"
                    rx="9"
                    fill="#D92525"
                    fillOpacity="0.14"
                    stroke="#D92525"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="9"
                    y="9"
                    width="42"
                    height="42"
                    rx="6"
                    fill="none"
                    stroke="#D92525"
                    strokeWidth="1"
                  />
                </>
              )}
            </svg>
            <span className="absolute font-jp text-sm font-black tracking-tight text-[#D92525] dark:text-rose-400">
              {ach.japaneseStamp}
            </span>
            <Sparkles
              className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 animate-pulse"
              aria-hidden="true"
            />
          </div>

          {/* Achievement Text & Actions */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#D92525] dark:text-rose-400">
                <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                New Achievement Unlocked
              </span>
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label={`Dismiss ${ach.title} notification`}
                className="p-0.5 rounded-md text-stone-400 hover:text-[#141413] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-[#141413] dark:text-white leading-snug">
                {ach.title}
              </h3>
              <span className="text-[10px] font-mono-nums font-bold px-1.5 py-0.5 rounded bg-[#D92525] text-white shrink-0">
                +{ach.xpBonus} XP
              </span>
            </div>

            <p className="text-xs text-stone-600 dark:text-zinc-300 leading-snug">
              {ach.description}
            </p>

            <div className="pt-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-stone-500 dark:text-zinc-400">
                実績解除 · Added to Profile
              </span>
              {onViewAchievements && (
                <button
                  type="button"
                  onClick={() => {
                    onDismiss(item.id);
                    onViewAchievements();
                  }}
                  className="text-[11px] font-semibold text-[#D92525] dark:text-rose-400 hover:underline cursor-pointer"
                >
                  View Seals →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Auto-dismiss countdown indicator */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-200/70 dark:bg-zinc-800/80">
          <div
            className="h-full bg-gradient-to-r from-[#D92525] to-amber-500 animate-toast-progress"
            style={{
              animationDuration: `${item.durationMs}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      </article>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="standard-toast"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      className="pointer-events-auto animate-toast-enter flex items-center gap-2.5 rounded-xl bg-[#141413] dark:bg-white text-white dark:text-[#141413] px-4 py-3 text-xs font-semibold shadow-lg max-w-sm"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" aria-hidden="true" />
      <span className="leading-snug">{item.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastNotificationHost: React.FC<ToastNotificationHostProps> = ({
  toasts,
  onDismiss,
  onPauseTimer,
  onResumeTimer,
  onViewAchievements,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      data-testid="toast-notification-host"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-3 items-end w-[calc(100vw-2.5rem)] sm:w-[385px]"
    >
      {toasts.map((item) => (
        <ToastCardWrapper
          key={item.id}
          item={item}
          onDismiss={onDismiss}
          onPauseTimer={onPauseTimer}
          onResumeTimer={onResumeTimer}
          onViewAchievements={onViewAchievements}
        />
      ))}
    </div>
  );
};
