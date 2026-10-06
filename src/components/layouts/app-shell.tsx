import {
  CalendarClock,
  LogOut,
  Moon,
  MoreHorizontal,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import {
  CommandPalette,
  type CommandGroup,
} from '@/components/ui/command-palette';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
  DropdownMenu as Dropdown,
  DropdownMenuContent as DropdownContent,
  DropdownMenuItem as DropdownMenuItem,
  DropdownMenuTrigger as DropdownTrigger,
} from '@/components/ui/dropdown';
import { Spinner } from '@/components/ui/spinner';
import {
  commandRoutes,
  roleRoutes,
  routeTable,
  type RoleRouteDefinition,
} from '@/config/routes';
import { useLogout, useUser } from '@/lib/auth';
import { useLanguageStore } from '@/lib/language';
import { useThemeStore } from '@/lib/theme';
import type { UserRole } from '@/types/domain';
import { cn } from '@/utils/cn';

import { TableDensityProvider, type TableDensity } from './table-density';

type IconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

export type NavItem = {
  labelKey: string;
  to: string;
  icon: IconComponent;
  end?: boolean;
};

export type NavGroup = {
  labelKey: string;
  icon?: IconComponent;
  to?: string;
  items: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export const isNavGroup = (entry: NavEntry): entry is NavGroup =>
  'items' in entry;

const toNavItem = (route: RoleRouteDefinition): NavItem => ({
  labelKey: route.labelKey ?? '',
  to: route.path,
  icon: route.icon ?? MoreHorizontal,
  end: route.end,
});

const groupChildren = (route: RoleRouteDefinition): NavItem[] =>
  routeTable
    .filter(
      (child) =>
        child.role === route.role &&
        child.nav === 'group' &&
        child.parent === route.id,
    )
    .map(toNavItem);

const buildRoleNav = (role: UserRole): NavEntry[] => {
  const routes = roleRoutes(role);
  const entries: NavEntry[] = [];
  for (const route of routes) {
    if (route.nav !== 'primary') continue;
    const children = groupChildren(route);
    if (children.length > 0) {
      entries.push({
        labelKey: route.labelKey ?? '',
        icon: route.icon,
        to: route.path,
        items: children,
      });
    } else {
      entries.push(toNavItem(route));
    }
  }
  const moreItems = routes
    .filter((route) => route.nav === 'more')
    .map(toNavItem);
  if (moreItems.length > 0) {
    entries.push({ labelKey: 'nav.more', items: moreItems });
  }
  return entries;
};

const buildMobileBar = (role: UserRole): Array<NavItem | NavGroup> => {
  const routes = roleRoutes(role);
  return routes
    .filter((route) => route.mobile === 'bar')
    .map((route) => {
      const children = groupChildren(route);
      if (children.length === 0) return toNavItem(route);
      return {
        labelKey: route.labelKey ?? '',
        icon: route.icon,
        to: route.path,
        items: children,
      };
    });
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};

const useCommandHotkey = (onOpen: () => void) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);
};

const useCommandGroups = (forRole: UserRole): CommandGroup[] => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return React.useMemo(() => {
    const pageEntries = commandRoutes(forRole).map((route) => ({
      id: `page-${route.id}`,
      label: t(route.labelKey ?? ''),
      icon: route.icon ?? Sparkles,
      onSelect: () => navigate(route.path),
    }));

    const groups: CommandGroup[] = [
      { headingKey: 'commandPalette.sections.pages', entries: pageEntries },
    ];

    const actions: CommandGroup['entries'] = [];
    if (forRole === 'student') {
      actions.push({
        id: 'ask-ai',
        label: t('commandPalette.actions.askAi'),
        icon: Sparkles,
        onSelect: () => navigate('/app/chat'),
      });
    }
    if (forRole === 'advisor') {
      actions.push({
        id: 'set-availability',
        label: t('commandPalette.actions.setAvailability'),
        icon: CalendarClock,
        onSelect: () => navigate('/advisor/hours'),
      });
    }
    if (actions.length > 0) {
      groups.push({
        headingKey: 'commandPalette.sections.actions',
        entries: actions,
      });
    }
    return groups;
  }, [forRole, navigate, t]);
};

const densityPadding: Record<TableDensity, string> = {
  spacious: 'p-4 pb-24 md:p-6 md:pb-6 lg:p-8',
  compact: 'p-4 pb-24 md:p-6 md:pb-6',
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
  React.useEffect(() => {
    document.body.dataset.mode = forRole === 'student' ? 'student' : 'staff';
    return () => {
      delete document.body.dataset.mode;
    };
  }, [forRole]);
  const items = React.useMemo(() => buildRoleNav(forRole), [forRole]);
  const barSlots = React.useMemo(() => buildMobileBar(forRole), [forRole]);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const commandGroups = useCommandGroups(forRole);
  const isMobile = useIsMobile();
  useCommandHotkey(() => setPaletteOpen(true));

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
          className="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col gap-1 border-e bg-card p-2 md:flex lg:w-56 lg:p-3"
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
          {items.map((item) =>
            isNavGroup(item) ? (
              <div key={item.labelKey} className="mt-2">
                {item.to ? (
                  <NavLink
                    to={item.to}
                    aria-label={t(item.labelKey)}
                    className="hidden h-9 items-center rounded-md px-3 text-2xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden lg:flex"
                  >
                    {t(item.labelKey)}
                  </NavLink>
                ) : (
                  <p className="hidden px-3 py-1 text-2xs font-medium tracking-wide text-muted-foreground uppercase lg:inline">
                    {t(item.labelKey)}
                  </p>
                )}
                {item.items.map((child) => (
                  <SidebarLink key={child.to} item={child} />
                ))}
              </div>
            ) : (
              <SidebarLink key={item.to} item={item} />
            ),
          )}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            bell={bell}
            name={user.data?.name ?? ''}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main
            id="main"
            className={cn('flex-1', densityPadding[resolvedDensity])}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {isMobile && (
        <BottomNav forRole={forRole} entries={items} slots={barSlots} />
      )}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={commandGroups}
      />
    </TableDensityProvider>
  );
};

const SidebarLink = ({ item }: { item: NavItem }) => {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={t(item.labelKey)}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
          isActive && 'bg-accent text-accent-foreground',
        )
      }
    >
      <item.icon className="size-5 shrink-0" aria-hidden />
      <span className="hidden truncate lg:inline">{t(item.labelKey)}</span>
    </NavLink>
  );
};

const BottomNav = ({
  forRole,
  entries,
  slots,
}: {
  forRole: UserRole;
  entries: NavEntry[];
  slots: Array<NavItem | NavGroup>;
}) => {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [sheetSlot, setSheetSlot] = React.useState<NavGroup | 'more' | null>(
    null,
  );

  const sheetItems = entries.flatMap((entryItem) =>
    isNavGroup(entryItem) ? entryItem.items : [entryItem],
  );
  const barToSet = new Set(
    slots.flatMap((slot) => (isNavGroup(slot) ? [] : [slot])),
  );
  const remaining = sheetItems.filter((item) => !barToSet.has(item));
  const sheetTitleKey =
    sheetSlot && sheetSlot !== 'more' ? sheetSlot.labelKey : 'nav.more';
  const sheetLinks =
    sheetSlot && sheetSlot !== 'more'
      ? [
          ...(sheetSlot.to
            ? [
                {
                  labelKey: sheetSlot.labelKey,
                  to: sheetSlot.to,
                  icon: sheetSlot.icon ?? MoreHorizontal,
                  end: true,
                },
              ]
            : []),
          ...sheetSlot.items,
        ]
      : remaining;

  const openSheet = (slot: NavGroup | 'more') => {
    setSheetSlot(slot);
    setMoreOpen(true);
  };

  return (
    <>
      <nav
        aria-label={t(`roles.${forRole}`)}
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex items-stretch">
          {slots.map((slot) =>
            isNavGroup(slot) ? (
              <li key={slot.labelKey} className="flex-1">
                <button
                  type="button"
                  onClick={() => openSheet(slot)}
                  aria-haspopup="dialog"
                  aria-expanded={moreOpen && sheetSlot === slot}
                  className="flex h-16 w-full flex-col items-center justify-center gap-1 text-2xs font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset"
                >
                  {slot.icon ? (
                    <slot.icon className="size-5" aria-hidden />
                  ) : (
                    <MoreHorizontal className="size-5" aria-hidden />
                  )}
                  {t(slot.labelKey)}
                </button>
              </li>
            ) : (
              <li key={slot.to} className="flex-1">
                <NavLink
                  to={slot.to}
                  end={slot.end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-16 w-full flex-col items-center justify-center gap-1 text-2xs font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset',
                      isActive && 'text-primary',
                    )
                  }
                >
                  <slot.icon className="size-5" aria-hidden />
                  <span>{t(slot.labelKey)}</span>
                </NavLink>
              </li>
            ),
          )}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => openSheet('more')}
              aria-haspopup="dialog"
              aria-expanded={moreOpen && sheetSlot === 'more'}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-2xs font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset"
            >
              <MoreHorizontal className="size-5" aria-hidden />
              {t('nav.more')}
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent side="bottom" className="rounded-t-lg p-4 pb-8">
          <DrawerTitle className="mb-2 text-start text-base font-semibold">
            {t(sheetTitleKey)}
          </DrawerTitle>
          <ul className="flex flex-col">
            {sheetLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex h-12 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                      isActive && 'bg-accent text-accent-foreground',
                    )
                  }
                >
                  <item.icon className="size-5 shrink-0" aria-hidden />
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  );
};

type TopbarProps = {
  bell?: React.ReactNode;
  name: string;
  onOpenPalette: () => void;
};

const Topbar = ({ bell, name, onOpenPalette }: TopbarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-1 border-b bg-card px-3 lg:px-4">
      <div className="me-auto flex items-center gap-2">
        <span className="truncate text-sm font-semibold lg:hidden">
          {t('app.name')}
        </span>
        <span className="hidden truncate text-sm font-semibold lg:inline">
          {t('app.name')}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label={t('commandPalette.open')}
        className="flex h-11 items-center gap-2 rounded-md px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <Search className="size-5" aria-hidden />
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-2xs font-medium lg:inline">
          ⌘K
        </kbd>
      </button>
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
                onSettled: () => navigate('/login'),
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
      className="flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs font-semibold tracking-wide uppercase hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
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
