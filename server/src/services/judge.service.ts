import { Problem } from '../models/Problem.model.js';
import { Submission } from '../models/Submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';

const XP_BY_DIFFICULTY = { easy: 10, medium: 25, hard: 50 } as const;

interface RecordSubmissionInput {
  userId: string;
  problemId: string;
  language: string;
  code: string;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
}

export const judgeService = {
  /**
   * Record a submission.
   *
   * v1 (current): the server does NOT execute code. The browser runs
   * the visible tests (and, per §4.3.1, the hidden tests via hashing)
   * and reports pass/fail counts. We accept the counts as an honor-system
   * self-report, clamp them to the problem's actual test-case count, and
   * award XP only once per (user, problem).
   *
   * v2 (future): run the code server-side against hidden test cases
   * before accepting. Tracked as "Secure server-side code judging" in
   * the brief's §9.
   */
  async recordSubmission(input: RecordSubmissionInput) {
    const problem = await Problem.findById(input.problemId);
    if (!problem) throw new ApiError(404, 'Problem not found');

    const serverTotal = problem.testCases.length;
    const totalTests = Math.min(input.totalTests, serverTotal);
    const passedTests = Math.max(0, Math.min(input.passedTests, totalTests));

    const computedStatus: RecordSubmissionInput['status'] =
      passedTests === serverTotal && serverTotal > 0
        ? 'accepted'
        : input.status === 'runtime_error' || input.status === 'compile_error'
          ? input.status
          : 'wrong_answer';

    const submission = await Submission.create({
      userId: input.userId,
      problemId: input.problemId,
      language: input.language,
      code: input.code,
      status: computedStatus,
      passedTests,
      totalTests: serverTotal,
      runtimeMs: input.runtimeMs,
    });

    if (computedStatus === 'accepted') {
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
   * @deprecated
   *
   * Previously used to "verify" client-reported results against an HMAC
   * of hidden test inputs. That provided no real protection because the
   * client already had the inputs, and the results themselves were
   * unverified.
   *
   * Kept as a no-op stub so existing client code doesn't 404 while we
   * migrate. Returns a computed status from the reported pass count.
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