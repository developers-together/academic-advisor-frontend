import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import { toCairoInstant } from '@/lib/i18n/cairo';
import type { MeetingReason } from '@/types/domain';

import { useCreateMyMeetingRequest } from '../api/meeting-mutations';

const REASONS: MeetingReason[] = [
  'plan_review',
  'course_selection',
  'academic_standing',
  'degree_progress',
  'other',
];

export type RequestMeetingDialogProps = {
  onClose: () => void;
};

export const RequestMeetingDialog = ({
  onClose,
}: RequestMeetingDialogProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const createRequest = useCreateMyMeetingRequest();

  const [reason, setReason] = useState<MeetingReason>('plan_review');
  const [note, setNote] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredStart, setPreferredStart] = useState('');
  const [preferredEnd, setPreferredEnd] = useState('');
  const [failed, setFailed] = useState<{ title: string; body: string } | null>(
    null,
  );

  const preferredComplete =
    (preferredDate === '' && preferredStart === '' && preferredEnd === '') ||
    (preferredDate !== '' && preferredStart !== '' && preferredEnd !== '');

  const save = () => {
    setFailed(null);
    const preferred =
      preferredDate && preferredStart && preferredEnd
        ? [
            {
              starts_at: toCairoInstant(preferredDate, preferredStart),
              ends_at: toCairoInstant(preferredDate, preferredEnd),
            },
          ]
        : [];
    createRequest.mutate(
      { reason, note: note.trim() || null, preferred_slots: preferred },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('myMeetings.requestDialog.success'),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setFailed({
              title: t('myMeetings.requestDialog.exists'),
              body: t('myMeetings.requestDialog.existsBody'),
            });
            return;
          }
          setFailed({
            title: t('common:errors.sendFailed'),
            body: t('common:errors.sendFailedBody'),
          });
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('myMeetings.requestDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('myMeetings.requestDialog.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="meeting-reason" className="text-sm font-medium">
              {t('myMeetings.requestDialog.reasonLabel')}
            </label>
            <select
              id="meeting-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as MeetingReason)
              }
              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              {REASONS.map((entry) => (
                <option key={entry} value={entry}>
                  {t(`reasons.${entry}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="meeting-note" className="text-sm font-medium">
              {t('myMeetings.requestDialog.noteLabel')}
            </label>
            <textarea
              id="meeting-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('myMeetings.requestDialog.noteHint')}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">
              {t('myMeetings.requestDialog.preferredLabel')}
            </legend>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('myMeetings.requestDialog.preferredHint')}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="preferred-date"
                  className="text-2xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {t('myMeetings.requestDialog.date')}
                </label>
                <input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(event) => setPreferredDate(event.target.value)}
                  className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="preferred-start"
                  className="text-2xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {t('myMeetings.requestDialog.from')}
                </label>
                <input
                  id="preferred-start"
                  type="time"
                  value={preferredStart}
                  onChange={(event) => setPreferredStart(event.target.value)}
                  className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="preferred-end"
                  className="text-2xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {t('myMeetings.requestDialog.to')}
                </label>
                <input
                  id="preferred-end"
                  type="time"
                  value={preferredEnd}
                  onChange={(event) => setPreferredEnd(event.target.value)}
                  className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden sm:text-sm"
                />
              </div>
            </div>
          </fieldset>

          {failed && (
            <Banner variant="destructive" title={failed.title}>
              {failed.body}
            </Banner>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={!preferredComplete}
            isLoading={createRequest.isPending}
            aria-busy={createRequest.isPending}
          >
            {t('myMeetings.requestDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
