import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useLayoutEffect } from 'react';

import {
  getCarpoolDepartureDateRange,
  useCarpoolCreateStore,
} from '@/features/carpool-registration';
import { SnackbarProvider } from '@/_app/providers';

import { CarpoolInfoPage } from './CarpoolInfoPage';

const meta = {
  title: 'Pages/Carpool/CarpoolInfoPage',
  component: CarpoolInfoPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/carpools/new/info',
      },
    },
  },
} satisfies Meta<typeof CarpoolInfoPage>;

export default meta;

type Story = StoryObj<typeof meta>;

function PageWithDraft({ complete }: { complete: boolean }) {
  useLayoutEffect(() => {
    const store = useCarpoolCreateStore.getState();
    const seoulDate = getCarpoolDepartureDateRange(Date.now() + 24 * 60 * 60 * 1000)?.minDate;

    store.setOrigin({ name: '서울역', lat: 37.5547, lng: 126.9707 });
    store.setDestination({ name: '강남역', lat: 37.4979, lng: 127.0276 });
    store.setDepartureDate(complete ? (seoulDate ?? null) : null);
    store.setDepartureTime(complete ? { period: '오전', hour: 11, minute: 30 } : null);
    store.setRecruitCount(complete ? 2 : null);

    return () => store.reset();
  }, [complete]);

  return (
    <SnackbarProvider>
      <CarpoolInfoPage />
    </SnackbarProvider>
  );
}

export const IncompleteDraft: Story = {
  render: () => <PageWithDraft complete={false} />,
};

export const CompleteDraft: Story = {
  render: () => <PageWithDraft complete />,
};
