/**
 * Instructor evaluation of a project submission.
 *
 * Master Spec, section 22:
 *   "Automated tests + browser screenshots + AI + instructor review
 *    + resubmission, all versioned and preserved."
 *
 * And section 24:
 *   "The AI evaluation is never the final say. The instructor's
 *    review is what determines a submission's status. The AI score
 *    is context, not authority."
 *
 * An `InstructorEvaluation` is a human's judgment of a submission.
 * It lives in its own collection, alongside `AIEvaluation`, never
 * merged into a single score.
 *
 * KEYING: one row per
 * `(submissionId, instructorId, revisionNumber)`.
 *
 *   - The first review by instructor X on submission S is revision 1.
 *   - If X re-reviews S, the new review is revision 2. The revision 1
 *     row survives untouched.
 *   - If a second instructor Y reviews S, that's Y's revision 1.
 *     Both X's and Y's rows coexist.
 *
 * The natural key is a triple, enforced by a unique index. The full
 * review history is preserved for every submission.
 */

/**
 * The status an instructor assigns to a submission.
 *
 *   - `passed`                 — the submission meets the bar.
 *   - `needs_improvement`      — the student should revise but is not
 *                                required to resubmit.
 *   - `resubmission_requested` — the student must submit a new attempt.
 *
 * This status is what `ProjectSubmission.status` is set to when the
 * instructor saves their review. The AI's opinion never sets this
 * field directly — only the instructor's review does.
 */
export type InstructorEvaluationStatus =
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

/**
 * A per-category score override on top of the AI's rubric score.
 *
 * The instructor may accept every AI category score, adjust a few,
 * or override all of them. This array records only the categories
 * where the instructor's value differs from the AI's — an empty
 * array means "the instructor accepted the AI's category scores
 * as-is".
 */
export interface IInstructorCategoryOverride {
  /** Must match a rubric category name exactly. */
  category: string;
  /** The instructor's score for this category. */
  score: number;
  /** The instructor's note on why the score was adjusted. */
  note?: string;
}

export interface IInstructorEvaluation {
  _id: string;

  submissionId: string;
  projectId: string;
  instructorId: string;

  /**
   * Which review of this submission by this instructor this is.
   * Starts at 1. A re-review by the same instructor increments it.
   */
  revisionNumber: number;

  /**
   * The instructor's final score for this submission, 0–100.
   *
   * The client prefills this from the AI evaluation, but the stored
   * value is the instructor's. `AIEvaluation` is never mutated.
   */
  finalScore: number;

  /**
   * Only the categories where the instructor disagreed with the AI.
   * Empty means "accepted the AI's category scores".
   */
  categoryOverrides: IInstructorCategoryOverride[];

  /**
   * Free-form feedback addressed to the student. Markdown is not
   * supported; line breaks are preserved.
   */
  feedback: string;

  /** Whether the instructor is requiring a new attempt. */
  requestResubmission: boolean;

  /** The status the instructor assigned. */
  status: InstructorEvaluationStatus;

  evaluationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A summary view of a review for list endpoints. Carries what the
 * instructor list page needs without the full feedback text.
 */
export interface IInstructorEvaluationSummary {
  _id: string;
  submissionId: string;
  instructorId: string;
  instructorName: string;
  revisionNumber: number;
  finalScore: number;
  status: InstructorEvaluationStatus;
  requestResubmission: boolean;
  evaluationDate: Date;
}