import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Avatar } from '@/shared/ui/avatar';
import { Header } from '@/shared/ui/header';
import { Logo } from '@/shared/ui/logo';

import { NotificationButton } from './notification-button';

const meta = {
  title: 'Entities/Notification/NotificationButton',
  component: NotificationButton,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NotificationButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InHeader: Story = {
  render: () => (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
      <Header
        className="z-30 bg-transparent"
        leftSlot={
          <span className="pt-2 pl-1.5">
            <Logo alt="모여타" size={27} variant="text" />
          </span>
        }
        rightSlot={
          <span className="flex items-center gap-2 pt-3 pr-1.5">
            <NotificationButton />
            <Avatar alt="프로필" size="md" />
          </span>
        }
      />
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
