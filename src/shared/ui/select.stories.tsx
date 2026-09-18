import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Icon } from './icon';
import { Select, type SelectOption } from './select';

type Transport = 'taxi' | 'car' | 'subway' | 'bus';

const transportOptions: SelectOption<Transport>[] = [
  { value: 'taxi', label: '택시' },
  { value: 'car', label: '자차' },
  { value: 'subway', label: '지하철' },
  { value: 'bus', label: '버스' },
];

const meta = {
  title: 'Shared/Select',
  component: Select,
  args: {
    'aria-label': '이동수단',
    options: transportOptions,
    value: null,
    onValueChange: () => {},
    placeholder: '이동수단을 선택해 주세요',
    disabled: false,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledSelect(args: ComponentProps<typeof Select>) {
  const [value, setValue] = useState(args.value);

  return <Select {...args} onValueChange={setValue} value={value} />;
}

export const Playground: Story = {
  render: (args) => <ControlledSelect {...args} />,
};

export const WithSelectedValue: Story = {
  args: {
    value: 'subway',
  },
  render: (args) => <ControlledSelect {...args} />,
};

export const WithDisabledOption: Story = {
  args: {
    options: transportOptions.map((option) =>
      option.value === 'car' ? { ...option, disabled: true } : option,
    ),
  },
  render: (args) => <ControlledSelect {...args} />,
};

export const WithItemDetails: Story = {
  args: {
    options: [
      {
        value: 'taxi',
        label: '택시',
        description: '출발지에서 목적지까지 바로 이동해요.',
        prefixIcon: <Icon aria-hidden="true" name="houseLine" size={22} />,
      },
      {
        value: 'subway',
        label: '지하철',
        description: '정류장과 환승 정보를 확인해 주세요.',
        prefixIcon: <Icon aria-hidden="true" name="crosshair" size={22} />,
      },
    ],
  },
  render: (args) => <ControlledSelect {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
};

export const ReadOnly: Story = {
  args: {
    value: 'subway',
    readOnly: true,
  },
};

export const Empty: Story = {
  args: {
    options: [],
  },
};

export const LongLabels: Story = {
  args: {
    options: [
      {
        value: 'taxi',
        label: '서울역에서 인천국제공항까지 택시로 이동',
      },
      {
        value: 'car',
        label: '개인 차량을 이용해 직접 이동',
      },
    ],
  },
  render: (args) => <ControlledSelect {...args} />,
};
