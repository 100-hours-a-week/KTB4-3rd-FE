import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Text, textVariants } from './text';

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

export const T7Bold: Story = {
  args: {
    children: 't7 Bold 텍스트',
    variant: 't7Bold',
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

export const IndividualProperties: Story = {
  render: () => (
    <Text
      variant="t7Bold"
      fontSize="t5"
      lineHeight="t6"
      fontWeight="medium"
      maxLines={2}
      align="center"
      whiteSpace="pre-line"
      userSelect="none"
      textDecorationLine="underline"
      color="fg.brand"
    >
      개별 텍스트 속성으로 덮어쓴 예시입니다. 긴 텍스트는 두 줄까지만 표시됩니다.
    </Text>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {textVariants.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}: 이동을 모아, 일상을 잇다
        </Text>
      ))}
    </div>
  ),
};
