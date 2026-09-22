import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BottomModal } from '@/shared/ui/bottom-modal';

afterEach(cleanup);

describe('BottomModal', () => {
  it('children과 헤더 액션을 렌더링한다', () => {
    render(
      <BottomModal href="/posts/1">
        <p>게시글 상세</p>
      </BottomModal>,
    );

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(screen.getByText('게시글 상세')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '크게보기' })).toHaveAttribute('href', '/posts/1');
  });

  it('bottomOffset만큼 하단에서 띄운다', () => {
    render(
      <BottomModal bottomOffset="72px" href="/posts/1">
        <p>게시글 상세</p>
      </BottomModal>,
    );

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toHaveStyle({ bottom: '72px' });
  });

  it('닫기 버튼을 누르면 비제어 모달을 닫는다', () => {
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onClose={onClose} onOpenChange={onOpenChange}>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('제어 모달은 닫기 이벤트를 부모에 위임한다', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onOpenChange={onOpenChange} open>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
  });
});
