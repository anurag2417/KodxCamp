import { Problem } from '../models/Problem.model.js';
import { Submission } from '../models/Submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';

const XP_BY_DIFFICULTY = { easy: 10, medium: 25, hard: 50 } as const;

export interface VisibleResult {
  index: number;
  passed: boolean;
}

export interface HiddenResult {
  id: string;
  passed: boolean;
}

interface RecordSubmissionInput {
  userId: string;
  problemId: string;
  language: string;
  code: string;
  sessionId?: string;
  visibleResults?: VisibleResult[];
  hiddenResults?: HiddenResult[];
  runtimeMs?: number;

  // ─── Legacy fields ──────────────────────────────────────────
  //
  // Older clients (and the seed fixtures) still send `passedTests`
  // and `totalTests`. We honour them if the structured fields are
  // absent, but they cannot award XP if hidden tests exist on the
  // problem, because the client-supplied counts don't prove hidden
  // tests ran.
  status?: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';
  passedTests?: number;
  totalTests?: number;
}

export const judgeService = {
  /**
   * Record a submission.
   *
   * The server does NOT execute student code. Hidden tests are hashed
   * and compared on the client (see the project brief §4.3.1). This
   * service therefore validates the *shape* of the client's report —
   * that every hidden test id exists, that the count matches, and that
   * no test outputs were smuggled through — and then records a
   * submission accordingly.
   *
   * It does NOT verify that a `passed: true` for a hidden test is
   * truthful. A modified client can lie. Server-side judging is
   * tracked as future work in the brief §9.
   */
  async recordSubmission(input: RecordSubmissionInput) {
    const problem = await Problem.findById(input.problemId);
    if (!problem) throw new ApiError(404, 'Problem not found');

    // Split the problem's test cases into visible/hidden, with the
    // hidden ids computed exactly as the client does.
    const visibleCount = problem.testCases.filter((tc) => !tc.isHidden).length;
    const hiddenIds: string[] = [];
    problem.testCases.forEach((tc, i) => {
      if (tc.isHidden) hiddenIds.push(`${problem._id}:${i}`);
    });
    const hiddenCount = hiddenIds.length;

    // ─── Determine pass counts and status ─────────────────────
    let visiblePassed: number;
    let hiddenPassed: number;
    let status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';

    if (input.visibleResults || input.hiddenResults) {
      // Structured path — validate shapes.
      const visibleResults = input.visibleResults ?? [];
      const hiddenResults = input.hiddenResults ?? [];

      // 1. Every hidden id the server expects must be present, and no
      //    extra ids may be sent. This stops "submit only the ones I
      //    passed" and random-id injection.
      if (hiddenResults.length !== hiddenCount) {
        throw new ApiError(
          400,
          `Expected ${hiddenCount} hidden results, got ${hiddenResults.length}`
        );
      }
      const reportedHiddenIds = new Set(hiddenResults.map((h) => h.id));
      if (reportedHiddenIds.size !== hiddenCount) {
        throw new ApiError(400, 'Duplicate hidden test ids in submission');
      }
      for (const id of hiddenIds) {
        if (!reportedHiddenIds.has(id)) {
          throw new ApiError(400, `Missing hidden result: ${id}`);
        }
      }

      // 2. Every visible result must reference a valid index.
      for (const v of visibleResults) {
        if (v.index < 0 || v.index >= visibleCount) {
          throw new ApiError(400, `Invalid visible test index: ${v.index}`);
        }
      }
      if (visibleResults.length !== visibleCount) {
        throw new ApiError(
          400,
          `Expected ${visibleCount} visible results, got ${visibleResults.length}`
        );
      }

      visiblePassed = visibleResults.filter((v) => v.passed).length;
      hiddenPassed = hiddenResults.filter((h) => h.passed).length;

      const allVisiblePassed = visiblePassed === visibleCount;
      const allHiddenPassed = hiddenPassed === hiddenCount;

      if (hiddenCount > 0) {
        // If the problem has hidden tests, ALL of them must pass for
        // the submission to be accepted. This matches the visible-test
        // semantics and prevents partial-credit gaming.
        status = allHiddenPassed && allVisiblePassed ? 'accepted' : 'wrong_answer';
      } else {
        status = allVisiblePassed ? 'accepted' : 'wrong_answer';
      }
    } else {
      // Legacy path — no structured fields. Honour the counts but
      // never award XP when the problem has hidden tests, because the
      // client hasn't proven those ran.
      const legacyPassed = Math.max(0, input.passedTests ?? 0);
      const legacyTotal = Math.max(0, input.totalTests ?? 0);
      const clampedTotal = Math.min(legacyTotal, visibleCount + hiddenCount);
      const clampedPassed = Math.min(legacyPassed, clampedTotal);

      visiblePassed = clampedPassed;
      hiddenPassed = 0;

      if (
        input.status === 'runtime_error' ||
        input.status === 'compile_error'
      ) {
        status = input.status;
      } else {
        status =
          clampedPassed === visibleCount + hiddenCount &&
          visibleCount + hiddenCount > 0
            ? 'accepted'
            : 'wrong_answer';
      }

      // If the problem has hidden tests and the client used the legacy
      // path, override to wrong_answer — the client can't prove hidden
      // tests ran. This closes the "old client bypasses hidden tests"
      // hole.
      if (hiddenCount > 0) {
        status = 'wrong_answer';
      }
    }

    const totalTests = visibleCount + hiddenCount;
    const passedTests = visiblePassed + hiddenPassed;

    const submission = await Submission.create({
      userId: input.userId,
      problemId: input.problemId,
      language: input.language,
      code: input.code,
      status,
      passedTests,
      totalTests,
      runtimeMs: input.runtimeMs,
      sessionId: input.sessionId,
      hiddenResults: input.hiddenResults,
    });

    // ─── XP + activity ────────────────────────────────────────
    if (status === 'accepted') {
      const priorAccepted = await Submission.countDocuments({
        userId: input.userId,
        problemId: input.problemId,
        status: 'accepted',
        _id: { $ne: submission._id },
      });

      const isFirstAccept = priorAccepted === 0;
      const xp = isFirstAccept
        ? XP_BY_DIFFICULTY[
            problem.difficulty as keyof typeof XP_BY_DIFFICULTY
          ] ?? 10
        : 0;

      if (isFirstAccept) {
        await activityService.record({
          userId: input.userId,
          type: 'problem_solved',
          refId: input.problemId,
          xp,
        });
      }
    } else {
      await activityService.record({
        userId: input.userId,
        type: 'problem_attempted',
        refId: input.problemId,
        xp: 0,
      });
    }

    return submission.toObject();
  },

  async listForUser(userId: string, problemId: string) {
    return Submission.find({ userId, problemId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  },

  async getSolvedProblemIds(userId: string) {
    const results = await Submission.distinct('problemId', {
      userId,
      status: 'accepted',
    });
    return results as string[];
  },

  /**
   * @deprecated — kept for backwards compatibility with the older
   * client. Returns a computed status from the client's reported
   * booleans without any validation. Do not use in new code.
   */
  async validateResults(input: {
    problemId: string;
    reportedResults: { index: number; passed: boolean }[];
  }) {
    const problem = await Problem.findById(input.problemId).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    const totalTests = problem.testCases.length;
    const passedCount = input.reportedResults.filter((r) => r.passed).length;
    const status = passedCount === totalTests ? 'accepted' : 'wrong_answer';

    return { status, passedCount, totalTests };
  },
};