import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';

interface ProblemInput {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

interface PublicTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface PublicVisibleTestCase extends PublicTestCase {
  isHidden: false;
}

interface PublicHiddenTestCase extends PublicTestCase {
  isHidden: true;
}

export const problemService = {
  async list(userId?: string) {
    const problems = await Problem.find()
      .select('-testCases -starterCode -statement')
      .sort({ difficulty: 1, createdAt: 1 })
      .lean();

    const solvedIds = userId ? await judgeService.getSolvedProblemIds(userId) : [];

    return problems.map((p) => ({
      ...p,
      solved: solvedIds.includes(p._id.toString()),
    }));
  },

  /**
   * Public problem payload.
   *
   * SECURITY: We only ship `input` and `expectedOutput` for VISIBLE test cases.
   * Hidden cases are returned as placeholders `{ index, isHidden: true }` with
   * empty input/output. The client should run only the visible ones.
   *
   * Real judging against hidden cases must happen server-side. Until that
   * exists, hidden tests are labeled honestly in the UI as "additional tests
   * checked on submit" — but the client CANNOT see them.
   */
  async getBySlug(slug: string, userId?: string) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    const testCases: PublicTestCase[] = problem.testCases.map(
      (tc: ProblemInput['testCases'][number], i: number): PublicVisibleTestCase | PublicHiddenTestCase =>
        tc.isHidden
          ? {
              index: i,
              input: '',
              expectedOutput: '',
              isHidden: true,
            }
          : {
              index: i,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: false,
            }
    );

    const solvedIds = userId ? await judgeService.getSolvedProblemIds(userId) : [];

    return {
      _id: problem._id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      topics: problem.topics,
      statement: problem.statement,
      starterCode: problem.starterCode,
      testCases,
      solved: solvedIds.includes(problem._id.toString()),
    };
  },

  // ─── Admin ────────────────────────────────────────
  async getFullBySlug(slug: string) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');
    return problem;
  },

  async createProblem(input: ProblemInput) {
    const exists = await Problem.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');
    const created = await Problem.create(input);
    return created.toObject();
  },

  async updateProblem(slug: string, patch: Partial<ProblemInput>) {
    if (patch.slug && patch.slug !== slug) {
      const collision = await Problem.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    const updated = await Problem.findOneAndUpdate({ slug }, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new ApiError(404, 'Problem not found');
    return updated;
  },

  async deleteProblem(slug: string) {
    const result = await Problem.deleteOne({ slug });
    if (result.deletedCount === 0) throw new ApiError(404, 'Problem not found');
    return { ok: true };
  },
};