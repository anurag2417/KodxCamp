import { Module } from '../models/Module.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Normalize the `order` values of every module in a course so they
 * are 1..N with no gaps. Called after any create/delete/reorder.
 *
 * Not atomic across all modules — a concurrent reorder could produce
 * a transient conflict. In practice only one instructor edits a
 * course at a time, so this is acceptable. The unique index on
 * (courseId, order) is the backstop.
 */
async function normalizeOrders(courseId: string): Promise<void> {
  const modules = await Module.find({ courseId }).sort({ order: 1 });
  for (let i = 0; i < modules.length; i++) {
    const desired = i + 1;
    if (modules[i].order !== desired) {
      // Step the module through a temporary high order to avoid
      // colliding with the module that is about to move down.
      modules[i].order = desired + 10_000;
      await modules[i].save();
    }
  }
  for (const m of modules) {
    const desired =
      modules.findIndex((x) => x._id.toString() === m._id.toString()) + 1;
    const doc = await Module.findById(m._id);
    if (doc && doc.order !== desired) {
      doc.order = desired;
      await doc.save();
    }
  }
}

export const moduleService = {
  /**
   * All modules in a course, in order.
   */
  async listForCourse(courseId: string) {
    return Module.find({ courseId }).sort({ order: 1 }).lean();
  },

  /**
   * All modules in a course, plus a bucket of lessons that don't
   * belong to any module. The bucket exists so the instructor UI has
   * somewhere to render a lesson whose module was deleted.
   */
  async listWithLessons(courseId: string) {
    const [modules, ungrouped] = await Promise.all([
      Module.find({ courseId }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId, moduleId: { $in: [undefined, null, ''] } })
        .sort({ order: 1 })
        .select('_id title slug order language problemSlug moduleId')
        .lean(),
    ]);

    const lessonsByModule = await Lesson.aggregate<{
      _id: string;
      lessons: {
        _id: string;
        title: string;
        slug: string;
        order: number;
        language: string;
        problemSlug?: string;
      }[];
    }>([
      { $match: { courseId, moduleId: { $nin: [undefined, null, ''] } } },
      { $sort: { order: 1 } },
      {
        $group: {
          _id: '$moduleId',
          lessons: {
            $push: {
              _id: '$_id',
              title: '$title',
              slug: '$slug',
              order: '$order',
              language: '$language',
              problemSlug: '$problemSlug',
            },
          },
        },
      },
    ]);

    const lessonsByModuleId = new Map(
      lessonsByModule.map((entry) => [entry._id, entry.lessons])
    );

    return {
      modules: modules.map((m) => ({
        ...m,
        _id: m._id.toString(),
        lessons: (lessonsByModuleId.get(m._id.toString()) ?? []).map((l) => ({
          ...l,
          _id: l._id.toString(),
        })),
      })),
      ungrouped: ungrouped.map((l) => ({
        ...l,
        _id: l._id.toString(),
      })),
    };
  },

  async getById(moduleId: string) {
    const doc = await Module.findById(moduleId).lean();
    if (!doc) throw new ApiError(404, 'Module not found');
    return doc;
  },

  async create(input: {
    courseId: string;
    title: string;
    description?: string;
    order?: number;
  }) {
    // Default the new module to the end of the list.
    let order = input.order;
    if (order === undefined) {
      const last = await Module.findOne({ courseId: input.courseId })
        .sort({ order: -1 })
        .lean();
      order = (last?.order ?? 0) + 1;
    }

    const created = await Module.create({
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      order,
    });

    await normalizeOrders(input.courseId);
    return created.toObject();
  },

  async update(
    moduleId: string,
    patch: { title?: string; description?: string }
  ) {
    const doc = await Module.findById(moduleId);
    if (!doc) throw new ApiError(404, 'Module not found');
    if (patch.title !== undefined) doc.title = patch.title;
    if (patch.description !== undefined) doc.description = patch.description;
    await doc.save();
    return doc.toObject();
  },

  /**
   * Delete a module and re-parent its lessons to `moduleId: null`.
   *
   * Not a cascade. The author deleted an organizational frame, not
   * content. Lessons survive and appear in the "ungrouped" bucket
   * until the author assigns them to a new module.
   */
  async delete(moduleId: string) {
    const doc = await Module.findById(moduleId);
    if (!doc) throw new ApiError(404, 'Module not found');

    const courseId = doc.courseId;

    await Lesson.updateMany(
      { moduleId },
      { $unset: { moduleId: '' } }
    );
    await Module.deleteOne({ _id: moduleId });
    await normalizeOrders(courseId);

    return { ok: true };
  },

  /**
   * Move a module to a new position. Both directions (up and down)
   * are handled by the same call with the target index.
   *
   * The `order` values of the affected modules are swapped in a
   * single transaction-like sequence: temporarily park the moving
   * module at a high order, shift the others, then set the moving
   * module's final order.
   */
  async reorder(moduleId: string, targetOrder: number) {
    const doc = await Module.findById(moduleId);
    if (!doc) throw new ApiError(404, 'Module not found');

    const courseId = doc.courseId;

    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const currentIndex = modules.findIndex(
      (m) => m._id.toString() === moduleId
    );
    if (currentIndex === -1) throw new ApiError(404, 'Module not found');

    const clampedTarget = Math.max(
      1,
      Math.min(targetOrder, modules.length)
    );
    if (clampedTarget === currentIndex + 1) {
      return doc.toObject();
    }

    // Park the moving module above the range.
    const PARK = 100_000;
    const moving = modules[currentIndex];
    moving.order = PARK;
    await moving.save();

    // Remove the moving module from the in-memory list and splice it
    // back at the target index.
    const rest = modules.filter(
      (m) => m._id.toString() !== moduleId
    );
    rest.splice(clampedTarget - 1, 0, moving);

    // Write every module's new order.
    for (let i = 0; i < rest.length; i++) {
      const desired = i + 1;
      if (rest[i].order !== desired) {
        rest[i].order = desired;
        await rest[i].save();
      }
    }

    return Module.findById(moduleId).lean();
  },

  /**
   * Move a lesson into a module, or move it between modules.
   * `moduleId = null` removes the lesson from any module.
   */
  async assignLesson(lessonId: string, moduleId: string | null) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    if (moduleId !== null) {
      const module = await Module.findById(moduleId).lean();
      if (!module) throw new ApiError(404, 'Module not found');
      if (module.courseId !== lesson.courseId) {
        throw new ApiError(
          400,
          'The module belongs to a different course than the lesson.'
        );
      }
      lesson.moduleId = moduleId;
    } else {
      lesson.moduleId = undefined;
    }

    await lesson.save();
    return lesson.toObject();
  },
};