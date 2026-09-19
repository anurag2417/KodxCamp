import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '../hooks/useProblem';
import { runTests } from '../lib/runner/testHarness';
import { problemsApi, type ApiSubmission } from '../lib/problems.api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { RunBar } from '../components/editor/RunBar';
import { DifficultyBadge } from '../components/problem/DifficultyBadge';
import { TestCaseList } from '../components/problem/TestCaseList';
import { SubmissionsList } from '../components/problem/SubmissionsList';
import { cn } from '../lib/utils';

const availableLanguages = ['javascript', 'python'] as const;
type Lang = (typeof availableLanguages)[number];

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { problem, loading, error, reload } = useProblem(slug);
  const user = useAuthStore((s) => s.user);

  const [language, setLanguage] = useState<Lang>('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>(
    'idle'
  );
  const [results, setResults] = useState<{ passed: boolean }[]>();
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [tab, setTab] = useState<'tests' | 'submissions'>('tests');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
    setOutput('');
    setResults(undefined);
    setStatus('idle');
  }, [problem, language]);

  useEffect(() => {
    if (!user || !problem) return;
    problemsApi.submissions(problem._id).then(setSubmissions).catch(() => {});
  }, [user, problem]);

  const testCases = useMemo(() => problem?.testCases ?? [], [problem]);

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

    const summary = await runTests(language, code, testCases, {
      functionName: problem.functionName,
      outputMode: problem.outputMode,
    });

    setResults(summary.results.map((r) => ({ passed: r.passed })));

    const summaryLine = summary.allPassed
      ? `✅ All ${summary.totalTests} test${
          summary.totalTests === 1 ? '' : 's'
        } passed (${summary.totalRuntimeMs}ms).`
      : `❌ ${summary.passedTests}/${summary.totalTests} tests passed.`;

    const failures = summary.results
      .filter((r) => !r.passed)
      .slice(0, 3)
      .map((r) => {
        const detail = r.stderr
          ? `\n  Error: ${r.stderr}`
          : r.actualOutput !== undefined
            ? `\n  Got: ${r.actualOutput || '(no output)'}`
            : '';
        return `Test #${r.index + 1} — Failed${detail}`;
      })
      .join('\n');

    setStatus(summary.allPassed ? 'success' : 'error');
    setOutput(summaryLine + (failures ? `\n\n${failures}` : ''));

    if (isSubmit) {
      try {
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
      <div className="w-full p-6 lg:p-8">
        <Link
          to="/practice"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} /> Practice
        </Link>
        <div className="mt-6">
          <ErrorState
            title="Couldn't load this problem"
            message={error ?? 'Problem not found'}
            onRetry={reload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full flex-1">
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
              <span className="text-text-muted">{problem.number}.</span>{' '}
              {problem.title}
            </h1>

            <p className="mt-2 text-xs text-text-muted">
              Implement{' '}
              <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-text-primary">
                {problem.functionName}
              </code>{' '}
              {problem.outputMode === 'return'
                ? '— return the result; the platform compares it to the expected output.'
                : '— print the result; the platform compares stdout to the expected output.'}
            </p>

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
                <TestCaseList testCases={testCases} results={results} />
              ) : (
                <SubmissionsList submissions={submissions} />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        <Panel defaultSize={60}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65}>
              <div className="flex h-full flex-col bg-surface">
                <RunBar
                  left={
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
                  }
                  right={
                    <Button
                      size="sm"
                      onClick={() => void runAllTests(true)}
                      disabled={busy || !user}
                    >
                      <Send size={14} /> Submit
                    </Button>
                  }
                  onRun={() => void runAllTests(false)}
                  running={busy}
                />
                <div className="flex-1">
                  <CodeEditor
                    language={language}
                    value={code}
                    onChange={setCode}
                  />
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