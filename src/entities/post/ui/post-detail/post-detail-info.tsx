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
  layout?: 'modal' | 'page';
  title: string;
  type: PostType;
};

export function PostDetailInfo({
  className,
  description,
  layout = 'modal',
  title,
  type,
}: PostDetailInfoProps) {
  const isPageLayout = layout === 'page';

  return (
    <header
      className={cn(
        'flex flex-col',
        isPageLayout ? 'px-7 pt-[38px]' : 'gap-1 px-6 pb-5',
        className,
      )}
    >
      <Text color="fg.brand" variant={isPageLayout ? 't5Bold' : 't3Bold'}>
        {postTypeLabels[type]}
      </Text>
      <Text
        as="h2"
        className={cn(isPageLayout && '!mt-[15px] max-w-[312px] break-words whitespace-normal')}
        color="fg.neutral"
        variant={isPageLayout ? 't8Bold' : 't6Bold'}
      >
        {title}
      </Text>
      <Text
        className={cn(isPageLayout && '!mt-[49px] w-[318px] px-[3px]')}
        color="fg.neutralMuted"
        variant={isPageLayout ? 't6Regular' : 't5Regular'}
      >
        {description}
      </Text>
    </header>
  );
}
