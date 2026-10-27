import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeaturedCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  thumbnail?: string;
  isFree: boolean;
  price?: number;
  originalPrice?: number;
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

function formatINR(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

/**
 * Featured courses.
 *
 * The visitor's first view of the actual product. Fetches the public
 * course list and shows the three most recent published courses.
 *
 * Fallback when the catalog is empty: a placeholder with CTAs to the
 * compiler and to roadmaps. This is unlikely but honest — if you have
 * no courses, "start with a course" would be a lie.
 *
 * The card design is deliberately lighter than the app-shell
 * `CourseCard` — no browser-chrome bar, no hover lift, smaller. It's
 * a marketing surface, not a catalog view.
 */
export default function FeaturedCourses() {
  const [courses, setCourses] = useState<FeaturedCourse[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/courses`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body: { data: FeaturedCourse[] }) => {
        if (cancelled) return;
        // Take the three most recently created. The API returns
        // them sorted by createdAt ascending; reverse for newest
        // first.
        const sorted = [...body.data].reverse().slice(0, 3);
        setCourses(sorted);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="kc-section kc-pricing" id="pricing">
      <div className="kc-section-heading">
        <span className="kc-eyebrow">Browse the catalog</span>
        <h2>Start with a course.</h2>
        <p
          style={{
            marginTop: 16,
            maxWidth: 640,
            color: 'var(--color-text-muted)',
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Every course is either free or priced individually. Practice
          problems are always free.
        </p>
      </div>

      {courses === null && !error && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '60px 0',
            color: 'var(--color-text-muted)',
          }}
        >
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <p>Courses are being prepared. Check back soon.</p>
        </div>
      )}

      {courses && courses.length === 0 && (
        <div
          style={{
            padding: 48,
            borderRadius: 24,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            textAlign: 'center',
          }}
        >
          <BookOpen
            size={36}
            style={{ margin: '0 auto', color: 'var(--color-text-muted)' }}
          />
          <h3
            style={{
              marginTop: 16,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            Courses are being prepared.
          </h3>
          <p
            style={{
              marginTop: 8,
              color: 'var(--color-text-muted)',
              maxWidth: 480,
              marginInline: 'auto',
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            In the meantime, try the compiler or browse roadmaps to see what
            the platform teaches.
          </p>
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Link to="/playground" className="kc-button kc-button-primary">
              Try the compiler →
            </Link>
            <Link to="/roadmaps" className="kc-button kc-button-secondary">
              Browse roadmaps
            </Link>
          </div>
        </div>
      )}

      {courses && courses.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              marginTop: 40,
            }}
          >
            {courses.map((course, index) => (
              <motion.article
                key={course._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  overflow: 'hidden',
                }}
              >
                {/* Course Thumbnail Image */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginBottom: 16,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(249,115,22,0.18))',
                        color: 'var(--color-text)',
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {course.language.toUpperCase()}
                    </div>
                  )}

                  {course.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#60a5fa',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {course.badge}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text)',
                  }}
                >
                  {course.title}
                </h3>

                <p
                  style={{
                    marginTop: 10,
                    flex: 1,
                    color: 'var(--color-text-muted)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {course.description}
                </p>

                <div
                  style={{
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                  }}
                >
                  {course.isFree ? (
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--color-success)',
                      }}
                    >
                      FREE
                    </span>
                  ) : course.price ? (
                    <>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--color-text)',
                        }}
                      >
                        {formatINR(course.price)}
                      </span>
                      {course.originalPrice &&
                        course.originalPrice > course.price && (
                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--color-text-muted)',
                              textDecoration: 'line-through',
                            }}
                          >
                            {formatINR(course.originalPrice)}
                          </span>
                        )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: 14,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Price coming soon
                    </span>
                  )}
                </div>

                <Link
                  to={`/courses/${course.slug}`}
                  style={{
                    marginTop: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--color-blue-primary)',
                    textDecoration: 'none',
                  }}
                >
                  View course
                  <ArrowRight size={14} />
                </Link>
              </motion.article>
            ))}
          </div>

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link
              to="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text)',
                textDecoration: 'none',
              }}
            >
              See all courses
              <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}