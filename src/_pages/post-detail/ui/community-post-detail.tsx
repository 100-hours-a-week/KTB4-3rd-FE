import {
  CommentList,
  CommentSummary,
  PostDetailInfo,
  type CommunityPostDetail,
} from '@/entities/post';
import { CommentComposer } from '@/features/post-comment';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type CommunityPostDetailProps = {
  className?: string;
  onCommentSubmit?: (content: string) => void;
  post: CommunityPostDetail;
};

export function CommunityPostDetail({
  className,
  onCommentSubmit,
  post,
}: CommunityPostDetailProps) {
  return (
    <article className={cn('flex flex-col', className)}>
      <PostDetailInfo description={post.description} title={post.title} type={post.type} />

      <div className="flex items-center justify-between px-6 pb-5">
        <CommentSummary count={post.comment_count} />
        <Text color="fg.neutral" variant="t4Bold">
          {post.author.nickname}
        </Text>
      </div>

      <CommentList comments={post.comments} />
      <CommentComposer onSubmit={onCommentSubmit} />
    </article>
  );
}
