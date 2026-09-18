import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Logo } from '@/shared/ui/logo';

describe('Logo', () => {
  afterEach(cleanup);

  it('full 로고를 기본 크기와 원본 비율로 렌더링한다', () => {
    render(<Logo alt="모여타" />);

    const logo = screen.getByRole('img', { name: '모여타' });

    expect(logo).toHaveAttribute('src', '/logos/logo_full.svg');
    expect(logo).toHaveAttribute('width', '303');
    expect(logo).toHaveAttribute('height', '308');
    expect(logo).toHaveStyle({ height: '72px', width: 'auto' });
  });

  it('text 로고를 원본 비율로 렌더링한다', () => {
    render(<Logo alt="모여타 텍스트" variant="text" />);

    const logo = screen.getByRole('img', { name: '모여타 텍스트' });

    expect(logo).toHaveAttribute('src', '/logos/logo_text.svg');
    expect(logo).toHaveAttribute('width', '272');
    expect(logo).toHaveAttribute('height', '120');
    expect(logo).toHaveStyle({ height: '72px', width: 'auto' });
  });

  it('아이콘 로고는 지정한 숫자 크기로 정사각형을 유지한다', () => {
    render(<Logo size={32} variant="symbol" alt="모여타 아이콘" />);

    const logo = screen.getByRole('img', { name: '모여타 아이콘' });

    expect(logo).toHaveAttribute('src', '/logos/logo_symbol.svg');
    expect(logo).toHaveStyle({ height: '32px', width: '32px' });
  });

  it('CSS 크기 문자열을 그대로 사용할 수 있다', () => {
    render(<Logo size="clamp(24px, 10vw, 64px)" variant="symbol" alt="로고" />);

    const logo = screen.getByRole('img', { name: '로고' });

    expect(logo.getAttribute('style')).toContain(
      'height: clamp(24px, 10vw, 64px); width: clamp(24px, 10vw, 64px)',
    );
  });

  it('href가 있으면 링크로 감싸고 접근 가능한 이름을 제공한다', () => {
    render(<Logo href="/" />);

    expect(screen.getByRole('link', { name: '모여타' })).toHaveAttribute('href', '/');
  });

  it('alt가 비어 있으면 장식용 로고로 렌더링한다', () => {
    const { container } = render(<Logo alt="" variant="symbol" />);

    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });
});
