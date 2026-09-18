import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Send } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '../hooks/useProblem';
import { runTests } from '../lib/runner/testHarness';
import { problemsApi, type ApiSubmission } from '../lib/problems.api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { DifficultyBadge } from '../components/problem/DifficultyBadge';
import { TestCaseList } from '../components/problem/TestCaseList';
import { SubmissionsList } from '../components/problem/SubmissionsList';
import { cn } from '../lib/utils';

const availableLanguages = ['javascript', 'python'] as const;
type Lang = (typeof availableLanguages)[number];

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { problem, loading, error } = useProblem(slug);
  const user = useAuthStore((s) => s.user);

  const [language, setLanguage] = useState<Lang>('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<{ passed: boolean; isHidden: boolean }[]>();
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [tab, setTab] = useState<'tests' | 'submissions'>('tests');
  const [busy, setBusy] = useState(false);

  // Initialize code from starter
  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
    setOutput('');
    setResults(undefined);
    setStatus('idle');
  }, [problem, language]);

  // Load submissions for logged-in users
  useEffect(() => {
    if (!user || !problem) return;
    problemsApi.submissions(problem._id).then(setSubmissions).catch(() => {});
  }, [user, problem]);

  const visibleTests = useMemo(() => problem?.testCases ?? [], [problem]);

  async function runAllTests(isSubmit: boolean) {
    if (!problem) return;
    if (isSubmit && !user) {
      setOutput('Please log in to submit solutions.');
      return;
    }

    setBusy(true);
    setStatus('running');
    setResults(undefined);
    setOutput('Running tests...');

    const summary = await runTests(language, code, problem.testCases);

    // Update per-test result display
    setResults(summary.results.map((r) => ({ passed: r.passed, isHidden: r.isHidden })));

    const summaryLine = summary.allPassed
      ? `✅ All ${summary.totalTests} test cases passed (${summary.totalRuntimeMs}ms).`
      : `❌ ${summary.passedTests}/${summary.totalTests} test cases passed.`;

    const failures = summary.results
      .filter((r) => !r.passed)
      .slice(0, 3)
      .map((r) => {
        const header = r.isHidden
          ? `Test #${r.index + 1} (hidden) — Failed`
          : `Test #${r.index + 1} — Failed`;
        const detail = r.stderr
          ? `\n  Error: ${r.stderr}`
          : r.actualOutput !== undefined
            ? `\n  Got: ${r.actualOutput || '(no output)'}`
            : '';
        return header + detail;
      })
      .join('\n');

    setStatus(summary.allPassed ? 'success' : 'error');
    setOutput(summaryLine + (failures ? `\n\n${failures}` : ''));

    if (isSubmit) {
      try {
        // Validate on the server first (HMAC-signed hidden test check)
        await problemsApi.validate({
          problemId: problem._id,
          hiddenSignature: problem.hiddenSignature,
          reportedResults: summary.results.map((r) => ({
            index: r.index,
            passed: r.passed,
          })),
        });

        await problemsApi.submit({
          problemId: problem._id,
          language,
          code,
          status: summary.allPassed ? 'accepted' : 'wrong_answer',
          passedTests: summary.passedTests,
          totalTests: summary.totalTests,
          runtimeMs: summary.totalRuntimeMs,
        });

        const fresh = await problemsApi.submissions(problem._id);
        setSubmissions(fresh);
        setTab('submissions');
      } catch (err) {
        setOutput(
          (prev) =>
            prev +
            `\n\n⚠️ Submit failed: ${
              err instanceof Error ? err.message : 'unknown error'
            }`
        );
      }
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">{error ?? 'Problem not found'}</p>
        <Link to="/practice" className="mt-4 inline-block text-brand-500 hover:underline">
          ← Back to practice
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full flex-1">
        {/* Left: problem statement */}
        <Panel defaultSize={40} minSize={25}>
          <div className="h-full overflow-auto bg-bg p-6">
            <Link
              to="/practice"
              className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
            >
              <ArrowLeft size={14} /> Practice
            </Link>

            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.solved && (
                <span className="text-xs font-medium text-[var(--color-success)]">
                  ✓ Solved
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-text-primary">
              {problem.title}
            </h1>

            <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm text-text-secondary">
              {problem.statement}
            </div>

            {problem.topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {problem.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-tertiary px-2.5 py-0.5 text-xs text-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-1 border-b border-border">
              {(['tests', 'submissions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                    tab === t
                      ? 'border-b-2 border-brand-500 text-brand-500'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {t === 'tests' ? 'Test Cases' : 'Submissions'}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === 'tests' ? (
                <TestCaseList testCases={visibleTests} results={results} />
              ) : (
                <SubmissionsList submissions={submissions} />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        {/* Right: editor + console */}
        <Panel defaultSize={60}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65}>
              <div className="flex h-full flex-col bg-surface">
                <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2">
                  <div className="flex gap-1">
                    {availableLanguages.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={cn(
                          'rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                          language === l
                            ? 'bg-brand-500 text-white'
                            : 'text-text-muted hover:bg-surface-tertiary'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => runAllTests(false)}
                      disabled={busy}
                    >
                      <Play size={14} /> Run
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => runAllTests(true)}
                      disabled={busy || !user}
                    >
                      <Send size={14} /> Submit
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <CodeEditor language={language} value={code} onChange={setCode} />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-1 bg-border transition-colors hover:bg-brand-500" />

            <Panel defaultSize={35}>
              <Console output={output} status={status} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};