type Envelope<T> = { data: T };

type LaravelMeta = {
  current_page?: number;
  per_page?: number;
  total?: number;
};

type LaravelLinks = {
  next?: string | null;
};

export type Page<T> = {
  items: T[];
  meta: LaravelMeta | null;
  links: LaravelLinks | null;
};

type NotificationListBody<T> = {
  data: T[];
  unread_count: number;
  links?: LaravelLinks;
  meta?: LaravelMeta;
};

export type NotificationPage<T> = Page<T> & { unreadCount: number };

export const unwrap = async <T>(promise: Promise<unknown>): Promise<T> => {
  const body = (await promise) as Envelope<T>;
  return body.data;
};

export const unwrapList = async <T>(
  promise: Promise<unknown>,
): Promise<T[]> => {
  const body = (await promise) as Envelope<T[]>;
  return body.data;
};

export const unwrapPage = async <T>(
  promise: Promise<unknown>,
): Promise<Page<T>> => {
  const body = (await promise) as Envelope<T[]> & {
    links?: LaravelLinks;
    meta?: LaravelMeta;
  };
  return {
    items: body.data,
    meta: body.meta ?? null,
    links: body.links ?? null,
  };
};

export const unwrapNotificationPage = async <T>(
  promise: Promise<unknown>,
): Promise<NotificationPage<T>> => {
  const body = (await promise) as NotificationListBody<T>;
  return {
    items: body.data,
    meta: body.meta ?? null,
    links: body.links ?? null,
    unreadCount: body.unread_count,
  };
};
