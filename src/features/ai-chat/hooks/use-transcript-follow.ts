import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isPinnedAtBottom,
  prefersReducedMotion,
  scrollBehavior,
} from '@/features/ai-chat/utils/scroll-follow';

const JUMP_SETTLE_MS = 600;

export const useTranscriptFollow = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const [pinned, setPinned] = useState(true);

  const stopJumpSettle = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopJumpSettle, [stopJumpSettle]);

  const follow = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
  }, []);

  const scrollToLatest = useCallback(() => {
    setPinned(true);
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
  }, []);

  const jumpToLatest = useCallback(() => {
    setPinned(true);
    jumpingRef.current = true;
    stopJumpSettle();
    settleTimerRef.current = window.setTimeout(() => {
      jumpingRef.current = false;
    }, JUMP_SETTLE_MS);
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: scrollBehavior(prefersReducedMotion()),
    });
  }, [stopJumpSettle]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (jumpingRef.current) {
      if (isPinnedAtBottom(container)) {
        jumpingRef.current = false;
        stopJumpSettle();
        setPinned(true);
      }
      return;
    }
    setPinned(isPinnedAtBottom(container));
  }, [stopJumpSettle]);

  return {
    containerRef,
    pinned,
    follow,
    scrollToLatest,
    jumpToLatest,
    handleScroll,
  };
};
