import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { GovernanceNode } from '@/types/domain';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { deniesPermission, injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

const treeOf = (): GovernanceNode | null => {
  const row = db.governanceTree.findFirst({
    where: { id: { equals: 'university' } },
  });
  return row ? (JSON.parse(row.payload) as GovernanceNode) : null;
};

const advisorsOf = (): GovernanceNode[] =>
  db.governanceAdvisor
    .getAll()
    .map((row) => JSON.parse(row.payload) as GovernanceNode);

const scopedToFaculty = (
  root: GovernanceNode,
  faculty: string | null,
): GovernanceNode | null =>
  faculty
    ? (root.children.find((child) => child.name_en === faculty) ?? null)
    : null;

const csvEscape = (value: string | number | null) => {
  const text = value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const csvRows = (node: GovernanceNode): string[] => {
  const metrics = node.metrics;
  const row = [
    node.level,
    node.code,
    node.name_en,
    node.term_code,
    metrics.students,
    metrics.caseload,
    metrics.approved,
    metrics.completion_rate,
    metrics.median_decision_hours,
    metrics.aging_count,
    metrics.funnel.draft,
    metrics.funnel.submitted,
    metrics.funnel.under_review,
    metrics.funnel.returned,
    metrics.funnel.approved,
    metrics.funnel.expired,
    metrics.funnel.closed,
    metrics.funnel.withdrawn,
    metrics.funnel.discarded,
  ].map(csvEscape);
  return [row.join(','), ...node.children.flatMap((child) => csvRows(child))];
};

const governanceCsvOf = (root: GovernanceNode): string =>
  [
    'level,code,name,term,students,caseload,approved,completion_rate,median_decision_hours,aging_count,draft,submitted,under_review,returned,approved,expired,closed,withdrawn,discarded',
    ...csvRows(root),
  ].join('\n');

export const governanceHandlers = [
  http.get(`${env.API_URL}/governance/dashboard`, async ({ request }) => {
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
    const root = treeOf();
    if (!root) {
      return HttpResponse.json(
        { message: 'No governance data yet.' },
        { status: 404 },
      );
    }
    if (user.role === 'dean') {
      const faculty = scopedToFaculty(root, user.faculty);
      if (!faculty) {
        return HttpResponse.json(
          { message: 'No faculty is assigned to you yet.' },
          { status: 404 },
        );
      }
      const groupBy = new URL(request.url).searchParams.get('group_by');
      if (groupBy === 'advisor') {
        return HttpResponse.json({
          data: { ...faculty, children: advisorsOf() },
        });
      }
      return HttpResponse.json({ data: faculty });
    }
    if (user.role === 'vp') {
      return HttpResponse.json({ data: root });
    }
    return HttpResponse.json(
      { message: 'This action is unauthorized.' },
      { status: 403 },
    );
  }),

  http.get(`${env.API_URL}/governance/export`, async ({ request }) => {
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
    const root = treeOf();
    if (!root) {
      return HttpResponse.json(
        { message: 'No governance data yet.' },
        { status: 404 },
      );
    }
    const scope =
      user.role === 'dean' ? scopedToFaculty(root, user.faculty) : root;
    if (!scope) {
      return HttpResponse.json(
        { message: 'No faculty is assigned to you yet.' },
        { status: 404 },
      );
    }
    return new HttpResponse(governanceCsvOf(scope), {
      headers: { 'Content-Type': 'text/csv' },
    });
  }),
];
