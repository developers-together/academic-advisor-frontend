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
      <main className="auth-stage">
        <div className="auth-window">
          <section className="auth-form-panel">
            <a href="/login" className="auth-brand" aria-label={t('app.name')}>
              <span aria-hidden className="auth-brand-symbol">
                A
              </span>
              {t('app.name')}
            </a>
            <div className="auth-form-content">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 mb-8 text-sm leading-relaxed text-muted-foreground">
                {t('experience.authIntro')}
              </p>
              {children}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                {t('app.tagline')}
              </span>
              <div className="flex items-center gap-1">
                <AuthLanguageToggle />
                <AuthThemeToggle />
              </div>
            </div>
          </section>
          <figure
            className="auth-visual"
            aria-label={t('experience.authImage')}
          >
            <img
              src="/advisor-study.png"
              alt={t('experience.authImage')}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="auth-visual-caption">
              <span
                className="mb-3 block size-3 rounded-full bg-white"
                aria-hidden
              />
              <p className="max-w-xs text-3xl leading-tight font-medium tracking-tight">
                {t('experience.authCaption')}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                {t('experience.authCaptionBody')}
              </p>
            </div>
          </figure>
        </div>
      </main>
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
        'flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs font-semibold tracking-wide uppercase',
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
