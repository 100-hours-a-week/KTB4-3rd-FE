import type { ReactNode } from 'react';

import { Text } from '@/shared/ui/text';

type ChatRoomStateProps = {
  children: ReactNode;
  label: string;
};

export function ChatRoomState({ children, label }: ChatRoomStateProps) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className="flex min-h-0 flex-1 items-center justify-center"
    >
      <Text color="fg.neutralSubtle" variant="t4Regular">
        {children}
      </Text>
    </section>
  );
}
