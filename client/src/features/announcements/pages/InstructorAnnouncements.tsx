import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  useMyAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
} from '@/features/announcements/hooks/useAnnouncements';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { AnnouncementComposer } from '@/features/announcements/components/AnnouncementComposer';
import { instructorApi } from '@/features/instructor/api';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useToast } from '@/shared/hooks/useToast';

interface PickOption {
  id: string;
  label: string;
}

/**
 * The instructor announcement composer + history page.
 *
 * The composer needs a list of pickable targets (courses,
 * cohorts, etc.) that the caller can post to. We build those from
 * the caller's own memberships — the same lists that power the
 * instructor dashboard — and pass them to the composer as props.
 *
 * The page is admin/instructor-only, enforced by
 * `InstructorGuard` at the route level.
 */
export const InstructorAnnouncements: React.FC = () => {
  const toast = useToast();
  const { announcements, loading, error, reload } = useMyAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [courses, setCourses] = useState<PickOption[]>([]);
  const [cohorts, setCohorts] = useState<PickOption[]>([]);
  const [roadmaps, setRoadmaps] = useState<PickOption[]>([]);
  const [classes, setClasses] = useState<PickOption[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);

  const loadTargets = useCallback(async () => {
    setLoadingTargets(true);
    try {
      const [coursesRes, cohortsRes] = await Promise.all([
        instructorApi.listMyCourses(),
        instructorApi.listMyCohorts(),
      ]);

      setCourses(coursesRes.map((c) => ({ id: c._id, label: c.title })));
      setCohorts(cohortsRes.map((c) => ({ id: c._id, label: c.name })));
      // Roadmaps and classes: instructor-side listings don't exist
      // yet. Leave empty — the composer hides them.
      setRoadmaps([]);
      setClasses([]);
    } catch {
      toast.error('Could not load your teaching context');
    } finally {
      setLoadingTargets(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  const handleCreate = async (input: {
    title: string;
    body: string;
    audience:
      | { kind: 'all' }
      | { kind: 'roadmap'; id: string }
      | { kind: 'course'; id: string }
      | { kind: 'cohort'; id: string }
      | { kind: 'class'; id: string };
  }) => {
    try {
      await createMutation.mutateAsync(input);
      toast.success('Announcement posted');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not post announcement'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not delete announcement'
      );
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/instructor"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Post messages to your courses, cohorts, or everyone.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void reload()}
          disabled={loading}
        >
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Composer */}
      <Card className="mb-6 p-6">
        {loadingTargets ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : courses.length === 0 && cohorts.length === 0 ? (
          <p className="text-sm text-text-muted">
            You need a course or a cohort to post targeted announcements.
            Create one first, or post to Everyone.
          </p>
        ) : (
          <AnnouncementComposer
            courses={courses}
            cohorts={cohorts}
            roadmaps={roadmaps}
            classes={classes}
            canPostGlobal
            busy={createMutation.isPending}
            onSubmit={handleCreate}
          />
        )}
      </Card>

      {/* History */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
          Your announcements
        </h2>

        {loading && announcements.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}

        {!loading && !error && announcements.length === 0 && (
          <Card className="p-6 text-center text-sm text-text-muted">
            You haven't posted any announcements yet.
          </Card>
        )}

        {announcements.length > 0 && (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <AnnouncementCard
                key={a._id}
                announcement={a}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};