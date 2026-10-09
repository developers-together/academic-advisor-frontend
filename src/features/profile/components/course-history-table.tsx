import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CourseAttempt } from '@/types/domain';

export type CourseHistoryTableProps = {
  history: CourseAttempt[];
};

export const CourseHistoryTable = ({ history }: CourseHistoryTableProps) => {
  const { t } = useTranslation('plan');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.history.title')}</CardTitle>
      </CardHeader>
      <CardBody>
        {history.length === 0 ? (
          <EmptyState compact title={t('profile.history.empty')} />
        ) : (
          <TableElement>
            <TableHeader>
              <TableRow>
                <TableHead>{t('profile.history.course')}</TableHead>
                <TableHead>{t('profile.history.credits')}</TableHead>
                <TableHead>{t('profile.history.term')}</TableHead>
                <TableHead>{t('profile.history.level')}</TableHead>
                <TableHead>{t('profile.history.grade')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((attempt) => {
                const supplementaryTerm = [attempt.year, attempt.semester]
                  .filter((part) => part !== null && part !== '')
                  .join(' ');
                return (
                  <TableRow
                    key={`${attempt.course_code}-${attempt.term_code}-${attempt.grade}`}
                  >
                    <TableCell>
                      <span className="text-sm">
                        <span className="bidi-code">{attempt.course_code}</span>
                        {attempt.name ? ` ${attempt.name}` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {attempt.credits ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {supplementaryTerm
                          ? `${attempt.term_code} · ${supplementaryTerm}`
                          : attempt.term_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {attempt.level ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {attempt.grade}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </TableElement>
        )}
      </CardBody>
    </Card>
  );
};
