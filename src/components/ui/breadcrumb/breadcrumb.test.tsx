import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { MemoryRouter } from 'react-router';

import { render, screen } from '@/testing/test-utils';

import { Breadcrumb } from './breadcrumb';

const renderCrumbs = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

test('labels the landmark and marks the last item as the current page', () => {
  renderCrumbs(
    <Breadcrumb
      items={[
        { label: 'Students', to: '/advisor/students' },
        { label: 'Ahmed Hassan' },
      ]}
    />,
  );

  expect(
    screen.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toHaveAttribute('aria-label', 'Breadcrumb');
  expect(screen.getByRole('link', { name: 'Students' })).toHaveAttribute(
    'href',
    '/advisor/students',
  );
  expect(screen.getByText('Ahmed Hassan')).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('collapses long trails and expands them on demand', async () => {
  renderCrumbs(
    <Breadcrumb
      items={[
        { label: 'Home', to: '/app' },
        { label: 'My Plan', to: '/app/plan' },
        { label: 'First Semester', to: '/app/plan' },
        { label: 'Course', to: '/app/plan' },
        { label: 'CS 402' },
      ]}
    />,
  );

  expect(screen.queryByText('My Plan')).not.toBeInTheDocument();
  expect(screen.queryByText('First Semester')).not.toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: 'Show hidden levels' }),
  );

  expect(screen.getByRole('link', { name: 'My Plan' })).toBeInTheDocument();
  expect(screen.getByText('CS 402')).toHaveAttribute('aria-current', 'page');
});

test('keeps a four-level trail collapsed behind one toggle until expanded', async () => {
  renderCrumbs(
    <Breadcrumb
      items={[
        { label: 'Home', to: '/app' },
        { label: 'My Plan', to: '/app/plan' },
        { label: 'Course', to: '/app/plan' },
        { label: 'CS 402' },
      ]}
    />,
  );

  expect(screen.getAllByRole('link')).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Course' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'href',
    '/app',
  );
  expect(screen.queryByText('My Plan')).not.toBeInTheDocument();
  expect(screen.getByText('CS 402')).toHaveAttribute('aria-current', 'page');

  await userEvent.click(
    screen.getByRole('button', { name: 'Show hidden levels' }),
  );

  expect(screen.getAllByRole('link')).toHaveLength(3);
  expect(screen.getByRole('link', { name: 'Course' })).toBeInTheDocument();
});
