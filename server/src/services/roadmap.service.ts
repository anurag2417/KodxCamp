import { Roadmap } from '../models/Roadmap.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';

interface RoadmapCourseInput {
  courseId: string;
  order?: number;
  isRequired?: boolean;
}

interface RoadmapInput {
  title: string;
  slug: string;
  description: string;
  tagline?: string;
  tags?: string[];
  badge?: 'LIVE' | 'NEW' | 'POPULAR' | 'STARTING SOON';
  thumbnail?: string;
  heroVideoUrl?: string;
  courses?: RoadmapCourseInput[];
  isFree?: boolean;
  price?: number;
  originalPrice?: number;
  features?: unknown[];
  sellingPoints?: unknown[];
  sellingHeadline?: string;
  learningOutcomes?: string[];
  curriculum?: unknown[];
  projects?: unknown[];
  instructor?: unknown;
  certificateIncluded?: boolean;
  faq?: unknown[];
  published?: boolean;
}

/**
 * Normalize the `courses` array so orders are always 1..N with no
 * gaps and no duplicates. The client may send them in any order with
 * any numbers; this function makes the invariant hold.
 */
function normalizeCourses(
  input: RoadmapCourseInput[]
): { courseId: string; order: number; isRequired: boolean }[] {
  const seen = new Set<string>();
  const out: { courseId: string; order: number; isRequired: boolean }[] = [];

  for (const c of input) {
    if (seen.has(c.courseId)) {
      throw new ApiError(400, `Course ${c.courseId} appears twice in the roadmap.`);
    }
    seen.add(c.courseId);
    out.push({
      courseId: c.courseId,
      order: c.order ?? out.length + 1,
      isRequired: c.isRequired ?? true,
    });
  }

  out.sort((a, b) => a.order - b.order);
  return out.map((c, i) => ({ ...c, order: i + 1 }));
}

async function assertCoursesExist(courseIds: string[]): Promise<void> {
  if (courseIds.length === 0) return;
  const found = await Course.find({ _id: { $in: courseIds } })
    .select('_id')
    .lean();
  const foundIds = new Set(found.map((c) => c._id.toString()));
  const missing = courseIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new ApiError(400, `Unknown course ids: ${missing.join(', ')}`);
  }
}

async function enrichCourses(
  refs: { courseId: string; order: number; isRequired: boolean }[]
) {
  if (refs.length === 0) return [];

  const courseIds = refs.map((r) => r.courseId);
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select('_id title slug description language thumbnail published')
    .lean();

  const lessonCounts = await Lesson.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: '$courseId', count: { $sum: 1 } } },
  ]);
  const lessonCountByCourse = new Map(
    lessonCounts.map((l) => [l._id, l.count])
  );

  const courseById = new Map(courses.map((c) => [c._id.toString(), c]));

  return refs
    .map((ref) => {
      const c = courseById.get(ref.courseId);
      if (!c) return null;
      return {
        _id: c._id.toString(),
        courseId: ref.courseId,
        order: ref.order,
        isRequired: ref.isRequired,
        title: c.title,
        slug: c.slug,
        description: c.description,
        language: c.language,
        thumbnail: c.thumbnail,
        totalLessons: lessonCountByCourse.get(ref.courseId) ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export const roadmapService = {
  async listPublished() {
    const roadmaps = await Roadmap.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();

    return roadmaps.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      description: r.description,
      tagline: r.tagline,
      tags: r.tags,
      badge: r.badge,
      thumbnail: r.thumbnail,
      isFree: r.isFree,
      price: r.price,
      originalPrice: r.originalPrice,
      courseCount: r.courses.length,
      published: r.published,
    }));
  },

  async getBySlug(slug: string, opts?: { isAdmin?: boolean }) {
    const roadmap = await Roadmap.findOne({ slug }).lean();
    if (!roadmap) throw new ApiError(404, 'Roadmap not found');
    if (!roadmap.published && !opts?.isAdmin) {
      throw new ApiError(404, 'Roadmap not found');
    }

    const enriched = await enrichCourses(roadmap.courses);

    return {
      ...roadmap,
      _id: roadmap._id.toString(),
      enrichedCourses: enriched,
    };
  },

  async listAllForAdmin() {
    const roadmaps = await Roadmap.find().sort({ createdAt: -1 }).lean();

    return roadmaps.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      description: r.description,
      tagline: r.tagline,
      tags: r.tags,
      badge: r.badge,
      thumbnail: r.thumbnail,
      isFree: r.isFree,
      price: r.price,
      originalPrice: r.originalPrice,
      courseCount: r.courses.length,
      published: r.published,
      updatedAt: r.updatedAt,
    }));
  },

  async getFullBySlug(slug: string) {
    return this.getBySlug(slug, { isAdmin: true });
  },

  async create(input: RoadmapInput, createdBy: string) {
    const exists = await Roadmap.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');

    const courses = normalizeCourses(input.courses ?? []);
    await assertCoursesExist(courses.map((c) => c.courseId));

    const created = await Roadmap.create({
      ...input,
      courses,
      isFree: input.isFree ?? true,
      published: input.published ?? false,
      createdBy,
    });

    return created.toObject();
  },

  async update(slug: string, patch: RoadmapInput) {
    const roadmap = await Roadmap.findOne({ slug });
    if (!roadmap) throw new ApiError(404, 'Roadmap not found');

    if (patch.slug && patch.slug !== slug) {
      const collision = await Roadmap.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    let courses;
    if (patch.courses) {
      courses = normalizeCourses(patch.courses);
      await assertCoursesExist(courses.map((c) => c.courseId));
    }

    const applyPatch: Record<string, unknown> = { ...patch };
    if (courses) applyPatch.courses = courses;

    Object.assign(roadmap, applyPatch);
    await roadmap.save();
    return roadmap.toObject();
  },

  async setPublished(slug: string, published: boolean) {
    const roadmap = await Roadmap.findOne({ slug });
    if (!roadmap) throw new ApiError(404, 'Roadmap not found');
    roadmap.published = published;
    await roadmap.save();
    return roadmap.toObject();
  },

  async delete(slug: string) {
    const result = await Roadmap.deleteOne({ slug });
    if (result.deletedCount === 0) throw new ApiError(404, 'Roadmap not found');
    return { ok: true };
  },

  async roadmapsContainingCourse(courseId: string) {
    const roadmaps = await Roadmap.find({
      published: true,
      'courses.courseId': courseId,
    })
      .select('_id title slug')
      .lean();

    return roadmaps.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      slug: r.slug,
    }));
  },
};