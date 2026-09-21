import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MapPin } from '@/entities/map-pin';

afterEach(cleanup);

describe('MapPin', () => {
  it.each(['accompany', 'community', 'start', 'destination'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<MapPin variant={variant} />);

      expect(document.querySelector(`[data-map-pin="${variant}"]`)).toBeInTheDocument();
    },
  );

  it('uses the route labels for start and destination pins', () => {
    render(
      <>
        <MapPin variant="start" />
        <MapPin variant="destination" />
      </>,
    );

    expect(screen.getByText('출발')).toBeInTheDocument();
    expect(screen.getByText('도착')).toBeInTheDocument();
  });

  it('allows a route label to be overridden', () => {
    render(<MapPin label="집" variant="start" />);

    expect(screen.getByText('집')).toBeInTheDocument();
  });

  it('exposes the clicked state for the map feature to control', () => {
    render(<MapPin state="clicked" variant="community" />);

    const pin = document.querySelector('[data-map-pin="community"]');

    expect(pin).toHaveAttribute('data-map-pin-state', 'clicked');
    expect(pin).toHaveClass('z-10');
    expect(pin).toHaveClass('active:brightness-95');
  });

  it('keeps decorative pins hidden from assistive technology by default', () => {
    render(<MapPin variant="community" />);

    expect(document.querySelector('[data-map-pin="community"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
