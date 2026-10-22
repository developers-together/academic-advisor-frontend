import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { i18n } from '@/lib/i18n/i18n-instance';
import { mapEntry } from '@/testing/mocks/map-entry';
import { server } from '@/testing/mocks/server';
import { createUser, renderApp, screen, within } from '@/testing/test-utils';
import type { ElectiveGroup } from '@/types/domain';

import RecordRoute from '../record';

const electiveGroup: ElectiveGroup = {
  key: '1:1:1:Humanities',
  name: 'Humanities',
  required_passes: 1,
  remaining_passes: 0,
  status: 'satisfied',
  passed_course_codes: ['HUM 101'],
  committed_course_codes: ['HUM 101'],
  planned_course_codes: [],
  course_codes: ['HUM 101', 'HUM 102'],
};

const showElectiveRecord = async (group = electiveGroup) => {
  server.use(
    http.get(`${env.API_URL}/academic-record`, () =>
      HttpResponse.json({
        data: {
          cgpa: 3,
          curriculum_year_level: 2,
          history: [],
          last_synced_at: null,
          elective_groups: [group],
          prerequisite_map: group.course_codes.map((code) => ({
            ...mapEntry({
              course_code: code,
              state: group.passed_course_codes.includes(code)
                ? 'completed'
                : 'attempted',
            }),
            type: 'elective',
            elective_group: group,
            requirement_outstanding: group.status !== 'satisfied',
          })),
        },
      }),
    ),
  );
  await renderApp(<RecordRoute />, {
    user: await createUser(),
    path: '/app/record',
    url: '/app/record',
  });
};

test('keeps attempted compulsory requirements outstanding until passed', async () => {
  server.use(
    http.get(`${env.API_URL}/academic-record`, () =>
      HttpResponse.json({
        data: {
          cgpa: 3,
          curriculum_year_level: 2,
          history: [],
          last_synced_at: null,
          elective_groups: [],
          prerequisite_map: [
            mapEntry({ course_code: 'CS 101', state: 'attempted' }),
            mapEntry({ course_code: 'CS 102', state: 'completed' }),
            mapEntry({ course_code: 'CS 103', state: 'planned' }),
          ],
        },
      }),
    ),
  );
  await renderApp(<RecordRoute />, {
    user: await createUser(),
    path: '/app/record',
    url: '/app/record',
  });
  const requirements = await screen.findByRole('region', {
    name: 'Curriculum requirements',
  });
  const items = within(requirements).getAllByRole('listitem');
  expect(items[0]).toHaveTextContent('CS 101');
  expect(items[0]).toHaveTextContent('Outstanding');
  expect(items[1]).toHaveTextContent('CS 102');
  expect(items[1]).toHaveTextContent('Satisfied');
  expect(items[2]).toHaveTextContent('CS 103');
  expect(items[2]).toHaveTextContent('Outstanding');
});

test('counts a satisfied elective group without requiring every alternative to pass', async () => {
  await showElectiveRecord();
  const requirements = await screen.findByRole('region', {
    name: 'Curriculum requirements',
  });
  expect(within(requirements).getAllByRole('listitem')).toHaveLength(1);
  expect(requirements).toHaveTextContent('Humanities');
  expect(requirements).toHaveTextContent('Satisfied');
  expect(requirements).toHaveTextContent('1 passes required; 0 remaining');
  expect(screen.getByRole('img', { name: /100 percent/ })).toBeInTheDocument();
});

test('distinguishes committed retakes from provisional plan reservations', async () => {
  await showElectiveRecord({
    ...electiveGroup,
    required_passes: 2,
    remaining_passes: 2,
    status: 'outstanding',
    passed_course_codes: [],
    committed_course_codes: ['HUM 101'],
    planned_course_codes: ['HUM 102'],
  });
  const requirements = await screen.findByRole('region', {
    name: 'Curriculum requirements',
  });
  expect(requirements).toHaveTextContent('Retake required: HUM 101');
  expect(requirements).toHaveTextContent(
    'Reserved in your plan, not SIS registration: HUM 102',
  );
  expect(requirements).toHaveTextContent('2 passes required; 2 remaining');
});

test('explains unresolved elective counts in Arabic without inventing curriculum progress', async () => {
  await i18n.changeLanguage('ar');
  try {
    await showElectiveRecord({
      ...electiveGroup,
      required_passes: null,
      remaining_passes: null,
      status: 'unresolved',
    });
    const requirements = await screen.findByRole('region', {
      name: 'متطلبات الخطة الدراسية',
    });
    expect(requirements).toHaveTextContent(
      'يجب على الموظفين تحديد عدد المقررات المطلوب اجتيازها',
    );
    expect(screen.queryByRole('img', { name: /100/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'نسبة إكمال الخطة الدراسية غير متاحة حتى تحديد أعداد المقررات الاختيارية.',
      ),
    ).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('en');
  }
});

test('does not require a retake of a failed alternative after its elective group is satisfied', async () => {
  await showElectiveRecord({
    ...electiveGroup,
    committed_course_codes: ['HUM 101', 'HUM 102'],
  });
  const requirements = await screen.findByRole('region', {
    name: 'Curriculum requirements',
  });
  expect(requirements).toHaveTextContent('Satisfied');
  expect(requirements).not.toHaveTextContent('Retake required');
});
