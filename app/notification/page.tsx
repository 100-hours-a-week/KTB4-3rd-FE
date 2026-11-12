import type { Metadata } from 'next';

import { NotificationPage } from '@/_pages/notification';

export const metadata: Metadata = {
  title: '알림',
};

export default function NotificationRoute() {
  return <NotificationPage />;
}
