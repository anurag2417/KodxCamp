import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Users,
  GraduationCap,
  Map as MapIcon,
  BookOpen,
  Archive,
  ArchiveRestore,
  ArrowRight,
} from 'lucide-react';
import { instructorApi } from '@/features/instructor/api';
import type {
  ApiCohortSummary,
  ApiInstructorCourse,
  CohortEntityKind,
} from '@/features/instructor/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/**
 * "My Cohorts" — the instructor's home for cohort management.
 *
 * Master Spec, section 71:
 *   "The Instructor dashboard should be simpler than Admin.
 *    It should answer: What do I need to do today?"
 *
 * This page lists the cohorts the caller is an instructor or
 * assistant of. It also lets them create a new cohort against a
 * course they can edit.
 */
export const InstructorCohorts: React.FC = () => {
  const toast = useToast();
  const [cohorts, setCohorts] = useState<ApiCohortSummary[]>([]);
  const [courses, setCourses] = useState<ApiInstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEntityKind, setNewEntityKind] =
    useState<CohortEntityKind>('course');
  const [newEntityId, setNewEntityId] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cohortRows, courseRows] = await Promise.all([
        instructorApi.listMyCohorts({ includeArchived: showArchived }),
        instructorApi.listMyCourses(),
      ]);
      setCohorts(cohortRows);
      setCourses(courseRows);
      if (courseRows.length > 0 && !newEntityId) {
        setNewEntityId(courseRows[0]._id);
      }
    } catch {
      setError('Failed to load your cohorts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const autoSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim() || !newEntityId) {
      toast.error('Name, slug, and a course are required');
      return;
    }
    setBusy(true);
    try {
      await instructorApi.createCohort({
        name: newName.trim(),
        slug: newSlug.trim(),
        description: newDescription.trim() || undefined,
        entityKind: newEntityKind,
        entityId: newEntityId,
      });
      toast.success(`Created "${newName.trim()}"`);
      setNewName('');
      setNewSlug('');
      setNewDescription('');
      setCreating(false);
      await reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not create cohort'
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleArchived = async (cohort: ApiCohortSummary) => {
    try {
      await instructorApi.setCohortArchived(cohort._id, !cohort.archived);
      await reload();
    } catch {
      toast.error('Could not update archive state');
    }
  };

  const grouped = useMemo(() => {
    const active = cohorts.filter((c) => !c.archived);
    const archived = cohorts.filter((c) => c.archived);
    return { active, archived };
  }, [cohorts]);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-text-primary">My Cohorts</h1>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load your cohorts"
            message={error}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            My Cohorts
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Groups of students going through a course or roadmap together.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive size={14} />{' '}
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
          <Button
            onClick={() => setCreating((v) => !v)}
            disabled={courses.length === 0}
          >
            <Plus size={16} /> {creating ? 'Close' : 'New Cohort'}
          </Button>
        </div>
      </div>

      {courses.length === 0 && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 text-sm text-[var(--color-warning)]">
          You don't have any courses yet. Create one in{' '}
          <Link to="/instructor" className="underline">
            My Courses
          </Link>{' '}
          before you can run a cohort.
        </Card>
      )}

      {creating && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Create a cohort
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Cohort name (e.g. Full Stack 2026-A)"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(autoSlug(e.target.value));
              }}
            />
            <Input
              placeholder="Slug"
              value={newSlug}
              onChange={(e) => setNewSlug(autoSlug(e.target.value))}
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="md:col-span-2"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Type
              </label>
              <select
                value={newEntityKind}
                onChange={(e) =>
                  setNewEntityKind(e.target.value as CohortEntityKind)
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="course">Course</option>
                <option value="roadmap">Roadmap</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                {newEntityKind === 'course' ? 'Course' : 'Roadmap'}
              </label>
              <select
                value={newEntityId}
                onChange={(e) => setNewEntityId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="">— Select —</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Note: roadmap cohorts are supported by the API. The picker
            currently lists courses only; the roadmap picker lands with
            the roadmap-team batch.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewName('');
                setNewSlug('');
                setNewDescription('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy}>
              {busy ? 'Creating…' : 'Create cohort'}
            </Button>
          </div>
        </Card>
      )}

      {grouped.active.length === 0 && !creating && (
        <Card className="p-8 text-center text-sm text-text-muted">
          You don't have any cohorts yet.{' '}
          {courses.length > 0 && (
            <button
              onClick={() => setCreating(true)}
              className="text-brand-500 hover:underline"
            >
              Create the first one →
            </button>
          )}
        </Card>
      )}

      {grouped.active.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.active.map((c) => (
            <CohortCard
              key={c._id}
              cohort={c}
              onToggleArchived={toggleArchived}
            />
          ))}
        </div>
      )}

      {showArchived && grouped.archived.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
            Archived ({grouped.archived.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.archived.map((c) => (
              <CohortCard
                key={c._id}
                cohort={c}
                onToggleArchived={toggleArchived}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CohortCard: React.FC<{
  cohort: ApiCohortSummary;
  onToggleArchived: (c: ApiCohortSummary) => void;
}> = ({ cohort, onToggleArchived }) => {
  const EntityIcon = cohort.entityKind === 'course' ? BookOpen : MapIcon;

  return (
    <Card
      className={cn(
        'flex h-full flex-col p-5 transition-all hover:border-brand-500/60',
        cohort.archived && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          <EntityIcon size={11} />
          {cohort.entityKind === 'course' ? 'Course' : 'Roadmap'}
        </span>
        <button
          onClick={() => onToggleArchived(cohort)}
          className="rounded p-1 text-text-muted hover:bg-surface-tertiary"
          title={cohort.archived ? 'Unarchive' : 'Archive'}
        >
          {cohort.archived ? (
            <ArchiveRestore size={14} />
          ) : (
            <Archive size={14} />
          )}
        </button>
      </div>

      <h3 className="mt-3 text-base font-semibold text-text-primary">
        {cohort.name}
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        {cohort.entityTitle}
        {cohort.startDate && ` · ${cohort.startDate}`}
      </p>
      {cohort.description && (
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-text-muted">
          {cohort.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          {cohort.studentCount}{' '}
          {cohort.studentCount === 1 ? 'student' : 'students'}
        </span>
        <span className="inline-flex items-center gap-1">
          <GraduationCap size={12} />
          {cohort.instructorCount}{' '}
          {cohort.instructorCount === 1 ? 'instructor' : 'instructors'}
        </span>
      </div>

      <Link
        to={`/instructor/cohorts/${cohort._id}`}
        className="mt-4 inline-flex items-center justify-between rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-brand-500/40 hover:bg-surface-tertiary"
      >
        Open
        <ArrowRight size={14} />
      </Link>
    </Card>
  );
};