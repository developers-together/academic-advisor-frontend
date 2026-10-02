import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type {
  AdvisorCaseloadStudent,
  AdvisorQueueItem,
  AvailabilityWindowRow,
  Plan,
  PlanComment,
  PlanStatus,
  PlannedCourse,
  PrerequisiteMapEntry,
  VisitRequest,
  VisitRequestSlot,
} from '@/types/domain';

import { db } from '../db';
import { CURRENT_TERM, requireAuth } from '../mock-auth';
import {
  DEFAULT_OFFICE_HOURS,
  deniesPermission,
  injectsErrors,
} from '../scenarios';
import { networkDelay } from '../utils';

const MOCK_AGING_THRESHOLD_DAYS = 3;

type SlotInput = { starts_at: string; ends_at: string };

const normalizeSlotInputs = (value: unknown): SlotInput[] =>
  Array.isArray(value)
    ? value
        .filter(
          (slot): slot is SlotInput =>
            typeof slot === 'object' &&
            slot !== null &&
            typeof (slot as SlotInput).starts_at === 'string' &&
            typeof (slot as SlotInput).ends_at === 'string',
        )
        .slice(0, 10)
    : [];

const parseVisitSlots = (slots: string) =>
  JSON.parse(slots) as Array<Omit<VisitRequestSlot, 'id'>>;

const visitRequestOf = (row: {
  id: unknown;
  status: string;
  term_code: string;
  initiatorId: unknown;
  studentId: unknown;
  slots: string;
  createdAt: string;
  studentName?: string;
  studentStudentId?: string | null;
}): VisitRequest => ({
  id: row.id as number,
  status: row.status as VisitRequest['status'],
  term_code: row.term_code,
  initiator_id: row.initiatorId as number,
  slots: parseVisitSlots(row.slots).map((slot, index) => ({
    id: (row.id as number) * 100 + index,
    ...slot,
  })),
  created_at: row.createdAt,
  ...(row.studentName
    ? {
        student: {
          id: row.studentId as number,
          name: row.studentName,
          student_id: row.studentStudentId ?? null,
        },
      }
    : {}),
});

const visitRequestResponse = (rowId: number) => {
  const row = db.visitRequest.findFirst({
    where: { id: { equals: rowId } },
  });
  const student = row
    ? db.user.findFirst({ where: { id: { equals: row.studentId as number } } })
    : null;
  return visitRequestOf({
    id: row?.id,
    status: row?.status ?? 'proposed',
    term_code: row?.term_code ?? CURRENT_TERM,
    initiatorId: row?.initiatorId,
    studentId: row?.studentId,
    slots: row?.slots ?? '[]',
    createdAt: row?.createdAt ?? new Date().toISOString(),
    studentName: student?.name,
    studentStudentId: student?.student_id,
  });
};

const waitingDays = (submittedAt: string | null) =>
  submittedAt ? dayjs().diff(dayjs(submittedAt), 'day') : 0;

const isAging = (submittedAt: string | null) =>
  submittedAt !== null && waitingDays(submittedAt) >= MOCK_AGING_THRESHOLD_DAYS;

const parsePlan = (row: {
  id: unknown;
  status: string;
  term_code: string;
  summary: string | null;
  courses: string;
  warnings: string;
  total_credit_hours: number;
  submitted_at: string | null;
  decided_at: string | null;
  return_reason: string | null;
}): Plan => ({
  id: row.id as number,
  status: row.status as Plan['status'],
  term_code: row.term_code,
  summary: row.summary,
  courses: JSON.parse(row.courses) as PlannedCourse[],
  total_credit_hours: row.total_credit_hours,
  warnings: JSON.parse(row.warnings) as string[],
  submitted_at: row.submitted_at,
  decided_at: row.decided_at,
  return_reason: row.return_reason,
});

const planRowOf = (userId: number) =>
  db.plan.findFirst({ where: { userId: { equals: userId as number } } });

const planById = (rawId: string | readonly string[]) =>
  db.plan.findFirst({ where: { id: { equals: Number(rawId) } } });

const userSummaryOf = (userId: number) => {
  const user = db.user.findFirst({ where: { id: { equals: userId } } });
  return user ? { id: user.id as number, name: user.name } : null;
};

const approveGateErrors = (row: NonNullable<ReturnType<typeof planRowOf>>) => {
  const courses = JSON.parse(row.courses) as PlannedCourse[];
  const record = db.academicRecord.findFirst({
    where: { userId: { equals: row.userId as number } },
  });
  const map: PrerequisiteMapEntry[] = record
    ? JSON.parse(record.prerequisite_map)
    : [];
  const errors: Record<string, string[]> = {};
  for (const course of courses) {
    const entry = map.find(
      (candidate) => candidate.course_code === course.course_code,
    );
    if (!entry) {
      errors[`map_membership.${course.course_code}`] = [
        `${course.course_code} is not in the student's course map.`,
      ];
    } else if (entry.state === 'locked') {
      errors[`prerequisite_chain.${course.course_code}`] = [
        `${course.course_code} requires ${entry.prerequisites.join(', ')} first.`,
      ];
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

export const advisorHandlers = [
  http.get(`${env.API_URL}/my/advisor`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    const user = requireAuth(request);
    const advisorId = user.advisor_id;
    const advisor = advisorId
      ? db.user.findFirst({ where: { id: { equals: advisorId as number } } })
      : null;
    if (!advisor) {
      return HttpResponse.json(
        { message: 'No advisor is assigned to you yet.' },
        { status: 404 },
      );
    }
    const profile = db.advisorProfile.findFirst({
      where: { advisorId: { equals: advisor.id as number } },
    });
    return HttpResponse.json({
      data: {
        advisor: { id: advisor.id, name: advisor.name },
        availability_window: {
          rows: profile ? JSON.parse(profile.rows) : [],
        },
      },
    });
  }),

  http.get(`${env.API_URL}/advisor/queue`, async ({ request }) => {
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
    const students = db.user.findMany({
      where: { advisor_id: { equals: advisor.id as number } },
    });
    const items: AdvisorQueueItem[] = [];
    for (const student of students) {
      const row = planRowOf(student.id as number);
      if (
        !row ||
        (row.status !== 'submitted' && row.status !== 'under_review')
      ) {
        continue;
      }
      items.push({
        id: row.id as number,
        student: {
          id: student.id as number,
          name: student.name,
          student_id: student.student_id,
        },
        status: row.status as PlanStatus,
        term_code: row.term_code,
        submitted_at: row.submitted_at,
        is_aging: isAging(row.submitted_at),
      });
    }
    items.sort((a, b) => {
      const aTime = a.submitted_at ? dayjs(a.submitted_at).valueOf() : 0;
      const bTime = b.submitted_at ? dayjs(b.submitted_at).valueOf() : 0;
      return aTime - bTime;
    });
    return HttpResponse.json({ data: items });
  }),

  http.get(`${env.API_URL}/advisor/students`, async ({ request }) => {
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
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const students = db.user.findMany({
      where: { advisor_id: { equals: advisor.id as number } },
    });
    const caseload: AdvisorCaseloadStudent[] = students
      .map((student) => {
        const row = planRowOf(student.id as number);
        const record = db.academicRecord.findFirst({
          where: { userId: { equals: student.id as number } },
        });
        const openRequest = db.visitRequest.findFirst({
          where: {
            studentId: { equals: student.id as number },
            status: { equals: 'proposed' },
          },
        });
        return {
          id: student.id as number,
          name: student.name,
          student_id: student.student_id,
          sis_email: student.email,
          faculty: student.faculty
            ? {
                code: student.faculty,
                name_en: student.faculty,
                name_ar: null,
              }
            : null,
          school: null,
          department: null,
          curriculum_year_level: record ? record.curriculum_year_level : null,
          plan_id: row ? (row.id as number) : null,
          plan_state: row ? (row.status as PlanStatus) : null,
          submitted_at: row?.submitted_at ?? null,
          is_aging: isAging(row?.submitted_at ?? null),
          has_unmet_meeting: openRequest !== null,
          cgpa: record ? record.cgpa : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const searched = search
      ? caseload.filter(
          (student) =>
            student.name.toLowerCase().includes(search) ||
            (student.student_id ?? '').toLowerCase().includes(search),
        )
      : caseload;
    return HttpResponse.json({ data: searched });
  }),

  http.get(
    `${env.API_URL}/advisor/plans/:planId`,
    async ({ request, params }) => {
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
      requireAuth(request);
      let row = planById(String(params.planId));
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      if (row.status === 'submitted') {
        row = db.plan.update({
          where: { id: { equals: row.id as number } },
          data: { status: 'under_review' },
        });
      }
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: parsePlan(row) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/plans/:planId/approve`,
    async ({ request, params }) => {
      await networkDelay();
      requireAuth(request);
      const row = planById(String(params.planId));
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      if (injectsErrors()) {
        return HttpResponse.json(
          {
            message: 'The student data service is unavailable.',
            key: 'plan.sis_unavailable',
          },
          { status: 503 },
        );
      }
      const errors = approveGateErrors(row);
      if (errors) {
        return HttpResponse.json(
          {
            message: 'The given data was invalid.',
            key: 'plan.validation',
            errors,
          },
          { status: 422 },
        );
      }
      const updated = db.plan.update({
        where: { id: { equals: row.id as number } },
        data: { status: 'approved', decided_at: new Date().toISOString() },
      });
      if (!updated) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: parsePlan(updated) });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/plans/:planId/return`,
    async ({ request, params }) => {
      await networkDelay();
      const advisor = requireAuth(request);
      const row = planById(String(params.planId));
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      const body = (await request.json()) as { reason?: unknown };
      const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      if (!reason) {
        return HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { reason: ['The return reason is required.'] },
          },
          { status: 422 },
        );
      }
      const updated = db.plan.update({
        where: { id: { equals: row.id as number } },
        data: {
          status: 'returned',
          return_reason: reason,
          decided_at: new Date().toISOString(),
        },
      });
      if (!updated) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      db.planComment.create({
        planId: row.id as number,
        authorId: advisor.id as number,
        body: reason,
      });
      return HttpResponse.json({ data: parsePlan(updated) });
    },
  ),

  http.get(
    `${env.API_URL}/advisor/plans/:planId/comments`,
    async ({ request, params }) => {
      await networkDelay();
      requireAuth(request);
      const row = planById(String(params.planId));
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      const comments: PlanComment[] = db.planComment
        .findMany({ where: { planId: { equals: row.id as number } } })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .flatMap((comment) => {
          const author = userSummaryOf(comment.authorId as number);
          if (!author) return [];
          return [
            {
              id: comment.id as number,
              body: comment.body,
              author,
              created_at: comment.createdAt,
            },
          ];
        });
      return HttpResponse.json({ data: comments });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/plans/:planId/comments`,
    async ({ request, params }) => {
      await networkDelay();
      const author = requireAuth(request);
      const row = planById(String(params.planId));
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      const body = (await request.json()) as { body?: unknown };
      const text = typeof body.body === 'string' ? body.body.trim() : '';
      if (!text) {
        return HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { body: ['The comment is required.'] },
          },
          { status: 422 },
        );
      }
      const created = db.planComment.create({
        planId: row.id as number,
        authorId: author.id as number,
        body: text,
      });
      return HttpResponse.json(
        {
          data: {
            id: created.id as number,
            body: created.body,
            author: { id: author.id as number, name: author.name },
            created_at: created.createdAt,
          },
        },
        { status: 201 },
      );
    },
  ),

  http.get(`${env.API_URL}/advisor/visit-requests`, async ({ request }) => {
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
    const studentIds = db.user
      .findMany({
        where: { advisor_id: { equals: advisor.id as number } },
      })
      .map((student) => student.id as number);
    const requests: VisitRequest[] = db.visitRequest
      .findMany({ where: { studentId: { in: studentIds } } })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => visitRequestResponse(row.id as number));
    return HttpResponse.json({ data: requests });
  }),

  http.post(`${env.API_URL}/advisor/visit-requests`, async ({ request }) => {
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
      slots?: unknown;
    };
    const student = db.user.findFirst({
      where: { id: { equals: Number(body.student_id) } },
    });
    if (!student) {
      return HttpResponse.json(
        { message: 'No student found.' },
        { status: 404 },
      );
    }
    const existing = db.visitRequest.findFirst({
      where: {
        studentId: { equals: student.id as number },
        status: { equals: 'proposed' },
      },
    });
    if (existing) {
      return HttpResponse.json(
        {
          message: 'A proposed visit request already stands for this term.',
          key: 'visit.request_exists',
        },
        { status: 409 },
      );
    }
    const created = db.visitRequest.create({
      studentId: student.id as number,
      initiatorId: advisor.id as number,
      status: 'proposed',
      term_code: CURRENT_TERM,
      slots: JSON.stringify(normalizeSlotInputs(body.slots)),
    });
    return HttpResponse.json(
      { data: visitRequestResponse(created.id as number) },
      { status: 201 },
    );
  }),

  http.post(
    `${env.API_URL}/advisor/visit-requests/:visitRequestId/slots`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.visitRequest.findFirst({
        where: { id: { equals: Number(params.visitRequestId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Visit request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'proposed') {
        return HttpResponse.json(
          {
            message: 'Only a proposed visit request accepts proposed times.',
            key: 'visit.not_slotable',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { slots?: unknown };
      db.visitRequest.update({
        where: { id: { equals: row.id as number } },
        data: { slots: JSON.stringify(normalizeSlotInputs(body.slots)) },
      });
      return HttpResponse.json({
        data: visitRequestResponse(row.id as number),
      });
    },
  ),

  http.post(
    `${env.API_URL}/advisor/visit-requests/:visitRequestId/done`,
    async ({ request, params }) => {
      await networkDelay();
      if (deniesPermission()) {
        return HttpResponse.json(
          { message: 'This action is unauthorized.' },
          { status: 403 },
        );
      }
      requireAuth(request);
      const row = db.visitRequest.findFirst({
        where: { id: { equals: Number(params.visitRequestId) } },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'Visit request not found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'proposed') {
        return HttpResponse.json(
          {
            message: 'Only a proposed visit request can be marked done.',
            key: 'visit.not_completable',
          },
          { status: 409 },
        );
      }
      db.visitRequest.update({
        where: { id: { equals: row.id as number } },
        data: { status: 'done' },
      });
      return HttpResponse.json({
        data: visitRequestResponse(row.id as number),
      });
    },
  ),

  http.get(`${env.API_URL}/advisor/availability`, async ({ request }) => {
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
    const profile = db.advisorProfile.findFirst({
      where: { advisorId: { equals: advisor.id as number } },
    });
    return HttpResponse.json({ data: availabilityOf(profile) });
  }),

  http.put(`${env.API_URL}/advisor/availability`, async ({ request }) => {
    await networkDelay();
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const advisor = requireAuth(request);
    const body = (await request.json()) as { rows?: unknown };
    const rows = normalizeSlotDayRows(body.rows);
    const profile = db.advisorProfile.findFirst({
      where: { advisorId: { equals: advisor.id as number } },
    });
    const stored = rows.length > 0 ? rows : [];
    if (profile) {
      db.advisorProfile.update({
        where: { advisorId: { equals: advisor.id as number } },
        data: { rows: JSON.stringify(stored) },
      });
    } else {
      db.advisorProfile.create({
        advisorId: advisor.id as number,
        rows: JSON.stringify(stored),
      });
    }
    return HttpResponse.json({
      data:
        stored.length > 0
          ? { rows: stored, is_default: false }
          : { rows: DEFAULT_OFFICE_HOURS, is_default: true },
    });
  }),
];

const availabilityOf = (profile: { rows: string } | null) => {
  if (!profile) {
    return { rows: DEFAULT_OFFICE_HOURS, is_default: true };
  }
  const rows = JSON.parse(profile.rows) as AvailabilityWindowRow[];
  return rows.length > 0
    ? { rows, is_default: false }
    : { rows: DEFAULT_OFFICE_HOURS, is_default: true };
};

const normalizeSlotDayRows = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter(
          (row): row is { day: string; from: string; to: string } =>
            typeof row === 'object' &&
            row !== null &&
            typeof (row as { day?: unknown }).day === 'string' &&
            typeof (row as { from?: unknown }).from === 'string' &&
            typeof (row as { to?: unknown }).to === 'string',
        )
        .map(({ day, from, to }) => ({ day, from, to }))
    : [];
