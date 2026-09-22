import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HomePage } from '@/_pages/home';

afterEach(cleanup);

describe('HomePage', () => {
  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    render(<HomePage />);

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'z-20',
    );
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' })).toBeInTheDocument();
  });
});
