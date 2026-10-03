import { create } from 'zustand';

import type { TurnFrame } from '@/types/domain';

export type ToolEvent = { tool: string; courseCode: string | null };

export type SubmitResultInfo = {
  status: 'submitted' | 'blocked';
  errors: Record<string, string[]>;
};

export type StreamBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tool'; toolEvent: ToolEvent }
  | { kind: 'submit-result'; result: SubmitResultInfo };

export type TurnError = {
  code: 'turn_failed' | 'turn_timeout';
  retryable: boolean;
  key: string;
  message: string;
};

export type TurnStatus =
  'typing' | 'streaming' | 'completed' | 'stopped' | 'failed';

export type ActiveTurn = {
  status: TurnStatus;
  userMessage: string;
  startedAt: string;
  turnId: string | null;
  lastSeq: number;
  blocks: StreamBlock[];
  userMessageReconciled: boolean;
  error: TurnError | null;
};

type TurnStreamState = {
  turns: Record<string, ActiveTurn>;
  toolEvents: Record<string, ToolEvent[]>;
  submitResults: Record<string, SubmitResultInfo[]>;
  submitSuggested: Record<string, boolean>;
  quotaExhausted: boolean;
  beginTurn: (conversationId: number, message: string) => void;
  appendToken: (
    conversationId: number,
    frame: Extract<TurnFrame, { event: 'token' }>,
  ) => void;
  applyTool: (
    conversationId: number,
    frame: Extract<TurnFrame, { event: 'tool.applied' }>,
  ) => void;
  markSubmitSuggested: (conversationId: number) => void;
  recordSubmitResult: (
    conversationId: number,
    frame: Extract<TurnFrame, { event: 'submit.result' }>,
  ) => void;
  completeTurn: (
    conversationId: number,
    frame: Extract<TurnFrame, { event: 'turn.completed' }>,
  ) => void;
  stopTurn: (conversationId: number) => void;
  failTurn: (conversationId: number, error: TurnError) => void;
  reconcileTurn: (conversationId: number) => void;
  clearTurn: (conversationId: number) => void;
  setQuotaExhausted: () => void;
};

const keyOf = (conversationId: number) => String(conversationId);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const courseCodeFromPayload = (payload: unknown): string | null =>
  isRecord(payload) && typeof payload.course_code === 'string'
    ? payload.course_code
    : null;

export const useTurnStreamStore = create<TurnStreamState>()((set) => ({
  turns: {},
  toolEvents: {},
  submitResults: {},
  submitSuggested: {},
  quotaExhausted: false,

  beginTurn: (conversationId, message) =>
    set((state) => ({
      turns: {
        ...state.turns,
        [keyOf(conversationId)]: {
          status: 'typing',
          userMessage: message,
          startedAt: new Date().toISOString(),
          turnId: null,
          lastSeq: 0,
          blocks: [],
          userMessageReconciled: false,
          error: null,
        },
      },
    })),

  appendToken: (conversationId, frame) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      if (!turn) {
        return state;
      }
      if (
        (turn.turnId && turn.turnId !== frame.turnId) ||
        frame.seq !== turn.lastSeq + 1
      ) {
        console.warn(
          `Dropped ${frame.event} frame for turn ${frame.turnId}: unstable ${turn.turnId ? 'turn id' : `seq ${frame.seq} after ${turn.lastSeq}`}`,
        );
        return state;
      }
      const blocks = [...turn.blocks];
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'text') {
        blocks[blocks.length - 1] = {
          kind: 'text',
          text: last.text + frame.token,
        };
      } else {
        blocks.push({ kind: 'text', text: frame.token });
      }
      return {
        turns: {
          ...state.turns,
          [key]: {
            ...turn,
            status: 'streaming',
            turnId: frame.turnId,
            lastSeq: frame.seq,
            blocks,
          },
        },
      };
    }),

  applyTool: (conversationId, frame) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      const toolEvent: ToolEvent = {
        tool: frame.tool,
        courseCode: courseCodeFromPayload(frame.payload),
      };
      const toolEvents = {
        ...state.toolEvents,
        [key]: [...(state.toolEvents[key] ?? []), toolEvent],
      };
      if (!turn || (turn.turnId && turn.turnId !== frame.turnId)) {
        return { toolEvents };
      }
      return {
        toolEvents,
        turns: {
          ...state.turns,
          [key]: {
            ...turn,
            turnId: turn.turnId ?? frame.turnId,
            lastSeq: frame.seq,
            blocks: [...turn.blocks, { kind: 'tool', toolEvent }],
          },
        },
      };
    }),

  markSubmitSuggested: (conversationId) =>
    set((state) => ({
      submitSuggested: {
        ...state.submitSuggested,
        [keyOf(conversationId)]: true,
      },
    })),

  recordSubmitResult: (conversationId, frame) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      const result: SubmitResultInfo = {
        status: frame.status,
        errors: frame.errors ?? {},
      };
      const submitResults = {
        ...state.submitResults,
        [key]: [...(state.submitResults[key] ?? []), result],
      };
      if (!turn) {
        return { submitResults };
      }
      return {
        submitResults,
        turns: {
          ...state.turns,
          [key]: {
            ...turn,
            lastSeq: frame.seq,
            blocks: [...turn.blocks, { kind: 'submit-result', result }],
          },
        },
        submitSuggested: { ...state.submitSuggested, [key]: false },
      };
    }),

  completeTurn: (conversationId, frame) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      if (!turn || (turn.turnId && turn.turnId !== frame.turnId)) {
        return state;
      }
      return {
        turns: {
          ...state.turns,
          [key]: { ...turn, status: 'completed', lastSeq: frame.seq },
        },
      };
    }),

  stopTurn: (conversationId) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      if (!turn || turn.status === 'completed' || turn.status === 'failed') {
        return state;
      }
      return {
        turns: {
          ...state.turns,
          [key]: { ...turn, status: 'stopped' },
        },
      };
    }),

  failTurn: (conversationId, error) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      if (!turn) {
        return state;
      }
      return {
        turns: {
          ...state.turns,
          [key]: { ...turn, status: 'failed', error },
        },
      };
    }),

  reconcileTurn: (conversationId) =>
    set((state) => {
      const key = keyOf(conversationId);
      const turn = state.turns[key];
      if (!turn) {
        return state;
      }
      return {
        turns: {
          ...state.turns,
          [key]: { ...turn, userMessageReconciled: true },
        },
      };
    }),

  clearTurn: (conversationId) =>
    set((state) => {
      const key = keyOf(conversationId);
      if (!(key in state.turns)) {
        return state;
      }
      const turns = { ...state.turns };
      delete turns[key];
      return { turns };
    }),

  setQuotaExhausted: () => set({ quotaExhausted: true }),
}));
