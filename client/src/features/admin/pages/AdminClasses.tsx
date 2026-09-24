import { useEffect, useState } from 'react';
import { Trash2, Pause, Play, Plus } from 'lucide-react';
import { adminApi, type AdminClass } from '@/features/admin/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { AdminTable } from '@/features/admin/components/AdminTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { AdminClassCreateForm } from '@/features/admin/pages/AdminClassCreateForm';
import { ClassStatusBadge } from '@/features/classes/components/ClassStatusBadge';
import { useToast } from '@/shared/hooks/useToast';

export const AdminClasses: React.FC = () => {
  const toast = useToast();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<AdminClass | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await adminApi.listClasses();
      setClasses(rows);
    } catch {
      toast.error('Could not load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (
    cls: AdminClass,
    status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  ) => {
    try {
      await adminApi.updateClass(cls.slug, { status });
      await reload();
    } catch {
      toast.error('Could not update class');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await adminApi.deleteClass(deleting.slug);
      await reload();
      toast.success('Class deleted');
    } catch {
      toast.error('Could not delete class');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreated = (cls: AdminClass) => {
    setClasses((prev) => [cls, ...prev]);
    setShowCreate(false);
    toast.success(`Scheduled "${cls.title}"`);
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Classes</h1>
          <p className="mt-1 text-sm text-text-muted">
            Schedule and manage live classes across the platform.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus size={16} /> {showCreate ? 'Close' : 'New Class'}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Schedule a new class
          </h2>
          <AdminClassCreateForm
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable
          headers={['Title', 'Instructor', 'Scheduled', 'Status', 'Actions']}
        >
          {classes.map((c) => (
            <tr key={c._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{c.title}</p>
                <p className="text-xs text-text-muted">/classes/{c.slug}</p>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {c.instructorName}
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {new Date(c.scheduledAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <ClassStatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(c, 'live')}
                    >
                      <Play size={12} /> Start
                    </Button>
                  )}
                  {c.status === 'live' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(c, 'ended')}
                    >
                      <Pause size={12} /> End
                    </Button>
                  )}
                  {c.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(c, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 size={14} className="text-[var(--color-error)]" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {classes.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-text-muted"
              >
                No classes yet. Click "New Class" to schedule one.
              </td>
            </tr>
          )}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete class?"
        message={`This will permanently delete "${deleting?.title}" and all its enrollments.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};