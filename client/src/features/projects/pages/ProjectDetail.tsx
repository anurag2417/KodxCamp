import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProject } from '@/features/projects/hooks/useProject';
import { useAuthStore } from '@/shared/store/auth.store';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { CategoryBadge } from '@/features/projects/components/CategoryBadge';
import { ProjectWorkspace } from '@/features/projects/components/ProjectWorkspace';

export const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { project, userProject, setUserProject, loading, error } = useProject(slug);
  const user = useAuthStore((s) => s.user);

  // If logged in but project not started, start it (auto-clone on first visit)

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
        <Link to="/projects" className="mt-4 inline-block text-brand-500 hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const files = userProject?.files ?? project.files;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full flex-1">
        {/* Instructions */}
        <Panel defaultSize={28} minSize={20}>
          <div className="h-full overflow-auto bg-bg p-6">
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
              <span className="font-semibold text-brand-500">+{project.xpReward} XP</span>
            </div>

            {project.instructions && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-text-primary">Instructions</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                  {project.instructions}
                </p>
              </div>
            )}

            {project.topics.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-tertiary px-2.5 py-0.5 text-xs text-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {!user && (
              <div className="mt-6 rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                <Link to="/login" className="text-brand-500 hover:underline">
                  Log in
                </Link>{' '}
                to save your work.
              </div>
            )}

            {userProject?.status === 'completed' && (
              <div className="mt-6 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 p-3 text-xs font-medium text-[var(--color-success)]">
                ✓ You completed this project
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        {/* Workspace */}
        <Panel defaultSize={72}>
          <ProjectWorkspace
            projectSlug={project.slug}
            initialFiles={files}
            previewMode={project.previewMode}
            userProject={userProject}
            onSaved={(up) => setUserProject(up)}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
