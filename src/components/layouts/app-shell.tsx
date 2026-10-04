import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import {
  DropdownMenu as Dropdown,
  DropdownMenuContent as DropdownContent,
  DropdownMenuItem as DropdownMenuItem,
  DropdownMenuTrigger as DropdownTrigger,
} from '@/components/ui/dropdown';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';
import { useLanguageStore } from '@/lib/language';
import { useThemeStore } from '@/lib/theme';
import type { UserRole } from '@/types/domain';
import { cn } from '@/utils/cn';

import { TableDensityProvider, type TableDensity } from './table-density';

export type NavItem = {
  labelKey: string;
  to: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  end?: boolean;
};

export const roleNav: Record<UserRole, NavItem[]> = {
  student: [
    {
      labelKey: 'nav.dashboard',
      to: paths.app.root.getHref(),
      icon: LayoutDashboard,
      end: true,
    },
    { labelKey: 'nav.myPlan', to: paths.app.plan.getHref(), icon: FileText },
    {
      labelKey: 'nav.builder',
      to: paths.app.builder.getHref(),
      icon: ClipboardList,
    },
    {
      labelKey: 'nav.profile',
      to: paths.app.profile.getHref(),
      icon: GraduationCap,
    },
    {
      labelKey: 'nav.rules',
      to: paths.app.rules.getHref(),
      icon: ScrollText,
    },
    {
      labelKey: 'nav.chat',
      to: paths.app.chat.getHref(),
      icon: MessagesSquare,
    },
    {
      labelKey: 'nav.notifications',
      to: paths.app.notifications.getHref(),
      icon: Bell,
    },
  ],
  advisor: [
    {
      labelKey: 'nav.queue',
      to: paths.advisor.root.getHref(),
      icon: ClipboardList,
      end: true,
    },
    {
      labelKey: 'nav.students',
      to: paths.advisor.students.getHref(),
      icon: Users,
    },
    {
      labelKey: 'nav.meetings',
      to: paths.advisor.meetings.getHref(),
      icon: CalendarCheck,
    },
    {
      labelKey: 'nav.hours',
      to: paths.advisor.hours.getHref(),
      icon: CalendarClock,
    },
    {
      labelKey: 'nav.notifications',
      to: paths.advisor.notifications.getHref(),
      icon: Bell,
    },
  ],
  dean: [
    {
      labelKey: 'nav.overview',
      to: paths.dean.root.getHref(),
      icon: LayoutDashboard,
      end: true,
    },
    {
      labelKey: 'nav.notifications',
      to: paths.dean.notifications.getHref(),
      icon: Bell,
    },
  ],
  vp: [
    {
      labelKey: 'nav.scorecard',
      to: paths.vp.root.getHref(),
      icon: LayoutDashboard,
      end: true,
    },
    {
      labelKey: 'nav.drilldown',
      to: paths.vp.drilldown.getHref(),
      icon: ShieldCheck,
    },
  ],
  admin: [
    {
      labelKey: 'nav.accounts',
      to: paths.admin.students.getHref(),
      icon: Users,
      end: true,
    },
    {
      labelKey: 'nav.assignments',
      to: paths.admin.assignments.getHref(),
      icon: GraduationCap,
    },
    { labelKey: 'nav.rules', to: paths.admin.rules.getHref(), icon: FileText },
    {
      labelKey: 'nav.staff',
      to: paths.admin.staff.getHref(),
      icon: UserCog,
    },
    {
      labelKey: 'nav.settings',
      to: paths.admin.settings.getHref(),
      icon: Settings,
    },
  ],
};

const densityPadding: Record<TableDensity, string> = {
  spacious: 'p-4 lg:p-6',
  compact: 'p-3 lg:p-4',
};

export type AppShellProps = {
  forRole: UserRole;
  density?: TableDensity;
  bell?: React.ReactNode;
};

export const AppShell = ({ forRole, density, bell }: AppShellProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const resolvedDensity: TableDensity =
    density ?? (forRole === 'student' ? 'spacious' : 'compact');
  const items = roleNav[forRole];

  return (
    <TableDensityProvider density={resolvedDensity}>
      <div className="flex min-h-dvh bg-background">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:inset-s-2 focus:top-2 focus:z-70 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
        >
          {t('skipToContent')}
        </a>

        <nav
          aria-label={t(`roles.${forRole}`)}
          className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col gap-1 border-e bg-card p-2 lg:w-56 lg:p-3"
        >
          <div className="mb-4 flex items-center gap-2 px-1 lg:px-2">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
            >
              A
            </span>
            <span className="hidden truncate text-sm font-semibold lg:inline">
              {t('app.name')}
            </span>
          </div>
          {items.map(({ labelKey, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={t(labelKey)}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="hidden truncate lg:inline">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar bell={bell} name={user.data?.name ?? ''} />
          <main
            id="main"
            className={cn('flex-1', densityPadding[resolvedDensity])}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </TableDensityProvider>
  );
};

const Topbar = ({ bell, name }: { bell?: React.ReactNode; name: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-1 border-b bg-card px-3 lg:px-4">
      <div className="me-auto hidden text-sm font-semibold lg:inline">
        {t('app.name')}
      </div>
      <LanguageToggle />
      <ThemeToggle />
      {bell}
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            type="button"
            aria-label={t('topbar.account')}
            className="flex h-11 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-crimson-100 text-xs font-semibold text-crimson-800">
              {initials(name)}
            </span>
            <span className="hidden max-w-32 truncate lg:inline">{name}</span>
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <DropdownMenuItem
            disabled={logout.isPending}
            onSelect={(event) => {
              event.preventDefault();
              logout.mutate(undefined, {
                onSettled: () => navigate(paths.auth.login.getHref()),
              });
            }}
          >
            {logout.isPending ? (
              <Spinner size="sm" className="text-current" />
            ) : (
              <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
            )}
            {logout.isPending ? t('topbar.signingOut') : t('topbar.signOut')}
          </DropdownMenuItem>
        </DropdownContent>
      </Dropdown>
    </header>
  );
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const LanguageToggle = () => {
  const { t, i18n } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const next = language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      aria-label={t('topbar.language')}
      onClick={() => setLanguage(next)}
      className="flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs font-semibold uppercase hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      {next === 'ar' ? 'ع' : 'EN'}
    </button>
  );
};

const ThemeToggle = () => {
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
      className="flex size-11 items-center justify-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
};
