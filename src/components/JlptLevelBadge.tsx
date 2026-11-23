import React from 'react';
import type { JlptLevel } from '../utils/srsEngine';
import { getJlptBadgeConfig } from '../utils/jlptBadge';
import { resolveTopBarBadgeDisplay, type StartingTrackId } from '../utils/onboardingProfile';

interface JlptLevelBadgeProps {
  level: JlptLevel;
  startingTrack?: StartingTrackId | null;
  onboardingCompleted?: boolean;
  variant?: 'compact' | 'prominent';
  onClick?: () => void;
  testId?: string;
}

export const JlptLevelBadge: React.FC<JlptLevelBadgeProps> = ({
  level,
  startingTrack = null,
  onboardingCompleted = true,
  variant = 'compact',
  onClick,
  testId = 'jlpt-level-badge',
}) => {
  const cfg = getJlptBadgeConfig(level);
  const resolved = resolveTopBarBadgeDisplay({
    onboardingCompleted,
    startingTrack,
    targetLevel: level,
  });

  const compactContainerClass = resolved.isSet
    ? resolved.meta.badgeContainerClass
    : 'bg-stone-100/90 dark:bg-zinc-800/80 border-stone-300 dark:border-zinc-700';

  const compactSealClass = resolved.isSet
    ? resolved.meta.badgeSealClass
    : 'bg-[#141413] dark:bg-zinc-200 text-white dark:text-[#141413]';

  const compactAccentClass = resolved.isSet
    ? resolved.meta.badgeAccentClass
    : 'text-[#141413] dark:text-zinc-100';

  const activeTier = resolved.isSet ? resolved.meta.tier : 0;

  const label = resolved.isSet
    ? `Your Starting Path: ${resolved.labelText} (${resolved.japaneseSeal})`
    : 'Personalize your starting Japanese level';

  if (variant === 'prominent') {
    return (
      <div
        data-testid={testId}
        data-jlpt-level={resolved.isSet ? resolved.meta.id : 'unset'}
        aria-label={label}
        className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-3 transition-colors ${compactContainerClass}`}
      >
        <div
          aria-hidden="true"
          className={`h-11 w-11 rounded-lg border border-black/10 font-jp font-bold text-sm flex items-center justify-center shrink-0 ${compactSealClass}`}
        >
          {resolved.japaneseSeal}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-bold font-mono-nums whitespace-nowrap ${compactAccentClass}`}>
              {resolved.labelText}
            </span>
            <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400 whitespace-nowrap">
              {resolved.isSet ? `Tier ${activeTier}/5` : 'Setup'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  key={step}
                  className={`h-1.5 w-3.5 rounded-xs transition-colors ${
                    step <= activeTier
                      ? cfg.pipActiveClass
                      : 'bg-stone-200 dark:bg-zinc-700/80'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono-nums text-stone-600 dark:text-zinc-300 truncate">
              {resolved.meta.description}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const compactContent = (
    <>
      <span
        aria-hidden="true"
        className={`inline-flex h-5 px-1.5 items-center justify-center rounded-sm font-jp text-[10px] font-bold leading-none ${compactSealClass}`}
      >
        {resolved.japaneseSeal}
      </span>
      <span className={`text-xs font-mono-nums font-bold ${compactAccentClass}`}>
        {resolved.labelText}
      </span>
      {resolved.isSet && (
        <span className="inline-flex items-center gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((step) => (
            <span
              key={step}
              className={`h-2.5 w-1 rounded-xs ${
                step <= activeTier
                  ? cfg.pipActiveClass
                  : 'bg-stone-300/80 dark:bg-zinc-700'
              }`}
            />
          ))}
        </span>
      )}
    </>
  );

  const sharedCompactClass = `inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border whitespace-nowrap shrink-0 transition-colors ${compactContainerClass}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        data-jlpt-level={resolved.isSet ? resolved.meta.id : 'unset'}
        aria-label={label}
        title={label}
        className={`${sharedCompactClass} hover:brightness-95 dark:hover:brightness-110 cursor-pointer`}
      >
        {compactContent}
      </button>
    );
  }

  return (
    <div
      data-testid={testId}
      data-jlpt-level={resolved.isSet ? resolved.meta.id : 'unset'}
      aria-label={label}
      title={label}
      className={sharedCompactClass}
    >
      {compactContent}
    </div>
  );
};
