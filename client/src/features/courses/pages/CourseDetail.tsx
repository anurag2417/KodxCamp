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
} from 'lucide-react';
import { useCourse } from '@/features/courses/hooks/useCourse';
import { paymentsApi, type PaymentConfig } from '@/features/courses/api';
import { progressApi } from '@/features/progress/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { CurriculumAccordion } from '@/features/courses/components/CurriculumAccordion';
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

/**
 * Razorpay checkout brand color.
 * Hardcoded to the brand navy because Razorpay's widget renders in its
 * own iframe and cannot read our CSS variables. Must match the favicon
 * and the deep-blue brand anchor in the design spec (#1E3A8A).
 */
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

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { course, loading, error, reload } = useCourse(slug);
  const user = useAuthStore((s) => s.user);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    paymentsApi
      .config()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig({ configured: false, mode: 'test' }));
  }, []);

  useEffect(() => {
    if (!user || !course) return;
    let cancelled = false;
    progressApi
      .getForCourse(course._id)
      .then(() => {
        if (!cancelled) setEnrolled(true);
      })
      .catch(() => {
        if (!cancelled) setEnrolled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, course]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen w-full bg-bg p-8">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Back to courses
        </Link>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load this course"
            message={error ?? 'Course not found'}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  const firstLesson = course.lessons[0];
  const enrollmentRequired = enrolled === false;
  const canEnterCourse = enrolled === true;
  const showPrice = !course.isFree && course.price && course.price > 0;
  const discount =
    course.price && course.originalPrice && course.originalPrice > course.price
      ? Math.round(
          ((course.originalPrice - course.price) / course.originalPrice) * 100
        )
      : null;

  const youtubeId = course.heroVideoUrl
    ? extractYouTubeId(course.heroVideoUrl)
    : null;

  const handleEnrollFree = async () => {
    if (!user) {
      navigate(`/login?next=/courses/${course.slug}`);
      return;
    }
    setBusy(true);
    try {
      await paymentsApi.enrollFree(course._id);
      setEnrolled(true);
      toast.success(`Enrolled in "${course.title}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enroll');
    } finally {
      setBusy(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate(`/login?next=/courses/${course.slug}`);
      return;
    }
    if (!paymentConfig?.configured || !paymentConfig.keyId) {
      toast.error(
        'Payment is not configured. Contact an admin to enroll.',
        'Payment unavailable'
      );
      return;
    }

    setBusy(true);
    try {
      const order = await paymentsApi.createOrder(course._id);
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
            await paymentsApi.verify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setEnrolled(true);
            toast.success(`Enrolled in "${course.title}"`);
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
          onClick={() => navigate(`/login?next=/courses/${course.slug}`)}
        >
          <Lock size={16} /> Sign in to enroll
        </Button>
      );
    }
    if (canEnterCourse && firstLesson) {
      return (
        <Link
          to={`/courses/${course.slug}/lessons/${firstLesson.slug}`}
          className="block w-full"
        >
          <Button size="lg" className="w-full">
            <Play size={16} /> Continue course
          </Button>
        </Link>
      );
    }
    if (enrollmentRequired && course.isFree) {
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
    if (enrollmentRequired && showPrice) {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={handleBuy}
          disabled={busy}
        >
          <IndianRupee size={16} />
          {busy ? 'Starting…' : `Join Course Now · ${formatINR(course.price!)}`}
        </Button>
      );
    }
    if (enrollmentRequired && !course.isFree && !course.price) {
      return (
        <Button size="lg" className="w-full" disabled>
          Price coming soon
        </Button>
      );
    }
    return null;
  })();

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} /> All courses
        </Link>

        {/* ─── Hero ─────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          {/* Left: video / thumbnail */}
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-surface">
            {youtubeId ? (
              <iframe
                title={course.title}
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : course.thumbnail ? (
              <>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                {/*
                  Overlay sits on top of an image, so it needs contrast
                  against the photo, not against the page. This is the
                  one deliberate hard-coded dark/white pair in the file.
                */}
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
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((t) => (
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
              {course.title}
              {course.tagline && (
                <span className="block text-text-muted">
                  with {course.tagline}
                </span>
              )}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              {course.description}
            </p>

            {course.features && course.features.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {course.features.map((f, i) => (
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

            {course.sellingPoints && course.sellingPoints.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                {course.sellingPoints.map((sp, i) => (
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

            {course.sellingHeadline && (
              <p className="mt-6 text-lg font-semibold text-text-primary">
                {course.sellingHeadline}
              </p>
            )}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <ul className="mt-3 space-y-2">
                {course.learningOutcomes.slice(0, 6).map((o, i) => (
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
                {course.isFree ? (
                  <span className="text-3xl font-bold text-[var(--color-success)]">
                    FREE
                  </span>
                ) : showPrice ? (
                  <>
                    <span className="text-3xl font-bold text-text-primary">
                      {formatINR(course.price!)}
                    </span>
                    {course.originalPrice &&
                      course.originalPrice > course.price! && (
                        <span className="text-base text-text-muted line-through">
                          {formatINR(course.originalPrice)}
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

                {course.curriculum && course.curriculum.length > 0 && (
                  <a
                    href="#curriculum"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    View Full Syllabus
                  </a>
                )}
              </div>

              {user &&
                !course.isFree &&
                !paymentConfig?.configured &&
                enrollmentRequired && (
                  <p className="mt-3 text-center text-[11px] text-text-muted">
                    Payment is not configured. Contact an admin to enroll.
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* ─── About ────────────────────────────────────── */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
            About this course
          </h2>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-text-secondary">
            {course.description}
          </p>
        </section>

        {/* ─── What You'll Learn ───────────────────────── */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              What you'll learn
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {course.learningOutcomes.map((o, i) => (
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

        {/* ─── Curriculum ──────────────────────────────── */}
        {course.curriculum && course.curriculum.length > 0 && (
          <section id="curriculum" className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Course curriculum
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {course.curriculum.reduce((sum, m) => sum + m.lessons, 0)}{' '}
              lessons across {course.curriculum.length} modules
            </p>
            <div className="mt-6">
              <CurriculumAccordion modules={course.curriculum} />
            </div>
          </section>
        )}

        {/* ─── Projects ────────────────────────────────── */}
        {course.projects && course.projects.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Real projects you'll build
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {course.projects.map((p, i) => (
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
        {course.instructor && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Instructor
            </h2>
            <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-border bg-surface-secondary p-6 sm:flex-row">
              {course.instructor.avatar ? (
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="h-24 w-24 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-brand-500/20 text-2xl font-bold text-brand-500">
                  {course.instructor.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-text-primary">
                  {course.instructor.name}
                </p>
                {course.instructor.role && (
                  <p className="mt-0.5 text-sm text-text-muted">
                    {course.instructor.role}
                  </p>
                )}
                {course.instructor.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {course.instructor.bio}
                  </p>
                )}
                {course.instructor.links &&
                  course.instructor.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {course.instructor.links.map((l, i) => (
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
        {course.certificateIncluded && (
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
                  {course.title}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                Every learner who completes this course receives a
                verifiable certificate of completion. Share it on LinkedIn,
                attach it to your résumé, or use it as proof of work when
                you apply for jobs. Certificates are generated the moment you
                finish the final lesson.
              </p>
            </div>
          </section>
        )}

        {/* ─── FAQ ─────────────────────────────────────── */}
        {course.faq && course.faq.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-6 max-w-3xl">
              <FaqAccordion items={course.faq} />
            </div>
          </section>
        )}

        {/* ─── Final CTA ───────────────────────────────── */}
        <section className="mt-20 rounded-3xl border border-border bg-gradient-to-br from-brand-700/20 via-transparent to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            Ready to start learning?
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            Build real skills. Build real projects.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-xs">{primaryCta}</div>
          </div>
        </section>
      </div>
    </div>
  );
};