import { Counter } from '../models/Counter.model.js';

/**
 * Allocation for 5-digit problem identifiers.
 *
 *   Programming -> 10001, 10002, ...
 *   SQL         -> 20001, 20002, ...
 *
 * Both ranges share the same `Counter` collection, keyed by _id.
 * Allocation is atomic via `findOneAndUpdate($inc)`; concurrent
 * callers cannot collide.
 */

const COUNTER_PROGRAMMING = 'problem_programming';
const COUNTER_SQL = 'problem_sql';

const BASE_PROGRAMMING = 10000;
const BASE_SQL = 20000;

export type ProblemKind = 'programming' | 'sql';

/**
 * Infer a problem's kind from its starter code. A problem is SQL when
 * it carries a `sql` key in `starterCode`. Everything else is
 * programming.
 *
 * This deliberately does NOT look at `sqlSetup`. A problem could have
 * SQL-style test cases without needing setup (e.g. testing against a
 * table the SQL runner pre-creates). The language key in `starterCode`
 * is the ground truth for "which language is this problem for".
 */
export function inferProblemKind(
  starterCode: Record<string, string> | undefined
): ProblemKind {
  if (!starterCode) return 'programming';
  return Object.prototype.hasOwnProperty.call(starterCode, 'sql')
    ? 'sql'
    : 'programming';
}

/**
 * Allocate the next problemId in the given kind's range.
 */
export async function allocateProblemId(kind: ProblemKind): Promise<number> {
  const counterId =
    kind === 'sql' ? COUNTER_SQL : COUNTER_PROGRAMMING;
  const base = kind === 'sql' ? BASE_SQL : BASE_PROGRAMMING;

  const doc = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const seq = doc?.seq ?? 1;
  return base + seq;
}