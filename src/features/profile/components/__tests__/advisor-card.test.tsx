import { AdvisorCard } from '@/features/profile/components/advisor-card';
import { db } from '@/testing/mocks/db';
import { createUser, renderApp, screen } from '@/testing/test-utils';

const seedAdvisor = () => {
  if (!db.user.findFirst({ where: { id: { equals: 2 as number } } })) {
    db.user.create({
      id: 2,
      name: 'Amr Advisor',
      email: 'advisor@ejust.edu.eg',
      password: 'password123',
      role: 'advisor',
    });
  }
  if (
    !db.advisorProfile.findFirst({
      where: { advisorId: { equals: 2 as number } },
    })
  ) {
    db.advisorProfile.create({
      advisorId: 2,
      rows: JSON.stringify([{ day: 'Sunday', from: '10:00', to: '12:00' }]),
      office_location: 'Building 3, Room 2140',
    });
  }
};

test('the advisor card shows the office location as a row like the hours rows', async () => {
  const student = await createUser({ advisor_id: 2 });
  seedAdvisor();

  await renderApp(<AdvisorCard />, { user: student, path: '/', url: '/' });

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.getByText('Office location')).toBeInTheDocument();
  expect(screen.getByText('Building 3, Room 2140')).toBeInTheDocument();
  expect(screen.getByText('Sunday 10:00-12:00')).toBeInTheDocument();
});

test('an unset office location renders the empty line', async () => {
  const student = await createUser({ advisor_id: 2 });
  seedAdvisor();
  db.advisorProfile.update({
    where: { advisorId: { equals: 2 as number } },
    data: { office_location: null as unknown as string },
  });

  await renderApp(<AdvisorCard />, { user: student, path: '/', url: '/' });

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.getByText('No office location set yet.')).toBeInTheDocument();
});
