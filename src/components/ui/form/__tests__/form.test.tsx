import { FieldError, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { rtlRender, screen, waitFor, userEvent } from '@/testing/test-utils';

import { Form } from '../form';
import { Input } from '../input';

const testData = {
  title: 'Hello World',
};

const schema = z.object({
  title: z.string().min(1, 'Required'),
});

test('should render and submit a basic Form component', async () => {
  const handleSubmit = vi.fn() as SubmitHandler<z.infer<typeof schema>>;

  rtlRender(
    <Form onSubmit={handleSubmit} schema={schema} id="my-form">
      {({ register, formState }) => (
        <>
          <Input
            label="Title"
            error={formState.errors['title']}
            registration={register('title')}
          />

          <Button name="submit" type="submit" className="w-full">
            Submit
          </Button>
        </>
      )}
    </Form>,
  );

  await userEvent.type(screen.getByLabelText(/title/i), testData.title);

  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() =>
    expect(handleSubmit).toHaveBeenCalledWith(testData, expect.anything()),
  );
});

test('should fail submission if validation fails', async () => {
  const handleSubmit = vi.fn() as SubmitHandler<z.infer<typeof schema>>;

  rtlRender(
    <Form onSubmit={handleSubmit} schema={schema} id="my-form">
      {({ register, formState }) => (
        <>
          <Input
            label="Title"
            error={formState.errors['title']}
            registration={register('title')}
          />

          <Button name="submit" type="submit" className="w-full">
            Submit
          </Button>
        </>
      )}
    </Form>,
  );

  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  await screen.findByRole('alert', { name: /required/i });

  expect(handleSubmit).toHaveBeenCalledTimes(0);
});

test('wires label, field, and error together with real ids (DS-A-04)', () => {
  const error = { message: 'Required', type: 'manual' } as FieldError;

  rtlRender(<Input label="Title" error={error} />);

  const input = screen.getByLabelText(/title/i);
  expect(input.id).toBeTruthy();
  expect(input).toHaveAttribute('aria-invalid', 'true');

  const label = screen.getByText('Title');
  expect(label).toHaveAttribute('for', input.id);

  const alert = screen.getByRole('alert', { name: /required/i });
  expect(input).toHaveAttribute('aria-describedby', alert.id);
});

test('leaves the field without error wiring when the form is valid', () => {
  rtlRender(<Input label="Title" />);

  const input = screen.getByLabelText(/title/i);
  expect(input).not.toHaveAttribute('aria-invalid', 'true');
  expect(input).not.toHaveAttribute('aria-describedby');
});
