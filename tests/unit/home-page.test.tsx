import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';

import { HomePage } from '@/_pages/home';

afterEach(cleanup);

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    renderHomePage();

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'z-20',
    );
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    const bottomNav = screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' });

    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).toHaveClass('!fixed', '!max-w-[393px]', '!-translate-x-1/2');
  });

  it('게시글을 선택하면 상세 API 응답으로 바텀모달을 연다', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await user.click(screen.getByRole('button', { name: /판교역까지 카풀할 분 찾아요/ }));

    const modal = await screen.findByRole('dialog', { name: '바텀모달' });

    expect(modal).toBeInTheDocument();
    expect(modal).toHaveStyle({
      bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 8px)',
    });
    expect(await screen.findByText('판교역까지 함께 이동할 분을 찾아요.')).toBeInTheDocument();
    expect(screen.getByText('서울역 10번 출구')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });
});
