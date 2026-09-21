import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Avatar, type AvatarSizePreset } from './avatar';

const sizes: AvatarSizePreset[] = ['lg', 'md', 'sm'];

const sizeLabels: Record<AvatarSizePreset, string> = {
  sm: '36 × 36',
  md: '42 × 42',
  lg: '100 × 100',
};

const meta = {
  title: 'Shared/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  args: {
    alt: '프로필 이미지',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fallback: Story = {};

export const WithImage: Story = {
  args: {
    src: '/logos/logo_symbol.svg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {sizes.map((size) => (
        <div className="flex flex-col items-center gap-2" key={size}>
          <Avatar alt={`${size}px 프로필 이미지`} size={size} />
          <span className="text-xs text-slate-600">{sizeLabels[size]}</span>
        </div>
      ))}
    </div>
  ),
};
