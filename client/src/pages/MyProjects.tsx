import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { projectsApi, type ApiProjectFull } from '../lib/projects.api';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CategoryBadge } from '../components/project/CategoryBadge';
import { Badge } from '../components/ui/Badge';

interface Row {
  _id: string;
  status: string;
  completedAt?: string;
  updatedAt: string;
  project: ApiProjectFull;
}

export const MyProjects: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.mine();
      setRows(data as Row[]);
    } catch {
      setError('Failed to load your projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> All Projects
      </Link>

      <h1 className="text-3xl font-bold text-text-primary">My Projects</h1>
      <p className="mt-1 text-sm text-text-muted">
        Everything you've started or completed.
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <ErrorState
          title="Couldn't load your projects"
          message={error}
          onRetry={reload}
          className="mt-8"
        />
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-muted">
            You haven't started any projects yet.
          </p>
          <Link to="/projects" className="mt-4 inline-block">
            <span className="text-brand-500 hover:underline">
              Browse projects →
            </span>
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((r) => (
            <Link key={r._id} to={`/projects/${r.project.slug}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition-all hover:border-brand-500/60">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={r.project.category} />
                    {r.status === 'completed' ? (
                      <Badge tone="success">Completed</Badge>
                    ) : (
                      <Badge tone="warning">In progress</Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-text-primary">
                    {r.project.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                    {r.project.description}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                  <Clock size={12} />
                  {new Date(r.updatedAt).toLocaleDateString()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};