import type { RunResult, RunnerOptions } from '@/shared/runner/types';

interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlDatabase;
}

export interface SqlDatabase {
  exec: (sql: string) => { columns: string[]; values: unknown[][] }[];
  close: () => void;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const mod = await import('sql.js');
      const initSqlJs = mod.default;

      // The wasm file version must match the installed sql.js version.
      // Check package.json for the pinned version, and keep them in sync.
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/${file}`,
      });
      return SQL as unknown as SqlJsStatic;
    })();
  }
  return sqlPromise;
}

/**
 * Result of a setup run. On success the `db` handle is live and must
 * be closed by the caller. On failure `db` is null and the error is in
 * `result.stderr`.
 */
export interface SqlSetupOutcome {
  result: RunResult;
  db: SqlDatabase | null;
}

/**
 * Execute a block of setup SQL (CREATE TABLE / INSERT) against a fresh
 * SQL.js database and return both the result and the live database
 * handle. The caller is responsible for closing the returned `db`.
 *
 * If `sqlSetup` is empty/undefined, we still return a fresh empty DB
 * so the caller can run queries against it (they'll fail with "no
 * such table", which is the correct behavior for a problem that
 * forgot to declare setup).
 */
export async function runSqlSetup(
  sqlSetup: string | undefined
): Promise<SqlSetupOutcome> {
  const start = performance.now();

  try {
    const SQL = await getSql();
    const db = new SQL.Database();

    if (sqlSetup && sqlSetup.trim() !== '') {
      const statements = splitSqlStatements(sqlSetup);
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        db.exec(trimmed);
      }
    }

    return {
      result: {
        ok: true,
        stdout: '',
        stderr: '',
        verdict: 'accepted',
        runtimeMs: Math.round(performance.now() - start),
      },
      db,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: {
        ok: false,
        stdout: '',
        stderr: `Setup failed: ${msg}`,
        verdict: 'runtime_error',
        runtimeMs: Math.round(performance.now() - start),
      },
      db: null,
    };
  }
}

/**
 * Run the student's SQL code.
 *
 * If `existingDb` is provided, executes against it and does NOT close
 * it - the caller owns the lifecycle. This is how the test harness
 * runs a student's query against the DB that `runSqlSetup` seeded.
 *
 * If `existingDb` is omitted, creates a fresh database, runs the code
 * against it, and closes it before returning. This is the Playground
 * and standalone code path.
 */
export async function runSql(
  code: string,
  opts: RunnerOptions = {},
  existingDb?: SqlDatabase
): Promise<RunResult> {
  const start = performance.now();
  const ownsDb = !existingDb;

  let db: SqlDatabase;
  try {
    if (existingDb) {
      db = existingDb;
    } else {
      const SQL = await getSql();
      db = new SQL.Database();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      stdout: '',
      stderr: msg,
      verdict: 'runtime_error',
      runtimeMs: Math.round(performance.now() - start),
    };
  }

  void opts;

  try {
    const statements = splitSqlStatements(code);
    const selectOutput: string[] = [];

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      const isQuery = /^(select|pragma|with)\b/i.test(
        stripLeadingComments(trimmed)
      );
      const result = db.exec(trimmed);

      if (isQuery && result.length > 0) {
        for (const rs of result) {
          selectOutput.push(formatTable(rs.columns, rs.values));
        }
      }
    }

    const runtimeMs = Math.round(performance.now() - start);

    return {
      ok: true,
      stdout: selectOutput.join('\n\n'),
      stderr: '',
      verdict: 'accepted',
      runtimeMs,
    };
  } catch (err) {
    const runtimeMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      stdout: '',
      stderr: msg,
      verdict: 'runtime_error',
      runtimeMs,
    };
  } finally {
    if (ownsDb) {
      try {
        db.close();
      } catch {
        /* ignore */
      }
    }
  }
}

function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let inString: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inString) {
      buf += ch;
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inString = ch;
      buf += ch;
      continue;
    }
    if (ch === ';') {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

function formatTable(columns: string[], values: unknown[][]): string {
  const header = columns.join(' | ');
  const sep = columns.map(() => '---').join(' | ');
  const rows = values.map((row) =>
    row.map((v) => (v === null ? 'NULL' : String(v))).join(' | ')
  );
  return [header, sep, ...rows].join('\n');
}

function stripLeadingComments(sql: string): string {
  let remaining = sql.trimStart();

  while (remaining.startsWith('--')) {
    const newlineIndex = remaining.indexOf('\n');
    if (newlineIndex === -1) return '';
    remaining = remaining.slice(newlineIndex + 1).trimStart();
  }

  return remaining;
}