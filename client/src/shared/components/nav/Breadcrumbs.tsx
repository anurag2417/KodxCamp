import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface Breadcrumb {
  /** Display label. Keep short — the trail is a location hint, not a title. */
  label: string;
  /** Where this crumb links to. Omit for the current (last) crumb. */
  to?: string;
}

interface Props {
  items: Breadcrumb[];
  className?: string;
}

/**
 * Breadcrumb trail.
 *
 * Behavior:
 *   - Renders a `<nav>` with an ordered list so screen readers announce
 *     the trail correctly.
 *   - The last item is the current page: rendered as plain text, marked
 *     `aria-current="page"`.
 *   - Non-last items must have a `to`; they render as `<Link>`.
 *   - The list is horizontally scrollable on mobile (no wrap) so a long
 *     trail stays on one line with a swipe, rather than exploding to
 *     two or three lines and pushing the page content down.
 *
 * Mobile behavior (Master Spec, section 25): the mobile display shows
 * only the current page — the parent chrome already communicates
 * "where you are". Desktop shows the full trail.
 */
export const Breadcrumbs: React.FC<Props> = ({ items, className }) => {
  if (items.length === 0) return null;

  const current = items[items.length - 1];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('w-full', className)}
    >
      {/* Mobile: current only */}
      <p className="truncate text-xs font-medium text-text-muted sm:hidden">
        {current.label}
      </p>

      {/* Desktop: full trail */}
      <ol className="hidden items-center gap-1.5 text-xs sm:flex">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  size={12}
                  className="shrink-0 text-text-muted/60"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="truncate font-medium text-text-primary"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="truncate text-text-muted transition-colors hover:text-brand-500"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};