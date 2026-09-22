import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostCreateFab } from '@/features/post-create';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
});

describe('PostCreateFab', () => {
  it('클릭하면 글 작성 위치 등록 화면으로 이동한다', () => {
    render(
      <PostCreateFab aria-label="글쓰기" leftSlot={<span aria-hidden="true">+</span>}>
        글쓰기
      </PostCreateFab>,
    );

    fireEvent.click(screen.getByRole('button', { name: '글쓰기' }));

    expect(navigation.push).toHaveBeenCalledWith('/post/create/location');
  });
});
