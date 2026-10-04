import dayjs from 'dayjs';

import type {
  GovernanceFunnel,
  GovernanceLevel,
  GovernanceNode,
} from '@/types/domain';

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
  db.notification.deleteMany({ where: {} });
  db.planConversation.deleteMany({ where: {} });
  db.governanceTree.deleteMany({ where: {} });
  db.governanceAdvisor.deleteMany({ where: {} });
  db.adminSettings.deleteMany({ where: {} });
  db.rule.deleteMany({ where: {} });
  db.advisorProfile.deleteMany({ where: {} });
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
  db.adminSettings.create({ id: 'admin', aging_threshold_days: 3 });
  db.advisorProfile.create({
    advisorId: 2,
    rows: JSON.stringify(officeHours),
    office_location: 'Building 3, Room 2140',
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

const seedNotifications = () => {
  const notification = (
    userId: number,
    values: {
      slug: string;
      title: string;
      body: string;
      deep_link: Record<string, unknown>;
      read_at?: string;
      hoursAgo: number;
    },
  ) =>
    db.notification.create({
      id: `seeded-${values.slug}-${userId}`,
      userId,
      slug: values.slug,
      title: values.title,
      body: values.body,
      deep_link: JSON.stringify(values.deep_link),
      read_at: values.read_at,
      created_at: dayjs().subtract(values.hoursAgo, 'hour').toISOString(),
    });

  notification(1, {
    slug: 'plan_returned',
    title: 'Plan returned',
    body: 'Amr Advisor returned your plan with feedback. Review it to unlock editing.',
    deep_link: { screen: 'plan', plan_id: 11 },
    hoursAgo: 2,
  });
  notification(1, {
    slug: 'window_opened',
    title: 'Registration window opened',
    body: `Registration for ${CURRENT_TERM} is open. Submit or review your plan.`,
    deep_link: { screen: 'plan', term_code: CURRENT_TERM },
    hoursAgo: 6,
  });
  notification(1, {
    slug: 'advisor_changed',
    title: 'Advisor changed',
    body: 'Amr Advisor is now your academic advisor.',
    deep_link: { screen: 'advisor', advisor_id: 2 },
    read_at: '2026-09-28T10:00:00.000Z',
    hoursAgo: 26,
  });
  notification(1, {
    slug: 'visit_slots_provided',
    title: 'Visit times proposed',
    body: 'Amr Advisor proposed times for your visit request.',
    deep_link: { screen: 'visit', visit_request_id: 100 },
    read_at: '2026-09-28T10:00:00.000Z',
    hoursAgo: 30,
  });
  notification(1, {
    slug: 'plan_approved',
    title: 'Plan approved',
    body: `Your plan for ${CURRENT_TERM} is approved. Follow the checklist to register in SIS.`,
    deep_link: { screen: 'plan', plan_id: 11 },
    read_at: '2026-09-28T10:00:00.000Z',
    hoursAgo: 48,
  });
  notification(1, {
    slug: 'window_deadline_nearing',
    title: 'Registration window closing soon',
    body: `Registration for ${CURRENT_TERM} closes in 3 days and your plan is not approved yet.`,
    deep_link: { screen: 'plan', term_code: CURRENT_TERM },
    read_at: '2026-09-28T10:00:00.000Z',
    hoursAgo: 60,
  });
  notification(2, {
    slug: 'visit_requested',
    title: 'Visit requested',
    body: 'Lina Majors requested a visit.',
    deep_link: { screen: 'visit', visit_request_id: 100, student_id: 11 },
    hoursAgo: 4,
  });
  notification(2, {
    slug: 'caseload_student_added',
    title: 'Caseload student added',
    body: 'Nour Adel joined your caseload.',
    deep_link: { screen: 'student', student_id: 13 },
    hoursAgo: 12,
  });
  notification(2, {
    slug: 'caseload_student_removed',
    title: 'Caseload student removed',
    body: 'Omar Fathi left your caseload.',
    deep_link: { screen: 'student', student_id: 12 },
    read_at: '2026-09-28T10:00:00.000Z',
    hoursAgo: 72,
  });
};

const seedConversations = () => {
  db.planConversation.create({
    id: 1,
    userId: 1,
    goal: 'maintain',
    title: 'Keeping my schedule steady',
    messages: JSON.stringify([
      {
        id: 1,
        role: 'user',
        content:
          'I want to keep my current level steady this term. What load works for me?',
        created_at: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 2,
        role: 'assistant',
        content:
          'Your record shows a steady pass across CS 101 and MATH 101. A load of 12 to 15 credits keeps you comfortably inside the REG-001 range while you repeat nothing. What did you have in mind for electives?',
        created_at: '2026-10-01T10:00:05.000Z',
      },
    ]),
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T14:30:00.000Z',
  });
};

const seedGovernance = () => {
  const metricsOf = (
    students: number,
    caseload: number,
    approved: number,
    completionRate: number | null,
    medianHours: number | null,
    aging: number,
    funnel: GovernanceFunnel,
  ) => ({
    students,
    caseload,
    approved,
    completion_rate: completionRate,
    completion_is_final: false,
    median_decision_hours: medianHours,
    aging_count: aging,
    funnel,
  });

  const spread = (total: number, parts: number): number[] => {
    const base = Math.floor(total / parts);
    return Array.from({ length: parts }, (_, index) =>
      index === parts - 1 ? total - base * (parts - 1) : base,
    );
  };

  const funnelOf = (approved: number, submitted: number): GovernanceFunnel => ({
    draft: Math.max(0, Math.round(submitted * 0.4)),
    submitted,
    under_review: Math.max(1, Math.round(submitted * 0.3)),
    returned: Math.max(1, Math.round(submitted * 0.5)),
    approved,
    expired: Math.max(0, Math.round(submitted * 0.2)),
    closed: approved,
    withdrawn: Math.max(0, Math.round(submitted * 0.1)),
    discarded: Math.max(0, Math.round(submitted * 0.15)),
  });

  const nodeOf = (
    level: GovernanceLevel,
    code: string | null,
    nameEn: string | null,
    metrics: ReturnType<typeof metricsOf>,
    children: GovernanceNode[] = [],
  ): GovernanceNode => ({
    level,
    code,
    name_en: nameEn,
    name_ar: null,
    term_code: CURRENT_TERM,
    metrics,
    children,
  });

  const facultyNode = (
    code: string,
    nameEn: string,
    students: number,
    caseload: number,
    approved: number,
    medianHours: number | null,
  ): GovernanceNode => {
    const completionRate =
      caseload === 0 ? null : Math.round((approved / caseload) * 100);
    const schools = ['Applied', 'Core'];
    const schoolCaseloads = spread(caseload, schools.length);
    const schoolApprovals = spread(approved, schools.length);
    return nodeOf(
      'faculty',
      code,
      nameEn,
      metricsOf(
        students,
        caseload,
        approved,
        completionRate,
        medianHours,
        Math.max(1, Math.round(caseload * 0.03)),
        funnelOf(approved, Math.round(caseload * 0.4)),
      ),
      schools.map((school, schoolIndex) => {
        const departments = ['A', 'B'];
        const departmentCaseloads = spread(
          schoolCaseloads[schoolIndex],
          departments.length,
        );
        const departmentApprovals = spread(
          schoolApprovals[schoolIndex],
          departments.length,
        );
        return nodeOf(
          'school',
          `${code}-S${schoolIndex + 1}`,
          `${nameEn} ${school} School`,
          metricsOf(
            Math.round(students / schools.length),
            schoolCaseloads[schoolIndex],
            schoolApprovals[schoolIndex],
            schoolCaseloads[schoolIndex] === 0
              ? null
              : Math.round(
                  (schoolApprovals[schoolIndex] /
                    schoolCaseloads[schoolIndex]) *
                    100,
                ),
            medianHours,
            Math.max(0, Math.round(schoolCaseloads[schoolIndex] * 0.03)),
            funnelOf(
              schoolApprovals[schoolIndex],
              Math.round(schoolCaseloads[schoolIndex] * 0.4),
            ),
          ),
          departments.map((department, departmentIndex) =>
            nodeOf(
              'department',
              `${code}-S${schoolIndex + 1}-D${departmentIndex + 1}`,
              `${nameEn} ${school} ${department}`,
              metricsOf(
                Math.round(students / schools.length / departments.length),
                departmentCaseloads[departmentIndex],
                departmentApprovals[departmentIndex],
                departmentCaseloads[departmentIndex] === 0
                  ? null
                  : Math.round(
                      (departmentApprovals[departmentIndex] /
                        departmentCaseloads[departmentIndex]) *
                        100,
                    ),
                medianHours,
                Math.max(
                  0,
                  Math.round(departmentCaseloads[departmentIndex] * 0.03),
                ),
                funnelOf(
                  departmentApprovals[departmentIndex],
                  Math.round(departmentCaseloads[departmentIndex] * 0.4),
                ),
              ),
            ),
          ),
        );
      }),
    );
  };

  const university = nodeOf(
    'university',
    null,
    'E-JUST',
    metricsOf(7600, 3100, 1780, 57, 30, 96, funnelOf(1780, 1240)),
    [
      facultyNode('F-ENG', 'Engineering', 2400, 980, 610, 26),
      facultyNode('F-SCI', 'Science', 1500, 610, 400, 34),
      facultyNode('F-AGR', 'Agriculture', 900, 380, 210, 41),
      facultyNode('F-MED', 'Medicine', 1300, 560, 290, 52),
      facultyNode('F-BUS', 'Business', 800, 300, 150, 22),
      facultyNode('F-ART', 'Arts', 400, 160, 70, 38),
      facultyNode('F-EDU', 'Education', 300, 110, 50, null),
    ],
  );

  db.governanceTree.create({
    id: 'university',
    payload: JSON.stringify(university),
  });

  const advisorsOf = (faculty: GovernanceNode) => {
    const caseloads = spread(faculty.metrics.caseload, 3);
    const approvals = spread(faculty.metrics.approved, 3);
    return ['Mona Said', 'Karim Adel', 'Hana Mostafa'].map((name, index) => {
      const caseload = caseloads[index];
      const approved = approvals[index];
      return nodeOf(
        'advisor',
        `${faculty.code}-AD${index + 1}`,
        name,
        metricsOf(
          Math.round(faculty.metrics.students / 3),
          caseload,
          approved,
          caseload === 0 ? null : Math.round((approved / caseload) * 100),
          faculty.metrics.median_decision_hours,
          Math.max(0, Math.round(caseload * 0.03)),
          funnelOf(approved, Math.round(caseload * 0.4)),
        ),
      );
    });
  };

  for (const advisor of advisorsOf(university.children[0])) {
    db.governanceAdvisor.create({ payload: JSON.stringify(advisor) });
  }
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
    seedNotifications();
    seedConversations();
    seedGovernance();
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
    db.user.create({
      id: 21,
      name: 'Rana Sameh',
      email: 'rana.sameh@ejust.edu.eg',
      password: hash(PASSWORD),
      role: 'student',
      language_preference: 'en',
      student_id: '3020721',
      advisor_id: 2,
      email_verified_at: '2026-09-01T09:00:00.000Z',
      faculty: 'Engineering',
    });
    db.user.create({
      id: 22,
      name: 'Karim Adel',
      email: 'karim.adel@ejust.edu.eg',
      password: hash(PASSWORD),
      role: 'student',
      language_preference: 'en',
      student_id: '3020722',
      email_verified_at: '2026-09-01T09:00:00.000Z',
      faculty: 'Science',
    });
  },

  'binding-incomplete': () => {
    seedUsers();
    db.user.update({
      where: { id: { equals: 1 } },
      data: {
        student_id: null as unknown as string,
        pending_admin_at: '2026-09-15T10:00:00.000Z',
      },
    });
    db.user.create({
      id: 31,
      name: 'Hana Held',
      email: 'hana.held@ejust.edu.eg',
      password: hash(PASSWORD),
      role: 'student',
      language_preference: 'en',
      advisor_id: 2,
      pending_admin_at: '2026-09-16T10:00:00.000Z',
      email_verified_at: '2026-09-01T09:00:00.000Z',
      faculty: 'Engineering',
    });
    db.user.create({
      id: 32,
      name: 'Faris Pending',
      email: 'faris.pending@ejust.edu.eg',
      password: hash(PASSWORD),
      role: 'student',
      language_preference: 'en',
      email_verified_at: '2026-09-01T09:00:00.000Z',
      faculty: 'Science',
    });
    seedAcademicRecord();
  },
};
