import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolPin, getCarpoolPinMarkerImage } from '@/entities/map-pin';

afterEach(cleanup);
describe('CarpoolPin', () => {
  it('같은 로컬 핀 자산을 UI와 지도에서 사용한다', () => {
    render(<CarpoolPin />);
    const image = screen.getByRole('button', { name: '카풀 게시글' }).querySelector('img');
    const marker = getCarpoolPinMarkerImage();
    expect(image).toHaveAttribute('src', marker.src);
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('aria-hidden', 'true');
    expect(marker).toEqual({
      src: '/map-pins/carpool-marker.png',
      width: 54,
      height: 54,
      offset: { x: 27, y: 54 },
    });
    const bytes = readFileSync(`public${marker.src}`);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.readUInt32BE(16)).toBe(marker.width);
    expect(bytes.readUInt32BE(20)).toBe(marker.height);
  });
  it('부모가 전달한 선택 상태와 이름을 표시한다', () => {
    const { rerender } = render(<CarpoolPin aria-label="서울역 출발" />);
    const pin = screen.getByRole('button', { name: '서울역 출발' });
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    rerender(<CarpoolPin aria-label="서울역 출발" isSelected />);
    expect(pin).toHaveAttribute('aria-pressed', 'true');
    expect(pin).toHaveClass('scale-[1.15]', 'z-10');
  });
  it('클릭과 Enter, Space를 각각 한 번 전달한다', async () => {
    const onClick = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<CarpoolPin onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter} ');
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
  it('비활성 핀은 클릭을 전달하지 않는다', async () => {
    const onClick = vi.fn<() => void>();
    render(<CarpoolPin disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
