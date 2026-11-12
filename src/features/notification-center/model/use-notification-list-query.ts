'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import type { NotificationTab } from '@/shared/api/notifications';

import { notificationQueries } from '../api/notification-center.queries';

export function useNotificationListQuery(tab: NotificationTab = 'all') {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useInfiniteQuery(notificationQueries.list(tab, isAuthenticated));
}
