import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { CarpoolPin } from './carpool-pin';

const meta = {
  title: 'Entities/CarpoolPin',
  component: CarpoolPin,
  parameters: { layout: 'centered' },
  args: { 'aria-label': '서울역 출발 카풀' },
} satisfies Meta<typeof CarpoolPin>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { isSelected: true } };
function SelectionExample() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex items-end gap-8 bg-[var(--color-bg-layer-fill)] p-8">
      {[1, 2, 3].map((id) => (
        <CarpoolPin
          key={id}
          aria-label={`카풀 ${id}`}
          isSelected={selected === id}
          onClick={() => setSelected((current) => (current === id ? null : id))}
        />
      ))}
    </div>
  );
}
export const Selection: Story = { name: '핀 선택과 해제', render: () => <SelectionExample /> };
