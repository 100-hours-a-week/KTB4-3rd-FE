import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolRequestCard } from '@/features/carpool-request';

const overLimitMessage = '200자 이내로 입력해주세요';
type Props = ComponentProps<typeof CarpoolRequestCard>;
function setup(overrides: Partial<Props> = {}) {
  const onSubmit = vi.fn<(content: string) => void>();
  const onDirtyChange = vi.fn<(dirty: boolean) => void>();
  const props = { isSubmitting: false, onSubmit, onDirtyChange, ...overrides };
  return { ...render(<CarpoolRequestCard {...props} />), props, onSubmit, onDirtyChange };
}
function input() {
  return screen.getByRole('textbox');
}
function change(content: string) {
  fireEvent.change(input(), { target: { value: content } });
}
function submitForm() {
  const form = input().closest('form');
  if (!form) {
    throw new Error('요청 입력은 native form으로 제출할 수 있어야 합니다.');
  }
  fireEvent.submit(form);
}
afterEach(cleanup);

describe('카풀 요청 메시지 카드', () => {
  it('빈 입력으로 시작하고 입력 존재 여부가 달라질 때만 상위에 알린다', () => {
    const { onDirtyChange } = setup();
    expect(input()).toHaveValue('');
    expect(input()).toHaveAccessibleName();
    expect(onDirtyChange.mock.calls).toEqual([[false]]);
    change('같이 가요');
    change('다른 내용');
    change(' ');
    expect(onDirtyChange.mock.calls).toEqual([[false], [true]]);
    change('');
    expect(onDirtyChange.mock.calls).toEqual([[false], [true], [false]]);
  });

  it('StrictMode와 callback 교체는 같은 dirty 알림을 반복하지 않는다', () => {
    const first = vi.fn<(dirty: boolean) => void>();
    const second = vi.fn<(dirty: boolean) => void>();
    const onSubmit = vi.fn<(content: string) => void>();
    const view = (onDirtyChange: Props['onDirtyChange']) => (
      <StrictMode>
        <CarpoolRequestCard
          isSubmitting={false}
          onSubmit={onSubmit}
          onDirtyChange={onDirtyChange}
        />
      </StrictMode>
    );
    const { rerender } = render(view(first));
    expect(first.mock.calls).toEqual([[false]]);
    change('메시지');
    expect(first.mock.calls).toEqual([[false], [true]]);
    rerender(view(second));
    expect(second).not.toHaveBeenCalled();
    change('');
    expect(second.mock.calls).toEqual([[false]]);
    expect(first.mock.calls).toEqual([[false], [true]]);
  });

  it.each([0, 1, 179, 180, 200, 201])('%i자 입력의 제출·counter·오류 경계를 지킨다', (length) => {
    setup();
    const content = '가'.repeat(length);
    change(content);
    expect(input()).toHaveValue(content);
    expect(input()).not.toHaveAttribute('maxlength');
    expect(screen.getByRole('button')).toHaveProperty('disabled', length === 0 || length > 200);
    const counter = screen.getByTestId('character-count');
    expect(counter).toHaveAttribute('aria-hidden', String(length < 180));
    expect(counter.classList.contains('invisible')).toBe(length < 180);
    expect(counter).toHaveTextContent(`${length} / 200`);
    expect(screen.queryByText(overLimitMessage) !== null).toBe(length > 200);
    expect(input().getAttribute('aria-invalid') === 'true').toBe(length > 200);
  });

  it('label 클릭은 textarea에 초점을 두고 Enter는 제출 대신 줄바꿈을 입력한다', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.click(screen.getByText('요청 메시지'));
    expect(input()).toHaveFocus();
    await user.type(input(), '첫 줄{Enter}둘째 줄');
    expect(input()).toHaveValue('첫 줄\n둘째 줄');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button'));
    expect(onSubmit.mock.calls).toEqual([['첫 줄\n둘째 줄']]);
  });

  it('초과한 입력을 지우면 길이 오류와 danger 표시를 해제한다', () => {
    setup();
    change('가'.repeat(201));
    expect(input()).toHaveAccessibleDescription(overLimitMessage);
    expect(screen.getByTestId('character-count')).toHaveStyle({
      color: 'var(--color-fg-critical)',
    });
    change('가'.repeat(200));
    expect(input()).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(overLimitMessage)).not.toBeInTheDocument();
    expect(screen.getByTestId('character-count')).toHaveStyle({ color: 'var(--color-fg-neutral)' });
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('보조 평면 이모지는 UTF-16 길이로 계산하며 200을 넘는 원문을 보존한다', () => {
    const { onSubmit } = setup();
    change('😀'.repeat(100));
    expect(screen.getByTestId('character-count')).toHaveTextContent('200 / 200');
    submitForm();
    expect(onSubmit).toHaveBeenCalledWith('😀'.repeat(100));
    const overLimit = `${'😀'.repeat(100)}a`;
    change(overLimit);
    expect(input()).toHaveValue(overLimit);
    expect(screen.getByTestId('character-count')).toHaveTextContent('201 / 200');
    submitForm();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it.each([' ', '  같이 가요  ', '첫 줄\n둘째 줄\n'])(
    '공백과 줄바꿈 원문 %j를 그대로 제출한다',
    (content) => {
      const { onSubmit } = setup();
      change(content);
      submitForm();
      expect(onSubmit.mock.calls).toEqual([[content]]);
    },
  );

  it.each([
    { content: '', busy: false },
    { content: '가'.repeat(201), busy: false },
    { content: '유효한 입력', busy: true },
  ])('native submit에서도 빈 입력·초과·제출 중 요청을 차단한다 (%j)', ({ content, busy }) => {
    const { onSubmit, props, rerender } = setup();
    change(content);
    rerender(<CarpoolRequestCard {...props} isSubmitting={busy} />);
    submitForm();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue(content);
  });

  it('제출 중 입력과 버튼을 잠그고 실패 후 입력을 유지하며 자동 재전송하지 않는다', async () => {
    const user = userEvent.setup();
    const { props, rerender, onSubmit } = setup();
    change('  원문 유지\n');
    await user.click(screen.getByRole('button'));
    expect(onSubmit.mock.calls).toEqual([['  원문 유지\n']]);
    rerender(<CarpoolRequestCard {...props} isSubmitting />);
    expect(input()).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    submitForm();
    rerender(<CarpoolRequestCard {...props} isSubmitting={false} />);
    expect(input()).toBeEnabled();
    expect(input()).toHaveValue('  원문 유지\n');
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('요청 단계가 종료되어 새로 마운트되면 빈 입력과 dirty false로 시작한다', () => {
    const { props, unmount, onDirtyChange } = setup();
    change('임시 입력');
    unmount();
    render(<CarpoolRequestCard {...props} />);
    expect(input()).toHaveValue('');
    expect(onDirtyChange.mock.calls).toEqual([[false], [true], [false]]);
  });

  it('상위가 주입한 프로필과 제출 액션에 현재 잠금·로딩·submit type을 전달한다', () => {
    const renderSubmitAction = vi.fn<NonNullable<Props['renderSubmitAction']>>(
      ({ disabled, loading, type }) => (
        <button type={type} disabled={disabled} aria-busy={loading || undefined}>
          직접 요청
        </button>
      ),
    );
    const { props, rerender, onSubmit } = setup({
      profileSlot: <span>요청자 프로필</span>,
      renderSubmitAction,
    });
    expect(screen.getByText('요청자 프로필')).toBeInTheDocument();
    expect(renderSubmitAction).toHaveBeenLastCalledWith({
      disabled: true,
      loading: false,
      type: 'submit',
    });
    change('요청 내용');
    expect(renderSubmitAction).toHaveBeenLastCalledWith({
      disabled: false,
      loading: false,
      type: 'submit',
    });
    fireEvent.click(screen.getByRole('button', { name: '직접 요청' }));
    expect(onSubmit.mock.calls).toEqual([['요청 내용']]);
    rerender(<CarpoolRequestCard {...props} isSubmitting />);
    expect(renderSubmitAction).toHaveBeenLastCalledWith({
      disabled: true,
      loading: true,
      type: 'submit',
    });
  });
});
