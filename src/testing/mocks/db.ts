import { factory, nullable, primaryKey } from '@mswjs/data';

const nextId = (() => {
  let current = 100;
  return () => ++current;
})();

const nullableString = nullable(() => null as unknown as string);

const nullableNumber = nullable(() => null as unknown as number);

const models = {
  user: {
    id: primaryKey(() => nextId()),
    name: String,
    email: String,
    password: String,
    role: String,
    language_preference: nullableString,
    student_id: nullableString,
    national_id: nullableString,
    advisor_id: nullableNumber,
    email_verified_at: nullableString,
    pending_admin_at: nullableString,
    suspended_at: nullableString,
    faculty: nullableString,
    createdAt: Date.now,
  },
  plan: {
    id: primaryKey(() => nextId()),
    userId: Number,
    status: String,
    term_code: String,
    summary: nullableString,

    courses: String,
    warnings: String,
    total_credit_hours: Number,
    submitted_at: nullableString,
    decided_at: nullableString,
    return_reason: nullableString,
    createdAt: Date.now,
  },
  academicRecord: {
    userId: primaryKey(() => nextId()),
    cgpa: nullableNumber,
    curriculum_year_level: Number,

    history: String,
    prerequisite_map: String,
    last_synced_at: nullableString,
  },
  advisorProfile: {
    advisorId: primaryKey(() => nextId()),
    rows: String,
    office_location: nullableString,
  },
  planComment: {
    id: primaryKey(() => nextId()),
    planId: Number,
    authorId: Number,
    body: String,
    createdAt: () => new Date().toISOString(),
  },
  meetingRequest: {
    id: primaryKey(() => nextId()),
    studentId: Number,
    advisorId: Number,
    requesterId: Number,
    direction: String,
    status: String,
    reason: String,
    note: nullableString,
    slots: String,
    selectedSlotIndex: nullableNumber,
    cancellationReason: nullableString,
    term_code: String,
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
    completedAt: nullableString,
  },
  course: {
    id: primaryKey(() => nextId()),
    code: String,
    title_en: String,
    title_ar: nullableString,
    credits: Number,
    level: nullableNumber,
  },
  program: {
    id: primaryKey(() => nextId()),
    code: String,
    name_en: String,
    name_ar: nullableString,
    faculty: nullableString,
  },
  registrationWindow: {
    id: primaryKey(() => nextId()),
    term_code: String,
    opens_at: String,
    closes_at: String,
    is_active: Boolean,
  },
  aiConfig: {
    id: primaryKey(() => nextId()),
    quota_per_student: Number,
    assistant_enabled: Boolean,
  },
  notification: {
    id: primaryKey(String),
    userId: Number,
    slug: nullableString,
    title: nullableString,
    body: nullableString,
    deep_link: String,
    read_at: nullableString,
    created_at: () => new Date().toISOString(),
  },
  planConversation: {
    id: primaryKey(() => nextId()),
    userId: Number,
    title: nullableString,
    submission_confirmed_at: nullableString,
    messages: String,
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
  },
  governanceTree: {
    id: primaryKey(() => 'university'),
    payload: String,
  },
  governanceAdvisor: {
    id: primaryKey(() => nextId()),
    payload: String,
  },
  adminSettings: {
    id: primaryKey(() => 'admin'),
    aging_threshold_days: Number,
  },
  pendingAssignment: {
    id: primaryKey(() => nextId()),
    student_id: String,
    advisor_id: Number,
    created_at: () => new Date().toISOString(),
  },
  rule: {
    id: primaryKey(() => nextId()),
    faculty: nullableString,
    title_en: String,
    title_ar: String,
    body_en: String,
    body_ar: String,
    created_at: () => new Date().toISOString(),
    updated_at: () => new Date().toISOString(),
  },
};

export const db = factory(models);

export const resetDb = () => {
  for (const model of Object.values(db)) {
    model.deleteMany({ where: {} });
  }
  window.localStorage.clear();
};
