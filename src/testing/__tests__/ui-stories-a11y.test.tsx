import axe from 'axe-core';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';

import {
  applyStoryCanvas,
  type StoryDirection,
  type StoryTheme,
} from '../story-canvas';
import { rtlRender } from '../test-utils';

type StoryModule = {
  default: {
    component?: React.ComponentType<Record<string, unknown>>;
    args?: Record<string, unknown>;
  };
};

const storyLoaders = import.meta.glob<StoryModule>(
  '../../components/ui/**/*.stories.tsx',
);

const themes: StoryTheme[] = ['light', 'dark'];
const directions: StoryDirection[] = ['ltr', 'rtl'];

const isStoryExport = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('render' in value || 'args' in value)
  );
};

const storyElement = (
  meta: StoryModule['default'],
  story: Record<string, unknown>,
) => {
  if (typeof story.render === 'function') {
    return (
      story.render as (
        args: Record<string, unknown>,
        context: Record<string, unknown>,
      ) => React.ReactElement
    )((story.args ?? {}) as Record<string, unknown>, { ...meta, ...story });
  }

  const Component = meta.component as React.ComponentType<
    Record<string, unknown>
  >;
  const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
  return <Component {...args} />;
};

const storyModules = Object.fromEntries(
  await Promise.all(
    Object.entries(storyLoaders).map(async ([path, load]) => {
      return [path, (await load()) as StoryModule] as const;
    }),
  ),
);

describe('ui story a11y across themes and directions', () => {
  afterAll(() => {
    applyStoryCanvas('light', 'ltr');
  });

  for (const [path, storyModule] of Object.entries(storyModules)) {
    describe(`stories in ${path}`, () => {
      const storyNames = Object.entries(storyModule)
        .filter(([name, value]) => name !== 'default' && isStoryExport(value))
        .map(([name]) => name);

      test('exposes at least one story', () => {
        expect(storyNames.length).toBeGreaterThan(0);
      });

      for (const storyName of storyNames) {
        for (const theme of themes) {
          for (const direction of directions) {
            test(`${storyName} renders in ${theme} ${direction} with no axe violations`, async () => {
              applyStoryCanvas(theme, direction);

              const story = (storyModule as unknown as Record<string, unknown>)[
                storyName
              ] as Record<string, unknown>;
              const storyContent = storyElement(storyModule.default, story);

              const view = rtlRender(
                <RouterProvider
                  router={createMemoryRouter([
                    {
                      path: '*',
                      element: <main>{storyContent}</main>,
                    },
                  ])}
                />,
              );

              const results = await axe.run(document.body);
              expect(results.violations).toEqual([]);

              view.unmount();
            });
          }
        }
      }
    });
  }
});
