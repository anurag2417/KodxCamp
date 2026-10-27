import mongoose, {
  Schema,
  type Document,
} from 'mongoose';

export interface SectionDocument extends Document {
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<SectionDocument>(
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

    published: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Sections are ordered inside a module.
 */
sectionSchema.index(
  {
    moduleId: 1,
    order: 1,
  },
  {
    unique: true,
  }
);

/**
 * Course-level lookup is common when constructing the student
 * curriculum tree.
 */
sectionSchema.index({
  courseId: 1,
  moduleId: 1,
  order: 1,
});

export const Section = mongoose.model<SectionDocument>(
  'Section',
  sectionSchema
);