import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostCreateFab } from '@/features/post-create';

afterEach(cleanup);

describe('PostCreateFab', () => {
  it('클릭하면 전달받은 동작을 실행한다', () => {
    const onClick = vi.fn<() => void>();

    render(
      <PostCreateFab
        aria-label="글쓰기"
        leftSlot={<span aria-hidden="true">+</span>}
        onClick={onClick}
      >
        글쓰기
      </PostCreateFab>,
    );

    fireEvent.click(screen.getByRole('button', { name: '글쓰기' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
