import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { AppNotification, DeepLink } from '@/types/domain';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { deniesPermission, injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

type NotificationRow = {
  id: unknown;
  slug: string | null;
  title: string | null;
  body: string | null;
  deep_link: string;
  read_at: string | null;
  created_at: string;
};

const parseDeepLink = (raw: string): DeepLink | string => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as DeepLink;
    }
  } catch {
    return raw;
  }
  return raw;
};

const parseNotification = (row: NotificationRow): AppNotification => ({
  id: row.id as string,
  slug: (row.slug as AppNotification['slug']) ?? null,
  title: row.title,
  body: row.body,
  deep_link: row.deep_link ? parseDeepLink(row.deep_link) : null,
  read_at: row.read_at,
  created_at: row.created_at,
});

const notificationsOf = (userId: number) =>
  db.notification
    .findMany({ where: { userId: { equals: userId as number } } })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(parseNotification);

export const notificationsHandlers = [
  http.get(`${env.API_URL}/notifications`, async ({ request }) => {
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
    const items = notificationsOf(user.id as number);
    return HttpResponse.json({
      data: items,
      unread_count: items.filter((item) => item.read_at === null).length,
    });
  }),

  http.post(`${env.API_URL}/notifications/read-all`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const readAt = new Date().toISOString();
    for (const row of db.notification.findMany({
      where: { userId: { equals: user.id as number } },
    })) {
      db.notification.update({
        where: { id: { equals: row.id as string } },
        data: { read_at: row.read_at ?? readAt },
      });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(
    `${env.API_URL}/notifications/:notificationId/read`,
    async ({ request, params }) => {
      await networkDelay();
      const user = requireAuth(request);
      const row = db.notification.findFirst({
        where: {
          id: { equals: String(params.notificationId) },
          userId: { equals: user.id as number },
        },
      });
      if (!row) {
        return HttpResponse.json(
          { message: 'No notification found.' },
          { status: 404 },
        );
      }
      db.notification.update({
        where: { id: { equals: row.id as string } },
        data: { read_at: row.read_at ?? new Date().toISOString() },
      });
      return new HttpResponse(null, { status: 204 });
    },
  ),
];
