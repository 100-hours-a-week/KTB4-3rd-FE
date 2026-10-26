import type { Metadata } from 'next';

import { OwnedCarManagementPage } from '@/_pages/owned-car-management';

export const metadata: Metadata = {
  title: '내 차량 관리',
};

export default function OwnedCarManagementRoute() {
  return <OwnedCarManagementPage />;
}
