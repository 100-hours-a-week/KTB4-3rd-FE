import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolItem, type CarPoolListItem } from '@/entities/carpool';

const carpool: CarPoolListItem = {
  id: 10,
  host: { name: '홍길동', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '유스페이스1',
  departure_at: '2026-10-10T09:40:00.000Z',
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  is_full: false,
  is_expired: false,
};

function renderItem(overrides: Partial<CarPoolListItem> = {}) {
  const onClick = vi.fn<(carpoolId: number) => void>();
  render(
    <ul>
      <CarpoolItem carpool={{ ...carpool, ...overrides }} onClick={onClick} />
    </ul>,
  );
  return onClick;
}

afterEach(cleanup);

describe('CarpoolItem', () => {
  it('출발지, 도착지와 서울 기준 출발 시간, 참여 인원을 표시한다', () => {
    renderItem();
    expect(screen.getByText('판교역 → 유스페이스1')).toBeInTheDocument();
    expect(screen.getByText('18:40 출발 · 2/4명 참여 중')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '홍길동 프로필 이미지' })).toHaveAttribute(
      'src',
      expect.stringContaining('/avatars/avatar-default.svg'),
    );
  });

  it('클릭하면 게시글 ID를 전달한다', async () => {
    const onClick = renderItem();
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledExactlyOnceWith(10);
  });

  it.each(['{Enter}', ' '])('키보드 %s로 상세 화면을 열 수 있다', async (key) => {
    const onClick = renderItem();
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard(key);
    expect(onClick).toHaveBeenCalledExactlyOnceWith(10);
  });

  it.each([{ is_full: true, current_count: 4 }, { is_expired: true }])(
    '정원이 찼거나 출발 시간이 지난 게시글도 선택할 수 있다: %j',
    async (overrides) => {
      const onClick = renderItem(overrides);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledExactlyOnceWith(10);
    },
  );

  it('긴 장소 이름도 버튼의 접근 가능한 이름에 모두 남긴다', () => {
    const origin_name = '아주 긴 출발지 이름 판교테크노밸리 유스페이스1 A동 정문';
    const dest_name = '아주 긴 도착지 이름 서울 강남역 12번 출구';
    renderItem({ origin_name, dest_name });
    expect(screen.getByRole('button')).toHaveAccessibleName(
      expect.stringContaining(`${origin_name} → ${dest_name}`),
    );
  });

  it('UTC 날짜가 바뀌는 시간도 서울 기준으로 표시한다', () => {
    renderItem({ departure_at: '2026-10-10T15:05:00.000Z' });
    expect(screen.getByText('00:05 출발 · 2/4명 참여 중')).toBeInTheDocument();
  });

  it('프로필 이미지 로드 실패 시 기본 아바타로 바꾼다', () => {
    renderItem({ host: { name: '홍길동', profile_image_url: '/missing-profile.png' } });
    const image = screen.getByRole('img', { name: '홍길동 프로필 이미지' });
    expect(image).toHaveAttribute('src', expect.stringContaining('/missing-profile.png'));
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', expect.stringContaining('/avatars/avatar-default.svg'));
  });
});
