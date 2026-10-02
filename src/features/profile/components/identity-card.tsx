import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/i18n/format';
import type { User } from '@/types/domain';

export type IdentityCardProps = {
  user: User;
  curriculumYear: number | null;
};

export const IdentityCard = ({ user, curriculumYear }: IdentityCardProps) => {
  const { t } = useTranslation('plan');

  const rows = [
    { label: t('profile.identity.studentId'), value: user.student_id },
    { label: t('profile.identity.email'), value: user.email },
    { label: t('profile.identity.faculty'), value: user.faculty },
    {
      label: t('profile.identity.year'),
      value: curriculumYear === null ? null : formatNumber(curriculumYear),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} forRole={user.role} size="lg" />
          <CardTitle>{user.name}</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows
            .filter((row) => row.value !== null)
            .map((row) => (
              <div key={row.label}>
                <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-sm wrap-break-word">{row.value}</dd>
              </div>
            ))}
        </dl>
      </CardBody>
    </Card>
  );
};
