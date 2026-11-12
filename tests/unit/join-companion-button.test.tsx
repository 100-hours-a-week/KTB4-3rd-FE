import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormEventHandler } from 'react';

import { JoinCompanionButton } from '@/features/join-companion';

afterEach(cleanup);

describe('동행 참여 버튼', () => {
  it('기존 문구와 button type을 유지하고 클릭을 전달한다', async () => {
    const onClick = vi.fn<() => void>();
    const onSubmit = vi.fn<FormEventHandler<HTMLFormElement>>((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <JoinCompanionButton onClick={onClick} />
      </form>,
    );
    const button = screen.getByRole('button', { name: '채팅 참여하기' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.setup().click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('주입한 문구와 submit type으로 실제 form을 제출한다', async () => {
    const onSubmit = vi.fn<FormEventHandler<HTMLFormElement>>((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <JoinCompanionButton label={<span>전송하기</span>} type="submit" />
      </form>,
    );
    const button = screen.getByRole('button', { name: '전송하기' });
    expect(button).toHaveAttribute('type', 'submit');
    await userEvent.setup().click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it.each([
    { disabled: true, loading: false },
    { disabled: false, loading: true },
  ])('disabled와 loading은 클릭 및 form 제출을 차단한다 (%j)', async (state) => {
    const onSubmit = vi.fn<FormEventHandler<HTMLFormElement>>((event) => event.preventDefault());
    const onClick = vi.fn<() => void>();
    render(
      <form onSubmit={onSubmit}>
        <JoinCompanionButton {...state} label="전송하기" type="submit" onClick={onClick} />
      </form>,
    );
    const button = screen.getByRole('button', { name: '전송하기' });
    expect(button).toBeDisabled();
    expect(button.getAttribute('aria-busy')).toBe(state.loading ? 'true' : null);
    await userEvent.setup().click(button);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
