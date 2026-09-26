import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  BookOpen,
  Map as MapIcon,
  Search,
} from 'lucide-react';
import { instructorApi } from '@/features/instructor/api';
import type {
  ApiCohortDetail,
  CohortRole,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/shared/store/auth.store';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const InstructorCohortDetail: React.FC = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);

  const [detail, setDetail] = useState<ApiCohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<CohortRole>('student');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!cohortId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await instructorApi.getCohort(cohortId);
      setDetail(data);
    } catch {
      setError('Failed to load this cohort');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId]);

  const handleAddMember = async () => {
    if (!cohortId || !newUserId.trim()) {
      toast.error('Enter a user ID');
      return;
    }
    setBusy(true);
    try {
      await instructorApi.addCohortMember(cohortId, {
        userId: newUserId.trim(),
        role: newRole,
      });
      toast.success('Member added');
      setNewUserId('');
      setShowAddForm(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setBusy(false);
    }
  };

  const handleChangeRole = async (userId: string, role: CohortRole) => {
    if (!cohortId) return;
    try {
      await instructorApi.updateCohortMemberRole(cohortId, userId, role);
      await reload();
    } catch {
      toast.error('Could not update role');
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!cohortId) return;
    if (!confirm(`Remove ${name} from this cohort?`)) return;
    try {
      await instructorApi.removeCohortMember(cohortId, userId);
      toast.success('Member removed');
      await reload();
    } catch {
      toast.error('Could not remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/instructor/cohorts"
          className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> All cohorts
        </Link>
        <ErrorState
          title="Couldn't load this cohort"
          message={error ?? 'Cohort not found'}
          onRetry={reload}
        />
      </div>
    );
  }

  const { cohort, entity, instructors, assistants, students } = detail;

  const filteredStudents = students.filter(
    (s) =>
      searchTerm === '' ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EntityIcon = entity.kind === 'course' ? BookOpen : MapIcon;

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/instructor/cohorts"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> All cohorts
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          <EntityIcon size={11} />
          {entity.kind === 'course' ? 'Course' : 'Roadmap'} cohort
        </span>
        <h1 className="mt-2 text-3xl font-bold text-text-primary">
          {cohort.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {cohort.startDate && `${cohort.startDate} · `}
          <Link
            to={`/${entity.kind === 'course' ? 'courses' : 'roadmaps'}/${entity.slug}`}
            className="text-brand-500 hover:underline"
          >
            {entity.title}
          </Link>
        </p>
        {cohort.description && (
          <p className="mt-3 max-w-3xl text-sm text-text-secondary">
            {cohort.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Students
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {students.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Instructors
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {instructors.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Assistants
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-500">
            {assistants.length}
          </p>
        </Card>
      </div>

      {/* Instructors + assistants */}
      {(instructors.length > 0 || assistants.length > 0) && (
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-brand-500" />
            <h2 className="text-sm font-semibold text-text-primary">
              Teaching team
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {instructors.map((i) => (
              <div
                key={i._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                {i.avatar ? (
                  <img
                    src={i.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {initials(i.name) || '?'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {i.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Instructor
                  </p>
                </div>
                {i._id === user?._id && (
                  <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-brand-500">
                    You
                  </span>
                )}
                <button
                  onClick={() => handleRemove(i._id, i.name)}
                  className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  title="Remove from cohort"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {assistants.map((a) => (
              <div
                key={a._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                {a.avatar ? (
                  <img
                    src={a.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-tertiary text-[10px] font-bold text-text-secondary">
                    {initials(a.name) || '?'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {a.name}
                  </p>
                  <p className="text-[10px] text-text-muted">Assistant</p>
                </div>
                <button
                  onClick={() => handleRemove(a._id, a.name)}
                  className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  title="Remove from cohort"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Students */}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-brand-500" />
            <h2 className="text-sm font-semibold text-text-primary">
              Students ({students.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus size={14} /> Add member
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-4 grid gap-3 rounded-lg border border-border bg-surface-secondary p-3 md:grid-cols-3">
            <Input
              placeholder="User ID (MongoDB _id)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as CohortRole)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="assistant">Assistant</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleAddMember} disabled={busy} className="flex-1">
                {busy ? 'Adding…' : 'Add'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUserId('');
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="md:col-span-3 text-[10px] text-text-muted">
              Find user IDs in the{' '}
              <Link to="/admin/users" className="text-brand-500 hover:underline">
                admin users list
              </Link>
              . An email-based picker lands in a later batch.
            </p>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            {students.length === 0
              ? 'No students in this cohort yet.'
              : 'No students match your search.'}
          </p>
        )}

        {filteredStudents.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Joined
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((s) => (
                  <tr
                    key={s._id}
                    className="transition-colors hover:bg-surface-secondary"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        {s.avatar ? (
                          <img
                            src={s.avatar}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-tertiary text-[10px] font-bold text-text-secondary">
                            {initials(s.name) || '?'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {s.name || '(no name)'}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-text-muted">
                      {new Date(s.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() =>
                            handleChangeRole(s._id, 'assistant')
                          }
                          className="rounded px-2 py-1 text-[10px] font-medium text-text-muted hover:bg-surface-tertiary"
                          title="Promote to assistant"
                        >
                          → Assistant
                        </button>
                        <button
                          onClick={() => handleRemove(s._id, s.name)}
                          className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                          title="Remove from cohort"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};