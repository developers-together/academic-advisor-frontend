import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { governanceNode, seedGovernanceTree } from '@/testing/governance-tree';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { createUser, loginAsUser, screen } from '@/testing/test-utils';

const universityTree = () =>
  governanceNode({
    level: 'university',
    nameEn: 'E-JUST',
    children: [
      governanceNode({
        level: 'faculty',
        code: 'F-SCI',
        nameEn: 'Science',
        metrics: { completion_rate: 80, students: 1500, caseload: 610 },
        children: [
          governanceNode({
            level: 'school',
            code: 'F-SCI-S1',
            nameEn: 'Science School',
            metrics: { completion_rate: 82, students: 750, caseload: 300 },
            children: [
              governanceNode({
                level: 'department',
                code: 'F-SCI-S1-D1',
                nameEn: 'Science A',
                metrics: { completion_rate: 88, students: 380, caseload: 150 },
              }),
            ],
          }),
        ],
      }),
      governanceNode({
        level: 'faculty',
        code: 'F-ENG',
        nameEn: 'Engineering',
        metrics: { completion_rate: 40, students: 2400, caseload: 980 },
        children: [
          governanceNode({
            level: 'school',
            code: 'F-ENG-S1',
            nameEn: 'Engineering Applied School',
            metrics: { completion_rate: 55 },
          }),
        ],
      }),
    ],
  });

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const countDashboardReads = () => {
  let reads = 0;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (
      url.pathname.endsWith('/governance/dashboard') &&
      request.method === 'GET'
    ) {
      reads += 1;
    }
  });
  return () => reads;
};

test('the drill-down walks university to department over one cached payload', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(universityTree());
  const vp = await createUser({ role: 'vp' });
  await loginAsUser(vp);
  const countReads = countDashboardReads();
  renderRealRouter('/vp/drilldown');

  expect(await screen.findByText('University . E-JUST')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Engineering' })).toBeInTheDocument();

  await user.click(await screen.findByRole('link', { name: 'Science' }));

  expect(await screen.findByText('Faculty . Science')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Science School' }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: 'Science School' }));

  expect(
    await screen.findByText('School . Science School'),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Science A' })).toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: 'University' }));

  expect(await screen.findByText('University . E-JUST')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Engineering' })).toBeInTheDocument();

  expect(countReads()).toBe(1);
});

test('a deep link scopes the drill-down without refetching the tree', async () => {
  seedGovernanceTree(universityTree());
  const vp = await createUser({ role: 'vp' });
  await loginAsUser(vp);
  const countReads = countDashboardReads();
  renderRealRouter('/vp/drilldown?node=F-ENG');

  expect(await screen.findByText('Faculty . Engineering')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Engineering Applied School' }),
  ).toBeInTheDocument();
  expect(countReads()).toBe(1);
});

test('a scoped leaf shows the empty children line', async () => {
  seedGovernanceTree(universityTree());
  const vp = await createUser({ role: 'vp' });
  await loginAsUser(vp);
  renderRealRouter('/vp/drilldown?node=F-ENG-S1');

  expect(
    await screen.findByText('School . Engineering Applied School'),
  ).toBeInTheDocument();
  expect(await screen.findByText('No rows to show.')).toBeInTheDocument();
});

test('a missing tree renders the drill-down empty state', async () => {
  db.governanceTree.deleteMany({ where: {} });

  const vp = await createUser({ role: 'vp' });
  await loginAsUser(vp);
  renderRealRouter('/vp/drilldown');

  expect(
    await screen.findByText('No drill-down data yet.'),
  ).toBeInTheDocument();
});
