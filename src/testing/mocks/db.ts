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
    remaining_requirements: nullableString,

    history: String,
    current_enrollments: String,
    prerequisite_map: String,
    last_synced_at: nullableString,

    staleness: String,
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
  visitRequest: {
    id: primaryKey(() => nextId()),
    studentId: Number,
    initiatorId: Number,
    status: String,
    term_code: String,
    slots: String,
    createdAt: () => new Date().toISOString(),
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
    goal: String,
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
    title_en: String,
    title_ar: String,
    body_en: String,
    body_ar: String,
    created_at: () => new Date().toISOString(),
    updated_at: () => new Date().toISOString(),
  },
};

export const db = factory(models);

const dbFilePath = 'mocked-db.json';

export const loadDb = async () => {
  if (typeof window === 'undefined') {
    const { readFile, writeFile } = await import('fs/promises');
    try {
      const data = await readFile(dbFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        const emptyDB = {};
        await writeFile(dbFilePath, JSON.stringify(emptyDB, null, 2));
        return emptyDB;
      } else {
        console.error('Error loading mocked DB:', error);
        return null;
      }
    }
  }
  return Object.assign(
    JSON.parse(window.localStorage.getItem('msw-db') || '{}'),
  );
};

export const initializeDb = async () => {
  const database = await loadDb();
  Object.entries(db).forEach(([key, model]) => {
    const dataEntries = database[key];
    if (dataEntries) {
      dataEntries?.forEach((entry: Record<string, any>) => {
        model.create(entry);
      });
    }
  });
};

export const resetDb = () => {
  window.localStorage.clear();
};
