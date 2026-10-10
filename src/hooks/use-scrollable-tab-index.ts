import { useCallback, useState, type RefObject } from 'react';

export const useScrollableTabIndex = (
  forwardedRef?: RefObject<HTMLDivElement | null>,
) => {
  const [scrollable, setScrollable] = useState(false);
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (forwardedRef) forwardedRef.current = element;
      if (!element) return;
      const measure = () =>
        setScrollable(
          element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth,
        );
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const resizeObserver = new ResizeObserver(measure);
      const mutationObserver = new MutationObserver(measure);
      resizeObserver.observe(element);
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    },
    [forwardedRef],
  );
  return { ref, tabIndex: scrollable ? 0 : undefined };
};
