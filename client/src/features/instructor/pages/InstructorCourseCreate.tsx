import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { instructorApi } from '@/features/instructor/api';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

export const InstructorCourseCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [courseType, setCourseType] = useState('general');
  const [language, setLanguage] = useState('custom');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    if (!title || !slug || !description) {
      setError('Title, slug, and description are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const course = await instructorApi.createCourse({
        title,
        slug,
        description,
        courseType,
        language,
      });
      navigate(`/instructor/courses/${course.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create course.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <Link to="/instructor" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-500">
        <ArrowLeft size={16} /> My courses
      </Link>
      <Card className="mx-auto mt-6 max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-text-primary">Create course</h1>
        <p className="mt-1 text-sm text-text-muted">Define the course identity first. Add lessons, activities, problems, and quizzes next.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Input placeholder="Course title" value={title} onChange={(event) => { setTitle(event.target.value); setSlug(event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} />
          <Input placeholder="Slug (lowercase, dashes)" value={slug} onChange={(event) => setSlug(event.target.value)} />
          <textarea placeholder="Description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Course type (web, dsa, sql, ...)" value={courseType} onChange={(event) => setCourseType(event.target.value)} />
            <Input placeholder="Primary language or subject" value={language} onChange={(event) => setLanguage(event.target.value)} />
          </div>
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button className="self-start" onClick={() => void create()} disabled={busy}>
            <Save size={15} /> {busy ? 'Creating...' : 'Create course'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
