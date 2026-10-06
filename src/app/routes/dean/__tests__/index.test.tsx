import { HttpResponse, http } from 'msw';
import { cloneElement } from 'react';

import DeanOverviewRoute from '@/app/routes/dean';
import { env } from '@/config/env';
import { i18n } from '@/lib/i18n/i18n-instance';
import { applyLanguage } from '@/lib/language';
import { governanceNode, seedGovernanceTree } from '@/testing/governance-tree';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      cloneElement(children, { width: 720, height: 280 } as never),
  };
});

const facultyTree = () =>
  governanceNode({
    level: 'faculty',
    code: 'F-ENG',
    nameEn: 'Engineering',
    metrics: {
      students: 2400,
      caseload: 980,
      approved: 610,
      completion_rate: 72,
      completion_is_final: false,
      median_decision_hours: 26,
      aging_count: 12,
    },
    children: [
      governanceNode({
        level: 'school',
        code: 'F-ENG-S1',
        nameEn: 'Engineering Applied School',
        metrics: { caseload: 500, approved: 400, completion_rate: 80 },
        children: [
          governanceNode({
            level: 'department',
            code: 'F-ENG-S1-D1',
            nameEn: 'Engineering Applied A',
            metrics: { caseload: 250, approved: 210, completion_rate: 84 },
          }),
        ],
      }),
      governanceNode({
        level: 'school',
        code: 'F-ENG-S2',
        nameEn: 'Engineering Core School',
        metrics: { caseload: 480, approved: 140, completion_rate: 30 },
        children: [
          governanceNode({
            level: 'department',
            code: 'F-ENG-S2-D1',
            nameEn: 'Engineering Core A',
            metrics: { caseload: 230, approved: 70, completion_rate: 30 },
          }),
          governanceNode({
            level: 'department',
            code: 'F-ENG-S2-D2',
            nameEn: 'Engineering Core B',
            metrics: {
              caseload: 250,
              approved: 0,
              completion_rate: null,
              median_decision_hours: null,
            },
          }),
        ],
      }),
    ],
  });

const deanSeesFaculty = async () => {
  const dean = await createUser({ role: 'dean', faculty: 'Engineering' });
  const view = await renderApp(<DeanOverviewRoute />, {
    user: dean,
    path: '/dean',
    url: '/dean',
  });
  return { dean, render: view };
};

const cardByContext = async (context: string) =>
  (await screen.findByText(context)).closest('div');

test('the overview renders the five KPI cards from the faculty metrics', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  const completion = await cardByContext('Live during the window');
  expect(completion).toHaveTextContent('Completion rate');
  expect(completion).toHaveTextContent('72%');

  const median = await cardByContext('Current term decided plans');
  expect(median).toHaveTextContent('Median decision time');
  expect(median).toHaveTextContent('26h');

  const aging = await cardByContext('Undecided past the aging threshold');
  expect(aging).toHaveTextContent('Aging');
  expect(aging).toHaveTextContent('12');

  const caseload = await cardByContext('Students with an assigned advisor');
  expect(caseload).toHaveTextContent('Caseload');
  expect(caseload).toHaveTextContent('980');

  const approved = await cardByContext('Approved and closed plans this term');
  expect(approved).toHaveTextContent('Approved');
  expect(approved).toHaveTextContent('610');
});

test('null completion and median render em dashes with their none-context lines', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [
        governanceNode({
          level: 'faculty',
          code: 'F-EDU',
          nameEn: 'Engineering',
          metrics: {
            caseload: 0,
            approved: 0,
            completion_rate: null,
            completion_is_final: false,
            median_decision_hours: null,
          },
          children: [
            governanceNode({
              level: 'school',
              code: 'F-EDU-S1',
              nameEn: 'Education School',
              metrics: { caseload: 0, completion_rate: null },
            }),
          ],
        }),
      ],
    }),
  );

  await deanSeesFaculty();

  const completion = await cardByContext('No assigned caseload yet');
  expect(completion).toHaveTextContent('Completion rate');
  expect(completion).toHaveTextContent('—');

  const median = await cardByContext('No decisions yet this term');
  expect(median).toHaveTextContent('Median decision time');
  expect(median).toHaveTextContent('—');
});

test('a dean without a faculty sees the no-faculty state without fetching', async () => {
  const dean = await createUser({ role: 'dean', faculty: null });

  await renderApp(<DeanOverviewRoute />, {
    user: dean,
    path: '/dean',
    url: '/dean',
  });

  expect(await screen.findByText('No faculty assigned')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Your dean account has no faculty assigned. Ask an administrator to finish setup.',
    ),
  ).toBeInTheDocument();
});

test('a 403 dashboard read renders the dean permission panel', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  server.use(
    http.get(`${env.API_URL}/governance/dashboard`, () =>
      HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      ),
    ),
  );

  await deanSeesFaculty();

  expect(
    await screen.findByText('This area is for Deans.'),
  ).toBeInTheDocument();
});

test('a missing tree renders the overview empty state', async () => {
  db.governanceTree.deleteMany({ where: {} });

  await deanSeesFaculty();

  expect(await screen.findByText('No overview data yet.')).toBeInTheDocument();
});

test('a failed dashboard read renders the error state with retry', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  server.use(
    http.get(`${env.API_URL}/governance/dashboard`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await deanSeesFaculty();

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

const PIPELINE_STATES = [
  'Draft',
  'Submitted',
  'Under review',
  'Returned',
  'Approved',
];
const TERMINAL_STATES = ['Expired', 'Closed', 'Withdrawn', 'Discarded'];

const funnelTable = () => screen.findByRole('table', { name: 'Plan funnel' });

test('the funnel charts all nine counts with pipeline and terminal groups and a text alternative', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  const view = await deanSeesFaculty();
  const container = view.render.container;

  expect(await screen.findByText('Pipeline')).toBeInTheDocument();
  expect(screen.getByText('Terminal')).toBeInTheDocument();

  const table = await funnelTable();
  const expectedCounts = [4, 6, 3, 2, 40, 2, 40, 1, 1];
  for (const [index, state] of [
    ...PIPELINE_STATES,
    ...TERMINAL_STATES,
  ].entries()) {
    const row = within(table).getByRole('row', {
      name: new RegExp(state),
    });
    expect(row).toHaveTextContent(String(expectedCounts[index]));
  }

  const bars = container.querySelectorAll('.recharts-bar-rectangle path');
  expect(bars).toHaveLength(9);
  const pipelineFills = container.querySelectorAll(
    'path[fill="var(--color-data-pipeline)"]',
  );
  const terminalFills = container.querySelectorAll(
    'path[fill="var(--color-data-terminal)"]',
  );
  expect(pipelineFills).toHaveLength(5);
  expect(terminalFills).toHaveLength(4);

  const tickTexts = Array.from(container.querySelectorAll('svg text')).map(
    (node) => node.textContent ?? '',
  );
  expect(tickTexts).toContain('Draft');
  expect(tickTexts).toContain('Discarded');
});

test('an all-zero funnel renders the settled empty state', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [
        governanceNode({
          level: 'faculty',
          code: 'F-ENG',
          nameEn: 'Engineering',
          metrics: {
            funnel: {
              draft: 0,
              submitted: 0,
              under_review: 0,
              returned: 0,
              approved: 0,
              expired: 0,
              closed: 0,
              withdrawn: 0,
              discarded: 0,
            },
          },
        }),
      ],
    }),
  );

  await deanSeesFaculty();

  expect(await screen.findByText('No plans yet this term')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Counts appear as students build and submit plans for 2026F.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: 'Plan funnel' }),
  ).not.toBeInTheDocument();
});

test('the funnel flips its category axis for RTL', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  const view = await deanSeesFaculty();
  const container = view.render.container;

  await funnelTable();

  const tickXOf = (label: string) => {
    const node = Array.from(container.querySelectorAll('svg text')).find(
      (candidate) => candidate.textContent === label,
    );
    return Number(node?.getAttribute('x') ?? Number.NaN);
  };

  expect(tickXOf('Draft')).toBeLessThan(360);

  await i18n.changeLanguage('ar');
  const arabicTable = await screen.findByRole('table');
  const stateCells = within(arabicTable)
    .getAllByRole('row')
    .slice(1)
    .map((row) => (row as HTMLTableRowElement).cells[0].textContent ?? '');
  expect(stateCells).toHaveLength(9);

  await waitFor(() => expect(tickXOf(stateCells[0])).toBeGreaterThan(360));
  expect(tickXOf(stateCells[8])).toBeLessThan(360);

  await i18n.changeLanguage('en');
});

test('child grid cells band by absolute rate and carry the rate in the cell', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  const applied = await screen.findByRole('link', {
    name: /Engineering Applied School/,
  });
  expect(applied).toHaveClass('bg-data-4', 'text-data-4-foreground');
  expect(applied).toHaveTextContent('80%');

  const core = screen.getByRole('link', { name: /Engineering Core School/ });
  expect(core).toHaveClass('bg-data-2', 'text-data-2-foreground');
  expect(core).toHaveTextContent('30%');
});

test('a child without a completion rate renders the no-data cell', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await renderApp(<DeanOverviewRoute />, {
    user: await createUser({ role: 'dean', faculty: 'Engineering' }),
    path: '/dean',
    url: '/dean?node=F-ENG-S2',
  });

  const noData = await screen.findByRole('link', {
    name: /Engineering Core B/,
  });
  expect(noData).toHaveClass('bg-muted', 'text-muted-foreground');
  expect(noData).toHaveTextContent('No data');
});

test('activating a child cell scopes the page through the node parameter', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  await user.click(
    await screen.findByRole('link', { name: /Engineering Applied School/ }),
  );

  const caseload = await screen.findByText('Students with an assigned advisor');
  expect(caseload.closest('div')).toHaveTextContent('500');
  expect(
    await screen.findByRole('link', { name: /Engineering Applied A/ }),
  ).toHaveClass('bg-data-4', 'text-data-4-foreground');
});

test('the header export downloads the faculty csv and toasts the settled line', async () => {
  let downloaded: string | undefined;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function mockClick(this: HTMLAnchorElement) {
      downloaded = this.download;
    });
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();

  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  const user = userEvent.setup();
  const view = await deanSeesFaculty();
  const container = view.render.container;

  await funnelTable();
  await user.click(await screen.findByRole('button', { name: 'Export CSV' }));

  expect(await screen.findByText('CSV export generated.')).toBeInTheDocument();
  expect(downloaded).toBe('governance-2026F.csv');
  expect(container).not.toHaveTextContent('This area is for Deans.');

  clickSpy.mockRestore();
});

test('a 403 export renders the dean denied panel', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  server.use(
    http.get(`${env.API_URL}/governance/export`, () =>
      HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      ),
    ),
  );

  const user = userEvent.setup();
  await deanSeesFaculty();

  await user.click(await screen.findByRole('button', { name: 'Export CSV' }));

  // A denied export keeps the aggregates on screen and flags the denial
  // instead of replacing the page (design.md DP-10).
  expect(
    await screen.findByText('You do not have access to this content.'),
  ).toBeInTheDocument();
  await deanSeesFaculty();
});

test('the overview carries no mutation affordances', async () => {
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  await screen.findByRole('table', { name: 'Plan funnel' });

  const buttons = screen.getAllByRole('button');
  for (const button of buttons) {
    expect(button).toHaveAccessibleName('Export CSV');
  }
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  const comboboxes = screen.getAllByRole('combobox');
  for (const combobox of comboboxes) {
    expect(combobox).toHaveAccessibleName('Filter by school');
  }
});

const recordDashboardRequests = () => {
  const urls: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/governance/dashboard')) {
      urls.push(request.url);
    }
  });
  return urls;
};

afterEach(() => {
  server.events.removeAllListeners();
});

test('the overview loads on the school and department grouping without group_by', async () => {
  const urls = recordDashboardRequests();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  expect(
    screen.getByRole('tab', { name: 'By school/department' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    expect(url).not.toContain('group_by=');
  }
  expect(
    await screen.findByRole('link', { name: /Engineering Applied School/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Engineering Core School/ }),
  ).toBeInTheDocument();
});

const advisorNodes = () => [
  governanceNode({
    level: 'advisor',
    code: 'AD-101',
    nameEn: 'Layla Hassan',
    metrics: { caseload: 32, approved: 28, completion_rate: 88 },
  }),
  governanceNode({
    level: 'advisor',
    code: 'AD-102',
    nameEn: 'Omar Fathi',
    metrics: { caseload: 30, approved: 9, completion_rate: 30 },
  }),
];

test('the grouping toggle queries the advisor view and renders advisor nodes', async () => {
  const user = userEvent.setup();
  const urls = recordDashboardRequests();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
    advisorNodes(),
  );

  await deanSeesFaculty();

  await user.click(screen.getByRole('tab', { name: 'By advisor' }));

  const layla = await screen.findByText('Layla Hassan');
  expect(layla.closest('div')).toHaveTextContent('88%');
  expect(screen.getByText('Omar Fathi')).toBeInTheDocument();
  expect(screen.getByText('Omar Fathi').closest('div')).toHaveTextContent(
    '30%',
  );
  expect(
    screen.queryByRole('link', { name: /Layla Hassan/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'By advisor' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(
    screen.getByRole('tab', { name: 'By school/department' }),
  ).toHaveAttribute('aria-selected', 'false');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(urls.some((url) => url.includes('group_by=advisor'))).toBe(true);

  const completion = await screen.findByText('Live during the window');
  expect(completion.closest('div')).toHaveTextContent('72%');

  await user.click(screen.getByRole('tab', { name: 'By school/department' }));

  expect(
    await screen.findByRole('link', { name: /Engineering Applied School/ }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Layla Hassan')).not.toBeInTheDocument();
});

test('the grouping toggle and filter render Arabic labels and advisor names under RTL', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
    [
      governanceNode({
        level: 'advisor',
        code: 'AD-101',
        nameEn: 'Layla Hassan',
        nameAr: 'ليلى حسن',
        metrics: { caseload: 32, approved: 28, completion_rate: 88 },
      }),
    ],
  );

  await deanSeesFaculty();

  expect(
    await screen.findByRole('link', { name: /Engineering Applied School/ }),
  ).toBeInTheDocument();

  applyLanguage('ar');

  expect(
    await screen.findByRole('tab', { name: 'حسب المرشد' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'حسب المدرسة/القسم' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('combobox', { name: 'تصفية حسب المدرسة' }),
  ).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');
  expect(document.documentElement).toHaveAttribute('lang', 'ar');

  await user.click(screen.getByRole('tab', { name: 'حسب المرشد' }));

  const layla = await screen.findByText('ليلى حسن');
  expect(layla.closest('div')).toHaveTextContent('88%');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

  applyLanguage('en');
  expect(document.documentElement.dir).toBe('ltr');
});

test('the school filter narrows the visible child cells', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await deanSeesFaculty();

  expect(
    await screen.findByRole('link', { name: /Engineering Applied School/ }),
  ).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Filter by school' }),
    'F-ENG-S2',
  );

  expect(
    screen.queryByRole('link', { name: /Engineering Applied School/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Engineering Core School/ }),
  ).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Filter by school' }),
    'all',
  );

  expect(
    screen.getByRole('link', { name: /Engineering Applied School/ }),
  ).toBeInTheDocument();
});

test('the department filter narrows the cells inside a school', async () => {
  const user = userEvent.setup();
  seedGovernanceTree(
    governanceNode({
      level: 'university',
      nameEn: 'E-JUST',
      children: [facultyTree()],
    }),
  );

  await renderApp(<DeanOverviewRoute />, {
    user: await createUser({ role: 'dean', faculty: 'Engineering' }),
    path: '/dean',
    url: '/dean?node=F-ENG-S2',
  });

  expect(
    await screen.findByRole('link', { name: /Engineering Core A/ }),
  ).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Filter by department' }),
    'F-ENG-S2-D2',
  );

  expect(
    screen.queryByRole('link', { name: /Engineering Core A/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Engineering Core B/ }),
  ).toBeInTheDocument();
});
