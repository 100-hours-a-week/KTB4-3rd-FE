import { redirect } from 'next/navigation';
import { expect, it, vi } from 'vitest';

// Next.js routes live outside the src alias.
// oxlint-disable-next-line import/no-relative-parent-imports
import ChattingRoute from '../../app/chatting/page';

vi.mock('next/navigation', () => ({ redirect: vi.fn<typeof redirect>() }));

it('/chatting에서 채팅 목록으로 이동한다', () => {
  ChattingRoute();

  expect(redirect).toHaveBeenCalledWith('/chat');
});
