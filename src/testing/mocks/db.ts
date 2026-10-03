import { factory, primaryKey } from '@mswjs/data';

const nextId = (() => {
  let current = 100;
  return () => ++current;
})();

const nullableString = () => null as unknown as string;

const nullableNumber = () => null as unknown as number;

const models = {
  user: {
    id: primaryKey(() => nextId()),
    name: String,
    email: String,
    password: String,
    role: String,
    language_preference: nullableString,
    student_id: nullableString,
    advisor_id: Number,
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
};

export const db = factory(models);

export type Model = keyof typeof models;

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

export const storeDb = async (data: string) => {
  if (typeof window === 'undefined') {
    const { writeFile } = await import('fs/promises');
    await writeFile(dbFilePath, data);
  } else {
    window.localStorage.setItem('msw-db', data);
  }
};

export const persistDb = async (model: Model) => {
  if (process.env.NODE_ENV === 'test') return;
  const data = await loadDb();
  data[model] = db[model].getAll();
  await storeDb(JSON.stringify(data));
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
