import React from 'react';
import type { FuriganaSegment } from '../data/curriculumData';

interface JapaneseTextProps {
  segments?: FuriganaSegment[];
  plainText: string;
  reading?: string;
  romaji?: string;
  showFurigana: boolean;
  showRomaji: boolean;
  className?: string;
  romajiClassName?: string;
}

export const JapaneseText: React.FC<JapaneseTextProps> = ({
  segments,
  plainText,
  reading,
  romaji,
  showFurigana,
  showRomaji,
  className = 'text-xl font-medium text-[#141413] dark:text-[#F4F3EF]',
  romajiClassName = 'text-xs font-mono-nums text-stone-500 dark:text-zinc-400 mt-1',
}) => {
  return (
    <div className="inline-flex flex-col">
      <div className={`font-jp leading-[1.9] ${className}`}>
        {segments && segments.length > 0 ? (
          segments.map((seg, idx) =>
            seg.reading && showFurigana ? (
              <ruby key={idx} className="ruby-align-center">
                {seg.text}
                <rt className="text-[0.52em] font-normal tracking-wide text-[#D92525] dark:text-rose-400 select-none">
                  {seg.reading}
                </rt>
              </ruby>
            ) : (
              <span key={idx}>{seg.text}</span>
            )
          )
        ) : showFurigana && reading && reading !== plainText ? (
          <ruby>
            {plainText}
            <rt className="text-[0.55em] font-normal text-[#D92525] dark:text-rose-400 select-none">
              {reading}
            </rt>
          </ruby>
        ) : (
          <span>{plainText}</span>
        )}
      </div>
      {showRomaji && romaji && <span className={romajiClassName}>{romaji}</span>}
    </div>
  );
};
