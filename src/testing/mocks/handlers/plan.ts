import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type {
  Plan,
  PlanComment,
  PlannedCourse,
  PrerequisiteMapEntry,
} from '@/types/domain';

import { db } from '../db';
import { CURRENT_TERM, requireAuth } from '../mock-auth';
import {
  deniesPermission,
  injectsErrors,
  registrationClosed,
} from '../scenarios';
import { networkDelay } from '../utils';

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
}): Plan => {
  const courses = JSON.parse(row.courses) as PlannedCourse[];
  return {
    id: row.id as number,
    status: row.status as Plan['status'],
    term_code: row.term_code,
    summary: row.summary,
    courses,
    total_credit_hours: courses.reduce(
      (total, course) => total + course.credits,
      0,
    ),
    warnings: JSON.parse(row.warnings) as string[],
    submitted_at: row.submitted_at,
    decided_at: row.decided_at,
    return_reason: row.return_reason || null,
  };
};

const planOf = (userId: number) =>
  db.plan.findFirst({ where: { userId: { equals: userId as number } } });

const CATALOG_CREDITS: Record<string, number> = {
  'CS 101': 3,
  'CS 201': 3,
  'CS 301': 3,
  'MATH 201': 4,
};

const INACTIVE_COURSES = new Set(['EE 210', 'PHYS 101']);

const catalogCredits = (courseCode: string) => CATALOG_CREDITS[courseCode] ?? 3;

const catalogTitle = (userId: number, courseCode: string) => {
  const record = db.academicRecord.findFirst({
    where: { userId: { equals: userId as number } },
  });
  const map: PrerequisiteMapEntry[] = record
    ? JSON.parse(record.prerequisite_map)
    : [];
  return map.find((entry) => entry.course_code === courseCode)?.title ?? null;
};

const parseCourseCode = (raw: string) => decodeURIComponent(raw);

export const planHandlers = [
  http.get(`${env.API_URL}/plan`, async ({ request }) => {
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
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(row) });
  }),

  http.post(`${env.API_URL}/plan`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const existing = planOf(user.id as number);
    if (existing && existing.status !== 'discarded') {
      return HttpResponse.json(
        { message: 'An active plan already exists for this term.' },
        { status: 409 },
      );
    }
    if (!user.advisor_id) {
      return HttpResponse.json(
        { message: 'You have no assigned advisor yet.' },
        { status: 409 },
      );
    }
    if (existing) {
      db.plan.delete({ where: { id: { equals: existing.id as number } } });
    }
    const row = db.plan.create({
      userId: user.id as number,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    return HttpResponse.json({ data: parsePlan(row) }, { status: 201 });
  }),

  http.post(`${env.API_URL}/plan/discard`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    if (row.status !== 'draft' && row.status !== 'returned') {
      return HttpResponse.json(
        { message: 'Only a draft or returned plan can be discarded.' },
        { status: 422 },
      );
    }
    const updated = db.plan.update({
      where: { id: { equals: row.id as number } },
      data: { status: 'discarded' },
    });
    if (!updated) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(updated) });
  }),

  http.post(`${env.API_URL}/plan/courses`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    if (row.status !== 'draft') {
      return HttpResponse.json(
        { message: 'Only a draft plan can be edited.' },
        { status: 422 },
      );
    }
    const body = (await request.json()) as { course_code?: unknown };
    const courseCode =
      typeof body.course_code === 'string' ? body.course_code.trim() : '';
    if (!courseCode) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { course_code: ['The course code is required.'] },
        },
        { status: 422 },
      );
    }
    const courses = JSON.parse(row.courses) as PlannedCourse[];
    if (courses.some((course) => course.course_code === courseCode)) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { course_code: ['The course is already in the plan.'] },
        },
        { status: 422 },
      );
    }
    const updated = db.plan.update({
      where: { id: { equals: row.id as number } },
      data: {
        courses: JSON.stringify(
          courses.concat({
            course_code: courseCode,
            title: catalogTitle(user.id as number, courseCode),
            credits: catalogCredits(courseCode),
            reason: null,
          }),
        ),
      },
    });
    if (!updated) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(updated) });
  }),

  http.delete(
    `${env.API_URL}/plan/courses/:courseCode`,
    async ({ request, params }) => {
      await networkDelay();
      const user = requireAuth(request);
      const row = planOf(user.id as number);
      if (!row) {
        return HttpResponse.json(
          { message: 'No plan found.' },
          { status: 404 },
        );
      }
      if (row.status !== 'draft') {
        return HttpResponse.json(
          { message: 'Only a draft plan can be edited.' },
          { status: 422 },
        );
      }
      const courseCode = parseCourseCode(String(params.courseCode));
      const courses = JSON.parse(row.courses) as PlannedCourse[];
      const next = courses.filter(
        (course) => course.course_code !== courseCode,
      );
      if (next.length === courses.length) {
        return HttpResponse.json(
          { message: 'No plan course found.' },
          { status: 404 },
        );
      }
      const updated = db.plan.update({
        where: { id: { equals: row.id as number } },
        data: { courses: JSON.stringify(next) },
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

  http.get(`${env.API_URL}/plan/comments`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    const comments: PlanComment[] = db.planComment
      .findMany({ where: { planId: { equals: row.id as number } } })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .flatMap((comment) => {
        const author = db.user.findFirst({
          where: { id: { equals: comment.authorId as number } },
        });
        if (!author) return [];
        return [
          {
            id: comment.id as number,
            body: comment.body,
            author: { id: author.id as number, name: author.name },
            created_at: comment.createdAt,
          },
        ];
      });
    return HttpResponse.json({ data: comments });
  }),

  http.post(`${env.API_URL}/plan/seen`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    if (row.status !== 'returned') {
      return HttpResponse.json(
        { message: 'Only a returned plan can be marked seen.' },
        { status: 422 },
      );
    }
    const updated = db.plan.update({
      where: { id: { equals: row.id as number } },
      data: { status: 'draft', return_reason: '' },
    });
    if (!updated) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(updated) });
  }),

  http.post(`${env.API_URL}/plan/withdraw`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    if (row.status !== 'draft') {
      return HttpResponse.json(
        { message: 'Only a draft plan can be withdrawn.' },
        { status: 422 },
      );
    }
    const updated = db.plan.update({
      where: { id: { equals: row.id as number } },
      data: { status: 'withdrawn' },
    });
    if (!updated) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(updated) });
  }),

  http.post(`${env.API_URL}/plan/submit`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    if (row.status !== 'draft') {
      return HttpResponse.json(
        { message: 'Only a draft plan can be edited.' },
        { status: 422 },
      );
    }
    if (registrationClosed()) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          key: 'window',
          errors: {
            window: [
              'Registration is closed. Your approved plan waits for the next window.',
            ],
          },
        },
        { status: 422 },
      );
    }
    if (injectsErrors()) {
      return HttpResponse.json(
        {
          message: 'The registration service is unavailable.',
          key: 'plan.window_unavailable',
        },
        { status: 503 },
      );
    }
    const courses = JSON.parse(row.courses) as PlannedCourse[];
    const record = db.academicRecord.findFirst({
      where: { userId: { equals: user.id as number } },
    });
    const map: PrerequisiteMapEntry[] = record
      ? JSON.parse(record.prerequisite_map)
      : [];
    const errors: Record<string, string[]> = {};
    let totalCredits = 0;
    for (const course of courses) {
      totalCredits += course.credits ?? 0;
      if (INACTIVE_COURSES.has(course.course_code)) {
        errors[`active_course.${course.course_code}`] = [
          `${course.course_code} is not offered this term. Pick a course from the active list.`,
        ];
      }
      const entry = map.find(
        (candidate) => candidate.course_code === course.course_code,
      );
      if (!entry) {
        errors[`map_membership.${course.course_code}`] = [
          `${course.course_code} is not in your course map. Remove it or pick a mapped course.`,
        ];
      } else if (entry.state === 'locked') {
        errors[`prerequisite_chain.${course.course_code}`] = [
          `${course.course_code} requires ${entry.prerequisites.join(', ')} first. Complete the missing prerequisites or pick an eligible course.`,
        ];
      }
    }
    if (totalCredits > 18) {
      errors.allowance_outside = [
        'Your plan is outside the allowed credit range for this term.',
      ];
    }
    if (Object.keys(errors).length > 0) {
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
      data: {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
    });
    if (!updated) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(updated) });
  }),
];
