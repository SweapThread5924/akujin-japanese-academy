import type { KanaGridCell } from '../data/foundationsData';

/**
 * Builds 4 deterministic, deduplicated Romaji answer choices for a Kana quiz item
 * so identical sounds across Hiragana/Katakana never produce duplicate options or React keys.
 */
export function buildKanaQuizOptions(
  target: KanaGridCell,
  pool: readonly KanaGridCell[],
  targetIdx: number,
  optionCount = 4
): string[] {
  const uniqueDistractors: string[] = [];
  const seen = new Set<string>([target.romaji]);

  if (pool.length > 0) {
    // Walk deterministic offsets across the pool to pick distinct Romaji sounds
    const stepOffsets = [3, 7, 11, 15, 19, 23, 27, 31];
    for (const offset of stepOffsets) {
      const candidate = pool[(targetIdx + offset) % pool.length];
      if (candidate && !seen.has(candidate.romaji)) {
        seen.add(candidate.romaji);
        uniqueDistractors.push(candidate.romaji);
        if (uniqueDistractors.length >= optionCount - 1) break;
      }
    }

    // Sequential fallback scan if offsets still fell short
    if (uniqueDistractors.length < optionCount - 1) {
      for (let i = 0; i < pool.length; i += 1) {
        const candidate = pool[(targetIdx + i) % pool.length];
        if (candidate && !seen.has(candidate.romaji)) {
          seen.add(candidate.romaji);
          uniqueDistractors.push(candidate.romaji);
          if (uniqueDistractors.length >= optionCount - 1) break;
        }
      }
    }
  }

  return [target.romaji, ...uniqueDistractors].sort((a, b) => a.localeCompare(b));
}
