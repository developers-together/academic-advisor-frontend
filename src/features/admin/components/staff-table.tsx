import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StaffMember } from '@/types/domain';

export type StaffTableProps = {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
};

export const StaffTable = ({
  staff,
  onEdit,
  onResetPassword,
  onDelete,
}: StaffTableProps) => {
  const { t } = useTranslation('admin');

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <TableElement>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {(
              [
                'name',
                'email',
                'role',
                'faculty',
                'caseload',
                'actions',
              ] as const
            ).map((key) => (
              <TableHead
                key={key}
                className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase"
              >
                {key === 'actions' ? (
                  <span className="sr-only">
                    {t('common:actions.moreActions')}
                  </span>
                ) : (
                  t(`staff.columns.${key}`)
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) => (
            <TableRow key={member.id} className="border-border">
              <TableCell className="px-3 py-2">
                <button
                  type="button"
                  aria-label={t('staff.actions.editAria', {
                    name: member.name,
                  })}
                  onClick={() => onEdit(member)}
                  className="rounded-sm text-start text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                >
                  {member.name}
                </button>
              </TableCell>
              <TableCell className="px-3 py-2 text-2xs break-all text-muted-foreground">
                {member.email}
              </TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant="neutral" size="sm">
                  {t(`staff.roles.${member.role}`)}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                {member.faculty ?? '-'}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm tabular-nums">
                {member.role === 'advisor'
                  ? t('staff.caseloadCount', {
                      count: member.students_count,
                    })
                  : '-'}
              </TableCell>
              <TableCell className="px-3 py-2 text-end">
                <span className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t('staff.actions.resetAria', {
                      name: member.name,
                    })}
                    onClick={() => onResetPassword(member)}
                  >
                    {t('staff.actions.resetPassword')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-label={t('staff.actions.deleteAria', {
                      name: member.name,
                    })}
                    onClick={() => onDelete(member)}
                  >
                    {t('staff.actions.delete')}
                  </Button>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableElement>
    </div>
  );
};
