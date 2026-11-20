import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PushNotificationPermissionDialog } from './push-notification-permission-dialog';

const meta = {
  title: 'Features/PushToken/PushNotificationPermissionDialog',
  component: PushNotificationPermissionDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    defaultOpen: true,
  },
} satisfies Meta<typeof PushNotificationPermissionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
