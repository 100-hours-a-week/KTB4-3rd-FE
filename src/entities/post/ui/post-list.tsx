import { cn } from '@/shared/lib/cn';

import type { Post } from '@/entities/post/model/post';
import { PostItem } from './post-item';

export type PostListProps = {
  className?: string;
  items: readonly Post[];
  onItemClick?: (post: Post) => void;
};

export function PostList({ className, items, onItemClick }: PostListProps) {
  return (
    <ul className={cn('m-0 w-full list-none p-0', className)}>
      {items.map((post, index) => (
        <PostItem
          key={`${post.type}-${post.id}`}
          onClick={onItemClick ? () => onItemClick(post) : undefined}
          post={post}
          showDivider={index < items.length - 1}
        />
      ))}
    </ul>
  );
}
