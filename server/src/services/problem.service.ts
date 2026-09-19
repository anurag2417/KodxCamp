import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';

interface ProblemInput {
  number?: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string }[];
}

async function nextProblemNumber(): Promise<number> {
  const last = await Problem.findOne()
    .sort({ number: -1 })
    .select('number')
    .lean();
  return (last?.number ?? 0) + 1;
}

export const problemService = {
  async list(userId?: string) {
    const problems = await Problem.find()
      .select('-testCases -starterCode -statement')
      .sort({ number: 1 })
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
      number: problem.number ?? 0,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      topics: problem.topics,
      statement: problem.statement,
      // Defaults for backwards-compat with pre-Batch-A problems
      functionName: problem.functionName ?? 'solve',
      outputMode: problem.outputMode ?? 'print',
      starterCode: problem.starterCode,
      testCases,
      solved: solvedIds.includes(problem._id.toString()),
    };
  },

  // ─── Admin: full problem (with all test data) ─────
  async getFullBySlug(slug: string) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');
    return {
      ...problem,
      number: problem.number ?? 0,
      functionName: problem.functionName ?? 'solve',
      outputMode: problem.outputMode ?? 'print',
    };
  },

  async createProblem(input: ProblemInput) {
    const exists = await Problem.findOne({ slug: input.slug }).lean();
    if (exists) throw new ApiError(409, 'Slug already exists');

    // Assign or validate the problem number
    let number = input.number;
    if (number === undefined) {
      number = await nextProblemNumber();
    } else {
      const clash = await Problem.findOne({ number }).lean();
      if (clash) {
        throw new ApiError(
          409,
          `Problem number ${number} is already used by "${clash.title}"`
        );
      }
    }

    const created = await Problem.create({ ...input, number });
    return created.toObject();
  },

  async updateProblem(slug: string, patch: Partial<ProblemInput>) {
    if (patch.slug && patch.slug !== slug) {
      const collision = await Problem.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    // Number change requires uniqueness check
    if (patch.number !== undefined) {
      const existing = await Problem.findOne({ slug }).lean();
      if (!existing) throw new ApiError(404, 'Problem not found');

      if (patch.number !== existing.number) {
        const clash = await Problem.findOne({ number: patch.number }).lean();
        if (clash && clash._id.toString() !== existing._id.toString()) {
          throw new ApiError(
            409,
            `Problem number ${patch.number} is already used by "${clash.title}"`
          );
        }
      }
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