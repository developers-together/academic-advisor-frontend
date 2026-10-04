import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { MDPreview } from '@/components/ui/md-preview';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import { useRules } from '../api/get-rules';

export const RulesDocument = () => {
  const { t } = useTranslation('rules');
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

  const rules = rulesQuery.data;

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
  );
};
