import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

import { MainErrorFallback } from '@/components/errors/main';
import { Notifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { AuthLoader } from '@/lib/auth';
import { applyLanguage, initialLanguage } from '@/lib/language';
import '@/lib/i18n/dayjs-ar-latin';
import { queryConfig } from '@/lib/react-query';
import { useThemeEffect } from '@/lib/theme';

type AppProviderProps = {
  children: React.ReactNode;
};

applyLanguage(initialLanguage());

const ThemeBoot = ({ children }: { children: React.ReactNode }) => {
  useThemeEffect();
  return <>{children}</>;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            {import.meta.env.DEV && <ReactQueryDevtools />}
            <Notifications />
            <ThemeBoot>
              <AuthLoader
                renderLoading={() => (
                  <div className="flex h-screen w-screen items-center justify-center">
                    <Spinner size="xl" />
                  </div>
                )}
              >
                {children}
              </AuthLoader>
            </ThemeBoot>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
