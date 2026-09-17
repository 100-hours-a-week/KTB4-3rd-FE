import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Text } from '@/shared/ui/text';
import textStyles from '@/shared/ui/text.module.css';

describe('Text', () => {
  it('renders children with the selected semantic variant', () => {
    render(<Text variant="screenTitle">모여타</Text>);

    const text = screen.getByText('모여타');

    expect(text).toHaveClass(textStyles.screenTitle);
    expect(text).toHaveTextContent('모여타');
  });

  it('supports a semantic HTML element through the as prop', () => {
    render(
      <Text as="h1" variant="screenTitle">
        이동을 모아, 일상을 잇다
      </Text>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('이동을 모아, 일상을 잇다');
  });

  it('renders the t7Bold variant', () => {
    render(<Text variant="t7Bold">t7 Bold 텍스트</Text>);

    expect(screen.getByText('t7 Bold 텍스트')).toHaveClass(textStyles.t7Bold);
  });

  it('supports token-based individual text properties', () => {
    render(
      <Text
        variant="t7Bold"
        fontSize="t5"
        fontWeight="medium"
        maxLines={2}
        align="center"
        whiteSpace="pre-line"
        userSelect="none"
        textDecorationLine="underline"
        color="fg.brand"
      >
        개별 텍스트 속성
      </Text>,
    );

    const text = screen.getByText('개별 텍스트 속성');

    expect(text).toHaveClass(textStyles.maxLines);
    expect(text).toHaveStyle({
      fontSize: 'var(--font-size-t5)',
      lineHeight: 'var(--line-height-t5)',
      fontWeight: 'var(--font-weight-medium)',
      textAlign: 'center',
      whiteSpace: 'pre-line',
      userSelect: 'none',
      textDecorationLine: 'underline',
      color: 'var(--color-fg-brand)',
    });
    expect(text.style.getPropertyValue('--text-max-lines')).toBe('2');
  });
});
