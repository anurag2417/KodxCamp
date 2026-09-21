import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '@/features/problems/hooks/useProblem';
import { runTests, type TestResult } from '@/shared/runner/testHarness';
import { preloadPython } from '@/shared/runner/pythonRunner';
import { problemsApi, type ApiSubmission } from '@/features/problems/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { ProblemPanel } from '@/features/problems/components/ProblemPanel';
import { TestPanel } from '@/features/problems/components/TestPanel';
import { EditorToolbar } from '@/features/problems/components/EditorToolbar';
import { AcceptanceOverlay } from '@/features/problems/components/AcceptanceOverlay';

const LANGUAGES = ['javascript', 'python'] as const;
type Lang = (typeof LANGUAGES)[number];

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { problem, loading, error, reload } = useProblem(slug);
  const user = useAuthStore((s) => s.user);

  const [language, setLanguage] = useState<Lang>('javascript');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<TestResult[]>();
  const [accepted, setAccepted] = useState(false);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [pyReady, setPyReady] = useState(false);

  // Warm Python in the background so first run feels instant
  useEffect(() => {
    void preloadPython().then(() => setPyReady(true));
  }, []);

  // Reset editor state when the problem or language changes
  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
    setResults(undefined);
    setAccepted(false);
  }, [problem, language]);

  // Load submissions (uncached — simple, refetched on problem change)
  useEffect(() => {
    if (!user || !problem) return;
    let cancelled = false;
    problemsApi
      .submissions(problem._id)
      .then((rows) => {
        if (!cancelled) setSubmissions(rows);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [user, problem]);

  const testCases = useMemo(() => problem?.testCases ?? [], [problem]);

  async function execute(isSubmit: boolean) {
    if (!problem) return;
    if (isSubmit && !user) return;

    setBusy(true);
    setResults(undefined);
    setAccepted(false);

    const summary = await runTests(language, code, testCases, {
      functionName: problem.functionName,
      outputMode: problem.outputMode,
    });

    setResults(summary.results);
    setAccepted(summary.allPassed);
    setTotalRuntimeMs(summary.totalRuntimeMs);

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

        // Show the celebration overlay only on all-pass
        if (summary.allPassed) {
          setShowAcceptance(true);
        }
      } catch {
        /* surfaced in the result panel */
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
    <>
      <div className="flex h-[calc(100vh-64px)] w-full">
        <PanelGroup direction="horizontal" className="h-full flex-1">
          {/* Left: problem panel */}
          <Panel defaultSize={42} minSize={28}>
            <div className="h-full bg-bg">
              <ProblemPanel problem={problem} submissions={submissions} />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

          {/* Right: editor + test panel */}
          <Panel defaultSize={58} minSize={35}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={65} minSize={30}>
                <div className="flex h-full flex-col bg-surface">
                  <EditorToolbar
                    languages={LANGUAGES}
                    language={language}
                    onLanguageChange={(l) => setLanguage(l as Lang)}
                    onRun={() => void execute(false)}
                    onSubmit={() => void execute(true)}
                    running={busy}
                    canSubmit={!!user}
                    pyReady={pyReady}
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

              <Panel defaultSize={35} minSize={15}>
                <TestPanel
                  testCases={testCases}
                  results={results}
                  running={busy}
                  accepted={accepted}
                  totalRuntimeMs={totalRuntimeMs}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      <AcceptanceOverlay
        open={showAcceptance}
        runtimeMs={totalRuntimeMs}
        language={language}
        onClose={() => setShowAcceptance(false)}
      />
    </>
  );
};
