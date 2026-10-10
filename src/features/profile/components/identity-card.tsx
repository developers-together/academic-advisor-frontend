import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/i18n/format';
import type { User } from '@/types/domain';

export type IdentityCardProps = {
  user: User;
  curriculumYear?: number | null;
  academic?: boolean;
};

export const IdentityCard = ({
  user,
  curriculumYear = null,
  academic = false,
}: IdentityCardProps) => {
  const { t } = useTranslation('plan');

  const rows = [
    {
      label: t('profile.identity.studentId'),
      value: academic ? user.student_id : null,
    },
    { label: t('profile.identity.email'), value: academic ? null : user.email },
    {
      label: t('profile.identity.faculty'),
      value: academic ? user.faculty : null,
    },
    {
      label: t('profile.identity.year'),
      value:
        !academic || curriculumYear === null
          ? null
          : formatNumber(curriculumYear),
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
