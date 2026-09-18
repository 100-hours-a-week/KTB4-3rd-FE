import { cleanup, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Header } from '@/shared/ui/header';

afterEach(cleanup);

describe('Header', () => {
  it('페이지 제목을 h1로 렌더링한다', () => {
    render(<Header title="글 작성" />);

    expect(screen.getByRole('banner')).toHaveClass('sticky');
    expect(screen.getByRole('heading', { level: 1, name: '글 작성' })).toBeInTheDocument();
  });

  it('양쪽 슬롯을 전달받은 그대로 렌더링한다', () => {
    render(
      <Header
        leftSlot={<Link href="/">뒤로가기</Link>}
        rightSlot={<button type="button">작성</button>}
      />,
    );

    expect(screen.getByRole('link', { name: '뒤로가기' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: '작성' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('className을 헤더 외곽에 추가한다', () => {
    render(<Header className="custom-header" title="제목" />);

    expect(screen.getByRole('banner')).toHaveClass('custom-header');
  });

  it('렌더링할 콘텐츠가 없으면 경고 후 렌더링하지 않는다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(render(<Header />).container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith('[Header] title 또는 leftSlot을 전달해야 합니다.');

    warn.mockRestore();
  });
});
