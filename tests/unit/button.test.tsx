import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/shared/ui/button';

describe('Button', () => {
  it('renders its label and handles a press', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();

    render(<Button onClick={handleClick}>확인</Button>);

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
