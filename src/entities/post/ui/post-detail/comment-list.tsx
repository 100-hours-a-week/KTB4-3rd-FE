import { cn } from '@/shared/lib/cn';

import type { PostComment } from '@/entities/post/model/post-detail';
import { Avatar } from '@/shared/ui/avatar';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

export type CommentListProps = {
  className?: string;
  comments: readonly PostComment[];
};

export function CommentList({ className, comments }: CommentListProps) {
  return (
    <ul className={cn('m-0 w-full list-none p-0', className)}>
      {comments.map((comment, index) => (
        <li key={comment.id}>
          <div className="flex min-h-[72px] items-center gap-3 px-6 py-3">
            <Avatar
              alt={`${comment.author.nickname} 프로필`}
              size={36}
              src={comment.author.profile_image_url}
            />
            <Text color="fg.neutral" variant="t3Regular">
              {comment.content}
            </Text>
          </div>
          {index < comments.length - 1 ? <Divider color="neutral-subtle" inset /> : null}
        </li>
      ))}
    </ul>
  );
}
