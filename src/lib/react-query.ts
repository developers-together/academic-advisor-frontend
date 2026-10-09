import { DefaultOptions } from '@tanstack/react-query';

import { ApiError } from './api-error';

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: Error) =>
      failureCount < 1 &&
      error instanceof ApiError &&
      (error.status === 0 ||
        error.status === 408 ||
        error.status === 429 ||
        error.status >= 500),
    retryDelay: 500,
    staleTime: 1000 * 60,
  },
} satisfies DefaultOptions;
