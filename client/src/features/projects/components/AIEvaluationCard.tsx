import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { cn } from '@/shared/lib/utils';

/**
 * A single AI evaluation, rendered the same way on every surface.
 *
 * The admin submission page and the instructor submission review
 * page both display AI evaluations. Rather than maintain two copies
 * of the same rendering logic, both import this component.
 *
 * The evaluation object it takes is structurally identical on both
 * sides — the admin's `AdminAIEvaluation` and the instructor's
 * (not-yet-declared) equivalent both have `parsed`, `parseError`,
 * `rawResponse`, and the provenance fields. The component declares
 * a local structural interface rather than importing either, so it
 * has no coupling to a feature module.
 */
export interface AIEvaluationShape {
  _id: string;
  kind: 'code' | 'vision';
  evaluatorVersion: string;
  promptVersion: string;
  provider: string;
  modelId: string;
  usedImages: boolean;
  evaluationDate: string;
  rawResponse: string;
  parseError?: string;
  parsed?: {
    score?: number | null;
    categoryScores?: {
      category: string;
      score: number;
      max: number;
      notes: string;
    }[];
    requirementResults?: {
      requirement: string;
      met: boolean;
      evidence: string;
    }[];
    overallFeedback?: string;
    evaluatorNotConfigured?: boolean;
  };
}

export const AIEvaluationCard: React.FC<{ evaluation: AIEvaluationShape }> = ({
  evaluation,
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [showCategories, setShowCategories] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);

  const parsed = evaluation.parsed;
  const hasParseError = Boolean(evaluation.parseError);
  const isNullProvider = parsed?.evaluatorNotConfigured === true;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              evaluation.kind === 'vision'
                ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                : 'bg-brand-500/10 text-brand-500',
            )}
          >
            {evaluation.kind}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(evaluation.evaluationDate)}
          </span>
          {evaluation.usedImages && (
            <span className="text-[10px] text-text-muted">· saw images</span>
          )}
        </div>
        {parsed?.score != null && (
          <span
            className={cn(
              'text-2xl font-bold',
              parsed.score >= 70
                ? 'text-[var(--color-success)]'
                : parsed.score >= 40
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-error)]',
            )}
          >
            {parsed.score}
            <span className="text-sm font-normal text-text-muted">/100</span>
          </span>
        )}
      </div>

      {/* Provenance */}
      <div className="mb-4 flex flex-wrap gap-3 text-[10px] text-text-muted">
        <span>
          provider: <code>{evaluation.provider}</code>
        </span>
        <span>
          model: <code>{evaluation.modelId}</code>
        </span>
        <span>
          prompt: <code>{evaluation.promptVersion}</code>
        </span>
        <span>
          evaluator: <code>{evaluation.evaluatorVersion}</code>
        </span>
      </div>

      {/* Parse error / not-configured */}
      {hasParseError && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-xs text-[var(--color-error)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              The model's response could not be parsed
            </p>
            <p className="mt-1 opacity-90">{evaluation.parseError}</p>
          </div>
        </div>
      )}

      {isNullProvider && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-xs text-[var(--color-warning)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">AI evaluation was not configured</p>
            <p className="mt-1 opacity-90">{parsed?.overallFeedback}</p>
          </div>
        </div>
      )}

      {/* Overall feedback */}
      {parsed?.overallFeedback && !isNullProvider && (
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Overall feedback
          </p>
          <p className="whitespace-pre-line rounded-md bg-surface-secondary p-3 text-sm text-text-secondary">
            {parsed.overallFeedback}
          </p>
        </div>
      )}

      {/* Category scores */}
      {parsed?.categoryScores && parsed.categoryScores.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCategories((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
          >
            {showCategories ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Category scores ({parsed.categoryScores.length})
          </button>
          {showCategories && (
            <div className="overflow-hidden rounded-md border border-border">
              {parsed.categoryScores.map((c, i) => (
                <div
                  key={i}
                  className="border-b border-border bg-surface p-3 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {c.category}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {c.score}
                      <span className="text-xs font-normal text-text-muted">
                        /{c.max}
                      </span>
                    </span>
                  </div>
                  {c.notes && (
                    <p className="mt-1 text-xs text-text-secondary">
                      {c.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requirement results */}
      {parsed?.requirementResults && parsed.requirementResults.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowRequirements((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
          >
            {showRequirements ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Requirements (
            {parsed.requirementResults.filter((r) => r.met).length}/
            {parsed.requirementResults.length} met)
          </button>
          {showRequirements && (
            <div className="flex flex-col gap-1">
              {parsed.requirementResults.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-3 py-2 text-xs',
                    r.met
                      ? 'bg-[var(--color-success)]/5 text-[var(--color-success)]'
                      : 'bg-[var(--color-error)]/5 text-[var(--color-error)]',
                  )}
                >
                  {r.met ? (
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={12} className="mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.requirement}</p>
                    {r.evidence && (
                      <p className="mt-0.5 text-[10px] opacity-80">
                        {r.evidence}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw response */}
      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline"
      >
        {showRaw ? <EyeOff size={12} /> : <Eye size={12} />}
        {showRaw ? 'Hide raw response' : 'Show raw response'}
      </button>
      {showRaw && (
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-surface-secondary p-3 font-mono text-[10px] text-text-secondary">
          {evaluation.rawResponse}
        </pre>
      )}
    </Card>
  );
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}