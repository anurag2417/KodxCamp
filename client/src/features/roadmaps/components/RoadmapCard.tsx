import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { ApiRoadmapSummary } from '@/features/roadmaps/api';
import { cn } from '@/shared/lib/utils';

function formatINR(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function discountPercent(
  price: number | undefined,
  original: number | undefined
): number | null {
  if (!price || !original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}

/**
 * Roadmap catalog card.
 *
 * Visual language matches `CourseCard` so a student scanning the
 * catalog sees a consistent card system — a roadmap is "a bigger
 * course", so its card should look like a course card with one extra
 * affordance: the course count.
 */
interface Props {
  roadmap: ApiRoadmapSummary;
}

export const RoadmapCard: React.FC<Props> = ({ roadmap }) => {
  const discount = discountPercent(roadmap.price, roadmap.originalPrice);

  return (
    <Link to={`/roadmaps/${roadmap.slug}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface',
          'transition-all duration-300',
          'hover:-translate-y-1 hover:border-brand-500/40',
          'hover:shadow-[0_20px_60px_-20px_rgba(30,58,138,0.35)]'
        )}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-auto font-mono text-[10px] text-text-muted">
            {roadmap.slug}.roadmap
          </span>
        </div>

        {/* Hero image */}
        <div className="relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl bg-surface-secondary">
          {roadmap.thumbnail ? (
            <img
              src={roadmap.thumbnail}
              alt={roadmap.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, rgba(37,99,235,0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.12), transparent 55%)',
              }}
            >
              <BookOpen size={40} className="text-brand-500/70" />
            </div>
          )}

          {/* Floating badge */}
          {roadmap.badge && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] font-bold tracking-wider text-text-primary backdrop-blur-md">
              {roadmap.badge === 'LIVE' && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-error)]" />
              )}
              {roadmap.badge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          {/* Tags */}
          {roadmap.tags && roadmap.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {roadmap.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
                >
                  {t}
                </span>
              ))}
              {roadmap.tags.length > 4 && (
                <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                  +{roadmap.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="mt-3 text-lg font-semibold leading-tight text-text-primary">
            {roadmap.title}
            {roadmap.tagline && (
              <span className="block text-text-muted">
                {roadmap.tagline}
              </span>
            )}
          </h3>

          {/* Description */}
          {!roadmap.tagline && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
              {roadmap.description}
            </p>
          )}

          {/* Course count */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
            <BookOpen size={12} />
            <span>
              {roadmap.courseCount}{' '}
              {roadmap.courseCount === 1 ? 'course' : 'courses'}
            </span>
          </div>

          {/* Price row */}
          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-baseline gap-2">
              {roadmap.isFree ? (
                <span className="text-lg font-bold text-[var(--color-success)]">
                  FREE
                </span>
              ) : roadmap.price ? (
                <>
                  <span className="text-lg font-bold text-text-primary">
                    {formatINR(roadmap.price)}
                  </span>
                  {roadmap.originalPrice &&
                    roadmap.originalPrice > roadmap.price && (
                      <span className="text-sm text-text-muted line-through">
                        {formatINR(roadmap.originalPrice)}
                      </span>
                    )}
                  {discount && (
                    <span className="rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                      {discount}% OFF
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-text-muted">Price TBD</span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors group-hover:border-brand-500/40 group-hover:bg-surface-tertiary">
              Explore Roadmap
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};