import { ApiError } from '../utils/ApiError.js';

/**
 * Structural sanity check for instructor-authored `Problem.sqlSetup`.
 *
 * This is deliberately NOT a SQL parser and NOT an executor. It catches
 * the common authoring mistakes that would otherwise surface at student
 * runtime:
 *
 *   - Empty / whitespace-only setup
 *   - Unbalanced parentheses
 *   - Missing CREATE TABLE
 *   - Missing INSERT INTO
 *
 * It does NOT catch semantic errors (wrong column names, bad types,
 * missing commas between columns). Those still fail at student runtime,
 * surfaced as `runtime_error` by the SQL runner.
 *
 * Runs on save, not on the Zod schema, because it needs multi-statement
 * reasoning that Zod shouldn't own.
 */
export function validateSqlSetup(sqlSetup: string | undefined | null): void {
  if (sqlSetup === undefined || sqlSetup === null) return;

  const sql = sqlSetup.trim();
  if (sql.length === 0) {
    throw new ApiError(400, 'sqlSetup is present but empty.');
  }

  if (sql.length > 20_000) {
    throw new ApiError(400, 'sqlSetup is too long (max 20,000 characters).');
  }

  if (!hasBalancedParens(sql)) {
    throw new ApiError(
      400,
      'sqlSetup has unbalanced parentheses. Check every "(" has a matching ")".'
    );
  }

  if (!/\bcreate\s+table\b/i.test(sql)) {
    throw new ApiError(
      400,
      'sqlSetup must contain at least one CREATE TABLE statement.'
    );
  }

  if (!/\binsert\s+into\b/i.test(sql)) {
    throw new ApiError(
      400,
      'sqlSetup must contain at least one INSERT INTO statement.'
    );
  }
}

/**
 * Paren counter that ignores parens inside single-quoted string literals
 * and inside `--` line comments. Multi-line `/* ... *\/` comments are
 * not handled - they're rare in seed data and adding them would make
 * this function longer than the risk justifies.
 */
function hasBalancedParens(sql: string): boolean {
  let depth = 0;
  let inString = false;
  let inLineComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inString) {
      // Handle '' as an escaped single quote inside a string.
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          i++; // skip the escaped quote
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === "'") {
      inString = true;
      continue;
    }

    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth < 0) return false;
    }
  }

  return depth === 0;
}