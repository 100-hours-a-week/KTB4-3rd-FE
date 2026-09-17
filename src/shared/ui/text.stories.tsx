import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Text, type TextVariant } from './text';

const variants: TextVariant[] = [
  'screenTitle',
  'articleBody',
  't4Regular',
  't4StaticRegular',
  'modalTitle',
];

const meta = {
  title: 'Shared/Text',
  component: Text,
  args: {
    children: '이동을 모아, 일상을 잇다',
    variant: 'articleBody',
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ArticleBody: Story = {};

export const ScreenTitle: Story = {
  args: {
    as: 'h1',
    children: '모여타',
    variant: 'screenTitle',
  },
};

export const ModalTitle: Story = {
  args: {
    as: 'h2',
    children: '모달 제목',
    variant: 'modalTitle',
  },
};

export const Multiline: Story = {
  render: () => (
    <Text as="h1" variant="screenTitle">
      서비스 이용을 위해
      <br />
      약관 동의를 진행해주세요.
    </Text>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}: 이동을 모아, 일상을 잇다
        </Text>
      ))}
    </div>
  ),
};
