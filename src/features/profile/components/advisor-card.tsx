import { Clock, MapPin, UserRound, GraduationCap } from 'lucide-react';
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
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-4" aria-hidden />
          {t('profile.advisor.title')}
        </CardTitle>
      </CardHeader>
      <CardBody>
        {advisorQuery.isPending && <SkeletonText lines={2} />}

        {advisorQuery.isError && (
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

        {advisorQuery.data && advisorQuery.data.advisor === null && (
          <p className="text-sm text-muted-foreground">
            {t('profile.advisor.none')}
          </p>
        )}

        {advisorQuery.data && advisorQuery.data.advisor !== null && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <UserRound className="size-4 shrink-0" aria-hidden />
              {advisorQuery.data.advisor.name}
            </p>
            {advisorQuery.data.office_location === null ? (
              <p className="text-sm text-muted-foreground">
                {t('profile.advisor.locationEmpty')}
              </p>
            ) : (
              <div>
                <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  <MapPin className="me-2 inline size-4" aria-hidden />
                  {t('profile.advisor.location')}
                </p>
                <p className="mt-1 text-sm">
                  {advisorQuery.data.office_location}
                </p>
              </div>
            )}
            {advisorQuery.data.availability_window.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('profile.advisor.hoursEmpty')}
              </p>
            ) : (
              <div>
                <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  <Clock className="me-2 inline size-4" aria-hidden />
                  {t('profile.advisor.hours')}
                </p>
                <ul className="mt-1 space-y-1">
                  {advisorQuery.data.availability_window.rows.map((row) => (
                    <li
                      key={`${row.day}-${row.from}-${row.to}`}
                      className="text-sm tabular-nums"
                    >
                      {t(`advisor:hours.days.${row.day.toLowerCase()}`, {
                        defaultValue: row.day,
                      })}{' '}
                      {row.from}-{row.to}
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
