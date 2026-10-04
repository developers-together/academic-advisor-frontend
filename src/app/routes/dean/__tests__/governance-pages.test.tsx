import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { governanceNode, seedGovernanceTree } from '@/testing/governance-tree';
import {
  createUser,
  loginAsUser,
  render as rtlRender,
  screen,
  within,
} from '@/testing/test-utils';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const treeWithAdvisors = () =>
  governanceNode({
    level: 'university',
    nameEn: 'E-JUST',
    children: [
      governanceNode({
        level: 'faculty',
        code: 'F-ENG',
        nameEn: 'Engineering',
        metrics: {
          students: 100,
          caseload: 40,
          approved: 20,
          completion_rate: 50,
          median_decision_hours: 24,
          aging_count: 3,
        },
        children: [
          governanceNode({
            level: 'school',
            code: 'F-ENG-S1',
            nameEn: 'Engineering Applied School',
            children: [
              governanceNode({
                level: 'department',
                code: 'F-ENG-S1-D1',
                nameEn: 'Engineering Applied A',
                advisors: [
                  {
                    id: 1,
                    name: 'Hoda Selim',
                    unit_en: 'Engineering Applied A',
                    unit_ar: null,
                    caseload: 22,
                    queue_size: 3,
                    median_decision_hours: 26,
                    aging_count: 1,
                    approved: 14,
                    completion_rate: 64,
                  },
                  {
                    id: 2,
                    name: 'Samir Nasr',
                    unit_en: 'Engineering Applied A',
                    unit_ar: null,
                    caseload: 19,
                    queue_size: 2,
                    median_decision_hours: 20,
                    aging_count: 0,
                    approved: 12,
                    completion_rate: 63,
                  },
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const deanSeesAdvisors = async () => {
  seedGovernanceTree(treeWithAdvisors());
  const dean = await createUser({ role: 'dean', faculty: 'Engineering' });
  await loginAsUser(dean);
  renderRealRouter('/dean/advisors');
  return dean;
};

test('the dean advisors view renders aggregate advisor rows', async () => {
  await deanSeesAdvisors();

  expect(
    await screen.findByRole('heading', { name: 'Advisors' }),
  ).toBeInTheDocument();
  const table = await screen.findByRole('table');
  const rows = within(table).getAllByRole('row').slice(1);
  expect(rows.length).toBeGreaterThan(0);
  expect(within(table).getAllByText('Engineering Applied A').length).toBe(
    rows.length,
  );
  expect(
    screen.queryByRole('button', { name: /approve/i }),
  ).not.toBeInTheDocument();
});

test('the dean analytics view renders the completion trend with a text alternative', async () => {
  seedGovernanceTree(treeWithAdvisors());
  const dean = await createUser({ role: 'dean', faculty: 'Engineering' });
  await loginAsUser(dean);
  renderRealRouter('/dean/analytics');

  expect(
    await screen.findByRole('heading', { name: 'Analytics' }),
  ).toBeInTheDocument();
  expect(
    (await screen.findAllByText('Completion rate by term')).length,
  ).toBeGreaterThan(0);
  expect(
    await screen.findByText('Is advising performance in your area improving?'),
  ).toBeInTheDocument();
  expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
});

test('the vp payload strips advisor rows from every node', async () => {
  seedGovernanceTree(treeWithAdvisors());
  const vp = await createUser({ role: 'vp' });
  await loginAsUser(vp);

  const { api } = await import('@/lib/api-client');
  const envelope = await api.get('/governance/dashboard');
  const payload = JSON.stringify(envelope);

  expect(payload).toContain('trends');
  expect(payload).not.toContain('advisors');
});
