import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BottomSheet } from '@/shared/ui/bottom-sheet';

describe('BottomSheet', () => {
  it('renders the optional title and description when open', () => {
    render(
      <BottomSheet open title="근처 핀 게시글" description="가까운 순">
        <p>게시글 목록</p>
      </BottomSheet>,
    );

    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    expect(screen.getByText('가까운 순')).toBeInTheDocument();
    expect(screen.getByText('게시글 목록')).toBeInTheDocument();
  });

  it('does not render a description when it is omitted', () => {
    render(
      <BottomSheet open title="제목">
        <p>콘텐츠</p>
      </BottomSheet>,
    );

    const title = screen.getByRole('heading', { name: '제목' });

    expect(title).toBeInTheDocument();
    expect(
      title.parentElement?.parentElement?.querySelector('[data-testid="bottom-sheet-description"]'),
    ).not.toBeInTheDocument();
  });

  it('allows the title to be omitted while keeping the description and divider', () => {
    render(
      <BottomSheet open description="가까운 순">
        <p>콘텐츠</p>
      </BottomSheet>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('bottom-sheet-description').at(-1)).toHaveTextContent('가까운 순');
    expect(screen.getAllByTestId('bottom-sheet-divider').at(-1)).toBeInTheDocument();
  });

  it('calls onViewAll when the view all button is clicked', () => {
    const onViewAll = vi.fn<() => void>();

    render(
      <BottomSheet open onViewAll={onViewAll} showViewAllButton title="게시글">
        <p>콘텐츠</p>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: '전체보기' }));

    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it('moves to the minimum snap point when the backdrop is clicked', () => {
    const onSnapPointChange = vi.fn<(snapPoint: number | string | null) => void>();

    render(
      <BottomSheet
        defaultOpen
        defaultSnapPoint={0.7}
        onSnapPointChange={onSnapPointChange}
        title="게시글"
      >
        <p>콘텐츠</p>
      </BottomSheet>,
    );

    fireEvent.pointerDown(screen.getAllByTestId('bottom-sheet-viewport').at(-1) as HTMLElement);

    expect(onSnapPointChange).toHaveBeenCalledWith('112px');
  });

  it('does not fully close from Escape when the sheet is open', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomSheet defaultOpen onOpenChange={onOpenChange} title="게시글">
        <p>콘텐츠</p>
      </BottomSheet>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '게시글' })).toBeInTheDocument();
  });
});
