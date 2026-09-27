import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TaxiPotAnnouncement } from '@/features/taxi-pot-chat';

afterEach(cleanup);

describe('TaxiPotAnnouncement', () => {
  it('기본 상태에서는 안내 내용을 접어둔다', () => {
    render(<TaxiPotAnnouncement departureTime="18:40" />);

    expect(screen.getByRole('button', { name: '안내 펼치기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByTestId('taxi-pot-announcement')).toHaveClass('h-[68px]');
    expect(screen.getByText('출발 시간: 18:40')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '안내 내용' })).not.toBeInTheDocument();
  });

  it('안내 버튼을 누르면 내용을 펼치고 다시 접을 수 있다', async () => {
    const user = userEvent.setup();
    render(<TaxiPotAnnouncement departureTime="18:40" />);

    await user.click(screen.getByRole('button', { name: '안내 펼치기' }));

    expect(screen.getByRole('button', { name: '안내 접기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByTestId('taxi-pot-announcement')).toHaveClass('h-[68px]');
    expect(screen.getByTestId('taxi-pot-announcement-panel')).toHaveClass('h-[262px]');
    expect(screen.getByRole('region', { name: '안내 내용' })).toHaveTextContent(
      '안전한 동승을 위해 확인해주세요',
    );

    await user.click(screen.getByRole('button', { name: '안내 접기' }));

    expect(screen.getByRole('button', { name: '안내 펼치기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('region', { name: '안내 내용' })).not.toBeInTheDocument();
  });

  it('제어 상태와 변경 콜백을 지원한다', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn<(expanded: boolean) => void>();

    render(
      <TaxiPotAnnouncement
        departureTime="18:40"
        expanded={false}
        onExpandedChange={onExpandedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '안내 펼치기' }));

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: '안내 펼치기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
