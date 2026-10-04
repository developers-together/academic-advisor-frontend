import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { ImportSummary, UniversityRule } from '@/types/domain';

import { db } from '../db';
import { requireAuth, sanitizeUser } from '../mock-auth';
import { getScenario, deniesPermission, injectsErrors } from '../scenarios';
import { hash, networkDelay } from '../utils';

const unauthorised = () =>
  HttpResponse.json(
    { message: 'This action is unauthorized.' },
    { status: 403 },
  );

const requireAdmin = (request: Request) => {
  const user = requireAuth(request);
  if (user.role !== 'admin') {
    throw unauthorised();
  }
  return user;
};

type UserRow = NonNullable<ReturnType<typeof db.user.findFirst>>;

const userResponse = (row: UserRow, status = 200) =>
  HttpResponse.json(
    { data: sanitizeUser(row) },
    { status: status === 200 ? undefined : status },
  );

const bindingComplete = (row: UserRow) =>
  row.student_id !== null && row.student_id !== undefined;

const accountById = (rawId: string | readonly string[]): UserRow | null => {
  const row = db.user.findFirst({
    where: { id: { equals: Number(rawId) } },
  });
  if (!row || row.role !== 'student') {
    return null;
  }
  return row;
};

const staffById = (rawId: string | readonly string[]): UserRow | null => {
  const row = db.user.findFirst({
    where: { id: { equals: Number(rawId) } },
  });
  if (!row || row.role === 'student') {
    return null;
  }
  return row;
};

const STAFF_ROLES = ['advisor', 'dean', 'vp', 'admin'];

const staffUpdateErrors = (
  body: Record<string, unknown>,
): Record<string, string[]> => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role : '';
  const faculty =
    typeof body.faculty === 'string' ? body.faculty.trim() : undefined;
  const errors: Record<string, string[]> = {};
  if (!name) {
    errors.name = ['The name is required.'];
  } else if (name.length > 255) {
    errors.name = ['Names are limited to 255 characters.'];
  }
  if (!STAFF_ROLES.includes(role)) {
    errors.role = ['Choose a staff role.'];
  }
  if (role === 'dean' && !faculty) {
    errors.faculty = ['Deans need a faculty.'];
  }
  return errors;
};

const invalid = (errors: Record<string, string[]>) =>
  HttpResponse.json(
    { message: 'The given data was invalid.', errors },
    { status: 422 },
  );

const notFound = (message: string) =>
  HttpResponse.json({ message }, { status: 404 });

const splitCsvLine = (line: string) =>
  line.split(',').map((cell) => cell.trim());

type ParsedImport =
  | { error: string }
  | {
      rows: Array<{ row: number; student_id: string; advisor_email: string }>;
    };

const parseImportCsv = (text: string): ParsedImport => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { error: 'The file is empty.' };
  }
  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const idIndex = header.indexOf('student_id');
  const advisorIndex = header.indexOf('advisor_email');
  if (idIndex === -1 || advisorIndex === -1) {
    return {
      error: 'The header row needs student_id and advisor_email columns.',
    };
  }
  const rows = lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    return {
      row: index + 1,
      student_id: cells[idIndex] ?? '',
      advisor_email: cells[advisorIndex] ?? '',
    };
  });
  return { rows };
};

const MAX_FILE_BYTES = 2048 * 1024;

const UNKNOWN_SIS_STUDENT_ID = '3020404';
const SIS_OUTAGE_STUDENT_ID = '3020503';
const SIS_ID_PATTERN = /^\d{1,20}$/;

const sisUnavailable = () =>
  HttpResponse.json(
    {
      message: 'The student information system is unavailable.',
      key: 'verification.sis_unavailable',
    },
    { status: 503 },
  );

const sisUnknownStudent = () =>
  HttpResponse.json(
    {
      message: 'The student information system has no student with this ID.',
      key: 'admin.sis_unknown_student',
    },
    { status: 422 },
  );

const sisEmailOf = (studentId: string) => `${studentId}@ejust.edu.eg`;

export const adminHandlers = [
  http.get(`${env.API_URL}/admin/students`, async ({ request }) => {
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAdmin(request);
    await networkDelay();
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const students = db.user
      .findMany({ where: { role: { equals: 'student' } } })
      .filter(
        (student) =>
          !search ||
          student.name.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search) ||
          (student.student_id ?? '').includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((student) => sanitizeUser(student));
    return HttpResponse.json({ data: students });
  }),

  http.post(`${env.API_URL}/admin/students`, async ({ request }) => {
    requireAdmin(request);
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const studentId =
      typeof body.student_id === 'string' ? body.student_id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const languagePreference =
      typeof body.language_preference === 'string'
        ? body.language_preference
        : '';

    const errors: Record<string, string[]> = {};
    if (!SIS_ID_PATTERN.test(studentId)) {
      errors.student_id = ['Enter the SIS student ID as 1 to 20 digits.'];
    } else if (
      db.user.findFirst({ where: { student_id: { equals: studentId } } })
    ) {
      errors.student_id = ['This student ID already has an account.'];
    }
    if (!name) {
      errors.name = ['The display name is required.'];
    } else if (name.length > 255) {
      errors.name = ['Names are limited to 255 characters.'];
    }
    if (password.length < 8) {
      errors.password = [
        'The temporary password must be at least 8 characters.',
      ];
    }
    if (languagePreference && !['en', 'ar'].includes(languagePreference)) {
      errors.language_preference = ['Choose English or Arabic.'];
    }
    if (Object.keys(errors).length > 0) {
      return invalid(errors);
    }
    if (injectsErrors() || studentId === SIS_OUTAGE_STUDENT_ID) {
      return sisUnavailable();
    }
    if (studentId === UNKNOWN_SIS_STUDENT_ID) {
      return sisUnknownStudent();
    }
    const created = db.user.create({
      name,
      email: sisEmailOf(studentId),
      password: hash(password),
      role: 'student',
      language_preference: languagePreference || 'en',
      student_id: studentId,
      email_verified_at: new Date().toISOString(),
    });
    return HttpResponse.json({ data: sanitizeUser(created) }, { status: 201 });
  }),

  http.get(
    `${env.API_URL}/admin/students/:studentId`,
    async ({ request, params }) => {
      if (injectsErrors()) {
        return HttpResponse.json(
          { message: 'The server encountered an error.' },
          { status: 500 },
        );
      }
      if (deniesPermission()) {
        return unauthorised();
      }
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      return userResponse(row);
    },
  ),

  http.patch(
    `${env.API_URL}/admin/students/:studentId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      const body = (await request.json()) as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name.trim() : undefined;
      const languagePreference =
        typeof body.language_preference === 'string'
          ? body.language_preference
          : undefined;
      const errors: Record<string, string[]> = {};
      if (name !== undefined && !name) {
        errors.name = ['The display name is required.'];
      } else if (name !== undefined && name.length > 255) {
        errors.name = ['Names are limited to 255 characters.'];
      }
      if (
        languagePreference !== undefined &&
        !['en', 'ar'].includes(languagePreference)
      ) {
        errors.language_preference = ['Choose English or Arabic.'];
      }
      if (Object.keys(errors).length > 0) {
        return invalid(errors);
      }
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(languagePreference !== undefined
            ? { language_preference: languagePreference }
            : {}),
        },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.post(
    `${env.API_URL}/admin/students/:studentId/suspend`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: { suspended_at: new Date().toISOString() },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.post(
    `${env.API_URL}/admin/students/:studentId/reactivate`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: { suspended_at: null as unknown as string },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.post(
    `${env.API_URL}/admin/students/:studentId/retry-sis`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      if (bindingComplete(row)) {
        return HttpResponse.json(
          {
            message: 'The student ID binding is already complete.',
            key: 'admin.binding_complete',
          },
          { status: 409 },
        );
      }
      if (injectsErrors()) {
        return HttpResponse.json(
          {
            message: 'The student information system is unavailable.',
            key: 'sis.unavailable',
          },
          { status: 503 },
        );
      }
      const bound = db.user.update({
        where: { id: { equals: row.id as number } },
        data: {
          student_id: `3020${String(row.id).padStart(3, '0')}`,
          pending_admin_at: null as unknown as string,
        },
      });
      return userResponse(bound ?? row);
    },
  ),

  http.patch(
    `${env.API_URL}/admin/students/:studentId/student-id`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      if (bindingComplete(row)) {
        return HttpResponse.json(
          {
            message: 'The student ID binding is already complete.',
            key: 'admin.binding_complete',
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as { student_id?: unknown };
      const studentId =
        typeof body.student_id === 'string' ? body.student_id.trim() : '';
      if (!/^\d{1,20}$/.test(studentId)) {
        return invalid({ student_id: ['Use 1 to 20 digits.'] });
      }
      if (
        db.user.findFirst({
          where: { student_id: { equals: studentId } },
        })
      ) {
        return invalid({
          student_id: ['This student ID is already registered.'],
        });
      }
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: {
          student_id: studentId,
          pending_admin_at: null as unknown as string,
        },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.delete(
    `${env.API_URL}/admin/students/:studentId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('No student account found.');
      }
      db.plan.deleteMany({ where: { userId: { equals: row.id as number } } });
      db.academicRecord.deleteMany({
        where: { userId: { equals: row.id as number } },
      });
      db.user.delete({ where: { id: { equals: row.id as number } } });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.post(
    `${env.API_URL}/admin/assignments/:studentId/reassign`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = accountById(String(params.studentId));
      if (!row) {
        return notFound('The account is not a student.');
      }
      const body = (await request.json()) as { advisor_email?: unknown };
      const advisorEmail =
        typeof body.advisor_email === 'string'
          ? body.advisor_email.trim().toLowerCase()
          : '';
      const advisor = advisorEmail
        ? db.user.findFirst({
            where: { email: { equals: advisorEmail } },
          })
        : null;
      if (!advisor || advisor.role !== 'advisor') {
        return invalid({
          advisor_email: ['No advisor carries the email.'],
        });
      }
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: { advisor_id: advisor.id as number },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.post(`${env.API_URL}/admin/assignments`, async ({ request }) => {
    requireAdmin(request);
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const studentId =
      typeof body.student_id === 'string' ? body.student_id.trim() : '';
    const advisorEmail =
      typeof body.advisor_email === 'string' ? body.advisor_email.trim() : '';

    const errors: Record<string, string[]> = {};
    if (!SIS_ID_PATTERN.test(studentId)) {
      errors.student_id = ['Enter the SIS student ID as 1 to 20 digits.'];
    }
    const advisor = findAdvisorByEmail(advisorEmail);
    if (!advisor) {
      errors.advisor_email = ['No advisor carries the email.'];
    }
    if (Object.keys(errors).length > 0) {
      return invalid(errors);
    }

    const student = db.user.findFirst({
      where: { role: { equals: 'student' }, student_id: { equals: studentId } },
    });
    if (student) {
      if (student.advisor_id === advisor?.id) {
        return HttpResponse.json({
          data: {
            mode: 'unchanged',
            student: sanitizeUser(student),
            assignment: null,
          },
        });
      }
      const updated = db.user.update({
        where: { id: { equals: student.id as number } },
        data: { advisor_id: advisor?.id as number },
      });
      return HttpResponse.json({
        data: {
          mode: 'assigned',
          student: sanitizeUser(updated ?? student),
          assignment: null,
        },
      });
    }
    return HttpResponse.json({
      data: {
        mode: 'scheduled',
        student: null,
        assignment: scheduleAssignment(studentId, advisor?.id as number),
      },
    });
  }),

  http.get(`${env.API_URL}/admin/assignments/pending`, async ({ request }) => {
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAdmin(request);
    await networkDelay();
    const pending = db.pendingAssignment
      .getAll()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((row) => pendingAssignmentOf(row));
    return HttpResponse.json({ data: pending });
  }),

  http.delete(
    `${env.API_URL}/admin/assignments/pending/:assignmentId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = db.pendingAssignment.findFirst({
        where: { id: { equals: Number(params.assignmentId) } },
      });
      if (!row) {
        return notFound('No scheduled assignment found.');
      }
      db.pendingAssignment.delete({
        where: { id: { equals: row.id as number } },
      });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.get(`${env.API_URL}/admin/staff`, async ({ request }) => {
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAdmin(request);
    await networkDelay();
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const staff = db.user
      .findMany(role ? { where: { role: { equals: role } } } : {})
      .filter((row) => row.role !== 'student')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({
        ...sanitizeUser(row),
        students_count: db.user.findMany({
          where: { advisor_id: { equals: row.id as number } },
        }).length,
      }));
    return HttpResponse.json({ data: staff });
  }),

  http.post(`${env.API_URL}/admin/assignments/import`, async ({ request }) => {
    await networkDelay();
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAdmin(request);
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    const scenarioErrors = importErrorsSeed();
    if (scenarioErrors) {
      return invalid(scenarioErrors);
    }
    const form = await request.formData();
    const raw = form.get('file');
    const file =
      raw instanceof File
        ? raw
        : new File([String(raw ?? '')], 'import.csv', {
            type: 'text/csv',
          });
    if (!file.size) {
      return invalid({ file: ['Choose a CSV file first.'] });
    }
    if (file.size > MAX_FILE_BYTES) {
      return invalid({ file: ['Files are limited to 2048 KB.'] });
    }
    const parsed = parseImportCsv(await file.text());
    if ('error' in parsed) {
      return invalid({ file: [parsed.error] });
    }
    const errors: Record<string, string[]> = {};
    const apply: Array<{
      student: UserRow | null;
      studentId: string;
      advisorId: number;
    }> = [];
    for (const row of parsed.rows) {
      const advisor = findAdvisorByEmail(row.advisor_email);
      if (!advisor) {
        errors[`rows.${row.row}`] = [
          `No advisor carries ${row.advisor_email || '(missing)'}.`,
        ];
        continue;
      }
      const student = row.student_id
        ? db.user.findFirst({
            where: {
              role: { equals: 'student' },
              student_id: { equals: row.student_id },
            },
          })
        : null;
      if (!student && !row.student_id) {
        errors[`rows.${row.row}`] = ['No student carries ID (missing).'];
        continue;
      }
      apply.push({
        student,
        studentId: row.student_id,
        advisorId: advisor.id as number,
      });
    }
    if (Object.keys(errors).length > 0) {
      return invalid(errors);
    }
    let assigned = 0;
    let unchanged = 0;
    let scheduled = 0;
    for (const entry of apply) {
      if (entry.student) {
        if (entry.student.advisor_id === entry.advisorId) {
          unchanged += 1;
        } else {
          db.user.update({
            where: { id: { equals: entry.student.id as number } },
            data: { advisor_id: entry.advisorId },
          });
          assigned += 1;
        }
      } else {
        scheduleAssignment(entry.studentId, entry.advisorId);
        scheduled += 1;
      }
    }
    const summary: ImportSummary = { assigned, unchanged, scheduled };
    return HttpResponse.json({ data: summary });
  }),

  http.get(`${env.API_URL}/admin/rules`, async ({ request }) => {
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAdmin(request);
    await networkDelay();
    const rules: UniversityRule[] = db.rule
      .getAll()
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((rule) => ruleOf(rule));
    return HttpResponse.json({ data: rules });
  }),

  http.post(`${env.API_URL}/admin/rules`, async ({ request }) => {
    requireAdmin(request);
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const errors = ruleErrors(body);
    if (errors) {
      return invalid(errors);
    }
    const now = new Date().toISOString();
    const created = db.rule.create({
      title_en: String(body.title_en).trim(),
      title_ar: String(body.title_ar).trim(),
      body_en: String(body.body_en).trim(),
      body_ar: String(body.body_ar).trim(),
      created_at: now,
      updated_at: now,
    });
    return HttpResponse.json({ data: ruleOf(created) }, { status: 201 });
  }),

  http.put(
    `${env.API_URL}/admin/rules/:ruleId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = db.rule.findFirst({
        where: { id: { equals: Number(params.ruleId) } },
      });
      if (!row) {
        return notFound('No rule found.');
      }
      const body = (await request.json()) as Record<string, unknown>;
      const errors = ruleErrors(body);
      if (errors) {
        return invalid(errors);
      }
      const updated = db.rule.update({
        where: { id: { equals: row.id as number } },
        data: {
          title_en: String(body.title_en).trim(),
          title_ar: String(body.title_ar).trim(),
          body_en: String(body.body_en).trim(),
          body_ar: String(body.body_ar).trim(),
          updated_at: new Date().toISOString(),
        },
      });
      return HttpResponse.json({ data: ruleOf(updated ?? row) });
    },
  ),

  http.delete(
    `${env.API_URL}/admin/rules/:ruleId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = db.rule.findFirst({
        where: { id: { equals: Number(params.ruleId) } },
      });
      if (!row) {
        return notFound('No rule found.');
      }
      db.rule.delete({ where: { id: { equals: row.id as number } } });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.post(`${env.API_URL}/admin/staff`, async ({ request }) => {
    requireAdmin(request);
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' ? body.role : '';
    const faculty = typeof body.faculty === 'string' ? body.faculty.trim() : '';

    const errors: Record<string, string[]> = {};
    if (!name) {
      errors.name = ['The name is required.'];
    }
    if (!email) {
      errors.email = ['The email is required.'];
    } else if (!email.endsWith('@ejust.edu.eg')) {
      errors.email = ['The email must belong to a university SIS domain.'];
    } else if (db.user.findFirst({ where: { email: { equals: email } } })) {
      errors.email = ['An account with this email already exists.'];
    }
    if (password.length < 8) {
      errors.password = ['The password must be at least 8 characters.'];
    }
    if (!['advisor', 'dean', 'vp', 'admin'].includes(role)) {
      errors.role = ['Choose a staff role.'];
    }
    if (role === 'dean' && !faculty) {
      errors.faculty = ['Deans need a faculty.'];
    }
    if (Object.keys(errors).length > 0) {
      return invalid(errors);
    }

    const created = db.user.create({
      name,
      email,
      password: hash(password),
      role,
      language_preference: 'en',
      faculty: faculty || undefined,
      email_verified_at: new Date().toISOString(),
    });
    return HttpResponse.json({ data: sanitizeUser(created) }, { status: 201 });
  }),

  http.patch(
    `${env.API_URL}/admin/staff/:staffId`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = staffById(String(params.staffId));
      if (!row) {
        return notFound('Staff account not found.');
      }
      const body = (await request.json()) as Record<string, unknown>;
      const errors = staffUpdateErrors(body);
      if (Object.keys(errors).length > 0) {
        return invalid(errors);
      }
      const faculty =
        typeof body.faculty === 'string' ? body.faculty.trim() : '';
      const updated = db.user.update({
        where: { id: { equals: row.id as number } },
        data: {
          name: String(body.name).trim(),
          role: String(body.role),
          faculty: faculty || (null as unknown as string),
        },
      });
      return userResponse(updated ?? row);
    },
  ),

  http.delete(
    `${env.API_URL}/admin/staff/:staffId`,
    async ({ request, params }) => {
      const authed = requireAdmin(request);
      await networkDelay();
      const row = staffById(String(params.staffId));
      if (!row) {
        return notFound('Staff account not found.');
      }
      if (row.id === authed.id) {
        return HttpResponse.json(
          { message: 'You cannot delete your own account.' },
          { status: 403 },
        );
      }
      if (
        row.role === 'admin' &&
        db.user.findMany({ where: { role: { equals: 'admin' } } }).length === 1
      ) {
        return HttpResponse.json(
          { message: 'The last administrator cannot be deleted.' },
          { status: 422 },
        );
      }
      db.user.updateMany({
        where: { advisor_id: { equals: row.id as number } },
        data: { advisor_id: null as unknown as number },
      });
      db.user.delete({ where: { id: { equals: row.id as number } } });
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.post(
    `${env.API_URL}/admin/staff/:staffId/password-reset`,
    async ({ request, params }) => {
      requireAdmin(request);
      await networkDelay();
      const row = db.user.findFirst({
        where: { id: { equals: Number(params.staffId) } },
      });
      if (!row) {
        return notFound('Staff account not found.');
      }
      return HttpResponse.json({
        message: 'If an account exists, we sent a reset link.',
      });
    },
  ),

  http.get(
    `${env.API_URL}/admin/settings/queue-aging-threshold`,
    async ({ request }) => {
      await networkDelay();
      if (injectsErrors()) {
        return HttpResponse.json(
          { message: 'The server encountered an error.' },
          { status: 500 },
        );
      }
      if (deniesPermission()) {
        return unauthorised();
      }
      requireAdmin(request);
      const settings = db.adminSettings.findFirst({
        where: { id: { equals: 'admin' } },
      });
      return HttpResponse.json({
        data: { days: settings ? settings.aging_threshold_days : 3 },
      });
    },
  ),

  http.put(
    `${env.API_URL}/admin/settings/queue-aging-threshold`,
    async ({ request }) => {
      requireAdmin(request);
      await networkDelay();
      const body = (await request.json()) as { days?: unknown };
      const days = Number(body.days);
      if (!Number.isInteger(days) || days < 1) {
        return invalid({ days: ['Use at least 1 day.'] });
      }
      const settings = db.adminSettings.findFirst({
        where: { id: { equals: 'admin' } },
      });
      if (settings) {
        db.adminSettings.update({
          where: { id: { equals: 'admin' } },
          data: { aging_threshold_days: days },
        });
      } else {
        db.adminSettings.create({
          id: 'admin',
          aging_threshold_days: days,
        });
      }
      return HttpResponse.json({ data: { days } });
    },
  ),
];

const importErrorsSeed = (): Record<string, string[]> | null => {
  if (getScenario() !== 'import-errors') {
    return null;
  }
  const errors: Record<string, string[]> = {
    file: ['The header row needs student_id and advisor_email columns.'],
  };
  for (let row = 1; row <= 23; row += 1) {
    errors[`rows.${row}`] = ['No student carries this ID.'];
  }
  return errors;
};

type PendingAssignmentRow = NonNullable<
  ReturnType<typeof db.pendingAssignment.findFirst>
>;

const pendingAssignmentOf = (row: PendingAssignmentRow) => {
  const advisor = db.user.findFirst({
    where: { id: { equals: row.advisor_id as number } },
  });
  return {
    id: row.id as number,
    student_id: row.student_id,
    advisor: {
      id: advisor?.id as number,
      name: advisor?.name ?? '',
      email: advisor?.email ?? '',
    },
    created_at: row.created_at,
  };
};

const findAdvisorByEmail = (advisorEmail: string) => {
  const advisor = advisorEmail
    ? db.user.findFirst({
        where: { email: { equals: advisorEmail.toLowerCase() } },
      })
    : null;
  return advisor && advisor.role === 'advisor' ? advisor : null;
};

const scheduleAssignment = (studentId: string, advisorId: number) => {
  const created = db.pendingAssignment.create({
    student_id: studentId,
    advisor_id: advisorId,
  });
  return pendingAssignmentOf(created);
};

const ruleOf = (row: {
  id: unknown;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  created_at: string;
  updated_at: string;
}): UniversityRule => ({
  id: row.id as number,
  title_en: row.title_en,
  title_ar: row.title_ar,
  body_en: row.body_en,
  body_ar: row.body_ar,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const RULE_FIELDS = ['title_en', 'title_ar', 'body_en', 'body_ar'] as const;

const ruleErrors = (body: Record<string, unknown>) => {
  const errors: Record<string, string[]> = {};
  for (const field of RULE_FIELDS) {
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (!value) {
      errors[field] = ['This field is required.'];
    } else if (field.startsWith('title') && value.length > 255) {
      errors[field] = ['Titles are limited to 255 characters.'];
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
};
