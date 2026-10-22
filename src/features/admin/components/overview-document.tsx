import { ArrowUpRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { routeTable } from '@/config/routes';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import { useAdminCourses } from '../api/get-admin-courses';
import { useAdminRules } from '../api/get-admin-rules';
import { useAdminStudentsCount } from '../api/get-admin-students-count';
import { useRegistrationWindows } from '../api/registration-windows';

const OVERVIEW_LINKS = [
  {
    labelKey: 'nav.users',
    to: () => paths.admin.users.getHref(),
    countOf: 'students',
  },
  {
    labelKey: 'nav.operations',
    to: () => paths.admin.operations.getHref(),
    countOf: null,
  },
  {
    labelKey: 'nav.assignments',
    to: () => paths.admin.assignments.getHref(),
    countOf: null,
  },
  {
    labelKey: 'nav.courses',
    to: () => paths.admin.courses.getHref(),
    countOf: 'courses',
  },
  {
    labelKey: 'nav.rules',
    to: () => paths.admin.rules.getHref(),
    countOf: 'rules',
  },
  {
    labelKey: 'nav.registrationWindows',
    to: () => paths.admin.registrationWindows.getHref(),
    countOf: null,
  },
  {
    labelKey: 'nav.academics',
    to: () => paths.admin.academics.getHref(),
    countOf: null,
  },
  {
    labelKey: 'nav.aiConfiguration',
    to: () => paths.admin.aiConfiguration.getHref(),
    countOf: null,
  },
] as const;

export const AdminOverviewDocument = () => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const { t } = useTranslation('admin');
  const { t: tNav } = useTranslation();
  const [search, setSearch] = useState('');
  const studentsCountQuery = useAdminStudentsCount();
  const coursesQuery = useAdminCourses();
  const rulesQuery = useAdminRules();
  const windowsQuery = useRegistrationWindows();

  const queries = [studentsCountQuery, coursesQuery, rulesQuery, windowsQuery];
  const pending = queries.some((query) => query.isPending);
  const denied = queries.some(
    (query) => query.error instanceof ApiError && query.error.status === 403,
  );
  const failed = queries.find((query) => query.isError);

  if (pending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (denied) {
    return <PermissionDenied audience="admin" />;
  }

  if (failed) {
    return (
      <ErrorState
        onRetry={() => {
          for (const query of queries) {
            if (query.isError) void query.refetch();
          }
        }}
        requestId={
          failed.error instanceof ApiError ? failed.error.requestId : null
        }
      />
    );
  }

  const activeWindow = windowsQuery.data?.find(
    (entry) =>
      entry.opens_at &&
      entry.closes_at &&
      Date.parse(entry.opens_at) <= now &&
      now < Date.parse(entry.closes_at),
  );
  const counts: Record<string, number | null> = {
    students: studentsCountQuery.data ?? null,
    courses: coursesQuery.data?.length ?? null,
    rules: rulesQuery.data?.length ?? null,
  };

  const links = OVERVIEW_LINKS.filter((link) =>
    tNav(link.labelKey)
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute inset-s-3 top-3 size-5 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label={t('overview.search')}
          placeholder={t('overview.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 bg-card ps-11"
        />
      </div>
      {links.length === 0 ? (
        <EmptyState
          title={tNav('commandPalette.noResults', { query: search })}
          action={{
            label: tNav('actions.clearSearch'),
            onClick: () => setSearch(''),
          }}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {links.map((link) => {
            const Icon = routeTable.find(
              (route) => route.path === link.to(),
            )?.icon;
            return (
              <li key={link.labelKey}>
                <Link
                  to={link.to()}
                  className="group flex min-h-20 items-center gap-4 p-4 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-inset sm:px-6"
                >
                  {Icon && (
                    <Icon
                      className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground"
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {tNav(link.labelKey)}
                    </span>
                    {link.labelKey === 'nav.registrationWindows' && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {activeWindow
                          ? t('overview.windowActive', {
                              term: activeWindow.term_code,
                            })
                          : t('overview.windowNone')}
                      </span>
                    )}
                  </span>
                  {link.countOf !== null && (
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {link.countOf === 'students'
                        ? t('overview.studentCount', {
                            count: counts.students ?? 0,
                          })
                        : (counts[link.countOf] ?? '—')}
                    </span>
                  )}
                  {link.labelKey === 'nav.registrationWindows' &&
                    activeWindow && (
                      <Badge variant="success">{t('windows.active')}</Badge>
                    )}
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
