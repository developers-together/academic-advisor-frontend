import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/banner';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
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
  const navigate = useNavigate();
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

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {OVERVIEW_LINKS.map((link) => (
        <li key={link.labelKey}>
          <button
            type="button"
            onClick={() => navigate(link.to())}
            className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <span>
              <span className="block text-sm font-medium">
                {tNav(link.labelKey)}
              </span>
              {link.countOf === null &&
                link.labelKey === 'nav.registrationWindows' && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {activeWindow
                      ? t('overview.windowActive', {
                          term: activeWindow.term_code,
                        })
                      : t('overview.windowNone')}
                  </span>
                )}
            </span>
            {link.countOf !== null && (
              <span className="text-2xl font-bold tabular-nums">
                {counts[link.countOf] ?? '—'}
              </span>
            )}
            {link.labelKey === 'nav.registrationWindows' && activeWindow && (
              <Badge variant="success">{t('windows.active')}</Badge>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
};
