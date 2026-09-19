import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '../hooks/useProblem';
import { runTests, type TestResult } from '../lib/runner/testHarness';
import {
  preloadPython,
} from '../lib/runner/pythonRunner';
import { problemsApi, type ApiSubmission } from '../lib/problems.api';
import { useAuthStore } from '../store/auth.store';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ProblemPanel } from '../components/problem/ProblemPanel';
import { TestPanel } from '../components/problem/TestPanel';
import { EditorToolbar } from '../components/problem/EditorToolbar';
import { AcceptanceOverlay } from '../components/problem/AcceptanceOverlay';

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

  // Preload Python in the background so first run is fast
  useEffect(() => {
    void preloadPython().then(() => setPyReady(true));
  }, []);

  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
    setResults(undefined);
    setAccepted(false);
  }, [problem, language]);

  useEffect(() => {
    if (!user || !problem) return;
    problemsApi.submissions(problem._id).then(setSubmissions).catch(() => {});
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

        if (summary.allPassed) {
          setShowAcceptance(true);
        }
      } catch {
        /* surfaced in the result tab */
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
          <Panel defaultSize={42} minSize={28}>
            <div className="h-full bg-bg">
              <ProblemPanel problem={problem} submissions={submissions} />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

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