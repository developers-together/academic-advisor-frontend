import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { User } from '@/types/domain';

import { db } from '../db';
import {
  CURRENT_TERM,
  requireAuth,
  sanitizeUser,
  tokenFor,
  verifyCredentials,
} from '../mock-auth';
import { injectsErrors, registrationClosed } from '../scenarios';
import { networkDelay } from '../utils';

type RegisterBody = {
  email?: string;
  password?: string;
  password_confirmation?: string;
  student_id?: string;
  language_preference?: string;
};

export const authHandlers = [
  http.post(`${env.API_URL}/register`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as RegisterBody;
    const errors: Record<string, string[]> = {};

    const email = body.email?.toLowerCase() ?? '';
    if (!email) {
      errors.email = ['The email field is required.'];
    } else if (!email.endsWith('@ejust.edu.eg')) {
      errors.email = ['The email must belong to a university SIS domain.'];
    } else if (db.user.findFirst({ where: { email: { equals: email } } })) {
      errors.email = ['An account with this email already exists.'];
    }

    if (!body.password || body.password.length < 8) {
      errors.password = ['The password must be at least 8 characters.'];
    }
    if (body.password !== body.password_confirmation) {
      errors.password_confirmation = [
        'The password confirmation does not match.',
      ];
    }
    if (!body.student_id) {
      errors.student_id = ['The student id field is required.'];
    } else if (
      db.user.findFirst({
        where: { student_id: { equals: body.student_id } },
      })
    ) {
      errors.student_id = ['This student ID is already registered.'];
    }

    if (Object.keys(errors).length > 0) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors,
        },
        { status: 422 },
      );
    }

    db.user.create({
      name: '',
      email,
      password: body.password,
      role: 'student',
      language_preference: body.language_preference === 'ar' ? 'ar' : 'en',
      student_id: body.student_id ?? undefined,
    });

    return HttpResponse.json(
      {
        message:
          'We sent a verification link to your email. The link expires after 60 minutes.',
      },
      { status: 201 },
    );
  }),

  http.post(`${env.API_URL}/login`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const user = verifyCredentials({
      email: body.email ?? '',
      password: body.password ?? '',
    });

    if (!user) {
      return HttpResponse.json(
        {
          message: 'These credentials do not match an account.',
          errors: {
            email: ['These credentials do not match an account.'],
          },
        },
        { status: 422 },
      );
    }

    if (user.suspended_at) {
      return HttpResponse.json(
        {
          message:
            'This account is suspended. Contact the administration office.',
        },
        { status: 403 },
      );
    }

    if (!user.email_verified_at) {
      return HttpResponse.json(
        {
          message: 'Verify your email address before signing in.',
          errors: {
            email: ['Verify your email address before signing in.'],
          },
        },
        { status: 422 },
      );
    }

    return HttpResponse.json({ token: tokenFor(user.id) });
  }),

  http.get(`${env.API_URL}/me`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    const user = requireAuth(request);
    return HttpResponse.json({
      data: sanitizeUser(user) as unknown as User,
    });
  }),

  http.post(`${env.API_URL}/logout`, async ({ request }) => {
    await networkDelay();
    requireAuth(request);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${env.API_URL}/forgot-password`, async () => {
    await networkDelay();
    // The response never reveals whether the email matches an account.
    return HttpResponse.json({
      message: 'If an account exists, we sent a reset link.',
    });
  }),

  http.get(`${env.API_URL}/verify-email/:id/:hash`, async ({ params }) => {
    await networkDelay();
    const user = db.user.findFirst({
      where: { id: { equals: Number(params.id) as number } },
    });
    if (!user || params.hash !== 'sha1') {
      return HttpResponse.json(
        { message: 'This link is invalid or has expired.' },
        { status: 403 },
      );
    }
    const verifiedAt = new Date().toISOString();
    db.user.update({
      where: { id: { equals: user.id } },
      data: { email_verified_at: verifiedAt },
    });
    return HttpResponse.json({
      data: sanitizeUser({
        ...user,
        email_verified_at: verifiedAt,
      }) as unknown as User,
    });
  }),

  // Built-in accounts, exposed for demos and tests only.
  http.get(`${env.API_URL}/__mocks/accounts`, async () => {
    await networkDelay();
    return HttpResponse.json({
      password: 'password123',
      term: CURRENT_TERM,
      accounts: db.user
        .getAll()
        .filter((user) => user.email_verified_at)
        .map((user) => ({ email: user.email, role: user.role })),
    });
  }),

  // Registration-window state read directly from the scenario, for the
  // states the real contract does not expose yet (handoff H3).
  http.get(`${env.API_URL}/__mocks/window`, async () => {
    await networkDelay();
    return HttpResponse.json({ registrationClosed: registrationClosed() });
  }),
];
