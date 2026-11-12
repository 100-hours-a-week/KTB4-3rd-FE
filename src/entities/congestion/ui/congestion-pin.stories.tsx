import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Image from 'next/image';

import {
  CongestionPin,
  congestionPinVariants,
  getCongestionPinMarkerImage,
} from './congestion-pin';

const meta = {
  title: 'Entities/Congestion/CongestionPin',
  component: CongestionPin,
  args: {
    variant: 'busy',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: congestionPinVariants,
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CongestionPin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Busy: Story = {};

export const Congested: Story = {
  args: {
    variant: 'congested',
  },
};

export const Available: Story = {
  args: {
    variant: 'available',
  },
};

export const Delayed: Story = {
  args: {
    variant: 'delayed',
  },
};

export const Selected: Story = {
  args: {
    isSelected: true,
    variant: 'delayed',
  },
};

export const SelectedAll: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {congestionPinVariants.map((variant) => (
        <CongestionPin key={variant} isSelected variant={variant} />
      ))}
    </div>
  ),
};

export const Accident: Story = {
  args: {
    variant: 'accident',
  },
};

export const All: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {congestionPinVariants.map((variant) => (
        <CongestionPin key={variant} variant={variant} />
      ))}
    </div>
  ),
};

export const MapMarkerWithUpdatedAt: Story = {
  render: () => {
    const marker = getCongestionPinMarkerImage('busy', {
      isSelected: true,
      selectedMessage: '퇴근 시간대 대기 인원 증가',
      updatedAtLabel: '3분 전 갱신됨',
    });

    return (
      <Image
        alt="갱신 시각이 포함된 혼잡도 핀"
        height={marker.height}
        src={marker.src}
        unoptimized
        width={marker.width}
      />
    );
  },
};
