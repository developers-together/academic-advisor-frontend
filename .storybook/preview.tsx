import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { BrowserRouter as Router } from 'react-router';

import {
  applyStoryCanvas,
  type StoryDirection,
  type StoryTheme,
} from '../src/testing/story-canvas';
import '../src/index.css';

const preview: Preview = {
  initialGlobals: {
    theme: 'light',
    direction: 'ltr',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Color theme for the canvas',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      name: 'Direction',
      description: 'Text direction for the canvas',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as StoryTheme;
      const direction = context.globals.direction as StoryDirection;

      React.useEffect(() => {
        applyStoryCanvas(theme, direction);
      }, [theme, direction]);

      return (
        <Router>
          <main>
            <Story />
          </main>
        </Router>
      );
    },
  ],
};

export default preview;
