import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import type {
  AdvisorCaseloadStudent,
  StudentSummary,
  MeetingReason,
} from '@/types/domain';

import { useCreateMeetingRequest } from '../api/create-meeting-request';
import { useOpenSlots } from '../api/get-open-slots';

import { SlotPicker } from './slot-picker';

const REASONS: MeetingReason[] = [
  'plan_review',
  'course_selection',
  'academic_standing',
  'degree_progress',
  'other',
];

export type InviteStudentDialogProps = {
  caseload: AdvisorCaseloadStudent[];
  student?: StudentSummary | null;
  onClose: () => void;
};

export const InviteStudentDialog = ({
  caseload,
  student: lockedStudent = null,
  onClose,
}: InviteStudentDialogProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const openSlots = useOpenSlots(true);
  const createRequest = useCreateMeetingRequest();

  const [student, setStudent] = useState<AdvisorCaseloadStudent | null>(
    lockedStudent
      ? {
          id: lockedStudent.id,
          name: lockedStudent.name,
          student_id: lockedStudent.student_id,
          sis_email: '',
          faculty: null,
          school: null,
          department: null,
          curriculum_year_level: null,
          plan_id: null,
          plan_state: null,
          submitted_at: null,
          is_aging: false,
          has_unmet_meeting: false,
          cgpa: null,
        }
      : null,
  );
  const [reason, setReason] = useState<MeetingReason>('plan_review');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const save = () => {
    if (!student) return;
    setFailed(false);
    const slots = selected.map((key) => {
      const [startMs, endMs] = key.split('-').map(Number);
      return {
        starts_at: new Date(startMs).toISOString(),
        ends_at: new Date(endMs).toISOString(),
      };
    });
    createRequest.mutate(
      { studentId: student.id, reason, note, slotInstants: slots },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('meetings.inviteDialog.success', { name: student.name }),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            addNotification({
              type: 'info',
              title: t('common:errors.conflict'),
            });
            onClose();
            return;
          }
          setFailed(true);
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('meetings.inviteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('meetings.inviteDialog.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {lockedStudent ? (
            <p className="text-sm font-medium">{lockedStudent.name}</p>
          ) : (
            <Combobox
              options={caseload.map((entry) => ({
                value: String(entry.id),
                label: entry.name,
                meta: entry.student_id ?? undefined,
              }))}
              placeholder={t('meetings.inviteDialog.studentPlaceholder')}
              ariaLabel={t('meetings.inviteDialog.studentLabel')}
              emptyMessage={(query) =>
                t('meetings.inviteDialog.studentEmpty', { query })
              }
              onSelect={(value) => {
                setStudent(
                  caseload.find((entry) => String(entry.id) === value) ?? null,
                );
              }}
            />
          )}

          <div>
            <label htmlFor="invite-reason" className="text-sm font-medium">
              {t('meetings.inviteDialog.reasonLabel')}
            </label>
            <select
              id="invite-reason"
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
            <label htmlFor="invite-note" className="text-sm font-medium">
              {t('meetings.inviteDialog.noteLabel')}
            </label>
            <textarea
              id="invite-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              {t('meetings.inviteDialog.slotsLabel')}
            </p>
            <SlotPicker
              slots={openSlots.data}
              isPending={openSlots.isPending}
              mode="multi"
              selected={selected}
              onSelectedChange={setSelected}
              max={5}
            />
          </div>

          {failed && (
            <Banner variant="destructive" title={t('common:errors.sendFailed')}>
              {t('common:errors.sendFailedBody')}
            </Banner>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={!student || selected.length === 0}
            isLoading={createRequest.isPending}
            aria-busy={createRequest.isPending}
          >
            {t('meetings.inviteDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
