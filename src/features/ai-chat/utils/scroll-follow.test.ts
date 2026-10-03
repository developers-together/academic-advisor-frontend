import { describe, expect, test } from 'vitest';

import { isPinnedAtBottom } from '@/features/ai-chat/utils/scroll-follow';

describe('isPinnedAtBottom', () => {
  test('a transcript is pinned only while its bottom sits within the threshold', () => {
    const box = { scrollHeight: 2000, clientHeight: 500 };
    expect(isPinnedAtBottom({ ...box, scrollTop: 1500 })).toBe(true);
    expect(isPinnedAtBottom({ ...box, scrollTop: 1460 })).toBe(true);
    expect(isPinnedAtBottom({ ...box, scrollTop: 1400 })).toBe(false);
  });
});
