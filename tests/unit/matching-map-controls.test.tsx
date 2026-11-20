import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MatchingMapControls } from '@/_pages/matching/ui/matching-map-controls';

afterEach(cleanup);

describe('MatchingMapControls', () => {
  it('현재 위치 버튼 클릭을 부모 callback에 전달한다', async () => {
    const user = userEvent.setup();
    const onCurrentLocationClick = vi.fn<() => void>();

    render(
      <MatchingMapControls
        isFabOpened={false}
        onCarpoolClick={vi.fn<() => void>()}
        onCurrentLocationClick={onCurrentLocationClick}
        onFabOpenChange={vi.fn<(isOpened: boolean) => void>()}
        onTaxipotClick={vi.fn<() => void>()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '현재 위치로 이동' }));

    expect(onCurrentLocationClick).toHaveBeenCalledOnce();
  });

  it('FAB 메뉴 표시 여부를 부모 prop으로 제어한다', async () => {
    const user = userEvent.setup();
    const props = {
      isFabOpened: false,
      onCarpoolClick: vi.fn<() => void>(),
      onCurrentLocationClick: vi.fn<() => void>(),
      onFabOpenChange: vi.fn<(isOpened: boolean) => void>(),
      onTaxipotClick: vi.fn<() => void>(),
    };
    const { rerender } = render(<MatchingMapControls {...props} />);

    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '택시팟 찾기' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));

    expect(props.onFabOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();

    rerender(<MatchingMapControls {...props} isFabOpened />);

    expect(screen.getByRole('button', { name: '카풀 등록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '택시팟 찾기' })).toBeInTheDocument();
  });

  it.each([
    ['카풀 등록', 'carpool'],
    ['택시팟 찾기', 'taxipot'],
  ] as const)('%s 선택 시 부모에게 닫기와 해당 액션을 요청한다', async (label, action) => {
    const user = userEvent.setup();
    const onFabOpenChange = vi.fn<(isOpened: boolean) => void>();
    const onCarpoolClick = vi.fn<() => void>();
    const onTaxipotClick = vi.fn<() => void>();

    render(
      <MatchingMapControls
        isFabOpened
        onCarpoolClick={onCarpoolClick}
        onCurrentLocationClick={vi.fn<() => void>()}
        onFabOpenChange={onFabOpenChange}
        onTaxipotClick={onTaxipotClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: label }));

    expect(onFabOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(action === 'carpool' ? onCarpoolClick : onTaxipotClick).toHaveBeenCalledOnce();
    expect(action === 'carpool' ? onTaxipotClick : onCarpoolClick).not.toHaveBeenCalled();
    expect(onFabOpenChange.mock.invocationCallOrder[0]).toBeLessThan(
      (action === 'carpool' ? onCarpoolClick : onTaxipotClick).mock.invocationCallOrder[0],
    );
  });
});
