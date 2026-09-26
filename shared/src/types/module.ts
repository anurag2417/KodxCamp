/**
 * A module is an ordered grouping of lessons inside a course.
 *
 * Hierarchy: Course > Module > Lesson.
 *
 * Modules are optional at the schema level but assigned to every
 * lesson by the `migrate-modules.ts` migration. The `moduleId` on
 * `Lesson` is therefore nullable in the type so that:
 *
 *   - Un-migrated databases still compile.
 *   - Bulk-import payloads that predate modules still parse.
 *   - The author can remove a lesson from its module without
 *     breaking the lesson's validity.
 *
 * Modules carry no completion logic of their own — a module's state
 * (`completed | in_progress | not_started`) is derived from the
 * completion of its lessons. Deriving rather than storing avoids
 * drift between the two.
 */
export interface IModule {
  _id: string;
  courseId: string;
  title: string;
  /** Optional short subtitle rendered under the title in the UI. */
  description?: string;
  /**
   * Display order within the course. 1-based, contiguous (no gaps).
   * The service normalizes this on every write.
   */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A module plus the lessons it contains. Returned by the instructor
 * editor and the student course detail view.
 */
export interface IModuleWithLessons extends IModule {
  lessons: {
    _id: string;
    title: string;
    slug: string;
    order: number;
    language: string;
    problemSlug?: string;
  }[];
}

/**
 * A course's modules, plus the "ungrouped" lessons that don't belong
 * to any module. After the migration, `ungrouped` is empty for every
 * course; it exists so the instructor UI has a bucket to render a
 * lesson into if the author deletes the module it belonged to.
 */
export interface ICourseWithModules {
  modules: IModuleWithLessons[];
  ungrouped: {
    _id: string;
    title: string;
    slug: string;
    order: number;
    language: string;
    problemSlug?: string;
  }[];
}