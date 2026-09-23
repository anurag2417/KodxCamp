import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '@/features/problems/hooks/useProblem';
import {
  runTests,
  combineSummaries,
  type AnyTestResult,
  type TestRunSummary,
  type VisibleTestCase,
} from '@/shared/runner/testHarness';
import {
  runHiddenTests,
  type HiddenTestCase,
  type HiddenTestOutcome,
} from '@/shared/runner/hiddenHarness';
import { getAdapter } from '@/shared/runner/adapters';
import { problemsApi, type ApiSubmission } from '@/features/problems/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { ProblemPanel } from '@/features/problems/components/ProblemPanel';
import { TestPanel } from '@/features/problems/components/TestPanel';
import { EditorToolbar } from '@/features/problems/components/EditorToolbar';
import { AcceptanceOverlay } from '@/features/problems/components/AcceptanceOverlay';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Human-readable labels for each language id.
 * Used to populate the EditorToolbar.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  ruby: 'Ruby',
  java: 'Java',
  sql: 'SQL',
  'html-css': 'HTML',
  react: 'React',
  tailwind: 'Tailwind',
};

/**
 * Map a language id to the Monaco editor language identifier.
 */
function toMonacoLanguage(lang: string): string {
  switch (lang) {
    case 'html-css':
    case 'tailwind':
      return 'html';
    case 'react':
      return 'javascript';
    case 'javascript':
    case 'dsa-javascript':
      return 'javascript';
    case 'typescript':
      return 'typescript';
    case 'python':
    case 'dsa-python':
      return 'python';
    case 'ruby':
      return 'ruby';
    case 'java':
      return 'java';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { problem, loading, error, reload } = useProblem(slug);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  // Languages available for this problem — derived from starterCode keys.
  const languages = useMemo(() => {
    if (!problem?.starterCode) return [];
    return Object.keys(problem.starterCode).map((id) => ({
      id,
      label: LANGUAGE_LABELS[id] ?? id,
    }));
  }, [problem?.starterCode]);

  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AnyTestResult[]>();
  const [accepted, setAccepted] = useState(false);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(true);

  // Pick the first available language once the problem loads.
  useEffect(() => {
    if (languages.length > 0 && !languages.some((l) => l.id === language)) {
      setLanguage(languages[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages]);

  // Warm the runtime for the current language when it changes.
  useEffect(() => {
    const adapter = getAdapter(language);
    if (!adapter?.init) {
      setRuntimeReady(true);
      return;
    }
    setRuntimeReady(adapter.isReady());
    let cancelled = false;
    adapter.init().then(() => {
      if (!cancelled) setRuntimeReady(true);
    }).catch(() => {
      if (!cancelled) setRuntimeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Reset editor state when the problem id or language changes.
  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] ?? '';
    setCode(starter);
    setResults(undefined);
    setAccepted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?._id, language]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, problem?._id]);

  const testCases = useMemo(() => problem?.testCases ?? [], [problem]);
  const hiddenTestCases = useMemo(
    () => problem?.hiddenTestCases ?? [],
    [problem]
  );

  async function execute(isSubmit: boolean) {
    if (!problem) return;
    if (isSubmit && !user) {
      toast.info('Log in to submit your solution.');
      return;
    }

    setBusy(true);
    setResults(undefined);
    setAccepted(false);

    const visibleCases: VisibleTestCase[] = testCases.map((tc) => ({
      index: tc.index,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    const visibleSummary: TestRunSummary = await runTests(
      language,
      code,
      visibleCases,
      {
        functionName: problem.functionName,
        outputMode: problem.outputMode,
      }
    );

    let hiddenSummary: {
      results: AnyTestResult[];
      totalRuntimeMs: number;
    } = {
      results: [],
      totalRuntimeMs: 0,
    };

    if (isSubmit && hiddenTestCases.length > 0) {
      const hiddenInputs: HiddenTestCase[] = hiddenTestCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutputHash: tc.expectedOutputHash,
        canonicalization: tc.canonicalization,
      }));

      const started = performance.now();
      const outcomes: HiddenTestOutcome[] = await runHiddenTests(
        language,
        code,
        hiddenInputs,
        {
          functionName: problem.functionName,
          outputMode: problem.outputMode,
          timeoutMs: 30000,
        }
      );

      hiddenSummary = {
        results: outcomes.map((o) => ({
          kind: 'hidden' as const,
          id: o.id,
          passed: o.passed,
          runtimeMs: 0,
        })),
        totalRuntimeMs: Math.round(performance.now() - started),
      };
    }

    const combined = combineSummaries(visibleSummary, hiddenSummary);

    setResults(combined.results);
    setAccepted(combined.allPassed);
    setTotalRuntimeMs(combined.totalRuntimeMs);

    if (isSubmit) {
      const sessionId =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        await problemsApi.submit({
          problemId: problem._id,
          language,
          code,
          sessionId,
          visibleResults: combined.results
            .filter(
              (r): r is Extract<AnyTestResult, { kind: 'visible' }> =>
                r.kind === 'visible'
            )
            .map((r) => ({ index: r.index, passed: r.passed })),
          hiddenResults: combined.results
            .filter(
              (r): r is Extract<AnyTestResult, { kind: 'hidden' }> =>
                r.kind === 'hidden'
            )
            .map((r) => ({ id: r.id, passed: r.passed })),
          runtimeMs: combined.totalRuntimeMs,
        });

        const fresh = await problemsApi.submissions(problem._id);
        setSubmissions(fresh);

        if (combined.allPassed) {
          setShowAcceptance(true);
        } else if (hiddenTestCases.length > 0) {
          const hiddenPassed = combined.results
            .filter((r) => r.kind === 'hidden')
            .filter((r) => r.passed).length;
          toast.warning(
            `${hiddenPassed}/${hiddenTestCases.length} hidden tests passed. Keep going.`,
            'Not accepted'
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to record submission';
        toast.error(message, 'Submission failed');
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
                    languages={languages}
                    language={language}
                    onLanguageChange={setLanguage}
                    onRun={() => void execute(false)}
                    onSubmit={() => void execute(true)}
                    running={busy}
                    canSubmit={!!user}
                    ready={runtimeReady}
                  />
                  <div className="flex-1">
                    <CodeEditor
                      language={toMonacoLanguage(language)}
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
                  hiddenCount={hiddenTestCases.length}
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