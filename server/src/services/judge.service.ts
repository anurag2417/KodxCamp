import { Problem } from '../models/Problem.model.js';
import { Submission } from '../models/Submission.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verify } from '../utils/hmac.js';
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
  async recordSubmission(input: RecordSubmissionInput) {
    const problem = await Problem.findById(input.problemId);
    if (!problem) throw new ApiError(404, 'Problem not found');

    const submission = await Submission.create(input);

    if (input.status === 'accepted') {
      const priorAccepted = await Submission.countDocuments({
        userId: input.userId,
        problemId: input.problemId,
        status: 'accepted',
        _id: { $ne: submission._id },
      });

      const isFirstAccept = priorAccepted === 0;
      const xp = isFirstAccept ? XP_BY_DIFFICULTY[problem.difficulty] ?? 10 : 0;

      await activityService.record({
        userId: input.userId,
        type: 'problem_solved',
        refId: input.problemId,
        xp,
      });
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

  async validateResults(input: {
    problemId: string;
    reportedResults: { index: number; passed: boolean }[];
    hiddenSignature: string;
  }) {
    const problem = await Problem.findById(input.problemId).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    const hiddenInputs = problem.testCases
      .map((tc, i) => ({ index: i, input: tc.input, isHidden: tc.isHidden }))
      .filter((t) => t.isHidden);

    if (!verify(hiddenInputs, input.hiddenSignature)) {
      throw new ApiError(400, 'Invalid test signature — results rejected');
    }

    const totalTests = problem.testCases.length;
    const reportedCount = input.reportedResults.length;

    if (reportedCount !== totalTests) {
      throw new ApiError(
        400,
        `Reported ${reportedCount} test results, expected ${totalTests}`
      );
    }

    const seen = new Set<number>();
    for (const r of input.reportedResults) {
      if (r.index < 0 || r.index >= totalTests) {
        throw new ApiError(400, 'Invalid test index in results');
      }
      if (seen.has(r.index)) {
        throw new ApiError(400, 'Duplicate test index in results');
      }
      seen.add(r.index);
    }

    const passedCount = input.reportedResults.filter((r) => r.passed).length;
    const status = passedCount === totalTests ? 'accepted' : 'wrong_answer';

    return { status, passedCount, totalTests };
  },
};