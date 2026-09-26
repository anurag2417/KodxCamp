import mongoose, { Schema, type Document } from 'mongoose';

/**
 * AI evaluation of a project submission.
 *
 * One row per `(submissionId, kind, evaluatorVersion, promptVersion)`.
 * `kind` distinguishes the code pass from the vision pass — they are
 * separate evaluations and never overwrite each other.
 *
 * Every row carries the full provenance needed to reproduce or audit
 * the evaluation:
 *
 *   evaluatorVersion  — the pipeline's logic version (bumped when the
 *                       service changes how it prompts or parses)
 *   promptVersion     — the template's version (bumped when the
 *                       wording of the prompt changes)
 *   provider          — the provider adapter, e.g. `'groq'` or `'null'`
 *   modelId           — the exact model identifier, e.g.
 *                       `'openai/gpt-oss-120b'`. Named `modelId`
 *                       rather than `model` because Mongoose's
 *                       `Document` already has a `model(name)`
 *                       method, and a `model: string` field would
 *                       collide with it.
 *   usedImages        — whether the model actually saw images
 *   evaluationDate    — when the call was made
 *   projectVersion    — reserved for pinning to an immutable project
 *                       snapshot; `null` for now
 *   rawResponse       — the model's verbatim text output
 *   parsed            — the structured result, when parsing succeeded
 *   parseError        — populated when parsing failed
 *
 * The `parsed` field's shape is the evaluator's contract:
 *
 *   {
 *     score: number | null,          // 0–100, null when unconfigured
 *     categoryScores: [{ category, score, max, notes }],
 *     requirementResults: [{ requirement, met, evidence }],
 *     overallFeedback: string,
 *   }
 *
 * The server does NOT enforce this shape at the schema level —
 * `parsed` is `Mixed`. The evaluation service validates the shape
 * with Zod before writing, and stores `parseError` (not a rejection)
 * when the model returns something malformed, so the raw response is
 * preserved for debugging.
 */
export interface AIEvaluationDocument extends Document {
  submissionId: string;
  projectId: string;
  userId: string;
  kind: 'code' | 'vision';

  evaluatorVersion: string;
  promptVersion: string;
  provider: string;
  /** The model identifier, e.g. `'openai/gpt-oss-120b'`. */
  modelId: string;
  usedImages: boolean;
  evaluationDate: Date;

  projectVersion: string | null;

  rawResponse: string;
  parseError?: string;
  parsed?: Record<string, unknown>;

  evaluatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiEvaluationSchema = new Schema<AIEvaluationDocument>(
  {
    submissionId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ['code', 'vision'],
      required: true,
      index: true,
    },

    evaluatorVersion: { type: String, required: true },
    promptVersion: { type: String, required: true },
    provider: { type: String, required: true },
    modelId: { type: String, required: true },
    usedImages: { type: Boolean, default: false },
    evaluationDate: { type: Date, required: true, index: true },

    projectVersion: { type: String, default: null },

    rawResponse: { type: String, required: true },
    parseError: { type: String },
    parsed: { type: Schema.Types.Mixed, default: undefined },

    evaluatedBy: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

/**
 * The natural uniqueness key: one evaluation of a given kind, under
 * a given pipeline version and prompt version, for a given
 * submission. Re-evaluating with the same versions is idempotent;
 * bumping either version produces a new row alongside the old one.
 */
aiEvaluationSchema.index(
  {
    submissionId: 1,
    kind: 1,
    evaluatorVersion: 1,
    promptVersion: 1,
  },
  { unique: true },
);

/**
 * Fast lookup for the admin list view: all evaluations of a
 * submission, newest first.
 */
aiEvaluationSchema.index({ submissionId: 1, kind: 1, evaluationDate: -1 });

export const AIEvaluation = mongoose.model<AIEvaluationDocument>(
  'AIEvaluation',
  aiEvaluationSchema,
);