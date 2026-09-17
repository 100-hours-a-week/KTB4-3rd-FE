import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  HStack,
  Stack,
  spacingTokenClassNames,
  spacingTokenNames,
  VStack,
} from '@/shared/ui/stack';

afterEach(cleanup);

describe('Stack', () => {
  it('defaults to a column flex layout', () => {
    render(
      <Stack data-testid="stack">
        <span>첫 번째</span>
        <span>두 번째</span>
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveClass('flex', 'flex-col');
  });

  it('renders HStack as a row and VStack as a column', () => {
    render(
      <>
        <HStack data-testid="h-stack">가로</HStack>
        <VStack data-testid="v-stack">세로</VStack>
      </>,
    );

    expect(screen.getByTestId('h-stack')).toHaveClass('flex-row');
    expect(screen.getByTestId('v-stack')).toHaveClass('flex-col');
  });

  it.each(spacingTokenNames)('maps the %s spacing token to a static gap class', (token) => {
    render(
      <Stack data-testid={`stack-${token}`} gap={token}>
        콘텐츠
      </Stack>,
    );

    expect(screen.getByTestId(`stack-${token}`)).toHaveClass(spacingTokenClassNames[token]);
  });

  it('maps alignment, justification, and wrapping props', () => {
    render(
      <Stack data-testid="stack" align="center" justify="between" wrap>
        콘텐츠
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveClass('items-center', 'justify-between', 'flex-wrap');
  });

  it('passes className and native HTML props through', () => {
    render(
      <Stack aria-label="콘텐츠 그룹" className="custom-class" data-testid="stack">
        콘텐츠
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveClass('custom-class');
    expect(screen.getByTestId('stack')).toHaveAttribute('aria-label', '콘텐츠 그룹');
  });

  it('supports a semantic element through the as prop', () => {
    render(
      <Stack as="section" data-testid="section-stack">
        섹션 콘텐츠
      </Stack>,
    );

    expect(screen.getByTestId('section-stack').tagName).toBe('SECTION');
  });
});
