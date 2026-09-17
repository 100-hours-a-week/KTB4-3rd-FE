import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HStack, Stack, spacingTokenNames, VStack } from './stack';

const meta = {
  title: 'Shared/Stack',
  component: Stack,
  args: {
    children: (
      <>
        <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">첫 번째 항목</div>
        <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">두 번째 항목</div>
      </>
    ),
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HStackExample: Story = {
  render: () => (
    <HStack gap="dimension-x2" align="center">
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">첫 번째</div>
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">두 번째</div>
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">세 번째</div>
    </HStack>
  ),
};

export const VStackExample: Story = {
  render: () => (
    <VStack gap="dimension-x1_5">
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">제목</div>
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">설명</div>
    </VStack>
  ),
};

export const AllSpacingTokens: Story = {
  render: () => (
    <VStack gap="dimension-x2">
      {spacingTokenNames.map((token) => (
        <HStack key={token} gap="dimension-x2" align="start">
          <span className="w-48 shrink-0 text-sm font-semibold text-slate-700">{token}</span>

          <HStack gap={token} align="start">
            <div className="size-6 shrink-0 bg-sky-500" />
            <div className="size-6 shrink-0 bg-sky-500" />
          </HStack>
        </HStack>
      ))}
    </VStack>
  ),
};

export const Alignment: Story = {
  args: {
    align: 'end',
    gap: 'dimension-x4',
  },
  argTypes: {
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch'],
    },
  },
  render: ({ align = 'end', gap = 'dimension-x4' }) => (
    <HStack
      className="min-h-32 w-full max-w-lg rounded-xl border border-dashed border-slate-300 p-3"
      align={align}
      gap={gap}
    >
      <div className="w-16 rounded-lg bg-sky-100 p-3 text-center text-sm">짧음</div>
      <div className="w-16 rounded-lg bg-sky-300 p-6 text-center text-sm">중간</div>
      <div className="w-16 rounded-lg bg-sky-500 p-1 text-center text-sm">
        길게
        <br />
        보기
      </div>
    </HStack>
  ),
};

export const Justify: Story = {
  render: () => (
    <HStack className="w-full" justify="between">
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">왼쪽</div>
      <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950">오른쪽</div>
    </HStack>
  ),
};

export const Wrap: Story = {
  render: () => (
    <HStack className="max-w-sm" gap="dimension-x2" wrap>
      {Array.from({ length: 8 }, (_, index) => (
        <div className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-950" key={index}>
          항목 {index + 1}
        </div>
      ))}
    </HStack>
  ),
};

export const SemanticElement: Story = {
  render: () => (
    <VStack as="section" gap="spacing-y-between-text" aria-label="공지사항">
      <h2 className="text-lg font-bold">공지사항</h2>
      <p className="text-sm text-slate-600">section 요소로 렌더링된 Stack입니다.</p>
    </VStack>
  ),
};

export const ResponsiveContent: Story = {
  render: () => (
    <HStack className="w-full max-w-xl flex-col sm:flex-row" gap="dimension-x3" align="stretch">
      <div className="min-w-0 flex-1 rounded-lg bg-sky-100 p-4 text-sm text-sky-950">
        화면이 좁아지면 세로로 쌓이고, 넓어지면 가로로 배치됩니다. 긴 콘텐츠도 부모 너비 안에서
        줄바꿈됩니다.
      </div>
      <div className="min-w-0 flex-1 rounded-lg bg-sky-200 p-4 text-sm text-sky-950">
        반응형 레이아웃 예시
      </div>
    </HStack>
  ),
};
