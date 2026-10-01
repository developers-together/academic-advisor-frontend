export class ApiError extends Error {
  status: number;
  key: string | null;
  fields: Record<string, string[]>;
  requestId: string | null;

  constructor({
    status,
    message,
    key,
    fields,
    requestId,
  }: {
    status: number;
    message?: string;
    key?: string | null;
    fields?: Record<string, string[]>;
    requestId?: string | null;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.key = key ?? null;
    this.fields = fields ?? {};
    this.requestId = requestId ?? null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

type AxiosLikeError = {
  response?: {
    status?: number;
    data?: unknown;
    headers?: Record<string, unknown>;
  };
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  const response = (error as AxiosLikeError | null)?.response;
  const status = response?.status ?? 0;
  const data = response?.data;
  const requestIdHeader = response?.headers?.['x-request-id'];

  if (isRecord(data)) {
    const fields: Record<string, string[]> = {};
    if (isRecord(data.errors)) {
      for (const [field, messages] of Object.entries(data.errors)) {
        if (Array.isArray(messages)) {
          fields[field] = messages.map(String);
        }
      }
    }
    return new ApiError({
      status,
      message: typeof data.message === 'string' ? data.message : undefined,
      key: typeof data.key === 'string' ? data.key : null,
      fields,
      requestId: typeof requestIdHeader === 'string' ? requestIdHeader : null,
    });
  }

  return new ApiError({
    status,
    requestId: typeof requestIdHeader === 'string' ? requestIdHeader : null,
  });
};
