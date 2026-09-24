import { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, Mail, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import {
  instructorApi,
  type ApiCourseTeamMember,
  type ApiInvitation,
  type CourseTeamRole,
} from '@/features/instructor/api';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useToast } from '@/shared/hooks/useToast';

interface Props {
  courseSlug: string;
  courseId: string;
  members: ApiCourseTeamMember[];
  createdBy: string;
  onUpdate: () => void;
}

const ROLE_OPTIONS: { value: CourseTeamRole; label: string; hint: string }[] = [
  { value: 'lead', label: 'Lead', hint: 'Full control of the course and team' },
  {
    value: 'course_author',
    label: 'Course Author',
    hint: 'Create and edit lessons, quizzes',
  },
  {
    value: 'problem_author',
    label: 'Problem Author',
    hint: 'Manage problems attached to this course',
  },
  {
    value: 'class_coordinator',
    label: 'Class Coordinator',
    hint: 'Schedule classes, upload recordings',
  },
  { value: 'ta', label: 'TA', hint: 'See students, no content edits' },
  { value: 'viewer', label: 'Viewer', hint: 'Read-only' },
];

export const CourseTeamPanel: React.FC<Props> = ({
  courseSlug,
  members,
  createdBy,
  onUpdate,
}) => {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CourseTeamRole>('course_author');
  const [busy, setBusy] = useState(false);
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);

  useEffect(() => {
    void reloadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  const reloadInvitations = async () => {
    try {
      const rows = await instructorApi.listInvitations(courseSlug);
      setInvitations(rows);
    } catch {
      /* ignore */
    }
  };

  const send = async () => {
    if (!email.trim()) {
      toast.error('Enter an email address', 'Missing email');
      return;
    }
    setBusy(true);
    try {
      await instructorApi.createInvitation(courseSlug, email.trim(), role);
      toast.success(`Invitation sent to ${email.trim()}`);
      setEmail('');
      setRole('course_author');
      setAdding(false);
      await reloadInvitations();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as
          | { message?: string; details?: { path: string; message: string }[] }
          | undefined;
        if (body?.details?.length) {
          toast.error(
            body.details.map((d) => d.message).join('\n'),
            'Invalid input'
          );
        } else {
          toast.error(body?.message ?? 'Failed to send invitation');
        }
      } else {
        toast.error('Failed to send invitation');
      }
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (invitationId: string) => {
    if (!confirm('Revoke this invitation?')) return;
    try {
      await instructorApi.revokeInvitation(courseSlug, invitationId);
      toast.success('Invitation revoked');
      await reloadInvitations();
    } catch {
      toast.error('Could not revoke invitation');
    }
  };

  const changeRole = async (userId: string, nextRole: CourseTeamRole) => {
    try {
      await instructorApi.updateTeamMember(courseSlug, userId, nextRole);
      onUpdate();
    } catch {
      toast.error('Could not change role');
    }
  };

  const remove = async (userId: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await instructorApi.removeTeamMember(courseSlug, userId);
      onUpdate();
    } catch {
      toast.error('Could not remove member');
    }
  };

  const pending = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Shield size={14} /> Course Team
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAdding((v) => !v)}
          >
            <Plus size={14} /> {adding ? 'Cancel' : 'Invite by email'}
          </Button>
        </div>

        {adding && (
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface-secondary p-3">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Email
              </label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CourseTeamRole)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={send} disabled={busy}>
              {busy ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* Creator row */}
          <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                C
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Creator <span className="text-text-muted">(you)</span>
                </p>
                <p className="text-[10px] font-mono text-text-muted">
                  {createdBy}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
              lead
            </span>
          </div>

          {members
            .filter((m) => m.userId !== createdBy)
            .map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-tertiary text-xs font-bold text-text-secondary">
                    {m.userId.slice(-2).toUpperCase()}
                  </span>
                  <p className="text-[10px] font-mono text-text-muted">
                    {m.userId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      changeRole(m.userId, e.target.value as CourseTeamRole)
                    }
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-primary"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(m.userId)}
                    className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

          {members.filter((m) => m.userId !== createdBy).length === 0 && (
            <p className="text-xs text-text-muted">
              No team members yet. Invite a colleague by email above.
            </p>
          )}
        </div>
      </Card>

      {pending.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Mail size={14} /> Pending invitations ({pending.length})
          </h3>
          <div className="flex flex-col gap-2">
            {pending.map((inv) => (
              <div
                key={inv._id}
                className="flex items-center justify-between rounded-lg border border-dashed border-border bg-surface p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {inv.email}
                  </p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                    <span>{inv.role}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => revoke(inv._id)}
                  className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  title="Revoke"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};