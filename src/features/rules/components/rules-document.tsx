import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { MDPreview } from '@/components/ui/md-preview';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { PermissionDenied } from '@/lib/authorization';
import type { UniversityRuleSummary } from '@/types/domain';

import { useRules } from '../api/get-rules';

const rulesForStudent = (
  rules: UniversityRuleSummary[],
  faculty: string | null,
): UniversityRuleSummary[] =>
  rules.filter((rule) => rule.faculty === null || rule.faculty === faculty);

export const RulesDocument = () => {
  const { t } = useTranslation('rules');
  const user = useUser();
  const rulesQuery = useRules();

  if (rulesQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (rulesQuery.isError) {
    if (
      rulesQuery.error instanceof ApiError &&
      rulesQuery.error.status === 403
    ) {
      return <PermissionDenied audience="student" />;
    }
    return (
      <ErrorState
        onRetry={() => void rulesQuery.refetch()}
        requestId={
          rulesQuery.error instanceof ApiError
            ? rulesQuery.error.requestId
            : null
        }
      />
    );
  }

  const faculty = user.data?.faculty ?? null;
  const rules = rulesForStudent(rulesQuery.data, faculty);

  if (rules.length === 0) {
    return (
      <EmptyState
        title={t('empty.title')}
        description={t('empty.body')}
        className="max-w-xl"
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {faculty === null ? t('scope.global') : t('scope.faculty', { faculty })}
      </p>
      <ul className="space-y-4">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-lg border bg-card p-4 lg:p-6">
            <h2 className="text-lg leading-tight font-semibold">
              <span className="block">{rule.title_en}</span>
              <span dir="rtl" lang="ar" className="block">
                {rule.title_ar}
              </span>
            </h2>
            <div className="max-w-prose">
              <MDPreview value={rule.body_en} />
            </div>
            <div
              dir="rtl"
              lang="ar"
              className="max-w-prose border-t border-border pt-2"
            >
              <MDPreview value={rule.body_ar} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
