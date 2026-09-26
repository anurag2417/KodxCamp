import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Lock,
  Gift,
  IndianRupee,
  Check,
  Award,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useRoadmap } from '@/features/roadmaps/hooks/useRoadmap';
import { roadmapsApi } from '@/features/roadmaps/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { FaqAccordion } from '@/features/courses/components/FaqAccordion';
import { useToast } from '@/shared/hooks/useToast';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (payload: unknown) => void) => void;
    };
  }
}

const RAZORPAY_THEME_COLOR = '#1E3A8A';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatINR(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return match ? match[1] : null;
}

export const RoadmapDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { roadmap, loading, error, reload } = useRoadmap(slug);
  const user = useAuthStore((s) => s.user);

  const [paymentConfigured, setPaymentConfigured] = useState<boolean | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    roadmapsApi
      .config()
      .then((c) => setPaymentConfigured(c.configured))
      .catch(() => setPaymentConfigured(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen w-full bg-bg p-8">
        <Link
          to="/roadmaps"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} /> All roadmaps
        </Link>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load this roadmap"
            message={error ?? 'Roadmap not found'}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const firstCourse = roadmap.enrichedCourses[0];
  const totalLessons = roadmap.enrichedCourses.reduce(
    (sum, c) => sum + c.totalLessons,
    0
  );
  const showPrice = !roadmap.isFree && roadmap.price && roadmap.price > 0;
  const discount =
    roadmap.price &&
    roadmap.originalPrice &&
    roadmap.originalPrice > roadmap.price
      ? Math.round(
          ((roadmap.originalPrice - roadmap.price) / roadmap.originalPrice) * 100
        )
      : null;

  const youtubeId = roadmap.heroVideoUrl
    ? extractYouTubeId(roadmap.heroVideoUrl)
    : null;

  const handleEnrollFree = async () => {
    if (!user) {
      navigate(`/login?next=/roadmaps/${roadmap.slug}`);
      return;
    }
    setBusy(true);
    try {
      await roadmapsApi.enrollFree(roadmap._id);
      toast.success(`Enrolled in "${roadmap.title}"`);
      navigate(`/roadmaps/${roadmap.slug}/overview`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enroll');
    } finally {
      setBusy(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate(`/login?next=/roadmaps/${roadmap.slug}`);
      return;
    }
    if (!paymentConfigured) {
      toast.error(
        'Payment is not configured. Contact an admin to enroll.',
        'Payment unavailable'
      );
      return;
    }

    setBusy(true);
    try {
      const order = await roadmapsApi.createOrder(roadmap._id);
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        toast.error('Could not load Razorpay. Check your connection.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'KodxCamp',
        description: order.title,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: RAZORPAY_THEME_COLOR },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await roadmapsApi.verify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success(`Enrolled in "${roadmap.title}"`);
            navigate(`/roadmaps/${roadmap.slug}/overview`);
          } catch {
            toast.error(
              'We could not verify your payment. If money was deducted, contact support with your payment ID.'
            );
          }
        },
        modal: {
          ondismiss: () => toast.info('Payment cancelled'),
        },
      });

      rzp.open();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not start payment'
      );
    } finally {
      setBusy(false);
    }
  };

  const primaryCta = (() => {
    if (!user) {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(`/login?next=/roadmaps/${roadmap.slug}`)}
        >
          <Lock size={16} /> Sign in to enroll
        </Button>
      );
    }
    if (roadmap.isFree) {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={handleEnrollFree}
          disabled={busy}
        >
          <Gift size={16} /> {busy ? 'Enrolling…' : 'Enroll for free'}
        </Button>
      );
    }
    if (showPrice) {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={handleBuy}
          disabled={busy}
        >
          <IndianRupee size={16} />
          {busy
            ? 'Starting…'
            : `Get Started · ${formatINR(roadmap.price!)}`}
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full" disabled>
        Price coming soon
      </Button>
    );
  })();

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="w-full px-4 py-10 md:px-6 lg:px-10 lg:py-14">
        <Link
          to="/roadmaps"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} /> All roadmaps
        </Link>

        {/* ─── Hero ─────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          {/* Left: video / thumbnail */}
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface">
            {youtubeId ? (
              <iframe
                title={roadmap.title}
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : roadmap.thumbnail ? (
              <>
                <img
                  src={roadmap.thumbnail}
                  alt={roadmap.title}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
                    <Play size={28} className="ml-1 text-white" fill="white" />
                  </span>
                </div>
              </>
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-700/30 to-transparent">
                <BookOpen size={48} className="text-text-muted" />
              </div>
            )}
          </div>

          {/* Right: purchase info */}
          <div className="lg:pt-4">
            {roadmap.tags && roadmap.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {roadmap.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-text-primary md:text-4xl lg:text-[2.75rem]">
              {roadmap.title}
              {roadmap.tagline && (
                <span className="block text-text-muted">{roadmap.tagline}</span>
              )}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              {roadmap.description}
            </p>

            {/* What's inside: stats row */}
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2">
                <BookOpen size={14} className="text-brand-500" />
                <span className="font-semibold text-text-primary">
                  {roadmap.enrichedCourses.length}
                </span>
                <span className="text-text-muted">
                  {roadmap.enrichedCourses.length === 1 ? 'course' : 'courses'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2">
                <GraduationCap size={14} className="text-brand-500" />
                <span className="font-semibold text-text-primary">
                  {totalLessons}
                </span>
                <span className="text-text-muted">lessons</span>
              </div>
            </div>

            {roadmap.features && roadmap.features.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {roadmap.features.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary"
                  >
                    {f.icon && <span>{f.icon}</span>}
                    {f.label}
                  </span>
                ))}
              </div>
            )}

            {roadmap.sellingPoints && roadmap.sellingPoints.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                {roadmap.sellingPoints.map((sp, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {sp.icon && (
                      <span className="text-lg leading-none">{sp.icon}</span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {sp.title}
                      </p>
                      {sp.subtitle && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          {sp.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {roadmap.sellingHeadline && (
              <p className="mt-6 text-lg font-semibold text-text-primary">
                {roadmap.sellingHeadline}
              </p>
            )}
            {roadmap.learningOutcomes && roadmap.learningOutcomes.length > 0 && (
              <ul className="mt-3 space-y-2">
                {roadmap.learningOutcomes.slice(0, 6).map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-[var(--color-success)]"
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Price block */}
            <div className="mt-8 rounded-2xl border border-border bg-surface-secondary p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                {roadmap.isFree ? (
                  <span className="text-3xl font-bold text-[var(--color-success)]">
                    FREE
                  </span>
                ) : showPrice ? (
                  <>
                    <span className="text-3xl font-bold text-text-primary">
                      {formatINR(roadmap.price!)}
                    </span>
                    {roadmap.originalPrice &&
                      roadmap.originalPrice > roadmap.price! && (
                        <span className="text-base text-text-muted line-through">
                          {formatINR(roadmap.originalPrice)}
                        </span>
                      )}
                    {discount && (
                      <span className="rounded-full bg-[var(--color-success)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--color-success)]">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-base text-text-muted">
                    Price coming soon
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-2">
                {primaryCta}

                {roadmap.enrichedCourses.length > 0 && (
                  <a
                    href="#courses"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    See all {roadmap.enrichedCourses.length} courses
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Courses in this roadmap ─────────────────── */}
        {roadmap.enrichedCourses.length > 0 && (
          <section id="courses" className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Courses in this roadmap
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {roadmap.enrichedCourses.length}{' '}
              {roadmap.enrichedCourses.length === 1 ? 'course' : 'courses'},
              meant to be taken in this order.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmap.enrichedCourses.map((c) => (
                <Link
                  key={c._id}
                  to={`/courses/${c.slug}`}
                  className="group block"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-brand-500/60 hover:shadow-md">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-text-muted">
                      <span className="grid h-5 w-5 place-items-center rounded bg-brand-500/10 font-mono text-[10px] font-bold text-brand-500">
                        {c.order}
                      </span>
                      <span className="font-mono">{c.language}</span>
                      {!c.isRequired && (
                        <span className="ml-auto rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-brand-500">
                        {c.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {c.description}
                      </p>
                      <p className="mt-3 text-[11px] text-text-muted">
                        {c.totalLessons}{' '}
                        {c.totalLessons === 1 ? 'lesson' : 'lessons'}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── About ────────────────────────────────────── */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
            About this roadmap
          </h2>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-text-secondary">
            {roadmap.description}
          </p>
        </section>

        {/* ─── What You'll Learn ───────────────────────── */}
        {roadmap.learningOutcomes && roadmap.learningOutcomes.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              What you'll learn
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {roadmap.learningOutcomes.map((o, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-4"
                >
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--color-success)]"
                  />
                  <span className="text-sm text-text-secondary">{o}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Projects ────────────────────────────────── */}
        {roadmap.projects && roadmap.projects.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Real projects you'll build
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmap.projects.map((p, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-surface-secondary"
                >
                  <div className="aspect-video bg-gradient-to-br from-brand-700/20 to-transparent">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <BookOpen size={28} className="text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-text-primary">
                      {p.title}
                    </p>
                    {p.subtitle && (
                      <p className="mt-1 text-xs text-text-muted">
                        {p.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Instructor ──────────────────────────────── */}
        {roadmap.instructor && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Instructor
            </h2>
            <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-border bg-surface-secondary p-6 sm:flex-row">
              {roadmap.instructor.avatar ? (
                <img
                  src={roadmap.instructor.avatar}
                  alt={roadmap.instructor.name}
                  className="h-24 w-24 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-brand-500/20 text-2xl font-bold text-brand-500">
                  {roadmap.instructor.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-text-primary">
                  {roadmap.instructor.name}
                </p>
                {roadmap.instructor.role && (
                  <p className="mt-0.5 text-sm text-text-muted">
                    {roadmap.instructor.role}
                  </p>
                )}
                {roadmap.instructor.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {roadmap.instructor.bio}
                  </p>
                )}
                {roadmap.instructor.links &&
                  roadmap.instructor.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {roadmap.instructor.links.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-tertiary"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* ─── Certificate ─────────────────────────────── */}
        {roadmap.certificateIncluded && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Certificate of completion
            </h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-700/20 to-transparent p-8 text-center">
                <Award size={36} className="mx-auto text-text-muted" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Certificate
                </p>
                <p className="mt-2 text-lg font-bold text-text-primary">
                  Awarded on completion
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {roadmap.title}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                Every learner who completes this roadmap receives a
                verifiable certificate of completion. Share it on LinkedIn,
                attach it to your résumé, or use it as proof of work when
                you apply for jobs.
              </p>
            </div>
          </section>
        )}

        {/* ─── FAQ ─────────────────────────────────────── */}
        {roadmap.faq && roadmap.faq.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-6 max-w-3xl">
              <FaqAccordion items={roadmap.faq} />
            </div>
          </section>
        )}

        {/* ─── Final CTA ───────────────────────────────── */}
        <section className="mt-20 rounded-3xl border border-border bg-gradient-to-br from-brand-700/20 via-transparent to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            Ready to walk this path?
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            Every course, project, and class - in order.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-xs">{primaryCta}</div>
          </div>
        </section>
      </div>
    </div>
  );
};