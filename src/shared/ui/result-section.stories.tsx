import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ResultSection, type ResultSectionButtons, type ResultSectionSize } from './result-section';

const sizes: ResultSectionSize[] = ['large', 'medium'];
const buttonOptions: ResultSectionButtons[] = ['none', 'primary', 'primarySecondary'];

const meta = {
  title: 'Shared/Result Section',
  component: ResultSection,
  args: {
    buttons: 'none',
    description: '상태에 대한 부가 설명이 필요한 경우 적어주세요.\n최대 두 줄을 권장해요.',
    primaryLabel: '라벨',
    secondaryLabel: '보조',
    size: 'large',
    title: '상태 안내 타이틀',
  },
  argTypes: {
    buttons: { control: 'select', options: buttonOptions },
    size: { control: 'select', options: sizes },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ResultSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllVariants: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-8">
      {sizes.flatMap((size) =>
        buttonOptions.map((buttons) => (
          <ResultSection {...args} key={`${size}-${buttons}`} buttons={buttons} size={size} />
        )),
      )}
    </div>
  ),
};

export const WithActions: Story = {
  args: {
    buttons: 'primarySecondary',
    primaryButtonProps: { onClick: () => undefined },
    secondaryButtonProps: { onClick: () => undefined },
  },
};
