import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonText } from '@/components/ui/skeleton';
import { useMyAdvisor } from '@/features/profile/api/get-advisor';
import { ApiError } from '@/lib/api-error';

export const AdvisorCard = () => {
  const { t } = useTranslation('plan');
  const advisorQuery = useMyAdvisor();

  return (
    <Card aria-busy={advisorQuery.isPending}>
      <CardHeader>
        <CardTitle>{t('profile.advisor.title')}</CardTitle>
      </CardHeader>
      <CardBody>
        {advisorQuery.isPending && <SkeletonText lines={2} />}

        {advisorQuery.isError &&
          advisorQuery.error instanceof ApiError &&
          advisorQuery.error.status === 404 && (
            <p className="text-sm text-muted-foreground">
              {t('profile.advisor.none')}
            </p>
          )}

        {advisorQuery.isError &&
          !(
            advisorQuery.error instanceof ApiError &&
            advisorQuery.error.status === 404
          ) && (
            <ErrorState
              compact
              onRetry={() => void advisorQuery.refetch()}
              requestId={
                advisorQuery.error instanceof ApiError
                  ? advisorQuery.error.requestId
                  : null
              }
            />
          )}

        {advisorQuery.data && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {advisorQuery.data.advisor.name}
            </p>
            {advisorQuery.data.availability_window.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('profile.advisor.hoursEmpty')}
              </p>
            ) : (
              <div>
                <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('profile.advisor.hours')}
                </p>
                <ul className="mt-1 space-y-1">
                  {advisorQuery.data.availability_window.rows.map((row) => (
                    <li
                      key={`${row.day}-${row.from}-${row.to}`}
                      className="text-sm tabular-nums"
                    >
                      {row.day} {row.from}-{row.to}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
