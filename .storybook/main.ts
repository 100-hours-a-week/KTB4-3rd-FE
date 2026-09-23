import type { StorybookConfig } from '@storybook/nextjs-vite';
import { loadEnv } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    const env = loadEnv('', process.cwd(), 'NEXT_PUBLIC_');

    return {
      ...config,
      define: {
        ...config.define,
        'process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY': JSON.stringify(
          env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
        ),
      },
    };
  },
};

export default config;
