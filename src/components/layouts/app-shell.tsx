import {
  CalendarClock,
  ChevronLeft,
  ChevronDown,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Moon,
  MoreHorizontal,
  Search,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import {
  CommandPalette,
  type CommandGroup,
} from '@/components/ui/command-palette';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown';
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
    if (route.nav !== 'primary' || route.id === 'app.account') continue;
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
  const setTheme = useThemeStore((state) => state.setTheme);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

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

    const actions: CommandGroup['entries'] = [
      {
        id: 'dark-mode',
        label: t('topbar.theme.dark'),
        icon: Moon,
        onSelect: () => setTheme('dark'),
      },
      {
        id: 'light-mode',
        label: t('topbar.theme.light'),
        icon: Sun,
        onSelect: () => setTheme('light'),
      },
      {
        id: 'language',
        label: t('topbar.language'),
        icon: Globe,
        onSelect: () =>
          setLanguage(
            document.documentElement.lang.startsWith('ar') ? 'en' : 'ar',
          ),
      },
    ];
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
  }, [forRole, navigate, t, setTheme, setLanguage]);
};

const densityPadding: Record<TableDensity, string> = {
  spacious: 'p-4 md:p-6 lg:p-8',
  compact: 'p-4 md:p-6',
};

export type AppShellProps = {
  forRole: UserRole;
  density?: TableDensity;
  bell?: React.ReactNode;
};

export const AppShell = ({ forRole, density, bell }: AppShellProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const resolvedDensity =
    density ?? (forRole === 'student' ? 'spacious' : 'compact');
  const items = React.useMemo(() => buildRoleNav(forRole), [forRole]);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(
    () => window.localStorage.getItem('advaisor.sidebarCollapsed') === 'true',
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const sidebarToggleRef = React.useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const expanded = isMobile ? mobileOpen : !collapsed;
  const commandGroups = useCommandGroups(forRole);
  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((value) => !value);
    else
      setCollapsed((value) => {
        window.localStorage.setItem(
          'advaisor.sidebarCollapsed',
          String(!value),
        );
        return !value;
      });
  };
  React.useEffect(() => {
    document.body.dataset.mode = forRole === 'student' ? 'student' : 'staff';
    return () => {
      delete document.body.dataset.mode;
    };
  }, [forRole]);
  React.useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);
  useCommandHotkey(() => {
    setMobileOpen(false);
    setPaletteOpen(true);
  });
  const sidebar = (
    <nav
      id="workspace-sidebar"
      aria-label={t(`roles.${forRole}`)}
      className={cn(
        isMobile && mobileOpen
          ? 'flex h-full min-h-0 flex-col gap-2'
          : 'workspace-sidebar',
        expanded && !(isMobile && mobileOpen) && 'is-expanded',
      )}
    >
      <div className="sidebar-brand-row">
        {expanded ? (
          <img
            src="/ejust-logo.png"
            alt="E-JUST"
            className="sidebar-brand-mark object-contain"
          />
        ) : (
          <button
            type="button"
            className="sidebar-brand-toggle group"
            aria-label={t('experience.expandSidebar')}
            aria-controls="workspace-sidebar"
            aria-expanded={false}
            ref={sidebarToggleRef}
            onClick={toggleSidebar}
          >
            <img
              src="/ejust-logo.png"
              alt="E-JUST"
              className="size-10 object-contain group-hover:opacity-0 group-focus-visible:opacity-0"
            />
            <PanelLeftOpen
              className="absolute size-5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 rtl:-scale-x-100"
              aria-hidden
            />
          </button>
        )}
        {expanded && (
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              {t('app.name')}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t(`roles.${forRole}`)}
            </span>
          </span>
        )}
        {expanded && (
          <button
            type="button"
            aria-controls="workspace-sidebar"
            aria-expanded={expanded}
            aria-label={t('experience.collapseSidebar')}
            className="sidebar-icon-button"
            ref={sidebarToggleRef}
            onClick={toggleSidebar}
          >
            <PanelLeftClose className="size-4 rtl:-scale-x-100" aria-hidden />
          </button>
        )}
      </div>
      <button
        type="button"
        className="sidebar-search"
        aria-label={t('commandPalette.open')}
        title={t('experience.searchHint')}
        onClick={() => {
          setMobileOpen(false);
          setPaletteOpen(true);
        }}
      >
        <Search className="size-5 shrink-0" aria-hidden />
        {expanded && (
          <>
            <span className="min-w-0 flex-1 text-start text-sm">
              {t('commandPalette.open')}
            </span>
            <kbd className="rounded-md bg-card px-1.5 py-1 text-xs">⌘K</kbd>
          </>
        )}
      </button>
      <div className="sidebar-navigation">
        {items.map((item) =>
          isNavGroup(item) ? (
            <div key={item.labelKey} className="my-2 space-y-1">
              {expanded && (
                <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
                  {t(item.labelKey)}
                </p>
              )}
              {item.to && (
                <SidebarLink
                  expanded={expanded}
                  item={{
                    labelKey: item.labelKey,
                    to: item.to,
                    icon: item.icon ?? MoreHorizontal,
                    end: true,
                  }}
                  onNavigate={() => setMobileOpen(false)}
                />
              )}
              {item.items.map((child) => (
                <SidebarLink
                  key={child.to}
                  expanded={expanded}
                  item={child}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
          ) : (
            <SidebarLink
              key={item.to}
              expanded={expanded}
              item={item}
              onNavigate={() => setMobileOpen(false)}
            />
          ),
        )}
      </div>
      <SidebarTools
        expanded={expanded}
        forRole={forRole}
        onNavigate={() => setMobileOpen(false)}
        bell={bell}
        name={user.data?.name ?? ''}
      />
    </nav>
  );
  return (
    <TableDensityProvider density={resolvedDensity}>
      <div className="workspace-frame" data-sidebar-expanded={expanded}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:inset-s-2 focus:top-2 focus:z-70 focus:rounded-md focus:bg-card focus:p-3"
        >
          {t('skipToContent')}
        </a>
        <div className="sidebar-space">
          {isMobile && mobileOpen ? (
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerContent
                side="left"
                showClose={false}
                className="workspace-sidebar is-expanded"
                aria-describedby={undefined}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  window.requestAnimationFrame(() =>
                    sidebarToggleRef.current?.focus(),
                  );
                }}
              >
                <DrawerTitle className="sr-only">
                  {t(`roles.${forRole}`)}
                </DrawerTitle>
                {sidebar}
              </DrawerContent>
            </Drawer>
          ) : (
            sidebar
          )}
        </div>
        <main
          id="main"
          inert={isMobile && mobileOpen}
          className={cn('min-w-0 flex-1', densityPadding[resolvedDensity])}
        >
          <Outlet />
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={commandGroups}
      />
    </TableDensityProvider>
  );
};

const SidebarLink = ({
  item,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  expanded: boolean;
  onNavigate: () => void;
}) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = React.useState<{
    left: number;
    top: number;
    rtl: boolean;
  } | null>(null);
  const showTooltip = (element: HTMLElement) => {
    if (expanded) return;
    const rect = element.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    setTooltip({
      left: rtl ? rect.left - 10 : rect.right + 10,
      top: rect.top + rect.height / 2,
      rtl,
    });
  };
  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={t(item.labelKey)}
      title={!expanded ? t(item.labelKey) : undefined}
      onClick={onNavigate}
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => setTooltip(null)}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => setTooltip(null)}
      className={({ isActive }) =>
        cn('sidebar-link group', isActive && 'is-active')
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn(
              'nav-state-icon size-5 shrink-0',
              isActive && 'is-active',
            )}
            aria-hidden
          />
          {expanded ? (
            <span className="min-w-0 flex-1 leading-snug">
              {t(item.labelKey)}
            </span>
          ) : (
            tooltip &&
            createPortal(
              <span
                role="tooltip"
                className="nav-tooltip"
                aria-hidden
                style={{
                  left: tooltip.left,
                  top: tooltip.top,
                  transform: tooltip.rtl
                    ? 'translate(-100%, -50%)'
                    : 'translateY(-50%)',
                }}
              >
                {t(item.labelKey)}
              </span>,
              document.body,
            )
          )}
          {expanded && isActive && (
            <ChevronLeft
              className="size-3 rotate-180 rtl:rotate-0"
              aria-hidden
            />
          )}
        </>
      )}
    </NavLink>
  );
};

const SidebarTools = ({
  expanded,
  bell,
  name,
  forRole,
  onNavigate,
}: {
  expanded: boolean;
  bell?: React.ReactNode;
  name: string;
  forRole: UserRole;
  onNavigate: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const logout = useLogout();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  return (
    <div className={cn('sidebar-tools', expanded && 'is-expanded')}>
      {!expanded && <div className="sidebar-account-bell">{bell}</div>}
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('topbar.account')}
            className="sidebar-account"
          >
            <span className="sidebar-avatar">{initials(name)}</span>
            {expanded && (
              <>
                <span className="min-w-0 flex-1 truncate text-start text-sm font-medium">
                  {name}
                </span>
                <ChevronDown className="size-4 shrink-0" aria-hidden />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className="account-menu"
        >
          <DropdownMenuLabel className="account-menu-identity">
            {name || t('topbar.account')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {forRole === 'student' && (
            <DropdownMenuItem
              className="account-menu-item"
              onSelect={() => {
                onNavigate();
                void navigate('/app/account');
              }}
            >
              <UserRound aria-hidden className="size-5" />
              {t('nav.account')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="account-menu-item">
              <Sun className="size-5 dark:hidden" aria-hidden />
              <Moon className="hidden size-5 dark:block" aria-hidden />
              {t('topbar.appearance')}
              <span className="account-menu-value">
                {t(`topbar.themeOptions.${theme}`)}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="account-menu">
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    if (
                      value === 'light' ||
                      value === 'dark' ||
                      value === 'system'
                    )
                      setTheme(value);
                  }}
                >
                  {(['light', 'dark', 'system'] as const).map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      className="account-menu-choice"
                    >
                      {t(`topbar.themeOptions.${value}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="account-menu-item">
              <Globe className="size-5" aria-hidden />
              {t('topbar.language')}
              <span className="account-menu-value">
                {i18n.language.startsWith('ar') ? 'العربية' : 'English'}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="account-menu">
                <DropdownMenuRadioGroup
                  value={i18n.language.startsWith('ar') ? 'ar' : 'en'}
                  onValueChange={(value) => {
                    if (value === 'ar' || value === 'en') setLanguage(value);
                  }}
                >
                  <DropdownMenuRadioItem
                    value="en"
                    className="account-menu-choice"
                  >
                    English
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="ar"
                    className="account-menu-choice"
                  >
                    العربية
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="account-menu-item text-destructive"
            disabled={logout.isPending}
            onSelect={() =>
              logout.mutate(undefined, { onSettled: () => navigate('/login') })
            }
          >
            <LogOut className="size-5 rtl:-scale-x-100" aria-hidden />
            {logout.isPending ? t('topbar.signingOut') : t('topbar.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {expanded && <div className="sidebar-account-bell">{bell}</div>}
    </div>
  );
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
