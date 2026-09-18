import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { classesApi, type ApiClass } from '../../lib/classes.api';

interface Props {
  onCreated: (cls: ApiClass) => void;
  onCancel?: () => void;
}

export const ClassForm: React.FC<Props> = ({ onCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetLink, setMeetLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!meetLink || !/^https:\/\/meet\.google\.com\//.test(meetLink)) {
      setError('Please provide a valid Google Meet link (https://meet.google.com/…)');
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
      const created = await classesApi.create({
        title,
        description,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        meetLink,
      });
      onCreated(created);
      setTitle('');
      setDescription('');
      setScheduledAt('');
      setDurationMinutes(60);
      setMeetLink('');
    } catch {
      setError('Could not create class. Check the fields.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input
        placeholder="Class title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-3">
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
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Schedule Class'}
        </Button>
      </div>
    </form>
  );
};