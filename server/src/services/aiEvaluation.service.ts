import { z } from 'zod';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { Project } from '../models/Project.model.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { aiProviderRegistry } from './aiProvider/registry.js';
import {
  buildCodeEvaluationPrompt,
  buildVisionEvaluationPrompt,
  type PromptVersion,
} from './aiEvaluationPrompt.service.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * AI project evaluation service.
 *
 * Master Spec, section 22:
 *   "Project-specific AI evaluation — never generic, only against
 *    instructor-defined requirements + rubric."
 *
 * And section 23:
 *   "Automated tests + browser screenshots + AI + instructor review
 *    + resubmission, all versioned and preserved."
 *
 * This service orchestrates two independent evaluation passes per
 * submission:
 *
 *   CODE   — the student's source files against the specification,
 *            rubric, and automated test results. Text-only model.
 *
 *   VISION — the rendered screenshots against the design and
 *            accessibility requirements. Vision-capable model.
 *
 * The passes are independent. Each produces its own `AIEvaluation`
 * row. Neither overwrites the other, and neither overwrites the
 * instructor's score (which lands in a separate model in Batch 9).
 *
 * The pipeline is admin-triggered, not automatic. Running evaluation
 * costs real money on real APIs, so a human decides when to run it.
 */

export const EVALUATOR_VERSION = 'v1';
export const PROMPT_VERSION: PromptVersion = 'v1';

/* ─── Response validation ────────────────────────────────────────── */

/**
 * The shape every AI evaluation response must match, after parsing
 * the model's JSON output. Enforced here so the `parsed` field on
 * the `AIEvaluation` row is guaranteed to be well-formed — anything
 * that fails validation is stored as `parseError` with the raw text
 * preserved.
 *
 * The prompts ask for this exact shape; the schema exists because
 * "the model will comply" is not a contract.
 */
const categoryScoreSchema = z.object({
  category: z.string().min(1),
  score: z.number().min(0),
  max: z.number().min(0),
  notes: z.string(),
});

const requirementResultSchema = z.object({
  requirement: z.string().min(1),
  met: z.boolean(),
  evidence: z.string(),
});

const evaluationResponseSchema = z.object({
  score: z.number().min(0).max(100).nullable(),
  categoryScores: z.array(categoryScoreSchema),
  requirementResults: z.array(requirementResultSchema),
  overallFeedback: z.string(),
  evaluatorNotConfigured: z.boolean().optional(),
});

type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;

/* ─── Service ────────────────────────────────────────────────────── */

export const aiEvaluationService = {
  /**
   * Run every configured evaluation pass for a submission.
   *
   * Returns the rows that were created. A submission with only a
   * text provider configured produces one row. A submission with
   * both produces two. A submission with no provider configured
   * produces one row from the `NullProvider` — a "not configured"
   * message that the admin UI renders honestly.
   *
   * Throws only when the submission or project cannot be loaded, or
   * when the project has no rubric (nothing to score against). Every
   * other failure is recorded on the row, not thrown — an API outage
   * must not lose the fact that an evaluation was attempted.
   */
  async evaluateSubmission(input: {
    submissionId: string;
    evaluatedBy: string;
  }): Promise<{ evaluations: unknown[] }> {
    const submission = await ProjectSubmission.findById(
      input.submissionId,
    ).lean();
    if (!submission) throw new ApiError(404, 'Submission not found');

    const project = await Project.findById(submission.projectId).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    if (!project.rubric || project.rubric.length === 0) {
      throw new ApiError(
        400,
        'This project has no rubric. AI evaluation needs a rubric to score against.',
      );
    }

    const created: unknown[] = [];

    // ─── Pass 1: code ──────────────────────────────────────────
    const codeRow = await this.runPass({
      kind: 'code',
      submission,
      project,
      evaluatedBy: input.evaluatedBy,
      buildPrompt: () =>
        buildCodeEvaluationPrompt({
          project,
          submission,
          promptVersion: PROMPT_VERSION,
        }),
    });
    created.push(codeRow);

    // ─── Pass 2: vision (only when screenshots exist) ──────────
    const hasScreenshots =
      Boolean(submission.screenshots?.desktop) ||
      Boolean(submission.screenshots?.mobile);

    if (hasScreenshots) {
      const visionProvider = aiProviderRegistry.getVisionProvider();
      if (visionProvider) {
        const visionRow = await this.runPass({
          kind: 'vision',
          submission,
          project,
          evaluatedBy: input.evaluatedBy,
          buildPrompt: () =>
            buildVisionEvaluationPrompt({
              project,
              submission,
              promptVersion: PROMPT_VERSION,
            }),
        });
        created.push(visionRow);
      } else {
        logger.info(
          'Vision evaluation skipped: no vision provider configured',
          { submissionId: input.submissionId },
        );
      }
    } else {
      logger.info(
        'Vision evaluation skipped: submission has no screenshots',
        { submissionId: input.submissionId },
      );
    }

    // Flip the submission status to ai_evaluated so the UI can
    // reflect that at least one pass has run.
    await ProjectSubmission.updateOne(
      { _id: submission._id },
      { $set: { status: 'ai_evaluated' } },
    );

    return { evaluations: created };
  },

  /**
   * Run one evaluation pass — code or vision — and persist the
   * result. The shared shape between the two passes is exactly what
   * matters: get a provider, build the prompt, call the model, parse
   * the JSON, write a row.
   */
  async runPass(input: {
    kind: 'code' | 'vision';
    submission: {
      _id: unknown;
      userId: string;
      projectId: string;
      files: { name: string; language: string; content: string }[];
      testRun?: unknown;
      screenshots?: unknown;
    };
    project: {
      _id: unknown;
      title: string;
      specification?: unknown;
      rubric?: unknown;
    };
    evaluatedBy: string;
    buildPrompt: () => import('./aiProvider/types.js').AIMessage[];
  }): Promise<unknown> {
    const provider =
      input.kind === 'vision'
        ? aiProviderRegistry.getVisionProvider()
        : aiProviderRegistry.getTextProvider();

    if (!provider) {
      throw new ApiError(
        500,
        'No vision provider is configured. This is a server bug — the caller should have checked before calling runPass.',
      );
    }

    const messages = input.buildPrompt();

    let rawText = '';
    let modelUsed = provider.model;
    let usedImages = false;
    let callError: string | undefined;

    try {
      const response = await provider.chat({
        messages,
        temperature: env.AI_TEMPERATURE,
        maxTokens: env.AI_MAX_TOKENS,
        responseFormat: { type: 'json_object' },
      });
      rawText = response.text;
      modelUsed = response.model;
      usedImages = response.usedImages;
    } catch (err) {
      callError = err instanceof Error ? err.message : String(err);
      rawText = '';
      logger.error('AI provider call failed', {
        kind: input.kind,
        provider: provider.name,
        submissionId: String(input.submission._id),
        error: callError,
      });
    }

    // Parse and validate the response.
    let parsed: EvaluationResponse | null = null;
    let parseError: string | undefined = callError;

    if (!parseError && rawText) {
      try {
        const asJson = JSON.parse(rawText);
        const result = evaluationResponseSchema.safeParse(asJson);
        if (result.success) {
          parsed = result.data;
        } else {
          parseError =
            'Response did not match the expected shape: ' +
            result.error.issues
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ');
        }
      } catch (err) {
        parseError =
          'Response was not valid JSON: ' +
          (err instanceof Error ? err.message : String(err));
      }
    }

    // The raw response must be preserved. When the model returned
    // nothing (a failed call), record a placeholder so the field
    // stays populated — the error is in `parseError`.
    const rawResponseToStore = rawText || `(no response: ${callError})`;

    const doc = await AIEvaluation.create({
      submissionId: String(input.submission._id),
      projectId: String(input.project._id),
      userId: input.submission.userId,
      kind: input.kind,

      evaluatorVersion: EVALUATOR_VERSION,
      promptVersion: PROMPT_VERSION,
      provider: provider.name,
      modelId: modelUsed,
      usedImages,
      evaluationDate: new Date(),

      projectVersion: null,

      rawResponse: rawResponseToStore,
      parseError,
      parsed: parsed ?? undefined,

      evaluatedBy: input.evaluatedBy,
    });

    return doc.toObject();
  },
};