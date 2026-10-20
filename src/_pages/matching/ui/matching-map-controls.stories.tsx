import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MatchingMapControls, type MatchingMapControlsProps } from './matching-map-controls';

const meta = {
  title: 'Pages/Matching/MatchingMapControls',
  component: MatchingMapControls,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isFabOpened: false,
    onFabOpenChange: () => {},
    onCarpoolClick: () => {},
    onTaxipotClick: () => {},
    onCurrentLocationClick: () => {},
  },
} satisfies Meta<typeof MatchingMapControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: {
    isFabOpened: true,
  },
};

function InteractiveMatchingMapControls(args: MatchingMapControlsProps) {
  const [isFabOpened, setIsFabOpened] = useState(args.isFabOpened);

  return (
    <MatchingMapControls
      {...args}
      isFabOpened={isFabOpened}
      onFabOpenChange={(nextIsOpened) => {
        args.onFabOpenChange(nextIsOpened);
        setIsFabOpened(nextIsOpened);
      }}
    />
  );
}

export const ToggleWithButton: Story = {
  name: '버튼으로 열고 닫기',
  render: (args) => <InteractiveMatchingMapControls {...args} />,
};
