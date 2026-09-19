import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { ClassCard } from '../components/class/ClassCard';
import { ClassForm } from '../components/class/ClassForm';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth.store';
import { cn } from '../lib/utils';
import type { ApiClass } from '../lib/classes.api';

type Tab = 'upcoming' | 'past';

export const Classes: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('upcoming');
  const { classes, setClasses, loading, error, reload } = useClasses(tab);
  const [showForm, setShowForm] = useState(false);

  const isInstructor =
    user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Live Classes</h1>
          <p className="mt-1 text-sm text-text-muted">
            Join live sessions or catch up with recordings.
          </p>
        </div>

        {isInstructor && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} /> {showForm ? 'Close' : 'New Class'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Schedule a new class
          </h2>
          <ClassForm
            onCreated={(cls: ApiClass) => {
              setClasses((prev) => [cls, ...prev]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <div className="mb-6 flex gap-1 border-b border-border">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
              tab === t
                ? 'border-b-2 border-brand-500 text-brand-500'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <ErrorState
          title="Couldn't load classes"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && classes.length === 0 && (
        <p className="text-text-muted">No {tab} classes yet.</p>
      )}

      {!loading && !error && classes.length > 0 && (
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard key={c._id} classItem={c} />
          ))}
        </div>
      )}
    </div>
  );
};