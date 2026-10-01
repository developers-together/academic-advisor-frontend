import { Moon, Sun } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { Head } from '@/components/seo';
import { useUser } from '@/lib/auth';
import { roleHome } from '@/lib/authorization';
import { useLanguageStore } from '@/lib/language';
import { useThemeStore } from '@/lib/theme';
import { cn } from '@/utils/cn';

type LayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AuthLayout = ({ children, title }: LayoutProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const navigate = useNavigate();

  useEffect(() => {
    if (user.data) {
      const safeTarget =
        redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : roleHome(user.data.role);
      navigate(safeTarget, { replace: true });
    }
  }, [user.data, navigate, redirectTo]);

  return (
    <>
      <Head title={title} />
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-end gap-1 p-3">
          <AuthLanguageToggle />
          <AuthThemeToggle />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-center gap-2">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
              >
                A
              </span>
              <span className="text-lg font-semibold">{t('app.name')}</span>
            </div>
            <div className="rounded-lg border bg-card px-6 py-8">
              <h1 className="mb-1 text-xl leading-tight font-semibold">
                {title}
              </h1>
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const AuthLanguageToggle = () => {
  const { t, i18n } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const next = language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      aria-label={t('topbar.language')}
      onClick={() => setLanguage(next)}
      className={cn(
        'flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs font-semibold uppercase',
        'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
      )}
    >
      {next === 'ar' ? 'ع' : 'EN'}
    </button>
  );
};

const AuthThemeToggle = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      aria-label={isDark ? t('topbar.theme.light') : t('topbar.theme.dark')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex size-11 items-center justify-center rounded-md',
        'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
      )}
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
};
