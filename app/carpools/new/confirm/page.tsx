import type { Metadata } from 'next';

import { CarpoolConfirmPage } from '@/_pages/carpool-confirm';

export const metadata: Metadata = {
  title: '카풀 등록 확인',
};

export default function Page() {
  return <CarpoolConfirmPage />;
}
