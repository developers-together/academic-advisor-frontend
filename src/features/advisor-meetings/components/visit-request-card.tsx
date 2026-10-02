import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/i18n/format';
import type { VisitRequest } from '@/types/domain';

import { SlotViewer } from './slot-viewer';

export type VisitRequestCardProps = {
  request: VisitRequest;
  initiatedByMe: boolean;
  markDonePending?: boolean;
  onMarkDone: () => void;
  onProposeSlots: () => void;
};

export const VisitRequestCard = ({
  request,
  initiatedByMe,
  markDonePending = false,
  onMarkDone,
  onProposeSlots,
}: VisitRequestCardProps) => {
  const { t } = useTranslation('advisor');
  const proposed = request.status === 'proposed';

  return (
    <Card aria-busy={markDonePending}>
      <CardHeader className="gap-2 lg:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{request.student?.name}</CardTitle>
            {request.student?.student_id && (
              <p className="mt-0.5 text-2xs text-muted-foreground">
                {request.student.student_id}
              </p>
            )}
          </div>
          <Badge variant={proposed ? 'info' : 'success'} dot size="sm">
            {t(proposed ? 'badges.proposed' : 'badges.done', { ns: 'common' })}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {initiatedByMe
            ? t('meetings.requestedByYou')
            : t('meetings.requestedBy', { name: request.student?.name })}
        </p>
      </CardHeader>
      <CardBody className="lg:pt-0">
        {request.slots.length > 0 && (
          <section aria-label={t('meetings.slots')}>
            <h2 className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('meetings.slots')}
            </h2>
            <SlotViewer slots={request.slots} className="mt-1" />
          </section>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(request.created_at)}
        </p>
      </CardBody>
      {proposed && (
        <CardFooter className="gap-2 lg:p-4 lg:pt-0">
          <Button variant="outline" size="sm" onClick={onProposeSlots}>
            {t('meetings.proposeSlots')}
          </Button>
          <Button
            size="sm"
            onClick={onMarkDone}
            isLoading={markDonePending}
            aria-busy={markDonePending}
          >
            {t('meetings.markDone')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
