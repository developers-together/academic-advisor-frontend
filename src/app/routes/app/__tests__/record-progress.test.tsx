import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { i18n } from '@/lib/i18n/i18n-instance';
import { mapEntry } from '@/testing/mocks/map-entry';
import { server } from '@/testing/mocks/server';
import { createUser, renderApp, screen } from '@/testing/test-utils';
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

test('counts a satisfied elective group toward curriculum progress without requiring every alternative to pass', async () => {
  await showElectiveRecord();
  expect(screen.getByRole('img', { name: /100 percent/ })).toBeInTheDocument();
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
