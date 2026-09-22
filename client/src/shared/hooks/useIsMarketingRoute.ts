import { useLocation } from 'react-router-dom';

/**
 * Returns true for routes that should render "full-bleed" — no sidebar,
 * transparent navbar, marketing-style layout.
 *
 * Add more paths here as you build out additional marketing pages
 * (e.g. /about, /pricing if they become standalone).
 */
const MARKETING_PATHS = ['/'];

export function useIsMarketingRoute(): boolean {
  const { pathname } = useLocation();
  return MARKETING_PATHS.includes(pathname);
}