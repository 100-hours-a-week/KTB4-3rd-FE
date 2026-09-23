import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LocationInputButtonFlow,
  LocationSearchScreen,
  type LocationSelection,
} from '@/features/location-search';

afterEach(cleanup);

describe('LocationSearchScreen', () => {
  it('출발지와 도착지를 순서대로 선택하면 완료 콜백을 호출한다', () => {
    const onComplete = vi.fn<(selection: LocationSelection) => void>();

    render(<LocationSearchScreen onComplete={onComplete} />);

    fireEvent.change(screen.getByRole('textbox', { name: '출발지' }), {
      target: { value: '유스페이스' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /유스페이스1빌딩/ })[0]);

    expect(screen.getByRole('textbox', { name: '출발지' })).toHaveValue('유스페이스1빌딩');
    expect(screen.getByRole('textbox', { name: '도착지' })).toHaveValue('');

    fireEvent.click(screen.getAllByRole('button', { name: /유스페이스1빌딩/ })[1]);

    expect(onComplete).toHaveBeenCalledWith({
      departure: expect.objectContaining({ placeName: '유스페이스1빌딩' }),
      destination: expect.objectContaining({ placeName: '유스페이스1빌딩' }),
    });
  });

  it('뒤로가기 콜백을 호출한다', () => {
    const onCancel = vi.fn<() => void>();

    render(<LocationSearchScreen onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: '장소 검색 닫기' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('LocationInputButtonFlow', () => {
  it('선택 완료 후 원래 화면으로 돌아와 도착지를 표시한다', () => {
    render(<LocationInputButtonFlow />);

    fireEvent.click(screen.getByRole('button', { name: '장소 선택' }));
    fireEvent.change(screen.getByRole('textbox', { name: '출발지' }), {
      target: { value: '유스페이스' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /유스페이스1빌딩/ })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /유스페이스1빌딩/ })[1]);

    expect(screen.getByRole('button', { name: '장소 선택' })).toHaveTextContent('유스페이스1빌딩');
    expect(screen.queryByRole('textbox', { name: '출발지' })).not.toBeInTheDocument();
  });
});
