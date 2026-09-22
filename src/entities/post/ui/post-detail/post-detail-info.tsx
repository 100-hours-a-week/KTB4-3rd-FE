import type { PostType } from '@/entities/post/model/post';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

const postTypeLabels: Record<PostType, string> = {
  COMPANION: '동행 모집',
  COMMUNITY: '커뮤니티',
};

export type PostDetailInfoProps = {
  className?: string;
  description: string;
  title: string;
  type: PostType;
};

export function PostDetailInfo({ className, description, title, type }: PostDetailInfoProps) {
  return (
    <header className={cn('flex flex-col gap-1 px-6 pb-5', className)}>
      <Text color="fg.brand" variant="t3Bold">
        {postTypeLabels[type]}
      </Text>
      <Text as="h2" color="fg.neutral" variant="t6Bold">
        {title}
      </Text>
      <Text color="fg.neutralMuted" variant="t5Regular">
        {description}
      </Text>
    </header>
  );
}
