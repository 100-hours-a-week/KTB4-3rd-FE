import { useQuery } from '@tanstack/react-query';

import { companionPostQueries } from './companion-posts.query';

export function useCompanionPostDetailQuery(companionId: number | null) {
  return useQuery(companionPostQueries.detail(companionId));
}
