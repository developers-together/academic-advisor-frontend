import dayjs from 'dayjs';

import { db } from './db';
import { CURRENT_TERM, FRESH_STALENESS, STALE_STALENESS } from './mock-auth';
import { hash } from './utils';

export const scenarios = [
  'happy',
  'empty',
  'error',
  'permission-denied',
  'stale-sis',
  'registration-closed',
  'quota-exhausted',
  'import-errors',
  'binding-incomplete',
] as const;

export type Scenario = (typeof scenarios)[number];

export const DEFAULT_SCENARIO: Scenario = 'happy';

let current: Scenario = DEFAULT_SCENARIO;

export const getScenario = (): Scenario => current;

export const setScenario = (scenario: Scenario) => {
  current = scenario;
  db.user.deleteMany({ where: {} });
  db.plan.deleteMany({ where: {} });
  db.academicRecord.deleteMany({ where: {} });
  db.planComment.deleteMany({ where: {} });
  db.visitRequest.deleteMany({ where: {} });
  seeds[scenario]();
};

export const injectsErrors = () => current === 'error';
export const deniesPermission = () => current === 'permission-denied';
export const registrationClosed = () => current === 'registration-closed';
export const quotaExhausted = () => current === 'quota-exhausted';

const PASSWORD = 'password123';

export const DEFAULT_OFFICE_HOURS = [
  { day: 'Sunday', from: '10:00', to: '12:00' },
  { day: 'Tuesday', from: '13:00', to: '15:00' },
];

const officeHours = DEFAULT_OFFICE_HOURS;

const seedUsers = () => {
  db.advisorProfile.create({
    advisorId: 2,
    rows: JSON.stringify(officeHours),
  });
  db.user.create({
    id: 1,
    name: 'Sara Student',
    email: 'student@ejust.edu.eg',
    password: hash(PASSWORD),
    role: 'student',
    language_preference: 'en',
    student_id: '3020117',
    advisor_id: 2,
    email_verified_at: '2026-09-01T09:00:00.000Z',
    faculty: 'Engineering',
  });
  db.user.create({
    id: 2,
    name: 'Amr Advisor',
    email: 'advisor@ejust.edu.eg',
    password: hash(PASSWORD),
    role: 'advisor',
    language_preference: 'en',
    email_verified_at: '2026-09-01T09:00:00.000Z',
    faculty: 'Engineering',
  });
  db.user.create({
    id: 3,
    name: 'Dina Dean',
    email: 'dean@ejust.edu.eg',
    password: hash(PASSWORD),
    role: 'dean',
    language_preference: 'en',
    email_verified_at: '2026-09-01T09:00:00.000Z',
    faculty: 'Engineering',
  });
  db.user.create({
    id: 4,
    name: 'Vera VP',
    email: 'vp@ejust.edu.eg',
    password: hash(PASSWORD),
    role: 'vp',
    language_preference: 'en',
    email_verified_at: '2026-09-01T09:00:00.000Z',
  });
  db.user.create({
    id: 5,
    name: 'Mona Admin',
    email: 'admin@ejust.edu.eg',
    password: hash(PASSWORD),
    role: 'admin',
    language_preference: 'en',
    email_verified_at: '2026-09-01T09:00:00.000Z',
  });
};

const prerequisiteMap = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'MATH 101',
    title: 'Calculus I',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: ['CS 101'],
  },
  {
    course_code: 'MATH 201',
    title: 'Calculus II',
    state: 'eligible',
    prerequisites: ['MATH 101'],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'locked',
    prerequisites: ['CS 201'],
  },
];

const history = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    term_code: '2025F',
    grade: 'A',
  },
  {
    course_code: 'MATH 101',
    title: 'Calculus I',
    term_code: '2025F',
    grade: 'B+',
  },
];

const seedAcademicRecord = (staleness = FRESH_STALENESS) => {
  db.academicRecord.create({
    userId: 1,
    cgpa: 3.2,
    curriculum_year_level: 2,
    remaining_requirements: '60 credit hours',
    history: JSON.stringify(history),
    current_enrollments: JSON.stringify([
      {
        course_code: 'EE 210',
        title: 'Circuits',
        group: 'G1',
        section: '01',
      },
    ]),
    prerequisite_map: JSON.stringify(prerequisiteMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
    staleness: JSON.stringify(staleness),
  });
};

const queueCourseMap = [
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: [],
  },
  {
    course_code: 'MATH 201',
    title: 'Calculus II',
    state: 'eligible',
    prerequisites: [],
  },
];

const seedQueue = () => {
  const queueStudents = [
    { id: 11, name: 'Lina Majors', studentId: '3020451', cgpa: 2.8 },
    { id: 12, name: 'Omar Fathi', studentId: '3020452', cgpa: 3.6 },
    { id: 13, name: 'Nour Adel', studentId: '3020453', cgpa: null },
  ];
  for (const student of queueStudents) {
    db.user.create({
      id: student.id,
      name: student.name,
      email: `${student.name.split(' ')[0].toLowerCase()}@ejust.edu.eg`,
      password: hash(PASSWORD),
      role: 'student',
      language_preference: 'en',
      student_id: student.studentId,
      advisor_id: 2,
      email_verified_at: '2026-09-01T09:00:00.000Z',
      faculty: 'Engineering',
    });
    if (student.cgpa !== null) {
      db.academicRecord.create({
        userId: student.id,
        cgpa: student.cgpa,
        curriculum_year_level: 3,
        remaining_requirements: '40 credit hours',
        history: JSON.stringify([]),
        current_enrollments: JSON.stringify([]),
        prerequisite_map: JSON.stringify(queueCourseMap),
        last_synced_at: '2026-10-01T12:00:00.000Z',
        staleness: JSON.stringify(FRESH_STALENESS),
      });
    } else {
      db.academicRecord.create({
        userId: student.id,
        curriculum_year_level: 3,
        remaining_requirements: '40 credit hours',
        history: JSON.stringify([]),
        current_enrollments: JSON.stringify([]),
        prerequisite_map: JSON.stringify(queueCourseMap),
        last_synced_at: '2026-10-01T12:00:00.000Z',
        staleness: JSON.stringify(FRESH_STALENESS),
      });
    }
  }
  db.plan.create({
    userId: 11,
    status: 'submitted',
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
      { course_code: 'MATH 201', group: 'G2', section: '03', reason: null },
    ]),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
    submitted_at: dayjs().subtract(6, 'day').toISOString(),
  });
  db.plan.create({
    userId: 12,
    status: 'submitted',
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', group: 'G2', section: '02', reason: null },
    ]),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
    submitted_at: dayjs().subtract(1, 'day').toISOString(),
  });
  db.plan.create({
    userId: 13,
    status: 'under_review',
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', group: 'G1', section: '03', reason: null },
    ]),
    warnings: JSON.stringify([
      'CS 201 sits outside the usual plan for this level.',
    ]),
    total_credit_hours: 0,
    submitted_at: dayjs().subtract(2, 'day').toISOString(),
  });
  const nourPlan = db.plan.findFirst({
    where: { userId: { equals: 13 } },
  });
  db.planComment.create({
    planId: nourPlan?.id as number,
    authorId: 2,
    body: 'I picked up your plan for review.',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
  });
};

const seeds: Record<Scenario, () => void> = {
  happy: () => {
    seedUsers();
    db.plan.create({
      userId: 1,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([
        { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
        { course_code: 'MATH 201', group: 'G2', section: '03', reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord();
    seedQueue();
  },

  empty: () => {
    seedUsers();
    seedAcademicRecord();
  },

  error: () => {
    seedUsers();
    db.plan.create({
      userId: 1,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord();
  },

  'permission-denied': () => {
    seedUsers();
    seedAcademicRecord();
  },

  'stale-sis': () => {
    seedUsers();
    db.plan.create({
      userId: 1,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([
        { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord(STALE_STALENESS);
  },

  'registration-closed': () => {
    seedUsers();
    db.plan.create({
      userId: 1,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([
        { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord();
  },

  'quota-exhausted': () => {
    seedUsers();
    seedAcademicRecord();
  },

  'import-errors': () => {
    seedUsers();
    seedAcademicRecord();
  },

  'binding-incomplete': () => {
    seedUsers();
    db.user.update({
      where: { id: { equals: 1 } },
      data: {
        pending_admin_at: '2026-09-15T10:00:00.000Z',
      },
    });
    seedAcademicRecord();
  },
};
