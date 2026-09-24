import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Lock, Gift, IndianRupee } from 'lucide-react';
import { useCourse } from '@/features/courses/hooks/useCourse';
import { coursesApi, paymentsApi, type PaymentConfig } from '@/features/courses/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { progressApi } from '@/features/progress/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/hooks/useToast';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (payload: unknown) => void) => void;
    };
  }
}

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

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { course, loading, error, reload } = useCourse(slug);
  const user = useAuthStore((s) => s.user);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  // Load payment config once.
  useEffect(() => {
    paymentsApi
      .config()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig({ configured: false, mode: 'test' }));
  }, []);

  // Load enrollment state for logged-in users.
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
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-500"
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
      toast.error(
        err instanceof Error ? err.message : 'Could not enroll'
      );
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
        description: order.courseTitle,
        order_id: order.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#2A835F' },
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
          ondismiss: () => {
            toast.info('Payment cancelled');
          },
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

  const showPrice =
    !course.isFree && course.price && course.price > 0
      ? `₹${Math.round(course.price / 100)}`
      : null;

  const enrollmentRequired = enrolled === false;
  const canEnterCourse = enrolled === true;

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={16} /> Back to courses
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{course.language}</Badge>
            {course.isFree ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
                <Gift size={11} /> Free
              </span>
            ) : showPrice ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
                <IndianRupee size={11} /> {showPrice.slice(1)}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-text-primary">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {course.description}
          </p>
        </div>

        {/* Enrollment action */}
        <div className="flex flex-col items-stretch gap-2">
          {!user && (
            <>
              <p className="text-xs text-text-muted">
                <Lock size={11} className="inline" /> Sign in to enroll
              </p>
              <Link to={`/login?next=/courses/${course.slug}`}>
                <Button size="lg" className="w-full">
                  <Lock size={16} /> Sign in to enroll
                </Button>
              </Link>
            </>
          )}

          {user && enrollmentRequired && course.isFree && (
            <Button size="lg" onClick={handleEnrollFree} disabled={busy}>
              <Gift size={16} /> {busy ? 'Enrolling…' : 'Enroll for free'}
            </Button>
          )}

          {user && enrollmentRequired && !course.isFree && (
            <Button size="lg" onClick={handleBuy} disabled={busy}>
              <IndianRupee size={16} />
              {busy
                ? 'Starting…'
                : showPrice
                  ? `Enroll — ${showPrice}`
                  : 'Enroll'}
            </Button>
          )}

          {user && canEnterCourse && firstLesson && (
            <Link to={`/courses/${course.slug}/lessons/${firstLesson.slug}`}>
              <Button size="lg" className="w-full">
                <PlayCircle size={18} /> Start First Lesson
              </Button>
            </Link>
          )}

          {user && !course.isFree && !paymentConfig?.configured && enrollmentRequired && (
            <p className="mt-1 max-w-xs text-center text-[10px] text-text-muted">
              Payment is not configured. Contact an admin to enroll manually.
            </p>
          )}
        </div>
      </div>

      {/* Lessons grid */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Lessons ({course.lessons.length})
        </h2>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {course.lessons.map((lesson, idx) => {
            // Locked lessons for non-enrolled users.
            const locked = user && !canEnterCourse;
            const anonymous = !user;

            const inner = (
              <Card className="group flex h-full items-center gap-4 p-4 transition-all hover:border-brand-500/60">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-tertiary font-bold text-brand-500">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Lesson {lesson.order}
                  </p>
                </div>
                {(locked || anonymous) && (
                  <Lock size={14} className="shrink-0 text-text-muted" />
                )}
              </Card>
            );

            if (locked || anonymous) {
              return (
                <div
                  key={lesson._id}
                  className="opacity-60"
                  title={
                    anonymous
                      ? 'Sign in to view this lesson'
                      : 'Enroll to view this lesson'
                  }
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={lesson._id}
                to={`/courses/${course.slug}/lessons/${lesson.slug}`}
                className="block"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};