import { ApiError } from '@/lib/api-error';

import { parseSubmitFailure } from '../submit-failure';

const failureFrom = (errors: Record<string, string[]>) =>
  parseSubmitFailure(
    new ApiError({
      status: 422,
      message: 'The given data was invalid.',
      fields: errors,
    }),
  );

test('per-course rule keys attach their messages to the matching line', () => {
  const failure = failureFrom({
    'active_course.CS 201': ['CS 201 is not offered this term.'],
    'map_membership.CS 999': ['CS 999 is not in your course map.'],
    'prerequisite_chain.CS 301': ['CS 301 requires CS 201 first.'],
  });

  expect(failure.lineErrors).toEqual({
    'CS 201': ['CS 201 is not offered this term.'],
    'CS 999': ['CS 999 is not in your course map.'],
    'CS 301': ['CS 301 requires CS 201 first.'],
  });
  expect(failure.total).toBe(3);
  expect(failure.windowClosed).toBe(false);
});

test('plan-level rule keys collect into plan messages', () => {
  const failure = failureFrom({
    allowance_missing: [
      'The credit allowance for this term is missing. Contact the registration office.',
    ],
    allowance_outside: [
      'Your plan is outside the allowed credit range for this term.',
    ],
  });

  expect(failure.lineErrors).toEqual({});
  expect(failure.planMessages).toEqual([
    'The credit allowance for this term is missing. Contact the registration office.',
    'Your plan is outside the allowed credit range for this term.',
  ]);
  expect(failure.total).toBe(2);
});

test('level and elective group failures attach to course lines while an unkeyed course code failure stays visible', () => {
  const failure = failureFrom({
    'level.CS 401': ['CS 401 is above your current level.'],
    'elective_group.CS 401': ['Retake CS 201 before choosing CS 401.'],
    course_code: ['The selected course code is invalid.'],
  });

  expect(failure.lineErrors).toEqual({
    'CS 401': [
      'CS 401 is above your current level.',
      'Retake CS 201 before choosing CS 401.',
    ],
  });
  expect(failure.planMessages).toEqual([
    'The selected course code is invalid.',
  ]);
  expect(failure.total).toBe(3);
});

test('a window rule sets the closed-window flag instead of a message', () => {
  const failure = failureFrom({
    window: ['Registration is closed.'],
  });

  expect(failure.windowClosed).toBe(true);
  expect(failure.planMessages).toEqual([]);
  expect(failure.total).toBe(0);
});
