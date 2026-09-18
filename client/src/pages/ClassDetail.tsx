import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Upload, Video } from 'lucide-react';
import { useClass } from '../hooks/useClass';
import { classesApi } from '../lib/classes.api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
import { ClassStatusBadge } from '../components/class/ClassStatusBadge';
import { RecordingPlayer } from '../components/class/RecordingPlayer';

const API_ORIGIN = ''; // served from same origin via proxy in dev

export const ClassDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { cls, enrollment, setEnrollment, attendeeCount, loading, error, reload } = useClass(slug);
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">{error ?? 'Class not found'}</p>
        <Link to="/classes" className="mt-4 inline-block text-brand-500 hover:underline">
          ← Back to classes
        </Link>
      </div>
    );
  }

  const isInstructor = user?._id === cls.instructorId;
  const isEnrolled = !!enrollment;

  const handleEnroll = async () => {
    setBusy(true);
    try {
      const e = await classesApi.enroll(cls.slug);
      setEnrollment(e);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this class?')) return;
    setBusy(true);
    try {
      await classesApi.unenroll(cls.slug);
      setEnrollment(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    await classesApi.attend(cls.slug);
    window.open(cls.meetLink, '_blank', 'noopener,noreferrer');
    reload();
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setUploadProgress('Uploading...');
    try {
      await classesApi.uploadRecording(cls.slug, file, durationSec);
      setUploadProgress('Done ✓');
      reload();
    } catch {
      setUploadProgress('Upload failed');
    } finally {
      setBusy(false);
      setFile(null);
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/classes"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Classes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <ClassStatusBadge status={cls.status} />
          <h1 className="mt-3 text-3xl font-bold text-text-primary">{cls.title}</h1>
          <p className="mt-2 text-sm text-text-secondary">{cls.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span>👩‍🏫 {cls.instructorName}</span>
            <span>
              🗓{' '}
              {new Date(cls.scheduledAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
            <span>⏱ {cls.durationMinutes} min</span>
            <span>👥 {attendeeCount} enrolled</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <Card className="mb-6 flex flex-wrap items-center gap-3 p-5">
        {!user && (
          <p className="text-sm text-text-muted">
            <Link to="/login" className="text-brand-500 hover:underline">
              Log in
            </Link>{' '}
            to enroll.
          </p>
        )}

        {user && !isInstructor && !isEnrolled && cls.status !== 'ended' && (
          <Button onClick={handleEnroll} disabled={busy}>
            Enroll
          </Button>
        )}

        {user && isEnrolled && cls.status === 'scheduled' && (
          <>
            <Button onClick={handleJoin} disabled={busy}>
              <ExternalLink size={16} /> Join Live
            </Button>
            <Button variant="ghost" onClick={handleLeave} disabled={busy}>
              Leave
            </Button>
          </>
        )}

        {user && isEnrolled && cls.status === 'live' && (
          <Button onClick={handleJoin} disabled={busy}>
            <ExternalLink size={16} /> Join Live Now
          </Button>
        )}

        {user && cls.status === 'ended' && cls.recording && (
          <p className="text-sm text-text-muted">
            ✓ This class has ended. Watch the recording below.
          </p>
        )}

        {isInstructor && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-text-muted">Instructor view</span>
          </div>
        )}
      </Card>

      {/* Recording */}
      {cls.recording ? (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Recording</h2>
          <Card className="overflow-hidden p-0">
            <div className="h-[480px]">
              <RecordingPlayer
                classSlug={cls.slug}
                src={`${API_ORIGIN}${cls.recording.url}`}
                chapters={cls.recording.chapters}
                initialSeconds={enrollment?.watchedSeconds ?? 0}
                onProgress={(watched, duration) => {
                  // Fire and forget
                  if (isEnrolled) {
                    classesApi.watch(cls.slug, watched, duration).catch(() => {});
                  }
                }}
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <Video size={18} />
            <span>No recording yet. This class hasn't been recorded.</span>
          </div>
        </Card>
      )}

      {/* Instructor upload */}
      {isInstructor && !cls.recording && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Upload Recording
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                // Try to detect duration via a temp video element
                const url = URL.createObjectURL(f);
                const v = document.createElement('video');
                v.preload = 'metadata';
                v.onloadedmetadata = () => {
                  setDurationSec(Math.floor(v.duration) || 0);
                  URL.revokeObjectURL(url);
                };
                v.src = url;
              }}
              className="text-xs text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-tertiary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-text-secondary hover:file:bg-surface-secondary"
            />
            <Button onClick={handleUpload} disabled={!file || busy}>
              <Upload size={14} /> {busy ? uploadProgress || 'Uploading...' : 'Upload'}
            </Button>
            {durationSec > 0 && (
              <span className="text-xs text-text-muted">
                Detected duration: {Math.round(durationSec / 60)} min
              </span>
            )}
          </div>
          {uploadProgress && (
            <p className="mt-2 text-xs text-text-muted">{uploadProgress}</p>
          )}
        </Card>
      )}
    </div>
  );
};