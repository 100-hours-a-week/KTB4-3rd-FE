import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';

afterEach(cleanup);

describe('PageLayout', () => {
  it('헤더를 선택적으로 렌더링한다', () => {
    const { rerender } = render(
      <PageLayout header={<Header title="회원가입" />}>
        <p>페이지 콘텐츠</p>
      </PageLayout>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('px-5');
    expect(screen.getByRole('main')).toHaveClass(
      'pb-[calc(var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom))]',
    );

    rerender(
      <PageLayout>
        <p>헤더 없는 페이지 콘텐츠</p>
      </PageLayout>,
    );

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
