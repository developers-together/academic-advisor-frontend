import { ArrowUpRight, Search } from 'lucide-react';
import { useState } from 'react';
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
import { useAdminPrograms } from '../api/get-admin-programs';
import { useAdminRules } from '../api/get-admin-rules';
import { useAdminStudents } from '../api/get-admin-students';
import { useRegistrationWindows } from '../api/registration-windows';

const OVERVIEW_LINKS = [
  {
    labelKey: 'nav.users',
    to: () => paths.admin.users.getHref(),
    countOf: 'students',
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
    labelKey: 'nav.programs',
    to: () => paths.admin.programs.getHref(),
    countOf: 'programs',
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
    labelKey: 'nav.aiConfiguration',
    to: () => paths.admin.aiConfiguration.getHref(),
    countOf: null,
  },
] as const;

export const AdminOverviewDocument = () => {
  const { t } = useTranslation('admin');
  const { t: tNav } = useTranslation();
  const [search, setSearch] = useState('');
  const studentsQuery = useAdminStudents({ search: '', perPage: 50, page: 1 });
  const coursesQuery = useAdminCourses();
  const programsQuery = useAdminPrograms();
  const rulesQuery = useAdminRules();
  const windowsQuery = useRegistrationWindows();

  const queries = [
    studentsQuery,
    coursesQuery,
    programsQuery,
    rulesQuery,
    windowsQuery,
  ];
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

  const activeWindow = windowsQuery.data?.find((entry) => entry.is_active);
  const counts: Record<string, number | null> = {
    students: studentsQuery.data?.meta?.total ?? null,
    courses: coursesQuery.data?.length ?? null,
    programs: programsQuery.data?.length ?? null,
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
