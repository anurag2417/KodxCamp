import { useState } from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import axios from 'axios';
import {
  instructorApi,
  type ApiCourseTeamMember,
  type CourseTeamRole,
} from '@/features/instructor/api';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface Props {
  courseSlug: string;
  members: ApiCourseTeamMember[];
  createdBy: string;
  onUpdate: () => void;
}

const ROLE_OPTIONS: { value: CourseTeamRole; label: string; hint: string }[] = [
  { value: 'lead', label: 'Lead', hint: 'Full control of the course' },
  { value: 'author', label: 'Author', hint: 'Create and edit lessons' },
  { value: 'reviewer', label: 'Reviewer', hint: 'Approve content' },
  { value: 'ta', label: 'TA', hint: 'See students, no content edits' },
  { value: 'viewer', label: 'Viewer', hint: 'Read-only' },
];

export const CourseTeamPanel: React.FC<Props> = ({
  courseSlug,
  members,
  createdBy,
  onUpdate,
}) => {
  const [adding, setAdding] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<CourseTeamRole>('author');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const add = async () => {
    setError('');
    if (!newUserId.trim()) {
      setError('Enter the user ID');
      return;
    }
    setBusy(true);
    try {
      await instructorApi.addTeamMember(courseSlug, newUserId.trim(), newRole);
      onUpdate();
      setAdding(false);
      setNewUserId('');
      setNewRole('author');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to add member');
      } else {
        setError('Failed to add member');
      }
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (userId: string, role: CourseTeamRole) => {
    try {
      await instructorApi.updateTeamMember(courseSlug, userId, role);
      onUpdate();
    } catch {
      /* ignore */
    }
  };

  const remove = async (userId: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await instructorApi.removeTeamMember(courseSlug, userId);
      onUpdate();
    } catch {
      /* ignore */
    }
  };

  return (
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
          <Plus size={14} /> {adding ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      {adding && (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface-secondary p-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              User ID
            </label>
            <Input
              placeholder="User _id from /admin/users"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as CourseTeamRole)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={add} disabled={busy}>
            {busy ? 'Adding…' : 'Add'}
          </Button>
        </div>
      )}

      {error && <p className="mb-2 text-xs text-[var(--color-error)]">{error}</p>}

      <div className="flex flex-col gap-2">
        {/* Creator row (implicit lead) */}
        <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
              C
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Creator <span className="text-text-muted">(you)</span>
              </p>
              <p className="text-[10px] font-mono text-text-muted">{createdBy}</p>
            </div>
          </div>
          <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
            lead
          </span>
        </div>

        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-tertiary text-xs font-bold text-text-secondary">
                {m.userId.slice(-2).toUpperCase()}
              </span>
              <p className="text-[10px] font-mono text-text-muted">{m.userId}</p>
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

        {members.length === 0 && (
          <p className="text-xs text-text-muted">
            No team members yet. You're the only one working on this course.
          </p>
        )}
      </div>
    </Card>
  );
};
