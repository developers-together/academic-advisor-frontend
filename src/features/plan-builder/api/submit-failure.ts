import { z } from 'zod';

import { ApiError } from '@/lib/api-error';

export type SubmitFailure = {
  lineErrors: Record<string, string[]>;
  planMessages: string[];
  windowClosed: boolean;
  total: number;
};

const LINE_GROUPS = [
  'active_course',
  'map_membership',
  'prerequisite_chain',
] as const;

const isLineGroup = (group: string): group is (typeof LINE_GROUPS)[number] =>
  (LINE_GROUPS as readonly string[]).includes(group);

export const parseSubmitFailure = (error: ApiError): SubmitFailure => {
  const lineErrors: Record<string, string[]> = {};
  const planMessages: string[] = [];
  let windowClosed = false;

  for (const [key, messages] of Object.entries(error.fields)) {
    const group = key.split('.')[0];
    if (group === 'window') {
      windowClosed = true;
      continue;
    }
    if (isLineGroup(group)) {
      const courseCode = key.slice(group.length + 1);
      lineErrors[courseCode] = [...(lineErrors[courseCode] ?? []), ...messages];
      continue;
    }
    planMessages.push(...messages);
  }

  const total =
    planMessages.length +
    Object.values(lineErrors).reduce(
      (sum, messages) => sum + messages.length,
      0,
    );

  if (total === 0 && !windowClosed) {
    return {
      lineErrors,
      planMessages: [error.message],
      windowClosed,
      total: 1,
    };
  }
  return { lineErrors, planMessages, windowClosed, total };
};

const builderEntrySchema = z.object({
  planId: z.number(),
  failure: z.object({
    lineErrors: z.record(z.string(), z.array(z.string())),
    planMessages: z.array(z.string()),
    windowClosed: z.boolean(),
    total: z.number().nonnegative(),
  }),
});

export const readBuilderFailure = (
  state: unknown,
  planId: number | undefined,
): SubmitFailure | null => {
  const result = builderEntrySchema.safeParse(state);
  return result.success && result.data.planId === planId
    ? result.data.failure
    : null;
};
