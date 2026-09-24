import { Problem } from '../models/Problem.model.js';
import { judgeService } from './judge.service.js';
import { ApiError } from '../utils/ApiError.js';
import { validateSqlSetup } from './sqlSetupValidator.js';
import {
  allocateProblemId,
  inferProblemKind,
} from './problemNumber.service.js';

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface ProblemInput {
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  statement: string;
  functionName: string;
  outputMode: 'return' | 'print';
  starterCode: Record<string, string>;
  testCases: TestCaseInput[];
  sqlSetup?: string;
  scope?: 'global' | 'course';
  courseId?: string;
  tier?: 'starter' | 'interview';
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

function normalizeScope(input: {
  scope?: 'global' | 'course';
  courseId?: string;
}): { scope: 'global' | 'course'; courseId?: string } {
  const scope = input.scope ?? 'global';
  if (scope === 'course') {
    if (!input.courseId) {
      throw new ApiError(400, 'courseId is required when scope is "course"');
    }
    return { scope: 'course', courseId: input.courseId };
  }
  return { scope: 'global', courseId: undefined };
}

export const problemService = {
  /**
   * Global catalog. Returns only problems with `scope: 'global'`.
   *
   * `tier` filter is optional. When absent, every global problem is
   * returned. The practice UI will use this to switch between
   * "Starter" and "Interview" tabs.
   */
  async listGlobal(userId: string | undefined, tier?: 'starter' | 'interview') {
    const filter: Record<string, unknown> = { scope: 'global' };
    if (tier) filter.tier = tier;

    const problems = await Problem.find(filter)
      .select('-testCases -starterCode -statement -sqlSetup')
      .sort({ problemId: 1 })
      .lean();

    const solvedIds = userId
      ? await judgeService.getSolvedProblemIds(userId)
      : [];

    return problems.map((p) => ({
      ...p,
      solved: solvedIds.includes(p._id.toString()),
    }));
  },

  /**
   * Course-scoped problems for a specific course. Caller is responsible
   * for verifying access to the course before calling.
   */
  async listForCourse(courseId: string, userId?: string) {
    const problems = await Problem.find({ scope: 'course', courseId })
      .select('-testCases -starterCode -statement -sqlSetup')
      .sort({ problemId: 1 })
      .lean();

    const solvedIds = userId
      ? await judgeService.getSolvedProblemIds(userId)
      : [];

    return problems.map((p) => ({
      ...p,
      solved: solvedIds.includes(p._id.toString()),
    }));
  },

  /**
   * Get a single problem by slug.
   *
   * Course-scoped problems are only returned to users with access to
   * the owning course. Access check is done by the caller and passed
   * in as `hasCourseAccess`.
   */
  async getBySlug(
    slug: string,
    userId?: string,
    hasCourseAccess?: boolean
  ) {
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) throw new ApiError(404, 'Problem not found');

    if (problem.scope === 'course' && !hasCourseAccess) {
      // Return 404, not 403, so course-scoped problems are invisible
      // to users who don't have access.
      throw new ApiError(404, 'Problem not found');
    }

    const testCases = problem.testCases.map((tc, i) => ({
      index: i,
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      isHidden: Boolean(tc.isHidden),
    }));

    const solvedIds = userId
      ? await judgeService.getSolvedProblemIds(userId)
      : [];

    return {
      _id: problem._id,
      problemId: problem.problemId,
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
      sqlSetup: problem.sqlSetup,
      scope: problem.scope,
      courseId: problem.courseId,
      tier: problem.tier,
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

    validateSqlSetup(input.sqlSetup);

    const kind = inferProblemKind(input.starterCode);
    const problemId = await allocateProblemId(kind);
    const { scope, courseId } = normalizeScope(input);
    const testCases = input.testCases.map((tc, i) => normalizeTestCase(tc, i));

    const created = await Problem.create({
      ...input,
      problemId,
      scope,
      courseId,
      tier: input.tier ?? 'starter',
      testCases,
    });

    return created.toObject();
  },

  async updateProblem(slug: string, patch: Partial<ProblemInput>) {
    if (patch.slug && patch.slug !== slug) {
      const collision = await Problem.findOne({ slug: patch.slug }).lean();
      if (collision) throw new ApiError(409, 'Slug already exists');
    }

    if ('sqlSetup' in patch) {
      validateSqlSetup(patch.sqlSetup);
    }

    const update: Record<string, unknown> = { ...patch };

    // Scope/courseId are a pair. If either is present, both are
    // normalized together; otherwise the existing values are kept.
    if ('scope' in patch || 'courseId' in patch) {
      const normalized = normalizeScope({
        scope: patch.scope,
        courseId: patch.courseId,
      });
      update.scope = normalized.scope;
      update.courseId = normalized.courseId;
    }

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