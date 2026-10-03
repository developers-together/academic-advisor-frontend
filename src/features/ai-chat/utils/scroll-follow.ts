export type ScrollBox = Pick<
  HTMLElement,
  'scrollTop' | 'scrollHeight' | 'clientHeight'
>;

const PINNED_THRESHOLD_PX = 80;

export const isPinnedAtBottom = (box: ScrollBox) =>
  box.scrollHeight - box.scrollTop - box.clientHeight <= PINNED_THRESHOLD_PX;

export const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollBehavior = (reducedMotion: boolean): ScrollBehavior =>
  reducedMotion ? 'auto' : 'smooth';
