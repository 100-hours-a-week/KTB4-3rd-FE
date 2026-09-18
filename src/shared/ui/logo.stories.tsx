import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Logo } from './logo';

const meta = {
  title: 'Shared/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'full',
    size: 'md',
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const Text: Story = {
  args: {
    variant: 'text',
  },
};

export const Symbol: Story = {
  args: {
    variant: 'symbol',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="flex flex-col items-center gap-2" key={size}>
          <Logo size={size} />
          <span className="text-xs text-slate-600">full / {size}</span>
        </div>
      ))}
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="flex flex-col items-center gap-2" key={`text-${size}`}>
          <Logo size={size} variant="text" />
          <span className="text-xs text-slate-600">text / {size}</span>
        </div>
      ))}
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="flex flex-col items-center gap-2" key={`symbol-${size}`}>
          <Logo size={size} variant="symbol" />
          <span className="text-xs text-slate-600">symbol / {size}</span>
        </div>
      ))}
    </div>
  ),
};

export const CustomSize: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Logo size={182} />
      <Logo size="clamp(48px, 12vw, 96px)" variant="symbol" />
    </div>
  ),
};

export const Link: Story = {
  args: {
    href: '/',
    alt: '서비스 홈',
  },
};

export const DarkBackground: Story = {
  render: () => (
    <div className="bg-slate-950 p-8">
      <Logo size="48px" />
    </div>
  ),
};
