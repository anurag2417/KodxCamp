import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '@/shared/components/ui/Button';
import { Seo } from '../../../shared/components/seo/Seo';
import { invitationApi, type ResolvedInvitation } from '../../instructor/api';
import { useAuthStore } from '../../../shared/store/auth.store';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: ResolvedInvitation }
  | { kind: 'error'; message: string }
  | { kind: 'accepting'; data: ResolvedInvitation }
  | { kind: 'accepted'; courseSlug: string };

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  const [state, setState] = useState<State>({ kind: 'loading' });

  // Resolve the token on mount.
  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'This link is missing a token.' });
      return;
    }
    let cancelled = false;
    invitationApi
      .resolve(token)
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'This invitation link is invalid or has expired.';
        setState({ kind: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    if (state.kind !== 'ready' || !token) return;
    setState({ kind: 'accepting', data: state.data });
    try {
      const { courseSlug } = await invitationApi.accept(token);
      setState({ kind: 'accepted', courseSlug });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Could not accept the invitation.';
      setState({ kind: 'error', message });
    }
  };

  // Wait for the auth bootstrapping to complete before deciding
  // whether to show the "sign in to continue" screen.
  if (!bootstrapped || state.kind === 'loading') {
    return (
      <AuthLayout
        title="Loading invitation"
        subtitle="One moment while we check the details."
        footer={null}
      >
        <div className="flex justify-center py-8">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      </AuthLayout>
    );
  }

  if (state.kind === 'error') {
    return (
      <>
        <Seo title="Invitation" description="Invitation details." />
        <AuthLayout
          title="Invitation unavailable"
          subtitle={state.message}
          footer={
            <Link
              to="/"
              className="font-medium text-brand-500 hover:underline"
            >
              Back to home
            </Link>
          }
        >
          <div className="flex justify-center py-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-error)]/10">
              <XCircle
                size={32}
                className="text-[var(--color-error)]"
              />
            </div>
          </div>
        </AuthLayout>
      </>
    );
  }

  if (state.kind === 'accepted') {
    return (
      <>
        <Seo title="Invitation accepted" description="You've joined the course." />
        <AuthLayout
          title="You're in!"
          subtitle={`You joined ${state.courseSlug}.`}
          footer={null}
        >
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-success)]/10">
              <CheckCircle2
                size={32}
                className="text-[var(--color-success)]"
              />
            </div>
            <Button
              size="lg"
              onClick={() => navigate(`/courses/${state.courseSlug}`)}
            >
              Open the course
            </Button>
          </div>
        </AuthLayout>
      </>
    );
  }

  // state.kind === 'ready' or 'accepting'
  const data = state.data;

  // Edge cases — the invitation might already be accepted, revoked,
  // or expired.
  if (data.isExpired || data.isRevoked || data.isAlreadyAccepted) {
    const message = data.isExpired
      ? 'This invitation has expired. Ask the instructor to send a new one.'
      : data.isRevoked
        ? 'This invitation was revoked.'
        : 'This invitation has already been accepted.';
    return (
      <>
        <Seo title="Invitation" description="Invitation status." />
        <AuthLayout title="Invitation unavailable" subtitle={message} footer={null}>
          <div className="flex justify-center py-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-warning)]/10">
              <XCircle
                size={32}
                className="text-[var(--color-warning)]"
              />
            </div>
          </div>
        </AuthLayout>
      </>
    );
  }

  // Not logged in — route to login with a redirect back here.
  if (!user) {
    const next = `/invitations/${token}`;
    return (
      <>
        <Seo title="Invitation" description="Sign in to accept." />
        <AuthLayout
          title={`You're invited to ${data.course.title}`}
          subtitle={`${data.invitation.role} · invited by email`}
          footer={null}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Sign in or create an account with{' '}
              <strong className="text-text-primary">
                {data.invitation.email}
              </strong>{' '}
              to accept this invitation.
            </p>
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  `/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(
                    data.invitation.email
                  )}`
                )
              }
            >
              Sign in to accept
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                navigate(
                  `/signup?next=${encodeURIComponent(next)}&email=${encodeURIComponent(
                    data.invitation.email
                  )}`
                )
              }
            >
              Create an account
            </Button>
          </div>
        </AuthLayout>
      </>
    );
  }

  // Logged in — show the accept button.
  const accepting = state.kind === 'accepting';

  return (
    <>
      <Seo title="Invitation" description="Accept your invitation." />
      <AuthLayout
        title={`You're invited to ${data.course.title}`}
        subtitle={`You'll join as ${data.invitation.role}.`}
        footer={null}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm">
            <p className="text-text-secondary">{data.course.description}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-text-muted">
              <Mail size={12} /> Invitation for {data.invitation.email}
            </p>
          </div>

          {user.email.toLowerCase() !== data.invitation.email && (
            <div className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-xs text-[var(--color-warning)]">
              You're signed in as <strong>{user.email}</strong>. This
              invitation is for <strong>{data.invitation.email}</strong>. Sign
              in with that account to accept.
            </div>
          )}

          <Button
            size="lg"
            onClick={handleAccept}
            disabled={
              accepting || user.email.toLowerCase() !== data.invitation.email
            }
          >
            {accepting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Accepting…
              </>
            ) : (
              'Accept invitation'
            )}
          </Button>
        </div>
      </AuthLayout>
    </>
  );
};