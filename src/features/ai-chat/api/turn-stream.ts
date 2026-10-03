import { env } from '@/config/env';
import { ApiError } from '@/lib/api-error';
import { tokenStorage } from '@/lib/token-storage';
import type { SubmitArmedFrame, TurnFrame } from '@/types/domain';

type SseEvent = { event: string; data: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export async function* sseEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      let event = 'message';
      const dataLines: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (dataLines.length) {
        yield { event, data: dataLines.join('\n') };
      }
    }
  }
}

const parseErrors = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const errors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      errors[key] = messages.map(String);
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
};

export const parseTurnFrame = (
  event: string,
  data: string,
): TurnFrame | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    return null;
  }
  if (!isRecord(raw)) {
    return null;
  }
  const turnId = typeof raw.turn_id === 'string' ? raw.turn_id : null;
  const seq = typeof raw.seq === 'number' ? raw.seq : null;
  if (!turnId || seq === null) {
    return null;
  }
  switch (event) {
    case 'token':
      return typeof raw.token === 'string'
        ? { event: 'token', turnId, seq, token: raw.token }
        : null;
    case 'tool.applied':
      return typeof raw.tool === 'string'
        ? {
            event: 'tool.applied',
            turnId,
            seq,
            tool: raw.tool,
            payload: raw.payload ?? null,
          }
        : null;
    case 'submit.suggested':
      return { event: 'submit.suggested', turnId, seq };
    case 'submit.result': {
      if (raw.status !== 'submitted' && raw.status !== 'blocked') {
        return null;
      }
      const errors = parseErrors(raw.errors);
      return {
        event: 'submit.result',
        turnId,
        seq,
        status: raw.status,
        ...(typeof raw.plan_id === 'number' ? { plan_id: raw.plan_id } : {}),
        ...(errors ? { errors } : {}),
      };
    }
    case 'turn.completed':
      return {
        event: 'turn.completed',
        turnId,
        seq,
        title: typeof raw.title === 'string' ? raw.title : null,
      };
    case 'error':
      if (raw.code !== 'turn_failed' && raw.code !== 'turn_timeout') {
        return null;
      }
      return {
        event: 'error',
        turnId,
        seq,
        code: raw.code,
        retryable: raw.retryable === true,
        key: typeof raw.key === 'string' ? raw.key : 'advisor.turn_failed',
        message: typeof raw.message === 'string' ? raw.message : '',
      };
    default:
      return null;
  }
};

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const preStreamFailure = async (response: Response): Promise<ApiError> => {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    key?: string;
  } | null;
  return new ApiError({
    status: response.status,
    message: body?.message,
    key: body?.key ?? null,
  });
};

const openEventStream = async (
  url: string,
  body: string,
  signal: AbortSignal | undefined,
) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body,
    signal,
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('text/event-stream')) {
    throw await preStreamFailure(response);
  }
  return response.body as ReadableStream<Uint8Array>;
};

export async function* streamTurn(
  conversationId: number,
  message: string,
  signal?: AbortSignal,
): AsyncGenerator<TurnFrame> {
  const body = await openEventStream(
    `${env.API_URL}/plan-conversations/${conversationId}/turns`,
    JSON.stringify({ message }),
    signal,
  );
  for await (const sse of sseEvents(body)) {
    const frame = parseTurnFrame(sse.event, sse.data);
    if (frame) {
      yield frame;
    }
  }
}

export async function* streamSubmitArm(
  conversationId: number,
  signal?: AbortSignal,
): AsyncGenerator<SubmitArmedFrame> {
  const body = await openEventStream(
    `${env.API_URL}/plan-conversations/${conversationId}/submit-arm`,
    JSON.stringify({}),
    signal,
  );
  for await (const sse of sseEvents(body)) {
    let raw: unknown;
    try {
      raw = JSON.parse(sse.data);
    } catch {
      continue;
    }
    if (isRecord(raw) && typeof raw.conversation_id === 'number') {
      yield {
        conversation_id: raw.conversation_id,
        submission_confirmed_at:
          typeof raw.submission_confirmed_at === 'string'
            ? raw.submission_confirmed_at
            : null,
      };
    }
  }
}
