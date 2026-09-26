import {
  Target,
  ListChecks,
  Code2,
  Palette,
  Accessibility,
  PlayCircle,
  Award,
  CircleAlert,
  type LucideIcon,
} from 'lucide-react';
import type {
  ApiProjectFull,
  ApiProjectSpecification,
  ApiProjectRubricCategory,
  ProjectMode,
} from '@/features/projects/api';

interface Props {
  project: ApiProjectFull;
}

/**
 * Master Spec, section 12 — Project Requirements.
 *
 * Renders the formal specification the instructor defined. Sections
 * with no content are omitted so an unspecified project doesn't show
 * a wall of empty headings — but the mode badge is always rendered,
 * because it's the single most important piece of context.
 */
export const ProjectSpecification: React.FC<Props> = ({ project }) => {
  const spec = project.specification ?? {};
  const hasSpec = hasAnySpec(spec);
  const hasRubric = (project.rubric ?? []).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Mode badge — always shown */}
      <ModeBadge mode={project.mode} />

      {/* Objective */}
      {spec.objective && (
        <SpecSection
          icon={Target}
          title="Objective"
          items={[spec.objective]}
          variant="paragraph"
        />
      )}

      {/* Requirements */}
      {spec.requiredFeatures && spec.requiredFeatures.length > 0 && (
        <SpecSection
          icon={ListChecks}
          title="Required features"
          items={spec.requiredFeatures}
          variant="list"
        />
      )}

      {spec.technicalRequirements &&
        spec.technicalRequirements.length > 0 && (
          <SpecSection
            icon={Code2}
            title="Technical requirements"
            items={spec.technicalRequirements}
            variant="list"
          />
        )}

      {spec.designRequirements && spec.designRequirements.length > 0 && (
        <SpecSection
          icon={Palette}
          title="Design requirements"
          items={spec.designRequirements}
          variant="list"
        />
      )}

      {spec.accessibilityRequirements &&
        spec.accessibilityRequirements.length > 0 && (
          <SpecSection
            icon={Accessibility}
            title="Accessibility requirements"
            items={spec.accessibilityRequirements}
            variant="list"
          />
        )}

      {spec.expectedBehaviour && (
        <SpecSection
          icon={PlayCircle}
          title="Expected behaviour"
          items={[spec.expectedBehaviour]}
          variant="paragraph"
        />
      )}

      {/* Rubric */}
      {hasRubric && <RubricSection rubric={project.rubric} />}

      {/* Fallback when there's nothing structured to show */}
      {!hasSpec && !hasRubric && project.instructions && (
        <p className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-text-secondary">
          {project.instructions}
        </p>
      )}

      {!hasSpec && !hasRubric && !project.instructions && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-4 text-xs text-[var(--color-warning)]">
          <CircleAlert size={14} />
          <span>
            This project has no specification yet. Follow the starter files
            and any instructions your instructor gives you.
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Mode badge ─────────────────────────────────────────────────── */

const MODE_LABELS: Record<
  ProjectMode,
  { label: string; description: string; tone: string }
> = {
  required: {
    label: 'Required Project',
    description:
      'Everyone builds the exact project defined by the instructor.',
    tone: 'border-brand-500/40 bg-brand-500/5 text-brand-500',
  },
  recommended: {
    label: 'Recommended Project',
    description:
      'A default is provided. You may pick an instructor-approved alternative.',
    tone:
      'border-[var(--color-info)]/40 bg-[var(--color-info)]/5 text-[var(--color-info)]',
  },
  open_choice: {
    label: 'Open Choice',
    description:
      'The instructor defines the outcomes. You decide what to build.',
    tone:
      'border-[var(--color-success)]/40 bg-[var(--color-success)]/5 text-[var(--color-success)]',
  },
};

const ModeBadge: React.FC<{ mode: ProjectMode }> = ({ mode }) => {
  const meta = MODE_LABELS[mode] ?? MODE_LABELS.required;
  return (
    <div className={`rounded-lg border px-4 py-3 ${meta.tone}`}>
      <p className="text-xs font-semibold uppercase tracking-widest">
        {meta.label}
      </p>
      <p className="mt-1 text-xs opacity-90">{meta.description}</p>
    </div>
  );
};

/* ─── Spec section ───────────────────────────────────────────────── */

interface SpecSectionProps {
  icon: LucideIcon;
  title: string;
  items: string[];
  variant: 'list' | 'paragraph';
}

const SpecSection: React.FC<SpecSectionProps> = ({
  icon: Icon,
  title,
  items,
  variant,
}) => (
  <div>
    <div className="mb-2 flex items-center gap-2">
      <Icon size={14} className="text-brand-500" />
      <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {title}
      </h3>
    </div>
    {variant === 'list' ? (
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-text-secondary"
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text-muted" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
        {items[0]}
      </p>
    )}
  </div>
);

/* ─── Rubric ─────────────────────────────────────────────────────── */

const RubricSection: React.FC<{ rubric: ApiProjectRubricCategory[] }> = ({
  rubric,
}) => {
  const total = rubric.reduce((sum, r) => sum + r.weight, 0);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Award size={14} className="text-brand-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Evaluation Rubric
        </h3>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {rubric.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 last:border-b-0"
          >
            <span className="text-sm text-text-secondary">{r.category}</span>
            <span className="text-sm font-semibold text-text-primary">
              {r.weight}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between bg-surface-secondary px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total
          </span>
          <span className="text-sm font-bold text-brand-500">{total}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function hasAnySpec(spec: ApiProjectSpecification): boolean {
  return Boolean(
    spec.objective ||
      (spec.requiredFeatures && spec.requiredFeatures.length > 0) ||
      (spec.technicalRequirements && spec.technicalRequirements.length > 0) ||
      (spec.designRequirements && spec.designRequirements.length > 0) ||
      (spec.accessibilityRequirements &&
        spec.accessibilityRequirements.length > 0) ||
      spec.expectedBehaviour
  );
}