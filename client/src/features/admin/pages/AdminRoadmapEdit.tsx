import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { adminApi } from '@/features/admin/api';
import type {
  AdminRoadmapDetail,
  AdminRoadmapCourseInput,
} from '@/features/admin/api';
import { useToast } from '@/shared/hooks/useToast';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';

export const AdminRoadmapEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [roadmap, setRoadmap] = useState<AdminRoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [courses, setCourses] = useState<AdminRoadmapCourseInput[]>([]);
  const [isFree, setIsFree] = useState(true);
  const [priceRupees, setPriceRupees] = useState('499');
  const [originalPriceRupees, setOriginalPriceRupees] = useState('');
  const [displayFieldsJson, setDisplayFieldsJson] = useState('{}');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Course picker
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [allCourses, setAllCourses] = useState<
    { _id: string; title: string; slug: string }[]
  >([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    adminApi
      .getRoadmapFull(slug)
      .then((r) => {
        setRoadmap(r);
        setTitle(r.title);
        setDescription(r.description);
        setTagline(r.tagline ?? '');
        setThumbnail(r.thumbnail ?? '');
        setHeroVideoUrl(r.heroVideoUrl ?? '');
        setCourses(r.courses);
        setIsFree(r.isFree);
        setPriceRupees(
          r.price ? String(Math.round(r.price / 100)) : '499'
        );
        setOriginalPriceRupees(
          r.originalPrice ? String(Math.round(r.originalPrice / 100)) : ''
        );

        // Serialize all display fields into a single JSON block. This
        // mirrors the "raw JSON file editor" idiom from AdminProjects.
        setDisplayFieldsJson(
          JSON.stringify(
            {
              tags: r.tags,
              badge: r.badge,
              features: r.features,
              sellingPoints: r.sellingPoints,
              sellingHeadline: r.sellingHeadline,
              learningOutcomes: r.learningOutcomes,
              curriculum: r.curriculum,
              projects: r.projects,
              instructor: r.instructor,
              certificateIncluded: r.certificateIncluded,
              faq: r.faq,
            },
            null,
            2
          )
        );
      })
      .catch(() => toast.error('Could not load roadmap'))
      .finally(() => setLoading(false));

    adminApi
      .listCourses()
      .then((rows) =>
        setAllCourses(
          rows.map((c) => ({ _id: c._id, title: c.title, slug: c.slug }))
        )
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addCourse = (courseId: string) => {
    if (courses.some((c) => c.courseId === courseId)) {
      toast.error('That course is already in this roadmap.');
      return;
    }
    setCourses((prev) => [
      ...prev,
      { courseId, order: prev.length + 1, isRequired: true },
    ]);
    setShowCoursePicker(false);
  };

  const removeCourse = (courseId: string) => {
    setCourses((prev) =>
      prev
        .filter((c) => c.courseId !== courseId)
        .map((c, i) => ({ ...c, order: i + 1 }))
    );
  };

  const moveCourse = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= courses.length) return;
    const next = [...courses];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setCourses(next.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const toggleRequired = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.courseId === courseId ? { ...c, isRequired: !c.isRequired } : c
      )
    );
  };

  const handleSave = async () => {
    if (!roadmap) return;
    setBusy(true);
    setError('');

    // Parse the display fields JSON before saving.
    let parsedDisplay: Record<string, unknown>;
    try {
      parsedDisplay = JSON.parse(displayFieldsJson);
      if (
        typeof parsedDisplay !== 'object' ||
        parsedDisplay === null ||
        Array.isArray(parsedDisplay)
      ) {
        throw new Error('must be a JSON object');
      }
    } catch (e) {
      setError(
        `Display fields must be a JSON object.\n${
          e instanceof Error ? e.message : ''
        }`
      );
      setBusy(false);
      return;
    }

    let pricePaise: number | undefined;
    let originalPricePaise: number | undefined;
    if (!isFree) {
      const rupees = Number(priceRupees);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        setError('Paid roadmaps require a price greater than 0.');
        setBusy(false);
        return;
      }
      pricePaise = Math.round(rupees * 100);

      if (originalPriceRupees.trim() !== '') {
        const orig = Number(originalPriceRupees);
        if (!Number.isFinite(orig) || orig <= 0) {
          setError('Original price must be a positive number.');
          setBusy(false);
          return;
        }
        originalPricePaise = Math.round(orig * 100);
      }
    }

    try {
      await adminApi.updateRoadmap(roadmap.slug, {
        title,
        description,
        tagline: tagline || undefined,
        thumbnail: thumbnail || undefined,
        heroVideoUrl: heroVideoUrl || undefined,
        courses,
        isFree,
        price: pricePaise,
        originalPrice: originalPricePaise,
        ...parsedDisplay,
      });
      toast.success('Roadmap saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    if (!roadmap) return;
    try {
      await adminApi.setRoadmapPublished(roadmap.slug, !roadmap.published);
      setRoadmap({ ...roadmap, published: !roadmap.published });
      toast.success(roadmap.published ? 'Unpublished' : 'Published');
    } catch {
      toast.error('Could not update publish state');
    }
  };

  const deleteRoadmap = async () => {
    if (!roadmap) return;
    if (
      !confirm(
        `Delete "${roadmap.title}"? Courses inside it are not deleted.`
      )
    )
      return;
    try {
      await adminApi.deleteRoadmap(roadmap.slug);
      navigate('/admin/roadmaps');
    } catch {
      toast.error('Could not delete');
    }
  };

  if (loading || !roadmap) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <Link
        to="/admin/roadmaps"
        className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> All roadmaps
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {roadmap.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {roadmap.courses.length}{' '}
            {roadmap.courses.length === 1 ? 'course' : 'courses'} ·{' '}
            {roadmap.published ? (
              <span className="text-[var(--color-success)]">Live</span>
            ) : (
              <span className="text-[var(--color-warning)]">Draft</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={togglePublish}>
            {roadmap.published ? (
              <>
                <EyeOff size={14} /> Unpublish
              </>
            ) : (
              <>
                <Eye size={14} /> Publish
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            <Save size={14} /> {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Metadata
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="md:col-span-2"
          />
          <Input
            placeholder="Tagline (optional, short subtitle)"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="md:col-span-2"
          />
          <textarea
            placeholder="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none md:col-span-2"
          />
          <Input
            placeholder="Thumbnail URL"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
          />
          <Input
            placeholder="Hero video URL (YouTube)"
            value={heroVideoUrl}
            onChange={(e) => setHeroVideoUrl(e.target.value)}
          />
        </div>
      </Card>

      {/* Courses */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Courses in this roadmap ({courses.length})
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCoursePicker((v) => !v)}
          >
            <Plus size={14} /> Add course
          </Button>
        </div>

        {showCoursePicker && (
          <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-secondary p-2">
            {allCourses.length === 0 && (
              <p className="p-2 text-xs text-text-muted">
                No courses exist yet. Create one in Admin → Courses first.
              </p>
            )}
            {allCourses.map((c) => (
              <button
                key={c._id}
                onClick={() => addCourse(c._id)}
                disabled={courses.some((x) => x.courseId === c._id)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-text-primary">{c.title}</span>
                <span className="text-xs text-text-muted">{c.slug}</span>
              </button>
            ))}
          </div>
        )}

        {courses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-text-muted">
            No courses added yet. Add at least one before publishing.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {courses.map((c, i) => {
              const meta = allCourses.find((x) => x._id === c.courseId);
              return (
                <li
                  key={c.courseId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <GripVertical size={14} className="text-text-muted" />
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-surface-tertiary font-mono text-xs font-bold text-brand-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {meta?.title ?? c.courseId}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {meta?.slug ?? ''}
                    </p>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={c.isRequired}
                      onChange={() => toggleRequired(c.courseId)}
                    />
                    Required
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveCourse(i, -1)}
                      disabled={i === 0}
                      className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-surface-tertiary disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCourse(i, 1)}
                      disabled={i === courses.length - 1}
                      className="rounded px-2 py-0.5 text-xs text-text-muted hover:bg-surface-tertiary disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeCourse(c.courseId)}
                      className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {/* Pricing */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Pricing
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFree(true)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isFree
                ? 'border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setIsFree(false)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              !isFree
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Paid
          </button>

          {!isFree && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">₹</span>
                <input
                  type="number"
                  min={1}
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none"
                />
                <span className="text-xs text-text-muted">(whole rupees)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  Was (optional):
                </span>
                <span className="text-sm text-text-secondary">₹</span>
                <input
                  type="number"
                  min={1}
                  value={originalPriceRupees}
                  onChange={(e) => setOriginalPriceRupees(e.target.value)}
                  placeholder="—"
                  className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Display fields (raw JSON) */}
      <Card className="mb-6 p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">
          Display fields
        </h2>
        <p className="mb-3 text-xs text-text-muted">
          Advanced: tags, badge, features, sellingPoints, sellingHeadline,
          learningOutcomes, curriculum, projects, instructor,
          certificateIncluded, faq. Edit as JSON — a full form lands in a
          later batch.
        </p>
        <textarea
          rows={14}
          value={displayFieldsJson}
          onChange={(e) => setDisplayFieldsJson(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-brand-500 focus:outline-none"
        />
      </Card>

      {error && (
        <pre className="mb-6 whitespace-pre-wrap rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-3 text-xs text-[var(--color-error)]">
          {error}
        </pre>
      )}

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="ghost"
          onClick={deleteRoadmap}
          className="text-[var(--color-error)]"
        >
          <Trash2 size={14} /> Delete roadmap
        </Button>
        <Button onClick={handleSave} disabled={busy}>
          <Save size={14} /> {busy ? 'Saving…' : 'Save roadmap'}
        </Button>
      </div>
    </div>
  );
};