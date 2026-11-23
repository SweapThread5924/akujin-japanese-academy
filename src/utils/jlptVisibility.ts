import type { JlptLevel } from './srsEngine';

export const ALL_JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const JLPT_VISIBILITY_STORAGE_KEY = 'akujin_visible_jlpt_levels_v1';

const VALID_LEVEL_SET = new Set<string>(ALL_JLPT_LEVELS);

/**
 * Normalizes a raw array or JSON value into an ordered, deduplicated list of JLPT levels (N5 -> N1).
 * Always returns at least one level; falls back to all 5 levels when empty or invalid.
 */
export function normalizeVisibleJlptLevels(raw: unknown): JlptLevel[] {
  if (!Array.isArray(raw)) {
    return [...ALL_JLPT_LEVELS];
  }
  const picked = new Set<JlptLevel>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_LEVEL_SET.has(item)) {
      picked.add(item as JlptLevel);
    }
  }
  if (picked.size === 0) {
    return [...ALL_JLPT_LEVELS];
  }
  return ALL_JLPT_LEVELS.filter((lvl) => picked.has(lvl));
}

/**
 * Toggles a single JLPT level in the active visibility list.
 * Guarantees at least 1 level stays visible so dashboard views never render empty.
 */
export function toggleVisibleJlptLevel(
  current: readonly JlptLevel[],
  level: JlptLevel
): { next: JlptLevel[]; blockedLastLevel: boolean } {
  const normalized = normalizeVisibleJlptLevels(current);
  const exists = normalized.includes(level);
  if (exists) {
    if (normalized.length <= 1) {
      return { next: normalized, blockedLastLevel: true };
    }
    return {
      next: normalized.filter((l) => l !== level),
      blockedLastLevel: false,
    };
  }
  const combined = new Set<JlptLevel>([...normalized, level]);
  return {
    next: ALL_JLPT_LEVELS.filter((l) => combined.has(l)),
    blockedLastLevel: false,
  };
}

/**
 * Ensures the currently active/focused single level belongs to visibleLevels.
 */
export function resolveActiveVisibleLevel(
  preferred: JlptLevel,
  visibleLevels: readonly JlptLevel[]
): JlptLevel {
  const safeVisible = normalizeVisibleJlptLevels(visibleLevels);
  return safeVisible.includes(preferred) ? preferred : safeVisible[0];
}

export function isAllJlptLevelsVisible(visibleLevels: readonly JlptLevel[]): boolean {
  const normalized = normalizeVisibleJlptLevels(visibleLevels);
  return normalized.length === ALL_JLPT_LEVELS.length;
}

export function readStoredVisibleJlptLevels(): JlptLevel[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [...ALL_JLPT_LEVELS];
    }
    const raw = window.localStorage.getItem(JLPT_VISIBILITY_STORAGE_KEY);
    if (!raw) return [...ALL_JLPT_LEVELS];
    return normalizeVisibleJlptLevels(JSON.parse(raw));
  } catch {
    return [...ALL_JLPT_LEVELS];
  }
}

export function writeStoredVisibleJlptLevels(levels: readonly JlptLevel[]): JlptLevel[] {
  const normalized = normalizeVisibleJlptLevels(levels);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(JLPT_VISIBILITY_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
  return normalized;
}

/**
 * Checks whether a resource string such as "JLPT N5 → N4", "JLPT N5–N1", or "Beginner → Upper-Int"
 * matches at least one currently visible JLPT level.
 * Items that do not mention explicit N5-N1 levels (e.g., "Zero → Pre-N5") remain visible when N5 or any starter path is active,
 * or always stay visible unless specifically excluded.
 */
export function matchesJlptLevelSpan(
  levelSpan: string,
  visibleLevels: readonly JlptLevel[]
): boolean {
  const safeVisible = normalizeVisibleJlptLevels(visibleLevels);
  if (safeVisible.length === ALL_JLPT_LEVELS.length) return true;

  const matches = levelSpan.match(/N[1-5]/g);
  if (!matches || matches.length === 0) {
    // Descriptive non-JLPT tags like "Zero -> Pre-N5" or "Beginner -> Upper-Int"
    if (/pre-?n5/i.test(levelSpan)) {
      return safeVisible.includes('N5');
    }
    if (/upper-?int/i.test(levelSpan)) {
      return safeVisible.some((l) => l === 'N5' || l === 'N4' || l === 'N3' || l === 'N2');
    }
    return true;
  }

  // Handle range like "N5 → N4" or "N5–N1"
  if (matches.length >= 2 && /[→\-–~]/.test(levelSpan)) {
    const startIdx = ALL_JLPT_LEVELS.indexOf(matches[0] as JlptLevel);
    const endIdx = ALL_JLPT_LEVELS.indexOf(matches[matches.length - 1] as JlptLevel);
    if (startIdx !== -1 && endIdx !== -1) {
      const low = Math.min(startIdx, endIdx);
      const high = Math.max(startIdx, endIdx);
      for (let i = low; i <= high; i += 1) {
        if (safeVisible.includes(ALL_JLPT_LEVELS[i])) return true;
      }
      return false;
    }
  }

  return matches.some((m) => safeVisible.includes(m as JlptLevel));
}
