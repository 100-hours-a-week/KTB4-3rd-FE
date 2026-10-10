import type { Preview } from '@storybook/nextjs-vite';
import { createElement } from 'react';

import { SnackbarProvider } from '@/_app/providers';
import '../app/globals.css';

const preview: Preview = {
  decorators: [(Story) => createElement(SnackbarProvider, null, createElement(Story))],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
