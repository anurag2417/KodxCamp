import crypto from 'node:crypto';
import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';

type CanonicalizationId =
  | 'trim-trailing-newline'
  | 'trim'
  | 'normalize-whitespace';

function canonicalizeOutput(value: string, mode: CanonicalizationId): string {
  switch (mode) {
    case 'trim-trailing-newline':
      return value.replace(/\r?\n$/, '');
    case 'trim':
      return value.trim();
    case 'normalize-whitespace':
      return value.trim().replace(/\s+/g, ' ');
    default:
      return value;
  }
}

interface TestCaseInput {
  input: string;
  isHidden: boolean;
  expectedOutput?: string;
  expectedOutputHash?: string;
  canonicalization?: CanonicalizationId;
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

/**
 * Normalize an incoming test case.
 *
 * Hidden tests must arrive with an `expectedOutputHash` (the admin UI
 * computes it from the plaintext via `hashExpectedOutput` before
 * posting). If somehow a plaintext expectedOutput reaches a hidden
 * test, we refuse rather than store it.
 */
function normalizeTestCase(
  tc: TestCaseInput,
  index: number
): {
  input: string;
  isHidden: boolean;
  expectedOutput?: string;
  expectedOutputHash?: string;
  canonicalization?: CanonicalizationId;
} {
  if (tc.isHidden) {
    if (!tc.expectedOutputHash) {
      throw new ApiError(
        400,
        `Test case #${index + 1}: hidden tests require expectedOutputHash`
      );
    }
    return {
      input: tc.input ?? '',
      isHidden: true,
      expectedOutputHash: tc.expectedOutputHash,
      canonicalization: tc.canonicalization ?? 'trim-trailing-newline',
    };
  }

  if (!tc.expectedOutput) {
    throw new ApiError(
      400,
      `Test case #${index + 1}: visible tests require expectedOutput`
    );
  }
  return {
    input: tc.input ?? '',
    isHidden: false,
    expectedOutput: tc.expectedOutput,
  };
}

/**
 * Hash a plaintext expected output. Used by the migration script and by
 * admin tooling that computes the hash before saving. Not exposed via
 * the API — the client should never send plaintext for hidden tests.
 */
export function hashExpectedOutput(
  plaintext: string,
  canonicalization: CanonicalizationId = 'trim-trailing-newline'
): string {
  const canon = canonicalizeOutput(plaintext, canonicalization);
  return crypto.createHash('sha256').update(canon).digest('hex');
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

  /**
   * Public problem view — for students.
   *
   * Splits test cases into visible (plaintext) and hidden (hashed).
   * Generates a fresh per-request session salt for the client to use
   * when hashing. The salt is NOT persisted anywhere.
   */
  async getBySlug(slug: string, userId?: string) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    const visibleTestCases: {
      index: number;
      input: string;
      expectedOutput: string;
    }[] = [];
    const hiddenTestCases: {
      id: string;
      input: string;
      expectedOutputHash: string;
      canonicalization: CanonicalizationId;
    }[] = [];

    problem.testCases.forEach((tc, i) => {
      if (tc.isHidden) {
        if (!tc.expectedOutputHash) return; // skip malformed
        hiddenTestCases.push({
          id: `${problem._id}:${i}`,
          input: tc.input ?? '',
          expectedOutputHash: tc.expectedOutputHash,
          canonicalization:
            (tc.canonicalization as CanonicalizationId) ??
            'trim-trailing-newline',
        });
      } else {
        visibleTestCases.push({
          index: visibleTestCases.length,
          input: tc.input ?? '',
          expectedOutput: tc.expectedOutput ?? '',
        });
      }
    });

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
      testCases: visibleTestCases,
      hiddenTestCases,
      sessionSalt: crypto.randomUUID(),
      solved: solvedIds.includes(problem._id.toString()),
    };
  },

  /**
   * Admin view — includes every test case in raw form. Hidden tests
   * are returned as-is (hash only) so the admin editor can display and
   * re-save them without recomputing.
   */
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
      update.testCases = patch.testCases.map((tc, i) => normalizeTestCase(tc, i));
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