import { queryOptions } from '@tanstack/react-query';

import { getCompanionPostDetail } from './get-companion-post-detail';

export const companionPostQueries = {
  all: () => ['companion-posts'] as const,
  detail: (companionId: number | null) =>
    queryOptions({
      queryKey: [...companionPostQueries.all(), 'detail', companionId] as const,
      enabled: companionId !== null,
      queryFn: () => {
        if (companionId === null) {
          throw new Error('동행모집 게시글 ID가 없어 상세 내용을 조회할 수 없습니다.');
        }

        return getCompanionPostDetail(companionId);
      },
    }),
};
