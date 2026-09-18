import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Link from 'next/link';

import { Button } from './button';
import { Header } from './header';
import { Icon } from './icon';

const iconLinkClassName =
  'inline-flex size-[44px] items-center justify-center rounded-[var(--dimension-x2)] text-[var(--color-fg-neutral)] hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]';

const meta = {
  title: 'Shared/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: '글 작성',
  },
};

export const BackAction: Story = {
  args: {
    title: '커뮤니티',
    leftSlot: (
      <Link className={iconLinkClassName} href="/" aria-label="뒤로가기">
        <Icon name="chevronLeft" size={24} />
      </Link>
    ),
  },
};

export const RightAction: Story = {
  args: {
    title: '커뮤니티',
    rightSlot: <Button size="small">작성</Button>,
  },
};

export const AllSlots: Story = {
  args: {
    title: '커뮤니티',
    leftSlot: (
      <Link className={iconLinkClassName} href="/" aria-label="뒤로가기">
        <Icon name="chevronLeft" size={24} />
      </Link>
    ),
    rightSlot: <Button size="small">작성</Button>,
  },
};

export const LongTitle: Story = {
  args: {
    title: '아주 긴 페이지 제목이 들어와도 한 줄로 안전하게 표시됩니다',
    leftSlot: (
      <Link className={iconLinkClassName} href="/" aria-label="뒤로가기">
        <Icon name="chevronLeft" size={24} />
      </Link>
    ),
  },
};
