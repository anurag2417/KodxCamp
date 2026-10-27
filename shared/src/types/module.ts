import type {
  ISectionWithItems,
} from './curriculum.js';

/**
 * A module is an ordered grouping of sections inside a course.
 *
 * New hierarchy:
 *
 * Course
 *   → Module
 *     → Section
 *       → CurriculumItem
 *
 * Lessons are no longer directly owned by modules from the
 * perspective of the student curriculum.
 */
export interface IModule {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A module with its complete curriculum sections.
 */
export interface IModuleWithSections extends IModule {
  sections: ISectionWithItems[];
}

/**
 * Legacy shape retained temporarily so older instructor screens
 * and APIs can continue to compile during migration.
 *
 * This will eventually be removed once all module consumers use
 * sections and curriculum items.
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
 * Legacy course module response.
 *
 * Retained during migration.
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

/**
 * New canonical course curriculum response.
 */
export interface ICourseCurriculumResponse {
  courseId: string;
  modules: IModuleWithSections[];
}