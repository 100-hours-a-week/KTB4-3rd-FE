import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Avatar } from '@/shared/ui/avatar';

describe('Avatar', () => {
  afterEach(cleanup);

  it('이미지가 없으면 기본 아바타 이미지를 렌더링한다', () => {
    render(<Avatar alt="사용자 프로필" />);

    expect(screen.getByRole('img', { name: '사용자 프로필' })).toHaveAttribute(
      'src',
      expect.stringContaining('/avatars/avatar-default.svg'),
    );
    expect(screen.getByRole('img')).toHaveClass('size-full', 'object-cover');
  });

  it('전달받은 프로필 이미지를 렌더링한다', () => {
    render(<Avatar alt="홍길동 프로필" src="/images/hong-gildong.png" />);

    expect(screen.getByRole('img', { name: '홍길동 프로필' })).toHaveAttribute(
      'src',
      expect.stringContaining('/images/hong-gildong.png'),
    );
  });

  it('이미지 로드에 실패하면 기본 아바타로 전환한다', () => {
    render(<Avatar alt="홍길동 프로필" src="https://dev.moyeota.com/profile/missing.png" />);

    const image = screen.getByRole('img', { name: '홍길동 프로필' });
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', expect.stringContaining('/avatars/avatar-default.svg'));
  });

  it.each([
    ['sm', 'size-[36px]'],
    ['md', 'size-[42px]'],
    ['lg', 'size-[100px]'],
  ] as const)('size=%s에 맞는 크기를 렌더링한다', (size, expectedClassName) => {
    render(<Avatar size={size} />);

    expect(screen.getByRole('img').parentElement).toHaveClass(expectedClassName);
  });

  it('숫자를 전달하면 사용자 지정 크기로 렌더링한다', () => {
    render(<Avatar size={64} />);

    expect(screen.getByRole('img').parentElement).toHaveStyle({
      height: '64px',
      width: '64px',
    });
  });
});
