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
  testCases: { input: string; expectedOutput: string }[];
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

    const testCases = problem.testCases.map((tc, i) => ({
      index: i,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

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