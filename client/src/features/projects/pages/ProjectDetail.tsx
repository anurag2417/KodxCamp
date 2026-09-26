import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProject } from '@/features/projects/hooks/useProject';
import {
  projectsApi,
  type ApiProjectSubmission,
} from '@/features/projects/api';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { CategoryBadge } from '@/features/projects/components/CategoryBadge';
import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace';
import { ProjectSpecification } from '@/features/projects/components/ProjectSpecification';
import { ProjectSubmissionHistory } from '@/features/projects/components/ProjectSubmissionHistory';

type LeftTab = 'spec' | 'submissions';

export const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { project, userProject, setUserProject, loading, error } =
    useProject(slug);
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<LeftTab>('spec');
  const [submissions, setSubmissions] = useState<ApiProjectSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const loadSubmissions = useCallback(async () => {
    if (!slug || !user) return;
    setSubmissionsLoading(true);
    try {
      const list = await projectsApi.submissions(slug);
      setSubmissions(list);
    } catch {
      /* ignore */
    } finally {
      setSubmissionsLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">{error ?? 'Project not found'}</p>
        <Link
          to="/projects"
          className="mt-4 inline-block text-brand-500 hover:underline"
        >
          ← Back to projects
        </Link>
      </div>
    );
  }

  const files = userProject?.files ?? project.files;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full flex-1">
        {/* Left panel: spec + submissions */}
        <Panel defaultSize={28} minSize={20}>
          <div className="flex h-full flex-col bg-bg">
            {/* Header */}
            <div className="border-b border-border px-6 pt-6">
              <Link
                to="/projects"
                className="mb-4 inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
              >
                <ArrowLeft size={14} /> Projects
              </Link>

              <CategoryBadge category={project.category} />

              <h1 className="mt-3 text-2xl font-bold text-text-primary">
                {project.title}
              </h1>

              <p className="mt-2 text-sm text-text-secondary">
                {project.longDescription || project.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                <span>⏱ {project.estimatedMinutes} min</span>
                <span className="font-semibold text-brand-500">
                  +{project.xpReward} XP
                </span>
              </div>

              {/* Tabs */}
              <div className="mt-6 flex gap-1 border-b border-border">
                <button
                  onClick={() => setTab('spec')}
                  className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    tab === 'spec'
                      ? 'text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Specification
                  {tab === 'spec' && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
                  )}
                </button>
                <button
                  onClick={() => setTab('submissions')}
                  className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    tab === 'submissions'
                      ? 'text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Submissions
                  {submissions.length > 0 && (
                    <span className="ml-1 rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-500">
                      {submissions.length}
                    </span>
                  )}
                  {tab === 'submissions' && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-auto p-6">
              {tab === 'spec' ? (
                <ProjectSpecification project={project} />
              ) : (
                <ProjectSubmissionHistory
                  submissions={submissions}
                  loading={submissionsLoading}
                  onResubmit={() => {
                    // Switch back to the spec tab and scroll to the top
                    // so the student sees the workspace. The workspace
                    // panel is always visible on the right; the "resubmit"
                    // action is about closing the history view and
                    // surfacing the editor, not about navigating away.
                    //
                    // The server has already put the student's
                    // UserProject back into `in_progress` when the
                    // instructor requested a resubmission, so the
                    // workspace is editable the moment they look at it.
                    setTab('spec');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {!user && (
                <div className="mt-6 rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                  <Link to="/login" className="text-brand-500 hover:underline">
                    Log in
                  </Link>{' '}
                  to save your work and submit your project.
                </div>
              )}

              {userProject?.status === 'completed' && (
                <div className="mt-6 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 p-3 text-xs font-medium text-[var(--color-success)]">
                  ✓ You completed this project
                </div>
              )}

              {(userProject?.status === 'submitted' ||
                userProject?.status === 'needs_improvement' ||
                userProject?.status === 'resubmission_requested') && (
                <div className="mt-6 rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-info)]/5 p-3 text-xs text-[var(--color-info)]">
                  You have an open submission.{' '}
                  <button
                    type="button"
                    onClick={() => setTab('submissions')}
                    className="font-semibold underline"
                  >
                    View it
                  </button>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        {/* Right panel: workspace */}
        <Panel defaultSize={72}>
          <ProjectWorkspace
            projectSlug={project.slug}
            initialFiles={files}
            previewMode={project.previewMode}
            tests={project.tests}
            userProject={userProject}
            onSaved={(up) => setUserProject(up)}
            onSubmitted={(submission) => {
              setSubmissions((prev) => [submission, ...prev]);
              setTab('submissions');
            }}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};