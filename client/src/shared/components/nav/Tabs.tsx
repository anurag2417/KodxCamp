import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';

export interface TabItem {
  /** Display label. */
  label: string;
  /** Route path. Tabs are route-linked, not state-driven. */
  to: string;
  /** When true, matches only the exact `to`, not nested paths. */
  end?: boolean;
}

interface Props {
  items: TabItem[];
  /**
   * Visual variant:
   *   - `underline` (default): bottom border on the active tab.
   *     Used inside content areas (Lesson's Session / Assignment / Quiz).
   *   - `pill`: rounded background on the active tab.
   *     Used at the top of a workspace (Roadmap's Overview / Learning / ...).
   */
  variant?: 'underline' | 'pill';
  /** Accessible label for the tablist landmark. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Contextual tab bar.
 *
 * This is the "contextual navigation" the Master Spec calls for in place
 * of a student sidebar. Tabs are route-linked (each tab is a real URL,
 * sharable and back-button-safe), not local component state.
 *
 * Two visual variants live here so one component serves both the
 * in-content tabs (Lesson) and the workspace-level tabs (Roadmap).
 *
 * Tabs are horizontally scrollable on overflow — critical on mobile
 * where five tabs won't fit. `overflow-x-auto` on the container with
 * `whitespace-nowrap` on each item.
 */
export const Tabs: React.FC<Props> = ({
  items,
  variant = 'underline',
  ariaLabel = 'Section navigation',
  className,
}) => {
  if (items.length === 0) return null;

  const baseItem =
    'relative flex shrink-0 items-center whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors';

  const underlineClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      baseItem,
      isActive
        ? 'text-text-primary'
        : 'text-text-muted hover:text-text-secondary'
    );

  const pillClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-text-muted hover:bg-surface-tertiary hover:text-text-secondary'
    );

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        variant === 'underline'
          ? 'flex w-full items-center gap-1 overflow-x-auto border-b border-border'
          : 'flex w-full items-center gap-2 overflow-x-auto',
        className
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={
            variant === 'underline' ? underlineClasses : pillClasses
          }
        >
          {({ isActive }) => (
            <>
              {item.label}
              {variant === 'underline' && isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};