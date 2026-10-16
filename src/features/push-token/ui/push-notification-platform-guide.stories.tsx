import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PushNotificationPlatformGuide } from './push-notification-platform-guide';

const meta = {
  title: 'Features/PushToken/PushNotificationPlatformGuide',
  component: PushNotificationPlatformGuide,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PushNotificationPlatformGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
