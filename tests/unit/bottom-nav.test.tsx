import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePathname } from 'next/navigation';

import { BottomNav } from '@/shared/ui/BottomNav';
import textStyles from '@/shared/ui/text.module.css';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn<() => string>(),
}));

const mockUsePathname = vi.mocked(usePathname);

afterEach(cleanup);

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('메뉴를 매칭, 홈, 채팅 순서로 렌더링한다', () => {
    render(<BottomNav />);

    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      '매칭',
      '홈',
      '채팅',
    ]);
    expect(screen.getByRole('link', { name: '매칭' })).toHaveAttribute('href', '/matching');
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '채팅' })).toHaveAttribute('href', '/chat');
  });

  it('현재 pathname에 해당하는 홈 메뉴를 활성화한다', () => {
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '매칭' })).not.toHaveAttribute('aria-current');
  });

  it('활성 메뉴에 fill 아이콘과 bold 라벨을 사용한다', () => {
    mockUsePathname.mockReturnValue('/matching');
    render(<BottomNav />);

    const matchingLink = screen.getByRole('link', { name: '매칭' });
    const matchingIcon = matchingLink.querySelector('span');
    const matchingLabel = matchingLink.querySelector('span:last-child');

    expect(matchingIcon?.style.maskImage).toContain('/icons/seed/icon_person2_fill.svg');
    expect(matchingLabel).toHaveClass(textStyles.t1Bold);
  });

  it.each([
    ['/matching/', '매칭'],
    ['/matching/detail', '매칭'],
    ['/chat/request/', '채팅'],
  ])('하위 pathname과 trailing slash를 처리한다: %s', (pathname, activeLabel) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: activeLabel })).toHaveAttribute('aria-current', 'page');
  });

  it('className을 navigation 외곽에 추가한다', () => {
    render(<BottomNav className="custom-bottom-nav" />);

    expect(screen.getByRole('navigation')).toHaveClass('custom-bottom-nav');
  });

  it('화면 전체 너비를 사용하고 최대 너비를 제한하지 않는다', () => {
    render(<BottomNav />);

    expect(screen.getByRole('navigation')).toHaveClass('w-full');
    expect(screen.getByRole('navigation')).not.toHaveClass('max-w-[393px]');
  });
});
