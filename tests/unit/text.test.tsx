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

  it('renders the modalTitle semantic variant', () => {
    render(<Text variant="modalTitle">모달 제목</Text>);

    expect(screen.getByText('모달 제목')).toHaveClass(textStyles.modalTitle);
  });
});
