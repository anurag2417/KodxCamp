import { useEffect, useRef, useState } from 'react';

/**
 * Returns a value between -1 and 1 representing the element's position
 * relative to the viewport. 0 = centered, -1 = bottom edge, 1 = top edge.
 */
export function useParallax<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const delta = (center - viewportCenter) / window.innerHeight;
      setProgress(Math.max(-1.2, Math.min(1.2, -delta)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { ref, progress };
}