import type { PostParticipant } from '@/entities/post/model/post-detail';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';

export type ParticipantListProps = {
  className?: string;
  layout?: 'modal' | 'page';
  participants: readonly PostParticipant[];
};

function getParticipantAvatarLabel(nickname: string) {
  return nickname.slice(0, 3);
}

export function ParticipantList({
  className,
  layout = 'modal',
  participants,
}: ParticipantListProps) {
  const isPageLayout = layout === 'page';

  return (
    <section
      className={cn(
        'flex flex-col',
        isPageLayout ? 'ml-7 w-[325px] gap-[5px] pt-[26px]' : 'gap-3 px-6',
        className,
      )}
      data-clarity-mask="true"
    >
      <Text
        className={isPageLayout ? '!leading-[18px]' : undefined}
        color="fg.neutral"
        variant="t4Bold"
      >
        참여자
      </Text>
      <ul className={cn('m-0 flex list-none flex-wrap gap-4 p-0', isPageLayout && 'gap-4')}>
        {participants.map((participant) => (
          <li
            className={cn('flex items-center gap-2', isPageLayout && 'gap-0')}
            key={participant.id}
          >
            {isPageLayout ? (
              <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-brand-weak)] text-[11px] leading-[15px] font-bold text-[var(--color-fg-brand)]">
                {getParticipantAvatarLabel(participant.nickname)}
              </span>
            ) : (
              <Avatar
                alt={`${participant.nickname} 프로필`}
                size={36}
                src={participant.profile_image_url}
              />
            )}
            {isPageLayout ? null : (
              <Text color="fg.neutral" variant="t3Regular">
                {participant.nickname}
              </Text>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
