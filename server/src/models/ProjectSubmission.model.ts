import mongoose, { Schema, type Document } from 'mongoose';

export type ProjectFileLang =
  | 'html'
  | 'css'
  | 'javascript'
  | 'jsx'
  | 'sql'
  | 'json'
  | 'markdown';

export type ProjectSubmissionStatus =
  | 'submitted'
  | 'ai_evaluated'
  | 'instructor_reviewed'
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

export interface SubmissionFile {
  name: string;
  language: ProjectFileLang;
  content: string;
  isEntry?: boolean;
}

interface ProjectTestResult {
  name: string;
  check: Record<string, unknown>;
  passed: boolean;
  actual: string;
  message?: string;
}

interface ProjectTestRun {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  durationMs: number;
  results: ProjectTestResult[];
  ranAt: Date;
  error?: string;
}

interface ProjectScreenshot {
  viewport: 'desktop' | 'mobile';
  width: number;
  height: number;
  dataUrl: string;
}

interface ProjectScreenshotSet {
  desktop?: ProjectScreenshot;
  mobile?: ProjectScreenshot;
  error?: string;
}

export interface ProjectSubmissionDocument extends Document {
  userId: string;
  projectId: string;
  attemptNumber: number;
  files: SubmissionFile[];
  status: ProjectSubmissionStatus;
  submittedAt: Date;
  notes?: string;

  testRun?: ProjectTestRun;
  screenshots?: ProjectScreenshotSet;

  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<SubmissionFile>(
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

/**
 * The test run is a snapshot of a run performed client-side. We store
 * it as-is; the server does not re-run the tests.
 *
 * `check` is a Mixed field because its shape depends on the test type
 * — the client already validated it when producing the run.
 */
const testResultSchema = new Schema<ProjectTestResult>(
  {
    name: { type: String, required: true },
    check: { type: Schema.Types.Mixed, required: true },
    passed: { type: Boolean, required: true },
    actual: { type: String, required: true },
    message: { type: String },
  },
  { _id: false }
);

const testRunSchema = new Schema<ProjectTestRun>(
  {
    totalTests: { type: Number, required: true, min: 0 },
    passedTests: { type: Number, required: true, min: 0 },
    failedTests: { type: Number, required: true, min: 0 },
    allPassed: { type: Boolean, required: true },
    durationMs: { type: Number, required: true, min: 0 },
    results: { type: [testResultSchema], default: [] },
    ranAt: { type: Date, required: true },
    error: { type: String },
  },
  { _id: false }
);

const screenshotSchema = new Schema<ProjectScreenshot>(
  {
    viewport: {
      type: String,
      enum: ['desktop', 'mobile'],
      required: true,
    },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    dataUrl: { type: String, required: true },
  },
  { _id: false }
);

const screenshotSetSchema = new Schema<ProjectScreenshotSet>(
  {
    desktop: { type: screenshotSchema, default: undefined },
    mobile: { type: screenshotSchema, default: undefined },
    error: { type: String },
  },
  { _id: false }
);

const submissionSchema = new Schema<ProjectSubmissionDocument>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    files: { type: [fileSchema], default: [] },
    status: {
      type: String,
      enum: [
        'submitted',
        'ai_evaluated',
        'instructor_reviewed',
        'passed',
        'needs_improvement',
        'resubmission_requested',
      ],
      default: 'submitted',
      index: true,
    },
    submittedAt: { type: Date, required: true },
    notes: { type: String, maxlength: 2000, default: undefined },
    testRun: { type: testRunSchema, default: undefined },
    screenshots: { type: screenshotSetSchema, default: undefined },
  },
  { timestamps: true }
);

submissionSchema.index(
  { userId: 1, projectId: 1, attemptNumber: 1 },
  { unique: true }
);

submissionSchema.index({ userId: 1, projectId: 1, attemptNumber: -1 });

submissionSchema.index({ projectId: 1, submittedAt: -1 });

export const ProjectSubmission = mongoose.model<ProjectSubmissionDocument>(
  'ProjectSubmission',
  submissionSchema
);