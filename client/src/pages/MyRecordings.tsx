import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react';
import { classesApi, type ApiMyRecording } from '../lib/classes.api';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export const MyRecordings: React.FC = () => {
  const [rows, setRows] = useState<ApiMyRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classesApi
      .myRecordings()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/classes"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Classes
      </Link>

      <h1 className="text-3xl font-bold text-text-primary">Catch Up</h1>
      <p className="mt-1 text-sm text-text-muted">
        Recordings from classes you're enrolled in.
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-text-muted">
            No recordings yet. Enroll in a class to see its recordings here.
          </p>
          <Link to="/classes" className="mt-4 inline-block text-brand-500 hover:underline">
            Browse classes →
          </Link>
        </Card>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((r) => (
            <Link key={r.class._id} to={`/classes/${r.class.slug}`}>
              <Card className="flex items-center gap-4 p-4 transition-all hover:border-brand-500/60">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-tertiary">
                  {r.recordingCompletedAt ? (
                    <CheckCircle2 size={22} className="text-[var(--color-success)]" />
                  ) : (
                    <PlayCircle size={22} className="text-brand-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {r.class.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {r.class.instructorName}
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${r.percentWatched}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-text-muted">
                    {r.percentWatched}% watched
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};