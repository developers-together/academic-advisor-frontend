import * as React from 'react';

export const useMediaQuery = (query: string): boolean => {
  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const queryList = window.matchMedia(query);
      queryList.addEventListener('change', onChange);
      return () => queryList.removeEventListener('change', onChange);
    },
    [query],
  );
  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
