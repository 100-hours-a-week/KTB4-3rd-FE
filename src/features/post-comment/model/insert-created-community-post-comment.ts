import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { CommunityPostCommentsResponse, CreatedCommunityPostComment } from '@/entities/post';

export function insertCreatedCommunityPostComment(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  comment: CreatedCommunityPostComment,
) {
  queryClient.setQueryData<InfiniteData<CommunityPostCommentsResponse>>(queryKey, (currentData) => {
    if (!currentData || currentData.pages.length === 0) {
      return currentData;
    }

    const alreadyIncluded = currentData.pages.some((page) =>
      page.data.items.some((item) => item.id === comment.id),
    );

    if (alreadyIncluded) {
      return currentData;
    }

    const [firstPage, ...remainingPages] = currentData.pages;

    return {
      ...currentData,
      pages: [
        {
          ...firstPage,
          data: {
            ...firstPage.data,
            items: [
              {
                author: {
                  nickname: comment.nickname,
                  profile_image_url: null,
                },
                content: comment.content,
                created_at: comment.created_at,
                id: comment.id,
              },
              ...firstPage.data.items,
            ],
          },
        },
        ...remainingPages,
      ],
    };
  });
}
