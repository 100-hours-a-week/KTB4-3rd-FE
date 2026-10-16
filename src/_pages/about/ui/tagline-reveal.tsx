'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import './tagline-reveal.css';

type TaglineRevealProps = {
  text: string;
};

export function TaglineReveal({ text }: TaglineRevealProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const words = container.querySelectorAll<HTMLElement>('[data-tagline-word]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = 'true';
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -28% 0px', threshold: 0.1 },
    );

    words.forEach((word) => observer.observe(word));

    return () => observer.disconnect();
  }, []);

  return (
    <p
      aria-label={text}
      className="max-w-4xl text-4xl leading-tight font-bold tracking-tight text-balance text-[var(--color-fg-neutral)] sm:text-5xl lg:text-6xl"
      ref={containerRef}
    >
      {text.split(' ').map((word, index) => (
        <span
          aria-hidden="true"
          className="tagline-word inline-block pr-2"
          data-tagline-word
          key={`${word}-${index}`}
          style={{ '--word-index': index } as CSSProperties}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
