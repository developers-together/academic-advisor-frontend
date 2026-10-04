import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { dayjsInCairo } from '@/lib/i18n/cairo';
import type {
  MeetingDirection,
  MeetingOpenSlot,
  MeetingReason,
  MeetingRequest,
  MeetingRequestStatus,
} from '@/types/domain';

import { db } from '../db';
import { CURRENT_TERM, requireAuth } from '../mock-auth';
import {
  DEFAULT_OFFICE_HOURS,
  deniesPermission,
  injectsErrors,
} from '../scenarios';
import { networkDelay } from '../utils';

const MEETING_DURATION_MINUTES = 30;
const OPEN_SLOT_DAYS = 14;
const MAX_PROPOSED_SLOTS = 5;
const ACTIVE_STATUSES: MeetingRequestStatus[] = [
  'requested',
  'awaiting_response',
  'confirmed',
];

type SlotInput = { starts_at: string; ends_at: string };
type StoredSlot = { starts_at: string; ends_at: string };

const MEETING_REASONS: MeetingReason[] = [
  'plan_review',
  'course_selection',
  'academic_standing',
  'degree_progress',
  'other',
];

const normalizeSlotInputs = (value: unknown): StoredSlot[] =>
  Array.isArray(value)
    ? value
        .filter(
          (slot): slot is SlotInput =>
            typeof slot === 'object' &&
            slot !== null &&
            typeof (slot as SlotInput).starts_at === 'string' &&
            typeof (slot as SlotInput).ends_at === 'string',
        )
        .slice(0, MAX_PROPOSED_SLOTS)
    : [];

const parseReason = (value: unknown): MeetingReason =>
  MEETING_REASONS.includes(value as MeetingReason)
    ? (value as MeetingReason)
    : 'other';

const parseOptionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, 2000)
    : null;

const slotsOverlap = (a: SlotInput, b: SlotInput) =>
  dayjs(a.starts_at).isBefore(dayjs(b.ends_at)) &&
  dayjs(b.starts_at).isBefore(dayjs(a.ends_at));

const bookedSlotsOf = (advisorId: number): StoredSlot[] =>
  db.meetingRequest
    .findMany({
      where: { advisorId: { equals: advisorId } },
    })
    .filter((row) => row.status === 'confirmed')
    .flatMap((row) => {
      const slots = JSON.parse(row.slots) as StoredSlot[];
      const selected = row.selectedSlotIndex ?? null;
      return selected === null ? [] : [slots[selected]];
    });

const availabilityRowsOf = (advisorId: number) => {
  const profile = db.advisorProfile.findFirst({
    where: { advisorId: { equals: advisorId } },
  });
  if (!profile) return DEFAULT_OFFICE_HOURS;
  const rows = JSON.parse(profile.rows) as {
    day: string;
    from: string;
    to: string;
  }[];
  return rows.length > 0 ? rows : DEFAULT_OFFICE_HOURS;
};

const openSlotsFor = (advisorId: number): MeetingOpenSlot[] => {
  const rows = availabilityRowsOf(advisorId);
  const booked = bookedSlotsOf(advisorId);
  const slots: MeetingOpenSlot[] = [];

  for (let dayOffset = 1; dayOffset <= OPEN_SLOT_DAYS; dayOffset += 1) {
    const day = dayjsInCairo(new Date()).add(dayOffset, 'day');
    const weekday = day.format('dddd');
    const dayKey = day.format('YYYY-MM-DD');
    for (const row of rows) {
      if (row.day !== weekday) continue;
      const windowStart = dayjs.tz(`${dayKey} ${row.from}`, 'Africa/Cairo');
      const windowEnd = dayjs.tz(`${dayKey} ${row.to}`, 'Africa/Cairo');
      let cursor = windowStart;
      while (
        cursor.add(MEETING_DURATION_MINUTES, 'minute').valueOf() <=
        windowEnd.valueOf()
      ) {
        const starts_at = cursor.toISOString();
        const ends_at = cursor
          .add(MEETING_DURATION_MINUTES, 'minute')
          .toISOString();
        const is_conflict = booked.some((slot) =>
          slotsOverlap({ starts_at, ends_at }, slot),
        );
        slots.push({ starts_at, ends_at, is_conflict });
        cursor = cursor.add(MEETING_DURATION_MINUTES, 'minute');
      }
    }
  }
  return slots;
};

const meetingOf = (row: {
  id: number;
  status: string;
  direction: string;
  requesterId: number;
  studentId: number;
  advisorId: number;
  reason: string;
  note: string | null;
  slots: string;
  selectedSlotIndex: number | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}): MeetingRequest => {
  const student = db.user.findFirst({
    where: { id: { equals: row.studentId } },
  });
  const slots = JSON.parse(row.slots) as StoredSlot[];
  return {
    id: row.id,
    status: row.status as MeetingRequest['status'],
    direction: row.direction as MeetingDirection,
    requester_id: row.requesterId,
    recipient_id:
      row.direction === 'student_to_advisor' ? row.advisorId : row.studentId,
    student: {
      id: row.studentId,
      name: student?.name ?? 'Student',
      student_id: student?.student_id ?? null,
    },
    reason: row.reason as MeetingReason,
    note: row.note,
    slots: slots.map((slot, index) => ({
      id: row.id * 100 + index,
      ...slot,
    })),
    selected_slot_id:
      row.selectedSlotIndex === null
        ? null
        : row.id * 100 + row.selectedSlotIndex,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    completed_at: row.completedAt,
    cancellation_reason: row.cancellationReason,
  };
};

const meetingResponse = (rowId: number) => {
  const row = db.meetingRequest.findFirst({ where: { id: { equals: rowId } } });
  if (!row) return null;
  return meetingOf(row as never);
};

let notificationSeq = 0;

const notify = (userId: number, slug: string, meetingId: number) => {
  notificationSeq += 1;
  db.notification.create({
    id: `meeting-${meetingId}-${slug}-${notificationSeq}`,
    userId,
    slug,
    deep_link: JSON.stringify({
      screen: 'visit',
      visit_request_id: meetingId,
    }),
  });
};

const studentIdsOfAdvisor = (advisorId: number) =>
  db.user
    .findMany({ where: { advisor_id: { equals: advisorId } } })
    .map((student) => student.id as number);

export const meetingsHandlers = [
  http.get(`${env.API_URL}/advisor/meeting-requests`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const advisor = requireAuth(request);
    const studentIds = studentIdsOfAdvisor(advisor.id as number);
    const requests: MeetingRequest[] = db.meetingRequest
      .findMany({ where: { studentId: { in: studentIds } } })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((row) => meetingOf(row as never));
    return HttpResponse.json({ data: requests });
  }),

  http.get(
    `${env.API_URL}/advisor/availability/open-slots`,
    async ({ request }) => {
      await networkDelay();
      if (injectsErrors()) {
        return HttpResponse.json(
          { message: 'The server encountered an error.' },
          { status: 500 },
        );
      }
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      const advisor = requireAuth(request);
      return HttpResponse.json({ data: openSlotsFor(advisor.id as number) });
    },
  ),

  http.post(`${env.API_URL}/advisor/meeting-requests`, async ({ request }) => {
    await networkDelay();
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const advisor = requireAuth(request);
    const body = (await request.json()) as {
      student_id?: unknown;
      reason?: unknown;
      note?: unknown;
      slots?: unknown;
    };
    const student = db.user.findFirst({
      where: { id: { equals: Number(body.student_id) } },
    });
    if (!student || student.advisor_id !== advisor.id) {
      return HttpResponse.json(
        { message: 'No assigned student found.' },
        { status: 404 },
      );
    }
    const slots = normalizeSlotInputs(body.slots);
    if (slots.length === 0) {
      return HttpResponse.json(
        {
          message: 'An invitation needs at least one proposed time.',
          key: 'meeting.slots_required',
        },
        { status: 422 },
      );
    }
    const existing = db.meetingRequest.findFirst({
      where: {
        studentId: { equals: student.id as number },
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (existing) {
      return HttpResponse.json(
        {
          message: 'An active meeting request already stands for this student.',
          key: 'meeting.request_exists',
        },
        { status: 409 },
      );
    }
    const created = db.meetingRequest.create({
      studentId: student.id as number,
      advisorId: advisor.id as number,
      requesterId: advisor.id as number,
      direction: 'advisor_to_student',
      status: 'awaiting_response',
      reason: parseReason(body.reason),
      note: parseOptionalText(body.note),
      slots: JSON.stringify(slots),
      selectedSlotIndex: null,
      cancellationReason: null,
      term_code: CURRENT_TERM,
      completedAt: null,
    });
    notify(student.id as number, 'meeting_requested', created.id as number);
    return HttpResponse.json(
      { data: meetingResponse(created.id as number) },
      { status: 201 },
    );
  }),

  http.post(
    `${env.API_URL}/advisor/meeting-requests/:meetingId/confirm`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      const advisor = requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'requested' && row.status !== 'awaiting_response') {
        return HttpResponse.json(
          {
            message: 'Only an open request can be confirmed.',
            key: 'meeting.not_confirmable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as {
        slot_id?: unknown;
        starts_at?: unknown;
        ends_at?: unknown;
      };
      const slots = JSON.parse(row.slots) as StoredSlot[];
      const slotId = Number(body.slot_id);
      let selected = slots.findIndex(
        (_slot, index) => row.id * 100 + index === slotId,
      );
      if (
        selected === -1 &&
        typeof body.starts_at === 'string' &&
        typeof body.ends_at === 'string'
      ) {
        const known = openSlotsFor(advisor.id as number).find(
          (slot) =>
            slot.starts_at === body.starts_at && slot.ends_at === body.ends_at,
        );
        if (known) {
          slots.push({ starts_at: known.starts_at, ends_at: known.ends_at });
          selected = slots.length - 1;
        }
      }
      if (selected === -1) {
        return HttpResponse.json(
          {
            message: 'That time is not part of this request.',
            key: 'meeting.slot_unknown',
          },
          { status: 422 },
        );
      }
      const chosen = slots[selected];
      const conflict = bookedSlotsOf(advisor.id as number).some((slot) =>
        slotsOverlap(chosen, slot),
      );
      if (conflict) {
        return HttpResponse.json(
          {
            message: 'That time collides with another confirmed meeting.',
            key: 'meeting.slot_conflict',
          },
          { status: 409 },
        );
      }
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'confirmed',
          slots: JSON.stringify(slots),
          selectedSlotIndex: selected,
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.studentId as number, 'meeting_confirmed', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/meeting-requests/:meetingId/propose`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'requested') {
        return HttpResponse.json(
          {
            message: 'Only an open request accepts proposed times.',
            key: 'meeting.not_proposable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { slots?: unknown };
      const slots = normalizeSlotInputs(body.slots);
      if (slots.length === 0) {
        return HttpResponse.json(
          {
            message: 'Propose at least one time.',
            key: 'meeting.slots_required',
          },
          { status: 422 },
        );
      }
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'awaiting_response',
          slots: JSON.stringify(slots),
          selectedSlotIndex: null,
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.studentId as number, 'meeting_proposed', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/meeting-requests/:meetingId/decline`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'requested' && row.status !== 'awaiting_response') {
        return HttpResponse.json(
          {
            message: 'Only an open request can be declined.',
            key: 'meeting.not_declinable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { reason?: unknown };
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'declined',
          cancellationReason: parseOptionalText(body.reason),
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.studentId as number, 'meeting_declined', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/meeting-requests/:meetingId/cancel`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (
        row.status !== 'requested' &&
        row.status !== 'awaiting_response' &&
        row.status !== 'confirmed'
      ) {
        return HttpResponse.json(
          {
            message: 'Only an open or confirmed meeting can be cancelled.',
            key: 'meeting.not_cancellable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { reason?: unknown };
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'cancelled',
          cancellationReason: parseOptionalText(body.reason),
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.studentId as number, 'meeting_cancelled', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/meeting-requests/:meetingId/done`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'confirmed') {
        return HttpResponse.json(
          {
            message: 'Only a confirmed meeting can be marked completed.',
            key: 'meeting.not_completable',
          },
          { status: 409 },
        );
      }
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.studentId as number, 'meeting_completed', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.get(`${env.API_URL}/my/meeting-requests`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const student = requireAuth(request);
    const requests: MeetingRequest[] = db.meetingRequest
      .findMany({
        where: { studentId: { equals: student.id as number } },
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((row) => meetingOf(row as never));
    return HttpResponse.json({ data: requests });
  }),

  http.post(`${env.API_URL}/my/meeting-requests`, async ({ request }) => {
    await networkDelay();
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const student = requireAuth(request);
    const advisorId = student.advisor_id as number | null;
    if (!advisorId) {
      return HttpResponse.json(
        {
          message:
            'You have no assigned advisor yet. The administration office assigns advisors.',
          key: 'meeting.no_advisor',
        },
        { status: 409 },
      );
    }
    const body = (await request.json()) as {
      reason?: unknown;
      note?: unknown;
      preferred_slots?: unknown;
    };
    const existing = db.meetingRequest.findFirst({
      where: {
        studentId: { equals: student.id as number },
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (existing) {
      return HttpResponse.json(
        {
          message: 'You already have an open meeting request.',
          key: 'meeting.request_exists',
        },
        { status: 409 },
      );
    }
    const created = db.meetingRequest.create({
      studentId: student.id as number,
      advisorId,
      requesterId: student.id as number,
      direction: 'student_to_advisor',
      status: 'requested',
      reason: parseReason(body.reason),
      note: parseOptionalText(body.note),
      slots: JSON.stringify(normalizeSlotInputs(body.preferred_slots)),
      selectedSlotIndex: null,
      cancellationReason: null,
      term_code: CURRENT_TERM,
      completedAt: null,
    });
    notify(advisorId, 'meeting_requested', created.id as number);
    return HttpResponse.json(
      { data: meetingResponse(created.id as number) },
      { status: 201 },
    );
  }),

  http.post(
    `${env.API_URL}/my/meeting-requests/:meetingId/accept`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      const student = requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row || row.studentId !== student.id) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'awaiting_response') {
        return HttpResponse.json(
          {
            message: 'Only a proposed meeting can be accepted.',
            key: 'meeting.not_acceptable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { slot_id?: unknown };
      const slots = JSON.parse(row.slots) as StoredSlot[];
      const selected = slots.findIndex(
        (_slot, index) => row.id * 100 + index === Number(body.slot_id),
      );
      if (selected === -1) {
        return HttpResponse.json(
          {
            message: 'That time is not part of this proposal.',
            key: 'meeting.slot_unknown',
          },
          { status: 422 },
        );
      }
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'confirmed',
          selectedSlotIndex: selected,
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.advisorId as number, 'meeting_confirmed', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/my/meeting-requests/:meetingId/decline`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      const student = requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row || row.studentId !== student.id) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'awaiting_response') {
        return HttpResponse.json(
          {
            message: 'Only a proposed meeting can be declined.',
            key: 'meeting.not_declinable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { reason?: unknown };
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'declined',
          cancellationReason: parseOptionalText(body.reason),
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.advisorId as number, 'meeting_declined', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),

  http.post(
    `${env.API_URL}/my/meeting-requests/:meetingId/cancel`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      const student = requireAuth(request);
      const row = db.meetingRequest.findFirst({
        where: { id: { equals: Number(params.meetingId) } },
      });
      if (!row || row.studentId !== student.id) {
        return HttpResponse.json(
          { message: 'Meeting request not found.' },
          { status: 404 },
        );
      }
      if (
        row.status !== 'requested' &&
        row.status !== 'awaiting_response' &&
        row.status !== 'confirmed'
      ) {
        return HttpResponse.json(
          {
            message: 'Only an open or confirmed meeting can be cancelled.',
            key: 'meeting.not_cancellable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { reason?: unknown };
      db.meetingRequest.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'cancelled',
          cancellationReason: parseOptionalText(body.reason),
          updatedAt: new Date().toISOString(),
        },
      });
      notify(row.advisorId as number, 'meeting_cancelled', row.id as number);
      return HttpResponse.json({ data: meetingResponse(row.id as number) });
    },
  ),
];
