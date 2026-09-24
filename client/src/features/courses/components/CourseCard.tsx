import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ApiCourse } from '@/features/courses/api';
import { cn } from '@/shared/lib/utils';

const langLabel: Record<string, string> = {
  'html-css': 'HTML & CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  sql: 'SQL',
  react: 'React',
  tailwind: 'Tailwind',
  'dsa-python': 'DSA · Python',
  'dsa-javascript': 'DSA · JavaScript',
};

/**
 * Per-language accent. Used for the browser dot indicators and the
 * fallback tile for courses without a thumbnail.
 *
 * Deliberately hardcoded - these are the "brand colors" of each
 * programming language, not the platform's theme colors. Python blue
 * should stay Python blue in both light and dark mode.
 */
const langAccent: Record<string, string> = {
  'html-css': '#E34F26',
  javascript: '#D4B106',
  typescript: '#3178C6',
  python: '#3776AB',
  sql: '#4479A1',
  react: '#0891B2',
  tailwind: '#0EA5E9',
  'dsa-python': '#16A34A',
  'dsa-javascript': '#D97706',
  ruby: '#CC342D',
  java: '#EA580C',
};

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

interface Props {
  course: ApiCourse;
  progressPercent?: number;
  completedCount?: number;
}

export const CourseCard: React.FC<Props> = ({
  course,
  progressPercent = 0,
  completedCount = 0,
}) => {
  const accent = langAccent[course.language] ?? '#2A835F';
  const discount = discountPercent(course.price, course.originalPrice);
  const hasProgress = progressPercent > 0 || completedCount > 0;

  return (
    <Link to={`/courses/${course.slug}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface',
          'transition-all duration-300',
          'hover:-translate-y-1 hover:border-brand-500/40',
          'hover:shadow-[0_20px_60px_-20px_rgba(42,131,95,0.35)]'
        )}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-auto font-mono text-[10px] text-text-muted">
            {course.slug}.kodx
          </span>
        </div>

        {/* Hero image */}
        <div className="relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl bg-surface-secondary">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, ${accent}30, transparent 60%), radial-gradient(circle at 80% 80%, ${accent}15, transparent 55%)`,
              }}
            >
              <span
                className="font-mono text-3xl font-bold"
                style={{ color: accent }}
              >
                {langLabel[course.language]?.split(' ')[0] ?? course.language}
              </span>
            </div>
          )}

          {/* Floating badge */}
          {course.badge && (
            <span
              className={cn(
                'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] font-bold tracking-wider text-text-primary backdrop-blur-md'
              )}
            >
              {course.badge === 'LIVE' && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-error)]" />
              )}
              {course.badge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {course.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
                >
                  {t}
                </span>
              ))}
              {course.tags.length > 4 && (
                <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                  +{course.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="mt-3 text-lg font-semibold leading-tight text-text-primary">
            {course.title}
            {course.tagline && (
              <span className="block text-text-muted">with {course.tagline}</span>
            )}
          </h3>

          {/* Description */}
          {!course.tagline && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
              {course.description}
            </p>
          )}

          {/* Progress */}
          {hasProgress && (
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-text-muted">
                {completedCount} / {course.totalLessons} lessons ·{' '}
                {progressPercent}%
              </p>
            </div>
          )}

          {/* Price row */}
          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-baseline gap-2">
              {course.isFree ? (
                <span className="text-lg font-bold text-[var(--color-success)]">
                  FREE
                </span>
              ) : course.price ? (
                <>
                  <span className="text-lg font-bold text-text-primary">
                    {formatINR(course.price)}
                  </span>
                  {course.originalPrice &&
                    course.originalPrice > course.price && (
                      <span className="text-sm text-text-muted line-through">
                        {formatINR(course.originalPrice)}
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
            <div
              className={cn(
                'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2.5',
                'text-sm font-semibold text-text-primary transition-colors',
                'group-hover:border-brand-500/40 group-hover:bg-surface-tertiary'
              )}
            >
              Check Course
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