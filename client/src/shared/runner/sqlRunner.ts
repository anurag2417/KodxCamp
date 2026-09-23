import type { RunResult, RunnerOptions } from '@/shared/runner/types';

interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlDatabase;
}

interface SqlDatabase {
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

export async function runSql(
  code: string,
  _opts: RunnerOptions = {}
): Promise<RunResult> {
  const start = performance.now();
  try {
    const SQL = await getSql();
    const db = new SQL.Database();

    const statements = splitSqlStatements(code);
    const selectOutput: string[] = [];

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      const isQuery = /^(select|pragma|with)\b/i.test(trimmed);
      const result = db.exec(trimmed);

      if (isQuery && result.length > 0) {
        for (const rs of result) {
          selectOutput.push(formatTable(rs.columns, rs.values));
        }
      }
    }

    db.close();
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