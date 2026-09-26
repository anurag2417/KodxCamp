/**
 * Analytics helper.
 *
 * Wraps Umami's `window.umami.track()` in a guard so the app never
 * crashes if the script is blocked, slow to load, or unconfigured.
 *
 * Umami automatically tracks page views for SPAs — it listens to the
 * History API and fires a pageview on every client-side navigation.
 * We do NOT need to call `track()` for page views. We only call it
 * for custom events (button clicks, funnel steps, etc.).
 *
 * Cloudflare Web Analytics has no event API. It tracks page views
 * and Core Web Vitals automatically once the beacon is loaded. There
 * is nothing to call from application code.
 *
 * Usage:
 *   track('compiler_click', { source: 'hero' });
 *   track('signup_complete');
 *
 * The function is fire-and-forget. It never throws, never returns a
 * promise, and never blocks the caller.
 */

type TrackProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        properties?: TrackProperties,
      ) => void;
    };
  }
}

/**
 * Track a custom event.
 *
 * No-op when:
 *   - `window.umami` is not defined (script blocked, still loading,
 *     or unconfigured).
 *   - We're running in development (to avoid polluting production
 *     analytics with local noise).
 *
 * @param eventName  Snake-case event name. Keep it short and stable.
 * @param properties Optional key-value pairs. Values must be
 *                   primitives — Umami does not serialize nested
 *                   objects.
 */
export function track(
  eventName: string,
  properties?: TrackProperties,
): void {
  // Skip in development. `import.meta.env.DEV` is true when running
  // `vite dev`, false in production builds.
  if (import.meta.env.DEV) {
    // Optional: log to console so you can verify events during
    // development without sending them to Umami.
    if (import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', eventName, properties ?? {});
    }
    return;
  }

  const umami = typeof window !== 'undefined' ? window.umami : undefined;
  if (!umami || typeof umami.track !== 'function') return;

  try {
    umami.track(eventName, properties);
  } catch {
    // Never let analytics break the app.
  }
}