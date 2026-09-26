import { useEffect, useState } from 'react';

export function useParallax(speed = 0.08) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = window.requestAnimationFrame(() => {
        setOffset(window.scrollY * speed);
      });
    };

    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return offset;
}