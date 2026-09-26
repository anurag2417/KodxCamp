import mongoose, { Schema, type Document } from 'mongoose';

export type ProjectCategory =
  | 'frontend'
  | 'react'
  | 'api'
  | 'sql'
  | 'dataviz'
  | 'javascript';

export type ProjectFileLang =
  | 'html'
  | 'css'
  | 'javascript'
  | 'jsx'
  | 'sql'
  | 'json'
  | 'markdown';

export type ProjectMode = 'required' | 'recommended' | 'open_choice';

export interface IProjectFile {
  name: string;
  language: ProjectFileLang;
  content: string;
  isEntry?: boolean;
}

export interface IProjectRubricCategory {
  category: string;
  weight: number;
}

/**
 * The test grammar. Mirrors `shared/src/types/project.ts`.
 *
 * Two levels deep, no recursion:
 *   - `dom-*` are assertions.
 *   - `event-*` perform an action, then assert a `dom-*`.
 *   - `visual-nonblank` is a structural check.
 */
interface DomAssertion {
  type: 'dom-exists' | 'dom-text' | 'dom-attribute' | 'dom-count';
  selector: string;
  // dom-text
  mode?: 'equals' | 'matches';
  value?: string;
  // dom-attribute
  attribute?: string;
  // dom-count
  count?: number;
}

interface ProjectTestCheck {
  type:
    | 'dom-exists'
    | 'dom-text'
    | 'dom-attribute'
    | 'dom-count'
    | 'event-click'
    | 'event-input'
    | 'visual-nonblank';
  // dom-* and event-*
  selector?: string;
  mode?: 'equals' | 'matches';
  value?: string;
  attribute?: string;
  count?: number;
  // event-*
  assert?: DomAssertion;
  // visual-nonblank
  minimumChars?: number;
}

interface ProjectTest {
  name: string;
  check: ProjectTestCheck;
  description?: string;
}

export interface ProjectDocument extends Document {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  thumbnail?: string;
  files: IProjectFile[];
  previewMode: 'html' | 'react' | 'sql' | 'none';
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;

  mode: ProjectMode;

  specification: {
    objective?: string;
    requiredFeatures?: string[];
    technicalRequirements?: string[];
    designRequirements?: string[];
    accessibilityRequirements?: string[];
    expectedBehaviour?: string;
  };

  rubric: IProjectRubricCategory[];

  /** Master Spec, section 13. */
  tests: ProjectTest[];

  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IProjectFile>(
  {
    name: { type: String, required: true },
    language: {
      type: String,
      enum: ['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown'],
      required: true,
    },
    content: { type: String, default: '' },
    isEntry: { type: Boolean, default: false },
  },
  { _id: false }
);

const rubricCategorySchema = new Schema<IProjectRubricCategory>(
  {
    category: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const specificationSchema = new Schema(
  {
    objective: { type: String, default: undefined },
    requiredFeatures: { type: [String], default: [] },
    technicalRequirements: { type: [String], default: [] },
    designRequirements: { type: [String], default: [] },
    accessibilityRequirements: { type: [String], default: [] },
    expectedBehaviour: { type: String, default: undefined },
  },
  { _id: false }
);

/**
 * The nested assertion of an `event-*` test. Same discriminated union
 * shape as a top-level `dom-*`, but with `_id: false` so it stays a
 * plain object.
 */
const domAssertionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['dom-exists', 'dom-text', 'dom-attribute', 'dom-count'],
      required: true,
    },
    selector: { type: String, required: true },
    mode: { type: String, enum: ['equals', 'matches'] },
    value: { type: String },
    attribute: { type: String },
    count: { type: Number },
  },
  { _id: false, strict: true }
);

/**
 * One test. The `check` field's shape depends on `check.type`.
 * Validation is intentionally loose at the schema level — the Zod
 * schema in the controller is the authority, and it rejects invalid
 * combinations before a document is ever written.
 */
const projectTestSchema = new Schema<ProjectTest>(
  {
    name: { type: String, required: true, trim: true },
    check: {
      type: {
        type: String,
        enum: [
          'dom-exists',
          'dom-text',
          'dom-attribute',
          'dom-count',
          'event-click',
          'event-input',
          'visual-nonblank',
        ],
        required: true,
      },
      selector: { type: String },
      mode: { type: String, enum: ['equals', 'matches'] },
      value: { type: String },
      attribute: { type: String },
      count: { type: Number },
      assert: { type: domAssertionSchema, default: undefined },
      minimumChars: { type: Number },
    },
    description: { type: String },
  },
  { _id: false }
);

const projectSchema = new Schema<ProjectDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: '' },
    category: {
      type: String,
      enum: ['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    topics: { type: [String], default: [] },
    thumbnail: { type: String },
    files: { type: [fileSchema], default: [] },
    previewMode: {
      type: String,
      enum: ['html', 'react', 'sql', 'none'],
      default: 'html',
    },
    instructions: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 60 },
    xpReward: { type: Number, default: 100 },

    mode: {
      type: String,
      enum: ['required', 'recommended', 'open_choice'],
      default: 'required',
      index: true,
    },

    specification: {
      type: specificationSchema,
      default: () => ({}),
    },

    rubric: { type: [rubricCategorySchema], default: [] },

    tests: { type: [projectTestSchema], default: [] },
  },
  { timestamps: true }
);

export const Project = mongoose.model<ProjectDocument>('Project', projectSchema);