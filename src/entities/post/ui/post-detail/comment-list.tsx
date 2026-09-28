import { cn } from '@/shared/lib/cn';

import type { PostComment } from '@/entities/post/model/post-detail';
import { Avatar } from '@/shared/ui/avatar';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

export type CommentListProps = {
  className?: string;
  comments: readonly PostComment[];
  layout?: 'modal' | 'page';
};

export function CommentList({ className, comments, layout = 'modal' }: CommentListProps) {
  const isPageLayout = layout === 'page';

  return (
    <ul
      className={cn(
        'm-0 w-full list-none p-0',
        isPageLayout && 'mx-[27px] w-[calc(100%-54px)]',
        className,
      )}
    >
      {comments.map((comment, index) => (
        <li key={comment.id}>
          <div
            className={cn('flex min-h-[72px] items-center gap-3 px-6 py-3', isPageLayout && 'px-3')}
          >
            <Avatar
              alt={`${comment.author.nickname} 프로필`}
              size={36}
              src={comment.author.profile_image_url}
            />
            {isPageLayout ? (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Text color="fg.neutral" variant="t2Bold">
                  {comment.author.nickname}
                </Text>
                <Text color="fg.neutral" variant="t3Regular">
                  {comment.content}
                </Text>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-1">
                <Text color="fg.neutral" variant="t4Bold">
                  {comment.author.nickname}
                </Text>
                <Text color="fg.neutral" variant="t3Regular">
                  {comment.content}
                </Text>
              </div>
            )}
          </div>
          {index < comments.length - 1 ? (
            <Divider color="neutral-subtle" inset={!isPageLayout} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
