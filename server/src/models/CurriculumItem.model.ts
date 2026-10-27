import mongoose, {
  Schema,
  type Document,
} from 'mongoose';

export const CURRICULUM_ITEM_TYPES = [
  'lesson',
  'mcq',
  'coding_problem',
  'sql_problem',
  'web_theory',
  'web_step',
  'web_workshop',
  'web_lab',
  'quiz',
  'project',
  'live_class',
] as const;

export type CurriculumItemType =
  (typeof CURRICULUM_ITEM_TYPES)[number];

export interface CurriculumItemDocument extends Document {
  courseId: string;
  moduleId: string;
  sectionId: string;

  type: CurriculumItemType;

  /**
   * ID of the actual content entity.
   *
   * Examples:
   *
   * lesson          -> Lesson._id
   * coding_problem  -> Problem._id
   * project         -> Project._id
   * live_class      -> Class._id
   */
  referenceId: string;

  title: string;
  description?: string;

  order: number;

  /**
   * Required activities contribute to the required completion
   * calculation for the section/course.
   */
  isRequired: boolean;

  published: boolean;

  estimatedMinutes?: number;

  createdAt: Date;
  updatedAt: Date;
}

const curriculumItemSchema =
  new Schema<CurriculumItemDocument>(
    {
      courseId: {
        type: String,
        required: true,
        index: true,
      },

      moduleId: {
        type: String,
        required: true,
        index: true,
      },

      sectionId: {
        type: String,
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: CURRICULUM_ITEM_TYPES,
        required: true,
        index: true,
      },

      referenceId: {
        type: String,
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: undefined,
        trim: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      isRequired: {
        type: Boolean,
        default: true,
      },

      published: {
        type: Boolean,
        default: false,
        index: true,
      },

      estimatedMinutes: {
        type: Number,
        min: 0,
        default: undefined,
      },
    },
    {
      timestamps: true,
    }
  );

/**
 * The position of an activity is unique within its section.
 */
curriculumItemSchema.index(
  {
    sectionId: 1,
    order: 1,
  },
  {
    unique: true,
  }
);

/**
 * Fast student curriculum lookups.
 */
curriculumItemSchema.index({
  courseId: 1,
  moduleId: 1,
  sectionId: 1,
  order: 1,
});

/**
 * Useful when resolving all curriculum references to a specific
 * content entity.
 */
curriculumItemSchema.index({
  type: 1,
  referenceId: 1,
});

export const CurriculumItem =
  mongoose.model<CurriculumItemDocument>(
    'CurriculumItem',
    curriculumItemSchema
  );