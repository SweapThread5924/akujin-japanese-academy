/**
 * Pure helpers for scroll progress indicator and staggered reveal choreography.
 */

export function computeScrollProgressPct(
  scrollY: number,
  scrollHeight: number,
  clientHeight: number
): number {
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  if (maxScroll <= 0) return 0;
  const raw = (Math.max(0, scrollY) / maxScroll) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

export function computeStaggerDelayMs(
  index: number,
  stepMs = 65,
  maxDelayMs = 390
): number {
  if (index <= 0) return 0;
  return Math.min(maxDelayMs, index * stepMs);
}

export function isElementInitiallyInViewport(
  top: number,
  bottom: number,
  viewportHeight: number
): boolean {
  return top < viewportHeight * 0.96 && bottom > 0;
}
