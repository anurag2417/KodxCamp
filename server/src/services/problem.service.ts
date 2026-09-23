import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

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
  testCases: TestCaseInput[];
}

async function nextProblemNumber(): Promise<number> {
  const last = await Problem.findOne()
    .sort({ number: -1 })
    .select('number')
    .lean();
  return (last?.number ?? 0) + 1;
}

function normalizeTestCase(tc: TestCaseInput, index: number) {
  if (!tc.expectedOutput) {
    throw new ApiError(
      400,
      `Test case #${index + 1}: expectedOutput is required`
    );
  }
  return {
    input: tc.input ?? '',
    expectedOutput: tc.expectedOutput,
    isHidden: Boolean(tc.isHidden),
  };
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
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      isHidden: Boolean(tc.isHidden),
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
      functionName: problem.functionName ?? 'solve',
      outputMode: problem.outputMode ?? 'print',
      starterCode: problem.starterCode,
      testCases,
      solved: solvedIds.includes(problem._id.toString()),
    };
  },

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

    const testCases = input.testCases.map((tc, i) => normalizeTestCase(tc, i));

    const created = await Problem.create({ ...input, number, testCases });
    return created.toObject();
  },

  async updateProblem(slug: string, patch: Partial<ProblemInput>) {
    if (patch.slug && patch.slug !== slug) {
      const collision = await Problem.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

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

    const update: Record<string, unknown> = { ...patch };
    if (patch.testCases) {
      update.testCases = patch.testCases.map((tc, i) =>
        normalizeTestCase(tc, i)
      );
    }

    const updated = await Problem.findOneAndUpdate({ slug }, update, {
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