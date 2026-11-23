import React, { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Sparkles, X } from 'lucide-react';
import {
  ONBOARDING_QUESTIONS,
  STARTING_TRACK_OPTIONS,
  TOTAL_ONBOARDING_QUESTIONS,
  countAnsweredOnboardingQuestions,
  isOnboardingComplete,
  type OnboardingAnswers,
  type StartingTrackId,
} from '../utils/onboardingProfile';
import type { DailyStudyGoalMinutes } from '../utils/dailyStudyGoal';

interface OnboardingModalProps {
  isOpen: boolean;
  initialAnswers?: Partial<OnboardingAnswers>;
  onComplete: (answers: OnboardingAnswers) => void;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialAnswers,
  onComplete,
  onDismiss,
}) => {
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>(() => ({
    ...(initialAnswers ?? {}),
  }));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({
      ...(initialAnswers ?? {}),
    });
    setValidationError(null);
  }, [initialAnswers, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const qFirstFour = ONBOARDING_QUESTIONS.filter((q) => q.number <= 4);
  const qLastTwo = ONBOARDING_QUESTIONS.filter((q) => q.number >= 6);
  const answeredCount = countAnsweredOnboardingQuestions(answers);
  const allAnswered = isOnboardingComplete(answers);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnboardingComplete(answers)) {
      setValidationError(
        `Please answer all ${TOTAL_ONBOARDING_QUESTIONS} questions (${answeredCount}/${TOTAL_ONBOARDING_QUESTIONS} selected).`
      );
      return;
    }
    setValidationError(null);
    onComplete(answers);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      data-testid="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-stone-200 dark:border-zinc-800 bg-gradient-to-r from-[#FCFBF8] via-[#FDF5F3] to-[#FAF3E8] dark:from-[#16181F] dark:via-[#1B1822] dark:to-[#16181F] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#D92525] dark:text-rose-400">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Get Ready · Takes Only a Couple of Minutes
            </p>
            <h2
              id="onboarding-modal-title"
              className="text-lg sm:text-2xl font-bold text-[#141413] dark:text-white"
            >
              Personalize Your Japanese Journey
            </h2>
            <p className="text-xs text-stone-600 dark:text-zinc-300">
              Choose your own answers below—nothing is pre-selected so AkuJin tailors your exact path from scratch.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close get ready survey"
            className="p-1.5 rounded-lg text-stone-500 hover:text-[#141413] dark:text-zinc-400 dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          {qFirstFour.map((q) => {
            const currentVal = answers[q.key] ? String(answers[q.key]) : '';
            return (
              <fieldset key={q.key} className="space-y-2.5">
                <legend className="text-sm font-bold text-[#141413] dark:text-white">
                  {q.number}. {q.question}
                </legend>
                <p className="text-xs text-stone-500 dark:text-zinc-400">{q.subtitle}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const selected = currentVal === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        data-testid={`onboarding-q${q.number}-opt-${optIdx}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setAnswers((prev) => ({
                            ...prev,
                            [q.key]: opt,
                          }));
                          setValidationError(null);
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#D92525] bg-rose-50/70 dark:bg-rose-950/35 text-[#141413] dark:text-white font-semibold'
                            : 'border-stone-200 dark:border-zinc-700 bg-stone-50/60 dark:bg-[#101218] text-stone-700 dark:text-zinc-300 hover:border-[#D92525]/50'
                        }`}
                      >
                        <span>{opt}</span>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {/* Question 5: Current Level / Starting Track */}
          <fieldset className="space-y-2.5 rounded-2xl border border-[#D92525]/25 bg-rose-50/35 dark:bg-rose-950/15 p-4">
            <legend className="text-sm font-bold text-[#141413] dark:text-white flex items-center gap-1.5 px-1">
              <Compass className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
              5. Which level are you doing or willing to start from?
            </legend>
            <p className="text-xs text-stone-600 dark:text-zinc-300 px-1">
              From complete zero knowledge to Hiragana/Katakana, Pre-N5, or JLPT N5–N1. Your top navigation badge adapts immediately to your choice.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 pt-1">
              {STARTING_TRACK_OPTIONS.map((track) => {
                const selected = answers.startingTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    data-testid={`onboarding-track-${track.id}`}
                    aria-pressed={selected}
                    onClick={() => {
                      setAnswers((prev) => ({
                        ...prev,
                        startingTrack: track.id as StartingTrackId,
                      }));
                      setValidationError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                      selected
                        ? 'border-[#D92525] bg-white dark:bg-[#1D202B] shadow-xs'
                        : 'border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-[#101218] hover:border-[#D92525]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#141413] dark:text-white">
                        <span className={`inline-flex h-5 px-1.5 items-center justify-center rounded font-jp text-[10px] font-bold ${track.badgeSealClass}`}>
                          {track.japaneseSeal}
                        </span>
                        {track.label}
                      </span>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-snug">
                      {track.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Questions 6 & 7 */}
          {qLastTwo.map((q) => {
            const isDaily = q.key === 'dailyGoalMinutes';
            const currentVal = answers[q.key] !== undefined ? String(answers[q.key]) : '';
            return (
              <fieldset key={q.key} className="space-y-2.5">
                <legend className="text-sm font-bold text-[#141413] dark:text-white">
                  {q.number}. {q.question}
                </legend>
                <p className="text-xs text-stone-500 dark:text-zinc-400">{q.subtitle}</p>
                <div className={isDaily ? 'grid grid-cols-1 sm:grid-cols-3 gap-2' : 'grid sm:grid-cols-2 gap-2'}>
                  {q.options.map((opt, optIdx) => {
                    const selected = currentVal === opt;
                    const label = isDaily
                      ? opt === '5'
                        ? '5 min/day · Easy'
                        : opt === '15'
                        ? '15 min/day · Steady'
                        : '30 min/day · Intensive'
                      : opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        data-testid={`onboarding-q${q.number}-opt-${optIdx}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setAnswers((prev) => ({
                            ...prev,
                            [q.key]: isDaily ? (Number(opt) as DailyStudyGoalMinutes) : opt,
                          }));
                          setValidationError(null);
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#D92525] bg-rose-50/70 dark:bg-rose-950/35 text-[#141413] dark:text-white font-semibold'
                            : 'border-stone-200 dark:border-zinc-700 bg-stone-50/60 dark:bg-[#101218] text-stone-700 dark:text-zinc-300 hover:border-[#D92525]/50'
                        }`}
                      >
                        <span>{label}</span>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {validationError && (
            <p
              role="alert"
              data-testid="onboarding-validation-error"
              className="text-xs font-semibold text-[#D92525] dark:text-rose-400"
            >
              {validationError}
            </p>
          )}

          {/* Sticky Footer Controls */}
          <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                data-testid="onboarding-skip-btn"
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white cursor-pointer"
              >
                Skip for now
              </button>
              <span
                data-testid="onboarding-answered-count"
                className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400"
              >
                {answeredCount} / {TOTAL_ONBOARDING_QUESTIONS} answered
              </span>
            </div>
            <button
              type="submit"
              data-testid="onboarding-submit-btn"
              className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                allAnswered
                  ? 'bg-[#D92525] hover:bg-[#B91C1C]'
                  : 'bg-stone-400 dark:bg-zinc-700 hover:bg-stone-500 dark:hover:bg-zinc-600'
              }`}
            >
              Save Answers &amp; Enter AkuJin →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

