import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolDetail, type CarpoolDetailProps } from '@/entities/carpool';

const carpool: Extract<CarpoolDetailProps, { status: 'content' }>['carpool'] = {
  status: 'RECRUITING',
  host: { id: 1, name: '호스트', profile_image_url: null },
  origin_name: '서울역',
  dest_name: '인천국제공항',
  departure_at: '2030-08-24T18:40:00',
  car_model: '현대 아반떼',
  current_count: 2,
  capacity: 4,
  is_full: false,
  participants: [
    { id: 1, name: '호스트', profile_image_url: null },
    { id: 2, name: '참여자', profile_image_url: null },
  ],
};

function renderContent(
  overrides: Partial<Extract<CarpoolDetailProps, { status: 'content' }>> = {},
) {
  const onRequestClick = vi.fn<() => void>();
  render(
    <CarpoolDetail
      carpool={carpool}
      isCheckingRequest={false}
      isHost={false}
      isParticipant={false}
      onRequestClick={onRequestClick}
      status="content"
      {...overrides}
    />,
  );
  return onRequestClick;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CarpoolDetail', () => {
  it('카풀 상세 정보와 참여자를 보여주고 가능한 요청을 전달한다', () => {
    const onRequestClick = renderContent();

    expect(screen.getByRole('heading', { name: '서울역 → 인천국제공항' })).toBeInTheDocument();
    expect(screen.getByText('2030/08/24 18:40 (오후)')).toBeInTheDocument();
    expect(screen.getByText('현대 아반떼')).toBeInTheDocument();
    expect(screen.getByText('2 / 4명')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '카풀 참여자' }).children).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '동행 요청하기' }));
    expect(onRequestClick).toHaveBeenCalledOnce();
  });

  it.each([
    ['호스트', { isHost: true }, '본인이 등록한 카풀에는 요청할 수 없어요.'],
    ['참여자', { isParticipant: true }, '이미 참여 중인 카풀이에요.'],
    ['요청 확인 중', { isCheckingRequest: true }, '최신 카풀 정보를 확인하고 있어요.'],
  ])('%s 상태에서는 요청을 막고 이유를 보여준다', (_label, override, message) => {
    const onRequestClick = renderContent(override);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '동행 요청하기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '동행 요청하기' }));
    expect(onRequestClick).not.toHaveBeenCalled();
  });

  it('로딩 상태를 보조 기술에 안내한다', () => {
    render(<CarpoolDetail status="loading" />);

    expect(screen.getByRole('status', { name: '카풀 상세 불러오는 중' })).toBeInTheDocument();
  });

  it('오류 상태에서 재시도를 요청한다', () => {
    const onRetry = vi.fn<() => void>();
    render(<CarpoolDetail onRetry={onRetry} status="error" />);

    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
