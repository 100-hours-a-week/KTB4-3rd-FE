import type { PostParticipant } from '@/entities/post/model/post-detail';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';

export type ParticipantListProps = {
  className?: string;
  participants: readonly PostParticipant[];
};

export function ParticipantList({ className, participants }: ParticipantListProps) {
  return (
    <section className={cn('flex flex-col gap-3 px-6', className)}>
      <Text color="fg.neutral" variant="t4Bold">
        참여자
      </Text>
      <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
        {participants.map((participant) => (
          <li className="flex items-center gap-2" key={participant.id}>
            <Avatar
              alt={`${participant.nickname} 프로필`}
              size={36}
              src={participant.profile_image_url}
            />
            <Text color="fg.neutral" variant="t3Regular">
              {participant.nickname}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
