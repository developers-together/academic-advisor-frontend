import dayjs from 'dayjs';

import { dayjsInCairo } from '@/lib/i18n/cairo';
import type {
  GovernanceAdvisorRow,
  GovernanceDean,
  GovernanceFunnel,
  GovernanceLevel,
  GovernanceNode,
} from '@/types/domain';

import { governanceTrends } from '../governance-tree';

import { db } from './db';
import { CURRENT_TERM } from './mock-auth';
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
  db.meetingRequest.deleteMany({ where: {} });
  db.notification.deleteMany({ where: {} });
  db.planConversation.deleteMany({ where: {} });
  db.governanceTree.deleteMany({ where: {} });
  db.governanceAdvisor.deleteMany({ where: {} });
  db.adminSettings.deleteMany({ where: {} });
  db.rule.deleteMany({ where: {} });
  db.advisorProfile.deleteMany({ where: {} });
  db.course.deleteMany({ where: {} });
  db.program.deleteMany({ where: {} });
  db.registrationWindow.deleteMany({ where: {} });
  db.aiConfig.deleteMany({ where: {} });
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
    name: 'Introduction to Programming',
    credits: 3,
    year: 2025,
    semester: 'Fall',
    term_code: '2025F',
    level: 1,
    grade: 'A',
  },
  {
    course_code: 'MATH 101',
    name: 'Calculus I',
    credits: 4,
    year: 2025,
    semester: 'Fall',
    term_code: '2025F',
    level: 1,
    grade: 'B+',
  },
];

const seedAcademicRecord = (lastSyncedAt = '2026-10-01T12:00:00.000Z') => {
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
      },
    ]),
    prerequisite_map: JSON.stringify(prerequisiteMap),
    last_synced_at: lastSyncedAt,
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
      });
    }
  }
  db.plan.create({
    userId: 11,
    status: 'submitted',
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'MATH 201', title: null, credits: 4, reason: null },
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
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
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
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
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

const seedMeetings = () => {
  const nextWeekday = (weekday: number) => {
    let day = dayjsInCairo(new Date()).add(1, 'day');
    while (day.day() !== weekday) day = day.add(1, 'day');
    return day;
  };
  const slot = (day: dayjs.Dayjs, from: string, to: string) => ({
    starts_at: dayjs
      .tz(`${day.format('YYYY-MM-DD')} ${from}`, 'Africa/Cairo')
      .toISOString(),
    ends_at: dayjs
      .tz(`${day.format('YYYY-MM-DD')} ${to}`, 'Africa/Cairo')
      .toISOString(),
  });
  const sunday = nextWeekday(0);
  const tuesday = nextWeekday(2);

  db.meetingRequest.create({
    studentId: 1,
    advisorId: 2,
    requesterId: 1,
    direction: 'student_to_advisor',
    status: 'confirmed',
    reason: 'plan_review',
    note: 'I want to discuss my elective choices before submitting.',
    slots: JSON.stringify([
      slot(sunday, '10:00', '10:30'),
      slot(tuesday, '13:00', '13:30'),
    ]),
    selectedSlotIndex: 0,
    cancellationReason: null,
    term_code: CURRENT_TERM,
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: null,
  });
  db.meetingRequest.create({
    studentId: 11,
    advisorId: 2,
    requesterId: 11,
    direction: 'student_to_advisor',
    status: 'requested',
    reason: 'academic_standing',
    note: null,
    slots: JSON.stringify([]),
    selectedSlotIndex: null,
    cancellationReason: null,
    term_code: CURRENT_TERM,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: null,
  });
  db.meetingRequest.create({
    studentId: 12,
    advisorId: 2,
    requesterId: 2,
    direction: 'advisor_to_student',
    status: 'awaiting_response',
    reason: 'plan_review',
    note: 'Your plan needs a quick check before the window closes.',
    slots: JSON.stringify([
      slot(sunday, '10:30', '11:00'),
      slot(tuesday, '13:30', '14:00'),
    ]),
    selectedSlotIndex: null,
    cancellationReason: null,
    term_code: CURRENT_TERM,
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
    completedAt: null,
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
    slug: 'meeting_confirmed',
    title: 'Meeting confirmed',
    body: 'Amr Advisor confirmed your meeting. Check My Advisor for the time.',
    deep_link: { screen: 'visit', visit_request_id: 100 },
    hoursAgo: 26,
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
    slug: 'meeting_requested',
    title: 'Meeting requested',
    body: 'Lina Majors requested a meeting.',
    deep_link: { screen: 'visit', visit_request_id: 200, student_id: 11 },
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
          'Your record shows a steady pass across CS 101 and MATH 101. A load of 12 to 15 credits stays inside the standard credit-load range while you repeat nothing. What did you have in mind for electives?',
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

  const advisorRowsOf = (
    code: string | null,
    nameEn: string | null,
  ): GovernanceAdvisorRow[] => {
    if (!code || !nameEn) return [];
    const hash = [...code].reduce(
      (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997,
      7,
    );
    const count = 2;
    return Array.from({ length: count }, (_, index) => {
      const caseload = 18 + ((hash + index * 13) % 12);
      const approved = 9 + ((hash + index * 7) % 8);
      return {
        id: hash * 10 + index,
        name: `${['Amr', 'Dina', 'Hoda', 'Karim', 'Laila', 'Samir'][(hash + index) % 6]} ${['Hassan', 'Fahmy', 'Nasr', 'Selim'][(hash + index * 3) % 4]}`,
        unit_en: nameEn,
        unit_ar: null,
        caseload,
        queue_size: 2 + ((hash + index * 5) % 6),
        median_decision_hours: 18 + ((hash + index * 11) % 30),
        aging_count: (hash + index) % 4,
        approved,
        completion_rate: Math.round((approved / caseload) * 100),
      };
    });
  };

  const nodeOf = (
    level: GovernanceLevel,
    code: string | null,
    nameEn: string | null,
    metrics: ReturnType<typeof metricsOf>,
    children: GovernanceNode[] = [],
    deans: GovernanceDean[] = [],
  ): GovernanceNode => ({
    level,
    code,
    name_en: nameEn,
    name_ar: null,
    term_code: CURRENT_TERM,
    metrics,
    trends: governanceTrends(
      code ?? nameEn ?? level,
      metrics.completion_rate,
      metrics.median_decision_hours,
      metrics.aging_count,
    ),
    ...(level === 'department'
      ? { advisors: advisorRowsOf(code, nameEn) }
      : {}),
    deans,
    children,
  });

  let nextDeanId = 1;
  const deansOf = (names: string[]): GovernanceDean[] =>
    names.map((name) => ({ id: nextDeanId++, name }));

  const facultyNode = (
    code: string,
    nameEn: string,
    students: number,
    caseload: number,
    approved: number,
    medianHours: number | null,
    deanNames: string[] = [],
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
      deansOf(deanNames),
    );
  };

  const university = nodeOf(
    'university',
    null,
    'E-JUST',
    metricsOf(7600, 3100, 1780, 57, 30, 96, funnelOf(1780, 1240)),
    [
      facultyNode('F-ENG', 'Engineering', 2400, 980, 610, 26, ['Omar Khaled']),
      facultyNode('F-SCI', 'Science', 1500, 610, 400, 34, ['Salma Ibrahim']),
      facultyNode('F-AGR', 'Agriculture', 900, 380, 210, 41, ['Youssef Adel']),
      facultyNode('F-MED', 'Medicine', 1300, 560, 290, 52, ['Hana Mostafa']),
      facultyNode('F-BUS', 'Business', 800, 300, 150, 22, ['Karim Nabil']),
      facultyNode('F-ART', 'Arts', 400, 160, 70, 38, ['Nour Elsayed']),
      facultyNode('F-EDU', 'Education', 300, 110, 50, null, ['Mona Hassan']),
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

const seedAdminOperations = () => {
  const courses = [
    {
      code: 'CS 101',
      title_en: 'Introduction to Programming',
      credits: 3,
      level: 1,
    },
    { code: 'MATH 101', title_en: 'Calculus I', credits: 3, level: 1 },
    { code: 'CS 201', title_en: 'Data Structures', credits: 3, level: 2 },
    { code: 'MATH 201', title_en: 'Calculus II', credits: 3, level: 2 },
    { code: 'CS 301', title_en: 'Algorithms', credits: 3, level: 3 },
    { code: 'EE 210', title_en: 'Circuits', credits: 4, level: 2 },
  ];
  for (const course of courses) {
    db.course.create({ ...course, title_ar: null });
  }
  db.program.create({
    code: 'CSE',
    name_en: 'Computer Science and Engineering',
    name_ar: null,
    faculty: 'Engineering',
  });
  db.program.create({
    code: 'EE',
    name_en: 'Electronics Engineering',
    name_ar: null,
    faculty: 'Engineering',
  });
  db.registrationWindow.create({
    term_code: CURRENT_TERM,
    opens_at: '2026-09-20T00:00:00.000Z',
    closes_at: '2026-10-15T23:59:59.000Z',
    is_active: true,
  });
  db.aiConfig.create({
    quota_per_student: 25,
    assistant_enabled: true,
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
        { course_code: 'CS 201', title: null, credits: 3, reason: null },
        { course_code: 'MATH 201', title: null, credits: 4, reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord();
    seedQueue();
    seedMeetings();
    seedNotifications();
    seedConversations();
    seedGovernance();
    seedAdminOperations();
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
        { course_code: 'CS 201', title: null, credits: 3, reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    seedAcademicRecord('2026-09-01T12:00:00.000Z');
  },

  'registration-closed': () => {
    seedUsers();
    db.plan.create({
      userId: 1,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([
        { course_code: 'CS 201', title: null, credits: 3, reason: null },
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
