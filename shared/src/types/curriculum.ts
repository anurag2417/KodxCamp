import type { IModuleWithSections } from './module.js';

export type CurriculumItemType =
  | 'lesson'
  | 'mcq'
  | 'coding_problem'
  | 'sql_problem'
  | 'web_theory'
  | 'web_step'
  | 'web_workshop'
  | 'web_lab'
  | 'quiz'
  | 'project'
  | 'live_class';

export type CurriculumItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export interface ISection {
  _id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICurriculumItem {
  _id: string;
  courseId: string;
  moduleId: string;
  sectionId: string;

  type: CurriculumItemType;

  /**
   * Reference to the actual content entity.
   *
   * Examples:
   * - lesson -> Lesson._id
   * - coding_problem -> Problem._id
   * - project -> Project._id
   * - live_class -> Class._id
   */
  referenceId: string;

  title: string;
  description?: string;

  /**
   * Display order within the section.
   * 1-based and contiguous.
   */
  order: number;

  /**
   * Whether this activity contributes to the required
   * completion of the section/course.
   */
  isRequired: boolean;

  published: boolean;

  /**
   * Optional estimated completion time for the activity.
   */
  estimatedMinutes?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISectionWithItems extends ISection {
  items: ICurriculumItem[];
}

export interface ICourseCurriculum {
  courseId: string;
  modules: IModuleWithSections[];
}
