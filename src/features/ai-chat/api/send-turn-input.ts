import { z } from 'zod';

export const TURN_MESSAGE_MAX = 10000;

export const createTurnInputSchema = (messages: {
  required: string;
  tooLong: string;
}) =>
  z
    .string()
    .trim()
    .min(1, messages.required)
    .max(TURN_MESSAGE_MAX, messages.tooLong);
