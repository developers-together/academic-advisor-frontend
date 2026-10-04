import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { env } from '@/config/env';
import { governanceNode, seedGovernanceTree } from '@/testing/governance-tree';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  loginAsUser,
  screen,
  waitFor,
  within,
  type MockUser,
} from '@/testing/test-utils';

const universityTree = () =>
  governanceNode({
    level: 'university',
    nameEn: 'E-JUST',
    metrics: { students: 5000, caseload: 2000, approved: 1000 },
    children: [
      governanceNode({
        level: 'faculty',
        code: 'F-ENG',
        nameEn: 'Engineering',
        deans: [{ id: 11, name: 'Omar Khaled' }],
        metrics: {
          students: 2400,
          caseload: 980,
          approved: 392,
          completion_rate: 40,
          median_decision_hours: 26,
          aging_count: 30,
        },
        children: [
          governanceNode({
            level: 'school',
            code: 'F-ENG-S1',
            nameEn: 'Engineering Applied School',
            metrics: { completion_rate: 55 },
            children: [
              governanceNode({
                level: 'department',
                code: 'F-ENG-S1-D1',
                nameEn: 'Engineering Applied A',
                metrics: { completion_rate: 61 },
              }),
            ],
          }),
        ],
      }),
      governanceNode({
        level: 'faculty',
        code: 'F-SCI',
        nameEn: 'Science',
        nameAr: 'العلوم',
        deans: [{ id: 12, name: 'Salma Ibrahim' }],
        metrics: {
          students: 1500,
          caseload: 610,
          approved: 488,
          completion_rate: 80,
          median_decision_hours: 34,
          aging_count: 12,
        },
        children: [
          governanceNode({
            level: 'school',
            code: 'F-SCI-S1',
            nameEn: 'Science School',
            metrics: { completion_rate: 82 },
            children: [
              governanceNode({
                level: 'department',
                code: 'F-SCI-S1-D1',
                nameEn: 'Science A',
                metrics: { completion_rate: 88 },
              }),
            ],
          }),
        ],
      }),
      governanceNode({
        level: 'faculty',
        code: 'F-EDU',
        nameEn: 'Education',
        metrics: {
          students: 300,
          caseload: 0,
          approved: 0,
          completion_rate: null,
          median_decision_hours: null,
          aging_count: 0,
        },
      }),
    ],
  });

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const vpSeesScorecard = async (
  overrides: Partial<MockUser> = {},
): Promise<MockUser> => {
  const vp = await createUser({ role: 'vp', ...overrides });
  await loginAsUser(vp);
  renderRealRouter('/vp/faculties');
  return vp;
};

test('the scorecard lists faculties by completion descending with nulls last', async () => {
  seedGovernanceTree(universityTree());

  await vpSeesScorecard();

  const table = await screen.findByRole('table');
  const rows = within(table).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(3);
  expect(rows[0]).toHaveTextContent('Science');
  expect(rows[1]).toHaveTextContent('Engineering');
  expect(rows[2]).toHaveTextContent('Education');

  const science = rows[0];
  expect(within(science).getByText('1500')).toBeInTheDocument();
  expect(within(science).getByText('610')).toBeInTheDocument();
  expect(within(science).getByText('488')).toBeInTheDocument();
  expect(within(science).getByText('80%')).toBeInTheDocument();
  expect(within(science).getByText('34h')).toBeInTheDocument();
  expect(within(science).getByText('12')).toBeInTheDocument();

  const education = rows[2];
  expect(within(education).getAllByText('—').length).toBeGreaterThanOrEqual(2);
});

test('the scorecard never names deans beside faculty statistics', async () => {
  seedGovernanceTree(universityTree());

  await vpSeesScorecard();

  await screen.findByRole('table');
  const body =
    (await screen.findByRole('main').then((main) => main.textContent)) ?? '';
  expect(body).not.toContain('Salma Ibrahim');
  expect(body).not.toContain('Omar Khaled');
  expect(body).not.toContain('No dean assigned yet.');
});

test('the completion header carries aria-sort and other headers do not', async () => {
  seedGovernanceTree(universityTree());

  await vpSeesScorecard();

  const table = await screen.findByRole('table');
  const headers = within(table).getAllByRole('columnheader');
  const sorted = headers.filter((header) => header.hasAttribute('aria-sort'));
  expect(sorted).toHaveLength(1);
  expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
  expect(sorted[0]).toHaveTextContent('Completion');
});

test('activating a row navigates to the drill-down scoped to the faculty', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(universityTree());

  await vpSeesScorecard();

  const table = await screen.findByRole('table');
  const rows = within(table).getAllByRole('row').slice(1);
  await user.click(within(rows[0]).getByText('Science'));

  expect(
    await screen.findByRole('heading', { name: 'Drill-down' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Faculty . Science')).toBeInTheDocument();
  expect(window.location.search).toBe('?node=F-SCI');
});

test('export downloads governance-{term}.csv, shows the busy state, and toasts the settled line', async () => {
  let downloaded: string | undefined;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function mockClick(this: HTMLAnchorElement) {
      downloaded = this.download;
    });
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();

  let resolveExport: (() => void) | undefined;
  server.use(
    http.get(`${env.API_URL}/governance/export`, async () => {
      await new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
      return new HttpResponse('level,code\nfaculty,F-SCI\n', {
        headers: { 'Content-Type': 'text/csv' },
      });
    }),
  );

  seedGovernanceTree(universityTree());
  const user = userEvent.setup();
  await vpSeesScorecard();

  await screen.findByRole('table');
  await user.click(await screen.findByRole('button', { name: 'Export CSV' }));

  const button = screen.getByRole('button', { name: /Export CSV/ });
  await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));

  resolveExport?.();

  expect(await screen.findByText('CSV export generated.')).toBeInTheDocument();
  expect(downloaded).toBe('governance-2026F.csv');

  clickSpy.mockRestore();
});

test('a 403 export renders the denied panel', async () => {
  seedGovernanceTree(universityTree());

  server.use(
    http.get(`${env.API_URL}/governance/export`, () =>
      HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      ),
    ),
  );

  const user = userEvent.setup();
  await vpSeesScorecard();

  await user.click(await screen.findByRole('button', { name: 'Export CSV' }));

  expect(
    await screen.findByText('This area is for Vice Presidents.'),
  ).toBeInTheDocument();
});

test('a 403 scorecard read renders the VP permission panel', async () => {
  seedGovernanceTree(universityTree());

  server.use(
    http.get(`${env.API_URL}/governance/dashboard`, () =>
      HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      ),
    ),
  );

  await vpSeesScorecard();

  expect(
    await screen.findByText('This area is for Vice Presidents.'),
  ).toBeInTheDocument();
});

test('a missing tree renders the scorecard empty state', async () => {
  db.governanceTree.deleteMany({ where: {} });

  await vpSeesScorecard();

  expect(await screen.findByText('No scorecard data yet.')).toBeInTheDocument();
});

test('the scorecard carries no mutation affordances', async () => {
  seedGovernanceTree(universityTree());

  await vpSeesScorecard();

  const main = await screen.findByRole('main');
  await within(main).findByRole('table');

  const buttons = within(main).getAllByRole('button');
  for (const button of buttons) {
    expect(button).toHaveAccessibleName(/Export CSV/);
  }
  expect(within(main).queryByRole('textbox')).not.toBeInTheDocument();
  expect(within(main).queryByRole('checkbox')).not.toBeInTheDocument();
});
