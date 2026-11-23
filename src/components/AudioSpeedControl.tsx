import React from 'react';
import { Gauge } from 'lucide-react';
import {
  AUDIO_SPEED_PRESETS,
  AUDIO_SPEED_STEP,
  clampAudioSpeed,
  formatAudioSpeedLabel,
  getAudioSpeedDescriptor,
  MAX_AUDIO_SPEED,
  MIN_AUDIO_SPEED,
} from '../utils/audioSpeed';

interface AudioSpeedControlProps {
  speed: number;
  onChange: (nextSpeed: number) => void;
  contextLabel?: string;
}

export const AudioSpeedControl: React.FC<AudioSpeedControlProps> = ({
  speed,
  onChange,
  contextLabel,
}) => {
  const safeSpeed = clampAudioSpeed(speed);
  const label = formatAudioSpeedLabel(safeSpeed);
  const descriptor = getAudioSpeedDescriptor(safeSpeed);

  return (
    <section
      aria-label="Global audio playback speed control"
      data-testid="global-audio-speed-control"
      className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200/80 dark:border-zinc-800 px-4 py-3.5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-[#D92525]/25 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-[#D92525] dark:text-rose-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#141413] dark:text-white">
                Global Audio Speed
              </span>
              <span
                data-testid="global-audio-speed-value"
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[11px] font-mono-nums font-bold text-[#D92525] dark:text-rose-300"
              >
                {label} · {descriptor}
              </span>
            </div>
            {contextLabel && (
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                {contextLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:min-w-[420px]">
          <div className="flex items-center gap-2.5 flex-1">
            <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400 shrink-0">
              0.5x
            </span>
            <input
              type="range"
              min={MIN_AUDIO_SPEED}
              max={MAX_AUDIO_SPEED}
              step={AUDIO_SPEED_STEP}
              value={safeSpeed}
              onChange={(e) => onChange(clampAudioSpeed(Number(e.target.value)))}
              aria-label="Global audio playback speed"
              aria-valuemin={MIN_AUDIO_SPEED}
              aria-valuemax={MAX_AUDIO_SPEED}
              aria-valuenow={safeSpeed}
              aria-valuetext={`${label} ${descriptor}`}
              data-testid="global-audio-speed-slider"
              className="w-full h-1.5 rounded-lg appearance-none bg-stone-200 dark:bg-zinc-700 accent-[#D92525] cursor-pointer"
            />
            <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400 shrink-0">
              1.5x
            </span>
          </div>

          <div
            role="group"
            aria-label="Audio speed presets"
            className="flex items-center gap-1 shrink-0"
          >
            {AUDIO_SPEED_PRESETS.map((preset) => {
              const active = Math.abs(safeSpeed - preset) < 0.001;
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={active}
                  data-testid={`audio-speed-preset-${preset}`}
                  onClick={() => onChange(preset)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono-nums font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D92525] text-white border-[#D92525]'
                      : 'bg-stone-50 dark:bg-[#1B1E28] text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-[#D92525]/60'
                  }`}
                >
                  {formatAudioSpeedLabel(preset)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
