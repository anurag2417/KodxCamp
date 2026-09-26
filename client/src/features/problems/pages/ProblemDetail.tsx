import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '@/features/problems/hooks/useProblem';
import {
  runTests,
  type TestRunSummary,
  type VisibleTestCase,
} from '@/shared/runner/testHarness';
import { problemsApi, type ApiSubmission } from '@/features/problems/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { useLanguagePreload } from '@/shared/hooks/useLanguagePreload';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { ProblemPanel } from '@/features/problems/components/ProblemPanel';
import { TestPanel } from '@/features/problems/components/TestPanel';
import { EditorToolbar } from '@/features/problems/components/EditorToolbar';
import { AcceptanceOverlay } from '@/features/problems/components/AcceptanceOverlay';
import { useToast } from '@/shared/hooks/useToast';
import { readStoredValue, writeStoredValue } from '@/shared/lib/storage';
import { buildPreviewHtml } from '@/shared/lib/preview';
import { withNext } from '@/features/auth/lib/redirect';
import { track } from '@/shared/lib/analytics';

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

const JAVA_FALLBACK_STARTER = `public class Main {
  public static void main(String[] args) {
    // TODO
  }
}
`;

const SQL_FALLBACK_STARTER = `-- Write your SQL query below
SELECT * FROM your_table;
`;

const WEB_FILES = ['index.html', 'styles.css', 'script.js'] as const;
type WebFile = (typeof WEB_FILES)[number];

function isWebLanguage(lang: string): boolean {
  return lang === 'html-css' || lang === 'react' || lang === 'tailwind';
}

function toMonacoLanguage(langOrFile: string): string {
  switch (langOrFile) {
    case 'index.html':
      return 'html';
    case 'styles.css':
      return 'css';
    case 'script.js':
      return 'javascript';

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
  const [searchParams] = useSearchParams();
  const { problem, loading, error, reload } = useProblem(slug);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const navigate = useNavigate();

  /**
   * The language query parameter. Set when a guest is redirected to
   * login and sent back — the guest was working in Python, they
   * should return in Python. Validated against the problem's
   * available languages; an unknown value falls back to the first
   * configured language.
   */
  const languageFromQuery = searchParams.get('lang') ?? '';

  const languages = useMemo(() => {
    if (!problem) return [];
    const configured = Object.keys(problem.starterCode ?? {}).map((id) => ({
      id,
      label: LANGUAGE_LABELS[id] ?? id,
    }));
    if (!configured.some((l) => l.id === 'java')) {
      configured.push({ id: 'java', label: 'Java' });
    }
    return configured;
  }, [problem]);

  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<WebFile>(WEB_FILES[0]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<TestRunSummary | undefined>();
  const [accepted, setAccepted] = useState(false);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [showAcceptance, setShowAcceptance] = useState(false);

  const hasEditedRef = useRef(false);
  /**
   * `edited` mirrors `hasEditedRef` for renders. The ref exists
   * because the persistence effects must not re-run when the flag
   * flips — they only need to read it. But the banner needs to
   * re-render when it flips, so the ref is not enough on its own.
   * One flag, two purposes; the state drives the UI, the ref
   * guards the effects.
   */
  const [edited, setEdited] = useState(false);

  /**
   * Analytics guard (Batch 3.4). `problem_solved` fires at most once
   * per mount. The user can submit a second time from the same
   * session — the ref makes sure we don't double-count.
   */
  const solvedTrackedRef = useRef(false);

  const languageIds = useMemo(() => languages.map((l) => l.id), [languages]);
  const { status: preloadStatus } = useLanguagePreload(languageIds, language);

  const isWebProblem = isWebLanguage(language);

  /**
   * Pick the initial language: the query param if it's valid, else
   * the first configured language on the problem.
   */
  useEffect(() => {
    if (languages.length === 0) return;

    if (
      languageFromQuery &&
      languages.some((l) => l.id === languageFromQuery)
    ) {
      if (language !== languageFromQuery) setLanguage(languageFromQuery);
      return;
    }

    if (!languages.some((l) => l.id === language)) {
      setLanguage(languages[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages, languageFromQuery]);

  useEffect(() => {
    if (!problem) return;

    const draftKey = `problem:${user?._id ?? 'guest'}:${problem._id}:${language}`;

    if (isWebLanguage(language)) {
      const stored = readStoredValue<Record<string, string>>(
        `${draftKey}:files`
      );
      const configured = problem.starterCode ?? {};
      setFiles(
        stored ?? {
          'index.html': configured['index.html'] ?? '',
          'styles.css': configured['styles.css'] ?? '',
          'script.js': configured['script.js'] ?? '',
        }
      );
      setActiveFile(WEB_FILES[0]);
    } else {
      const configured = problem.starterCode?.[language];
      const starter =
        configured ??
        (language === 'java'
          ? JAVA_FALLBACK_STARTER
          : language === 'sql'
            ? SQL_FALLBACK_STARTER
            : '');
      setCode(readStoredValue<string>(draftKey) ?? starter);
    }

    setSummary(undefined);
    setAccepted(false);
    hasEditedRef.current = false;
    setEdited(false);
  }, [problem, language, user?._id]);

  useEffect(() => {
    if (!problem) return;
    const draftKey = `problem:${user?._id ?? 'guest'}:${problem._id}:${language}`;
    if (isWebLanguage(language)) {
      if (Object.keys(files).length === 0) return;
      writeStoredValue(`${draftKey}:files`, files);
    } else {
      if (!code) return;
      writeStoredValue(draftKey, code);
    }
  }, [code, files, language, problem, user?._id]);

  useEffect(() => {
    if (!user || !problem) return;
    let cancelled = false;
    problemsApi
      .submissions(problem._id)
      .then((rows) => {
        if (!cancelled) {
          setSubmissions(rows);
          const latest = rows.find((s) => s.language === language);
          if (latest) {
            if (isWebLanguage(language)) {
              /* legacy single-string submission - don't adopt */
            } else {
              setCode(latest.code);
            }
          }
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [user, problem?._id, language]);

  const testCases = useMemo(() => problem?.testCases ?? [], [problem]);

  /**
   * The URL to send a guest to when they need to sign in. Includes
   * the language so they return to the same editor context, and
   * preserves the exact problem slug.
   */
  const currentProblemPath = useMemo(() => {
    const base = `/practice/${slug ?? ''}`;
    return `${base}?lang=${encodeURIComponent(language)}`;
  }, [slug, language]);

  const goToLogin = () => {
    toast.info('Sign in to submit and keep your work.', 'Not signed in');
    navigate(withNext('/login', currentProblemPath));
  };

  async function execute(isSubmit: boolean) {
    if (!problem) return;

    if (isSubmit && !user) {
      goToLogin();
      return;
    }

    setBusy(true);
    setSummary(undefined);
    setAccepted(false);

    const visibleCases: VisibleTestCase[] = testCases.map((tc) => ({
      index: tc.index,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

    const submittedCode = isWebProblem ? buildPreviewHtml(files) : code;

    const result = await runTests(language, submittedCode, visibleCases, {
      functionName: problem.functionName,
      outputMode: problem.outputMode,
      sqlSetup: problem.sqlSetup,
    });

    setSummary(result);
    setAccepted(result.allPassed);
    setTotalRuntimeMs(result.totalRuntimeMs);

    if (isSubmit) {
      try {
        await problemsApi.submit({
          problemId: problem._id,
          language,
          code: submittedCode,
          status: result.allPassed ? 'accepted' : 'wrong_answer',
          passedTests: result.passedTests,
          totalTests: result.totalTests,
          runtimeMs: result.totalRuntimeMs,
        });

        const fresh = await problemsApi.submissions(problem._id);
        setSubmissions(fresh);

        if (result.allPassed) {
          // CHANGED (Batch 3.4): fire problem_solved at most once
          // per mount, only on the Submit path (not on a bare Run).
          if (!solvedTrackedRef.current) {
            solvedTrackedRef.current = true;
            track('problem_solved', {
              problem: problem.slug,
              language,
            });
          }
          setShowAcceptance(true);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to record submission';
        toast.error(message, 'Submission failed');
      }
    }

    setBusy(false);
  }

  const handleFilesChange = (fileName: WebFile, value: string) => {
    hasEditedRef.current = true;
    setEdited(true);
    setFiles((current) => ({ ...current, [fileName]: value }));
  };

  const handleCodeChange = (value: string) => {
    hasEditedRef.current = true;
    setEdited(true);
    setCode(value);
  };

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

  const activeCode = isWebProblem ? files[activeFile] ?? '' : code;

  const editorLanguage = isWebProblem
    ? toMonacoLanguage(activeFile)
    : toMonacoLanguage(language);

  const showGuestBanner = !user && edited;

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
                    onSignIn={goToLogin}
                    running={busy}
                    canSubmit={!!user}
                    preloadStatus={preloadStatus}
                  />

                  {showGuestBanner && (
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-brand-500/5 px-4 py-2 text-xs">
                      <p className="text-text-secondary">
                        Your draft is saved on this device.{' '}
                        <span className="text-text-muted">
                          Sign in to keep it and see your submission history.
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={goToLogin}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        <LogIn size={11} /> Sign in
                      </button>
                    </div>
                  )}

                  {isWebProblem && (
                    <div className="flex items-center gap-1 border-b border-border bg-surface-secondary px-3 py-1.5">
                      {WEB_FILES.map((fileName) => (
                        <button
                          key={fileName}
                          type="button"
                          onClick={() => setActiveFile(fileName)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            activeFile === fileName
                              ? 'bg-surface-tertiary text-brand-500'
                              : 'text-text-muted hover:bg-surface-tertiary hover:text-text-primary'
                          }`}
                        >
                          {fileName}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex-1">
                    <CodeEditor
                      language={editorLanguage}
                      value={activeCode}
                      onChange={(value) => {
                        if (isWebProblem) {
                          handleFilesChange(activeFile, value);
                        } else {
                          handleCodeChange(value);
                        }
                      }}
                      projectFiles={isWebProblem ? files : undefined}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-border transition-colors hover:bg-brand-500" />

              <Panel defaultSize={35} minSize={15}>
                <TestPanel
                  testCases={testCases}
                  results={summary?.results}
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