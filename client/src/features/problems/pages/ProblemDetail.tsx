import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

/**
 * Assemble the three web files into a single HTML document ready for
 * the sandboxed iframe. The `<script src="script.js">` reference in the
 * student's HTML (if any) is left alone - we inject our own inline
 * script at the end of body, so the browser sees the real code.
 */
function buildWebPreview(files: Record<string, string>): string {
  const html = files['index.html'] ?? '';
  const css = files['styles.css'] ?? '';
  const javascript = files['script.js'] ?? '';

  let doc = html;

  if (css) {
    const styleTag = `<style>${css}</style>`;
    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `${styleTag}\n</head>`);
    } else {
      doc = styleTag + doc;
    }
  }

  // Strip any <script src="..."> references so we don't 404 trying to
  // load a file that only exists in the editor.
  doc = doc.replace(/<script[^>]*src=[^>]*><\/script>/gi, '');

  if (javascript) {
    const scriptTag = `<script>${javascript}</script>`;
    if (doc.includes('</body>')) {
      doc = doc.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      doc += scriptTag;
    }
  }

  return doc;
}

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { problem, loading, error, reload } = useProblem(slug);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

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

  const languageIds = useMemo(() => languages.map((l) => l.id), [languages]);
  const { status: preloadStatus } = useLanguagePreload(languageIds, language);

  const isWebProblem = isWebLanguage(language);

  useEffect(() => {
    if (languages.length > 0 && !languages.some((l) => l.id === language)) {
      setLanguage(languages[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages]);

  // Load starter state. For web languages we want three files; for
  // everything else we want a single code blob.
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
  }, [problem, language, user?._id]);

  // Persist drafts.
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
              // Legacy submissions stored only a single string; skip
              // adopting it as files.
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

  async function execute(isSubmit: boolean) {
    if (!problem) return;
    if (isSubmit && !user) {
      toast.info('Log in to submit your solution.');
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

    // Web problems: assemble the three files into one HTML document
    // and run it through the html runner. Non-web problems go straight
    // through with their code as-is.
    const submittedCode = isWebProblem ? buildWebPreview(files) : code;

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
                    preloadStatus={preloadStatus}
                  />

                  {/* Web problems: tabbed multi-file editor */}
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
                      language={toMonacoLanguage(
                        isWebProblem
                          ? activeFile === 'styles.css'
                            ? 'css'
                            : activeFile === 'script.js'
                              ? 'javascript'
                              : language
                          : language
                      )}
                      value={activeCode}
                      onChange={(value) => {
                        if (isWebProblem) {
                          setFiles((current) => ({
                            ...current,
                            [activeFile]: value,
                          }));
                        } else {
                          setCode(value);
                        }
                      }}
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