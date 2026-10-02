import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '@/features/chatting';

afterEach(cleanup);

describe('ChatComposer', () => {
  it('Figma 기준의 입력 영역과 비활성 전송 버튼을 렌더링한다', () => {
    render(<ChatComposer />);

    expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveAttribute(
      'placeholder',
      '메시지를 입력하세요.',
    );
    expect(screen.getByRole('textbox', { name: '메시지 입력' })).toHaveAttribute(
      'maxLength',
      '500',
    );
    expect(screen.getByRole('button', { name: '메시지 전송' })).toBeDisabled();
    expect(screen.getByRole('textbox').closest('form')).toHaveClass('h-[78px]');
    expect(screen.getByRole('textbox').parentElement).not.toHaveClass('focus-within:border-2');
  });

  it('메시지를 입력하면 전송 버튼을 활성화하고 제출 후 값을 비운다', () => {
    const onSubmit = vi.fn<(message: string) => void>();
    render(<ChatComposer onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });

    fireEvent.change(input, { target: { value: '  안녕하세요  ' } });
    expect(sendButton).toBeEnabled();

    fireEvent.click(sendButton);

    expect(onSubmit).toHaveBeenCalledWith('안녕하세요');
    expect(input).toHaveValue('');
    expect(sendButton).toBeDisabled();
  });

  it('전송 준비 전에도 메시지를 입력할 수 있고 전송 버튼만 비활성화한다', () => {
    const onSubmit = vi.fn<(message: string) => void>();
    render(<ChatComposer onSubmit={onSubmit} submitDisabled />);

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });

    expect(input).toBeEnabled();
    expect(sendButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '연결을 기다리는 메시지' } });

    expect(input).toHaveValue('연결을 기다리는 메시지');
    expect(sendButton).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('controlled value와 변경 콜백을 지원한다', () => {
    const onValueChange = vi.fn<(value: string) => void>();
    const onSubmit = vi.fn<(message: string) => void>();
    const { rerender } = render(
      <ChatComposer onSubmit={onSubmit} onValueChange={onValueChange} value="메시지" />,
    );

    expect(screen.getByRole('button', { name: '메시지 전송' })).toBeEnabled();

    fireEvent.change(screen.getByRole('textbox', { name: '메시지 입력' }), {
      target: { value: '새 메시지' },
    });
    expect(onValueChange).toHaveBeenCalledWith('새 메시지');

    fireEvent.submit(screen.getByRole('textbox').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledWith('메시지');

    rerender(<ChatComposer onSubmit={onSubmit} value="" />);
    expect(screen.getByRole('button', { name: '메시지 전송' })).toBeDisabled();
  });
});
