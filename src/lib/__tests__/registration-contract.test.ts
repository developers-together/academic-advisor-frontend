import { registerInputSchema } from '../auth';

test('registration leaves the optional student ID and email domain verification to the server', () => {
  const result = registerInputSchema.safeParse({
    name: 'Sara Student',
    email: 'sara@another-university.edu',
    studentId: '',
    nationalId: '30001011234567',
    password: 'secret1234',
    passwordConfirmation: 'secret1234',
    language_preference: 'en',
  });

  expect(result.success).toBe(true);
});
