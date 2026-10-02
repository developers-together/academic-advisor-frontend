import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { CurrentEnrollment } from '@/types/domain';

export type CurrentEnrollmentsProps = {
  enrollments: CurrentEnrollment[];
};

export const CurrentEnrollments = ({
  enrollments,
}: CurrentEnrollmentsProps) => {
  const { t } = useTranslation('plan');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.enrollments.title')}</CardTitle>
      </CardHeader>
      <CardBody>
        {enrollments.length === 0 ? (
          <EmptyState compact title={t('profile.enrollments.empty')} />
        ) : (
          <ul className="space-y-3">
            {enrollments.map((enrollment) => (
              <li key={enrollment.course_code} className="space-y-0.5">
                <p className="text-sm font-medium">
                  <span className="bidi-code">{enrollment.course_code}</span>
                  {enrollment.title ? ` ${enrollment.title}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.enrollments.group')} {enrollment.group},{' '}
                  {t('profile.enrollments.section')} {enrollment.section}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};
