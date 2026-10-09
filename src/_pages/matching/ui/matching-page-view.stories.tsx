import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { useAuthStore } from '@/entities/auth';

import { MatchingPageView } from './matching-page-view';
import { MatchingMapPreview } from './matching-map-preview';

const storyUser = {
  id: 1,
  nickname: '모여타',
  profile_image_url: null,
  has_bank_account: false,
};

function setStoryAuthState(isAuthenticated: boolean) {
  const previousAccessToken = useAuthStore.getState().accessToken;

  useAuthStore.setState({
    accessToken: isAuthenticated ? 'storybook-preview-token' : null,
  });

  return () => {
    useAuthStore.setState({ accessToken: previousAccessToken });
  };
}

const meta = {
  title: 'Pages/Matching/MatchingPageView',
  component: MatchingPageView,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/matching' },
    },
  },
  beforeEach: () => setStoryAuthState(true),
  args: {
    isFabOpened: false,
    onFabOpenChange: () => undefined,
    onCarpoolClick: () => undefined,
    onTaxipotClick: () => undefined,
    onCurrentLocationClick: () => undefined,
    map: <MatchingMapPreview />,
    user: storyUser,
  },
} satisfies Meta<typeof MatchingPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  name: '닫힌 메뉴',
};

export const Open: Story = {
  name: '열린 메뉴',
  args: {
    isFabOpened: true,
  },
};

export const SignedOut: Story = {
  name: '로그인 전',
  beforeEach: () => setStoryAuthState(false),
  args: {
    user: undefined,
  },
};

function InteractivePreview() {
  const [isFabOpened, setIsFabOpened] = useState(false);

  return (
    <MatchingPageView
      isFabOpened={isFabOpened}
      map={<MatchingMapPreview />}
      onCarpoolClick={() => setIsFabOpened(false)}
      onCurrentLocationClick={() => undefined}
      onFabOpenChange={setIsFabOpened}
      onTaxipotClick={() => setIsFabOpened(false)}
      user={storyUser}
    />
  );
}

export const Interactive: Story = {
  name: '버튼으로 열고 닫기',
  render: () => <InteractivePreview />,
};
