import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { OwnedCarEditDialog } from './owned-car-edit-dialog';

const meta = {
  title: 'Features/OwnedCarManagement/OwnedCarEditDialog',
  component: OwnedCarEditDialog,
  args: {
    car: { id: 12, model: '아반떼', number: '12가3456' },
    onOpenChange: () => undefined,
    onSubmit: () => undefined,
    open: true,
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OwnedCarEditDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Error: Story = {
  args: { errorMessage: '차량 정보를 저장하지 못했어요. 다시 시도해주세요.' },
};
