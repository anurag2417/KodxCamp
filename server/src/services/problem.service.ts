import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';
import { sign } from '../utils/hmac.js';

interface ProblemInput {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
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

  async getBySlug(slug: string, userId?: string) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    const visible = problem.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc, i) => ({
        index: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: false,
      }));

    const hiddenInputs = problem.testCases
      .map((tc, i) => ({ index: i, input: tc.input, isHidden: tc.isHidden }))
      .filter((t) => t.isHidden);

    const hiddenSignature = sign(hiddenInputs);

    const allTests = problem.testCases.map((tc, i) => ({
      index: i,
      input: tc.input,
      expectedOutput: tc.isHidden ? '' : tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

    void visible;

    const solvedIds = userId ? await judgeService.getSolvedProblemIds(userId) : [];

    return {
      ...problem,
      testCases: allTests,
      hiddenSignature,
      solved: solvedIds.includes(problem._id.toString()),
    };
  },

  // ─── Admin: full problem (with hidden data) ─────
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