import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps } from 'react';

import { PhotoInput } from './photo-input';

const meta = {
  title: 'Shared/PhotoInput',
  component: PhotoInput,
  parameters: {
    layout: 'centered',
  },
  args: {
    'aria-label': '프로필 사진 선택',
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof PhotoInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractivePhotoInput(args: ComponentProps<typeof PhotoInput>) {
  return <PhotoInput {...args} />;
}

export const Empty: Story = {
  render: (args) => <InteractivePhotoInput {...args} />,
};

export const WithPreview: Story = {
  args: {
    defaultPreviewUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f97316'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23fff'/%3E%3Cpath d='M20 100c4-26 56-26 60 0' fill='%23fff'/%3E%3C/svg%3E",
  },
  render: (args) => <InteractivePhotoInput {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <InteractivePhotoInput {...args} />,
};
