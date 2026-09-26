import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { instructorApi, type ApiInstructorModule } from '@/features/instructor/api';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

interface Props {
  courseSlug: string;
  modules: ApiInstructorModule[];
  /** Lesson counts per module id. */
  lessonCounts: Record<string, number>;
  /** Called after any mutation so the parent can refetch. */
  onChanged: () => void;
  /** The module the user is currently focused on (highlighted). */
  activeModuleId?: string;
  /** Called when the user clicks a module pill. */
  onSelect?: (moduleId: string) => void;
}

/**
 * Module editor strip.
 *
 * Rendered above the lesson list in the instructor course editor.
 * Every module is a pill; the author can:
 *   - click a pill to focus the lesson list on that module
 *   - click the pencil to rename
 *   - click the arrows to reorder
 *   - click the trash to delete (lessons move to the ungrouped bucket)
 *   - click "Add module" to create a new one
 *
 * Delete is non-destructive to lessons — see module.service.delete
 * on the server. The confirmation text says so explicitly.
 */
export const CourseModuleBar: React.FC<Props> = ({
  courseSlug,
  modules,
  lessonCounts,
  onChanged,
  activeModuleId,
  onSelect,
}) => {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      await instructorApi.createModule(courseSlug, {
        title: newTitle.trim(),
      });
      setNewTitle('');
      setCreating(false);
      onChanged();
      toast.success('Module created');
    } catch {
      toast.error('Could not create module');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (moduleId: string) => {
    if (!editTitle.trim()) return;
    setBusy(true);
    try {
      await instructorApi.updateModule(courseSlug, moduleId, {
        title: editTitle.trim(),
      });
      setEditingId(null);
      setEditTitle('');
      onChanged();
    } catch {
      toast.error('Could not rename module');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (module: ApiInstructorModule) => {
    const lessons = lessonCounts[module._id] ?? 0;
    const confirmed = confirm(
      `Delete module "${module.title}"?\n\n` +
        (lessons > 0
          ? `The ${lessons} lesson${lessons === 1 ? '' : 's'} inside will move to the ungrouped bucket. They will not be deleted.`
          : 'This module has no lessons.')
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await instructorApi.deleteModule(courseSlug, module._id);
      onChanged();
      toast.success('Module deleted');
    } catch {
      toast.error('Could not delete module');
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (
    module: ApiInstructorModule,
    direction: -1 | 1
  ) => {
    const targetOrder = module.order + direction;
    if (targetOrder < 1 || targetOrder > modules.length) return;
    setBusy(true);
    try {
      await instructorApi.reorderModule(courseSlug, module._id, targetOrder);
      onChanged();
    } catch {
      toast.error('Could not reorder module');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-brand-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Modules
        </h3>
        <span className="text-xs text-text-muted">
          ({modules.length})
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {modules.map((m) => {
          const isEditing = editingId === m._id;
          const isActive = activeModuleId === m._id;
          const count = lessonCounts[m._id] ?? 0;

          if (isEditing) {
            return (
              <div
                key={m._id}
                className="flex items-center gap-1 rounded-lg border border-brand-500 bg-surface px-2 py-1"
              >
                <Input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRename(m._id);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditTitle('');
                    }
                  }}
                  className="h-7 w-40 border-0 bg-transparent px-1 text-sm focus:ring-0"
                />
                <button
                  onClick={() => void handleRename(m._id)}
                  disabled={busy}
                  className="rounded p-1 text-[var(--color-success)] hover:bg-[var(--color-success)]/10"
                  title="Save"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditTitle('');
                  }}
                  className="rounded p-1 text-text-muted hover:bg-surface-tertiary"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={m._id}
              className={cn(
                'group flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm transition-colors',
                isActive
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border bg-surface text-text-secondary hover:border-brand-500/40'
              )}
            >
              <button
                type="button"
                onClick={() => onSelect?.(m._id)}
                className="flex items-center gap-1.5"
                title={`Show lessons in ${m.title}`}
              >
                <span className="font-medium">{m.title}</span>
                <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-medium">
                  {count}
                </span>
              </button>

              {/* Action cluster — appears on hover */}
              <div className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleReorder(m, -1)}
                  disabled={m.order === 1 || busy}
                  className="rounded p-0.5 text-text-muted hover:bg-surface-tertiary disabled:opacity-30"
                  title="Move left"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={() => handleReorder(m, 1)}
                  disabled={m.order === modules.length || busy}
                  className="rounded p-0.5 text-text-muted hover:bg-surface-tertiary disabled:opacity-30"
                  title="Move right"
                >
                  <ChevronRight size={12} />
                </button>
                <button
                  onClick={() => {
                    setEditingId(m._id);
                    setEditTitle(m.title);
                  }}
                  className="rounded p-0.5 text-text-muted hover:bg-surface-tertiary"
                  title="Rename"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => void handleDelete(m)}
                  disabled={busy}
                  className="rounded p-0.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  title="Delete module"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {creating ? (
          <div className="flex items-center gap-1 rounded-lg border border-brand-500 bg-surface px-2 py-1">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Module title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
                if (e.key === 'Escape') {
                  setCreating(false);
                  setNewTitle('');
                }
              }}
              className="h-7 w-40 border-0 bg-transparent px-1 text-sm focus:ring-0"
            />
            <button
              onClick={() => void handleCreate()}
              disabled={busy || !newTitle.trim()}
              className="rounded p-1 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 disabled:opacity-40"
              title="Create"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewTitle('');
              }}
              className="rounded p-1 text-text-muted hover:bg-surface-tertiary"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setCreating(true)}
          >
            <Plus size={14} /> Add module
          </Button>
        )}
      </div>
    </div>
  );
};