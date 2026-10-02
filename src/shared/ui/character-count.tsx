import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Text, type TextColor } from './text';

export type CharacterCountProps = {
  characterCount?: ReactNode | null;
  maxCharacterCount?: ReactNode | null;
  showFrom?: number;
  className?: string;
};

function hasContent(content: ReactNode | null | undefined) {
  return content !== null && content !== undefined && content !== false && content !== '';
}

function getCharacterCountColor(
  characterCount: ReactNode | null | undefined,
  maxCharacterCount: ReactNode | null | undefined,
): TextColor {
  if (
    typeof characterCount === 'number' &&
    typeof maxCharacterCount === 'number' &&
    characterCount > maxCharacterCount
  ) {
    return 'fg.critical';
  }

  if (typeof characterCount === 'number' ? characterCount > 0 : hasContent(characterCount)) {
    return 'fg.neutral';
  }

  return 'fg.neutralSubtle';
}

export function CharacterCount({
  characterCount,
  className,
  maxCharacterCount,
  showFrom,
}: CharacterCountProps) {
  const isVisible =
    showFrom === undefined || typeof characterCount !== 'number' || characterCount >= showFrom;

  return (
    <Text
      aria-label="글자 수"
      aria-hidden={!isVisible}
      className={cn('shrink-0', !isVisible && 'invisible', className)}
      color={getCharacterCountColor(characterCount, maxCharacterCount)}
      data-testid="character-count"
      variant="t3Regular"
    >
      {hasContent(characterCount) ? characterCount : 0}
      {hasContent(maxCharacterCount) ? (
        <Text as="span" color="fg.neutralSubtle" variant="t3Regular">
          {' / '}
          {maxCharacterCount}
        </Text>
      ) : null}
    </Text>
  );
}
