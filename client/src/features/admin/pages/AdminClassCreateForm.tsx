import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { adminApi, type AdminClass, type AdminInstructor } from '@/features/admin/api';
import { useAuthStore } from '@/shared/store/auth.store';

interface Props {
  onCreated: (cls: AdminClass) => void;
  onCancel: () => void;
}

export const AdminClassCreateForm: React.FC<Props> = ({
  onCreated,
  onCancel,
}) => {
  const currentUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetLink, setMeetLink] = useState('');

  const [instructors, setInstructors] = useState<AdminInstructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listInstructors()
      .then((rows) => {
        if (cancelled) return;
        setInstructors(rows);
        const self = rows.find((r) => r._id === currentUser?._id);
        setInstructorId(self ? self._id : rows[0]?._id ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load instructors.');
      })
      .finally(() => {
        if (!cancelled) setLoadingInstructors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?._id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || title.length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!instructorId) {
      setError('Pick an instructor.');
      return;
    }
    if (!meetLink || !/^https:\/\/meet\.google\.com\//.test(meetLink)) {
      setError(
        'Please provide a valid Google Meet link (https://meet.google.com/…).'
      );
      return;
    }
    if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
      setError('Please pick a valid date and time.');
      return;
    }
    if (new Date(scheduledAt) < new Date()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    setBusy(true);
    try {
      // `adminApi.createClass` returns an `AdminClass` directly (the
      // api helper unwraps `data.data` before returning).
      const created = await adminApi.createClass({
        title,
        description,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        meetLink,
      });

      onCreated(created);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create class.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          placeholder="Class title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
        />
        <div>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            disabled={loadingInstructors || instructors.length === 0}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary disabled:opacity-60"
          >
            {loadingInstructors && <option>Loading instructors…</option>}
            {!loadingInstructors && instructors.length === 0 && (
              <option value="">No instructors available</option>
            )}
            {!loadingInstructors &&
              instructors.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.role})
                </option>
              ))}
          </select>
        </div>
      </div>

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
        <Input
          type="number"
          min={5}
          max={480}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          placeholder="Duration (min)"
        />
      </div>

      <Input
        placeholder="Google Meet link (required)"
        value={meetLink}
        onChange={(e) => setMeetLink(e.target.value)}
        required
      />
      <p className="text-xs text-text-muted">
        Open Google Meet, click "New meeting", and paste the link here.
      </p>

      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Schedule Class'}
        </Button>
      </div>
    </form>
  );
};