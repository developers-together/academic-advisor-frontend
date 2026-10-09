import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';

import { getAdminRulesQueryOptions } from '@/features/admin/api/get-admin-rules';
import { getAdminStudentsQueryOptions } from '@/features/admin/api/get-admin-students';
import { getQueueAgingThresholdQueryOptions } from '@/features/admin/api/get-queue-aging-threshold';
import { getAvailabilityQueryOptions } from '@/features/advisor-hours/api/get-availability';
import { getMeetingRequestsQueryOptions } from '@/features/advisor-meetings/api/get-meeting-requests';
import { getAdvisorQueueQueryOptions } from '@/features/advisor-queue/api/get-advisor-queue';
import { getCaseloadQueryOptions } from '@/features/advisor-students/api/get-caseload';
import {
  getConversationQueryOptions,
  getConversationsQueryOptions,
} from '@/features/ai-chat/api/conversations';
import { getGovernanceDashboardQueryOptions } from '@/features/governance/api/get-governance-dashboard';
import { useNotifications } from '@/features/notifications/api/get-notifications';
import { getPlanQueryOptions } from '@/features/plan/api/get-plan';
import { getPlanCommentsQueryOptions } from '@/features/plan/api/get-plan-comments';
import { getAcademicRecordQueryOptions } from '@/lib/api/academic-record';
import { queryConfig } from '@/lib/react-query';

const minute = 60 * 1000;

describe('settled per-family query freshness (acad-abl.13 rules 24-27)', () => {
  test('global defaults are 60 seconds stale, no focus refetch, bounded recovery', () => {
    expect(queryConfig.queries).toMatchObject({
      staleTime: minute,
      refetchOnWindowFocus: false,
      retry: expect.any(Function),
      retryDelay: 500,
    });
  });

  test('plan and its comments are always stale', () => {
    expect(getPlanQueryOptions()).toMatchObject({
      queryKey: ['plan'],
      staleTime: 0,
    });
    expect(getPlanCommentsQueryOptions()).toMatchObject({
      queryKey: ['plan', 'comments'],
      staleTime: 0,
    });
  });

  test('the conversation list is fresh for 30 seconds, an open conversation is always stale', () => {
    expect(getConversationsQueryOptions()).toMatchObject({
      staleTime: 30 * 1000,
    });
    expect(getConversationQueryOptions(7)).toMatchObject({
      staleTime: 0,
    });
  });

  test('the academic record is fresh for 5 minutes', () => {
    expect(getAcademicRecordQueryOptions()).toMatchObject({
      queryKey: ['academic-record'],
      staleTime: 5 * minute,
    });
  });

  test('operational advisor lists are fresh for 30 seconds and refetch on focus', () => {
    expect(getAdvisorQueueQueryOptions()).toMatchObject({
      queryKey: ['advisor', 'queue'],
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    });
    expect(getCaseloadQueryOptions()).toMatchObject({
      queryKey: ['advisor', 'caseload'],
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    });
    expect(getMeetingRequestsQueryOptions()).toMatchObject({
      queryKey: ['advisor', 'meeting-requests'],
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    });
  });

  test('availability, governance, and admin read precomputed data for 5 minutes', () => {
    expect(getAvailabilityQueryOptions()).toMatchObject({
      queryKey: ['advisor', 'availability'],
      staleTime: 5 * minute,
    });
    expect(getGovernanceDashboardQueryOptions()).toMatchObject({
      queryKey: ['governance', 'dashboard'],
      staleTime: 5 * minute,
    });
    expect(
      getAdminStudentsQueryOptions({ search: '', perPage: 10, page: 1 }),
    ).toMatchObject({
      staleTime: 5 * minute,
    });
    expect(getAdminRulesQueryOptions()).toMatchObject({
      staleTime: 5 * minute,
    });
    expect(getQueueAgingThresholdQueryOptions()).toMatchObject({
      staleTime: 5 * minute,
    });
  });

  test('notifications poll every 30 seconds in the foreground only', () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useNotifications(), { wrapper });

    const [observer] = client.getQueryCache().getAll()[0].observers;
    expect(observer.options.refetchInterval).toBe(30_000);
    expect(observer.options.refetchIntervalInBackground).toBe(false);
  });
});
