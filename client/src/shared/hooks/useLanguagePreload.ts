import { useEffect, useMemo, useState } from 'react';
import {
  getPreloadStatus,
  preloadNow,
  queuePreload,
  subscribe,
  type PreloadStatus,
} from '@/shared/runner/preloadManager';

export function useLanguagePreload(
  languages: string[],
  activeLanguage?: string
): {
  status: Record<string, PreloadStatus>;
  warmUp: (language: string) => void;
} {
  // Bumped on every manager event. Forces a re-render so the status
  // snapshot below picks up the latest values.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(() => setTick((n) => n + 1));
    return unsubscribe;
  }, []);

  // Queue all provided languages, with the active one prioritised.
  // The dependency list is the joined string, which has a stable
  // length regardless of how many languages there are.
  const languagesKey = languages.join(',');
  useEffect(() => {
    if (languages.length === 0) return;

    if (activeLanguage && languages.includes(activeLanguage)) {
      queuePreload(activeLanguage, 'front');
    }
    for (const lang of languages) {
      if (lang !== activeLanguage) queuePreload(lang, 'back');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languagesKey, activeLanguage]);

  // Recompute the status map on every render, including ones triggered
  // by the manager's subscription. `tick` in the deps ensures the memo
  // re-runs when the manager emits.
  const status = useMemo(() => {
    const out: Record<string, PreloadStatus> = {};
    for (const lang of languages) {
      out[lang] = getPreloadStatus(lang);
    }
    if (activeLanguage) {
      out[activeLanguage] = getPreloadStatus(activeLanguage);
    }
    return out;
    // `tick` is a proxy for "the manager changed"; `languagesKey` and
    // `activeLanguage` capture the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, languagesKey, activeLanguage]);

  const warmUp = useMemo(
    () => (language: string) => {
      void preloadNow(language);
    },
    []
  );

  return { status, warmUp };
}