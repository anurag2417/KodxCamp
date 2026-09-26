import type { AIMessage } from './aiProvider/types.js';

/**
 * Versioned prompt builders.
 *
 * Two prompts, one per pass:
 *
 *   buildCodeEvaluationPrompt   — reviews the student's source files
 *                                 against the specification, rubric,
 *                                 and automated test results.
 *   buildVisionEvaluationPrompt — reviews the rendered screenshots
 *                                 against the design and
 *                                 accessibility requirements.
 *
 * Every function name is suffixed with its prompt version. When the
 * wording of a prompt changes, ADD a new version — do not edit the
 * old one. Old `AIEvaluation` rows carry the version they were
 * produced under, and this file must be able to reproduce them.
 *
 * INPUT TYPES: this module declares plain structural shapes
 * (`ProjectPromptInput`, `SubmissionPromptInput`) rather than taking
 * Mongoose `Document` types. The evaluator service calls
 * `findById(...).lean()`, whose result is structurally a plain object
 * — not a `Document`. Typing the prompt builders to what they
 * actually read keeps that call site assignable without casts.
 *
 * The shapes are deliberately WIDER than what the prompt-building
 * code happens to use in any given version. A narrower type would
 * reject the stored data for no runtime benefit — the stored
 * `ProjectScreenshot.viewport` is `'desktop' | 'mobile'`, not the
 * literal `'desktop'`, and pretending otherwise breaks assignability
 * without catching a single real bug.
 *
 * The response contract the prompts ask for:
 *
 *   {
 *     "score": 0–100 integer,
 *     "categoryScores": [
 *       {
 *         "category": "Visual Design",   // must match a rubric category
 *         "score": 0–max,
 *         "max": <weight>,
 *         "notes": "one or two sentences of evidence"
 *       }
 *     ],
 *     "requirementResults": [
 *       {
 *         "requirement": "exact text from the specification",
 *         "met": true | false,
 *         "evidence": "what in the code or screenshot supports this"
 *       }
 *     ],
 *     "overallFeedback": "3–6 sentences addressed to the student"
 *   }
 */

/* ─── Input shapes ───────────────────────────────────────────────── */

export interface ProjectPromptInput {
  title: string;
  specification?: {
    objective?: string;
    requiredFeatures?: string[];
    technicalRequirements?: string[];
    designRequirements?: string[];
    accessibilityRequirements?: string[];
    expectedBehaviour?: string;
  };
  rubric?: { category: string; weight: number }[];
}

export interface SubmissionPromptInput {
  files: { name: string; language: string; content: string }[];
  testRun?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    allPassed: boolean;
    durationMs: number;
    results: {
      name: string;
      passed: boolean;
      actual: string;
      message?: string;
    }[];
    ranAt: Date;
    error?: string;
  };
  /**
   * Screenshot set, matching the stored `ProjectScreenshotSet`.
   *
   * `viewport` is the union `'desktop' | 'mobile'` — the same union
   * the stored data declares. Do NOT narrow it to the literal in the
   * `desktop` / `mobile` slot. The server writes it correctly, but
   * the type does not promise that, and narrowing it here only makes
   * the lean-doc result unassignable for no real safety gain.
   */
  screenshots?: {
    desktop?: {
      viewport: 'desktop' | 'mobile';
      width: number;
      height: number;
      dataUrl: string;
    };
    mobile?: {
      viewport: 'desktop' | 'mobile';
      width: number;
      height: number;
      dataUrl: string;
    };
    error?: string;
  };
}

/* ─── Shared helpers ─────────────────────────────────────────────── */

function formatRubric(project: ProjectPromptInput): string {
  const rubric = project.rubric ?? [];
  if (rubric.length === 0) {
    return '(No rubric defined for this project.)';
  }
  return rubric
    .map((r) => `- ${r.category} (weight: ${r.weight})`)
    .join('\n');
}

function formatSpecification(project: ProjectPromptInput): string {
  const spec = project.specification ?? {};
  const sections: string[] = [];

  if (spec.objective) {
    sections.push(`### Objective\n${spec.objective}`);
  }
  if (spec.requiredFeatures && spec.requiredFeatures.length > 0) {
    sections.push(
      `### Required Features\n${spec.requiredFeatures
        .map((f) => `- ${f}`)
        .join('\n')}`,
    );
  }
  if (spec.technicalRequirements && spec.technicalRequirements.length > 0) {
    sections.push(
      `### Technical Requirements\n${spec.technicalRequirements
        .map((r) => `- ${r}`)
        .join('\n')}`,
    );
  }
  if (spec.designRequirements && spec.designRequirements.length > 0) {
    sections.push(
      `### Design Requirements\n${spec.designRequirements
        .map((r) => `- ${r}`)
        .join('\n')}`,
    );
  }
  if (
    spec.accessibilityRequirements &&
    spec.accessibilityRequirements.length > 0
  ) {
    sections.push(
      `### Accessibility Requirements\n${spec.accessibilityRequirements
        .map((r) => `- ${r}`)
        .join('\n')}`,
    );
  }
  if (spec.expectedBehaviour) {
    sections.push(`### Expected Behaviour\n${spec.expectedBehaviour}`);
  }

  if (sections.length === 0) {
    return '(No specification defined for this project.)';
  }
  return sections.join('\n\n');
}

function formatStudentFiles(submission: SubmissionPromptInput): string {
  return submission.files
    .map(
      (f) =>
        `#### ${f.name}\n\`\`\`${f.language}\n${f.content || '(empty)'}\n\`\`\``,
    )
    .join('\n\n');
}

function formatTestResults(submission: SubmissionPromptInput): string {
  const run = submission.testRun;
  if (!run) {
    return '(No automated tests were run for this submission.)';
  }
  if (run.error) {
    return `(Automated tests did not complete: ${run.error})`;
  }
  if (run.totalTests === 0) {
    return '(The project has no automated tests.)';
  }

  const lines: string[] = [
    `Summary: ${run.passedTests} / ${run.totalTests} tests passed.`,
    '',
  ];

  for (const r of run.results) {
    const status = r.passed ? 'PASS' : 'FAIL';
    lines.push(`- [${status}] ${r.name}`);
    if (!r.passed && r.message) {
      lines.push(`    ${r.message}`);
    }
  }

  return lines.join('\n');
}

/* ─── Prompt v1: code evaluation ─────────────────────────────────── */

/**
 * Prompt v1 — code evaluator.
 *
 * Target model: `openai/gpt-oss-120b` (text only).
 *
 * Inputs:
 *   - The project specification
 *   - The project rubric (categories and weights)
 *   - The student's source files
 *   - The automated test results (deterministic, treated as fact)
 *
 * Does NOT include screenshots — the target model cannot see them.
 * The vision pass handles visual review separately.
 */
export function buildCodeEvaluationPromptV1(input: {
  project: ProjectPromptInput;
  submission: SubmissionPromptInput;
}): AIMessage[] {
  const { project, submission } = input;

  const system = `You are an expert code reviewer evaluating a student's project submission for a coding bootcamp.

You will be given:
  1. A project specification (what the student was asked to build).
  2. A rubric with weighted categories (how to score them).
  3. The student's source files.
  4. The results of automated tests that were run against the files.

Your task is to score the submission against the rubric and evaluate whether each requirement in the specification was met.

Rules:
  - The automated test results are objective facts. Do NOT contradict them. If a test passed, the behaviour it checks is present. If a test failed, the behaviour is absent or broken.
  - Focus your review on things the automated tests cannot see: code quality, structure, naming, whether the approach is idiomatic, and whether the implementation is complete relative to the specification.
  - Score each rubric category from 0 to its weight. The sum of category scores is the overall score.
  - For each requirement in the specification, state whether it was met and cite specific evidence from the code.
  - Be constructive. Write feedback addressed to the student, not to the instructor.
  - If the submission is incomplete, say so plainly. Do not invent evidence.
  - Respond with valid JSON only. No prose before or after the JSON object.

The JSON response must match this shape exactly:

{
  "score": <integer 0–100>,
  "categoryScores": [
    {
      "category": "<must be one of the rubric category names, spelled exactly>",
      "score": <integer 0–weight>,
      "max": <the category's weight>,
      "notes": "<one or two sentences citing specific code evidence>"
    }
  ],
  "requirementResults": [
    {
      "requirement": "<exact text from the specification>",
      "met": <true | false>,
      "evidence": "<specific code evidence, or 'not implemented'>"
    }
  ],
  "overallFeedback": "<3–6 sentences addressed to the student>"
}`;

  const user = `# Project: ${project.title}

## Specification

${formatSpecification(project)}

## Rubric

${formatRubric(project)}

## Student's Files

${formatStudentFiles(submission)}

## Automated Test Results

${formatTestResults(submission)}

Score this submission against the rubric and evaluate the requirements. Respond with JSON only.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/* ─── Prompt v1: vision evaluation ───────────────────────────────── */

/**
 * Prompt v1 — vision evaluator.
 *
 * Target model: `meta-llama/llama-4-scout-17b-16e-instruct` (vision).
 *
 * Inputs:
 *   - The project specification's design and accessibility
 *     requirements (the visual half of the spec)
 *   - The desktop and mobile screenshots of the rendered submission
 *
 * Does NOT include the student's source code. The vision pass is
 * deliberately scoped to "what does the rendered output look like",
 * not "how is it implemented." That is the code pass's job.
 *
 * A known caveat this prompt must state explicitly: the screenshots
 * were captured from a **script-stripped** copy of the student's
 * HTML. Runtime-generated DOM (a todo list rendered by JavaScript,
 * a fetched API response) will not appear in the screenshots. The
 * model must be told this, or it will penalize an otherwise-correct
 * submission for content that cannot be captured.
 */
export function buildVisionEvaluationPromptV1(input: {
  project: ProjectPromptInput;
  submission: SubmissionPromptInput;
}): AIMessage[] {
  const { project, submission } = input;

  const spec = project.specification ?? {};

  const designReqs =
    spec.designRequirements && spec.designRequirements.length > 0
      ? spec.designRequirements.map((r) => `- ${r}`).join('\n')
      : '(No specific design requirements were listed.)';

  const a11yReqs =
    spec.accessibilityRequirements &&
    spec.accessibilityRequirements.length > 0
      ? spec.accessibilityRequirements.map((r) => `- ${r}`).join('\n')
      : '(No specific accessibility requirements were listed.)';

  const system = `You are evaluating the visual output of a student's web project for a coding bootcamp.

You will be given:
  1. The project's design requirements.
  2. The project's accessibility requirements.
  3. Two screenshots of the student's rendered project: one at desktop width, one at mobile width.

Your task is to review the visual output against the design and accessibility requirements, and comment on layout, typography, spacing, colour use, and responsiveness.

IMPORTANT — capture limitation:

  The screenshots were captured from a copy of the student's HTML with JavaScript stripped out. This was necessary for security (the student's scripts must not run in the evaluator's environment) but it means the screenshots show ONLY the static HTML and CSS.

  Consequences you MUST account for:
    - If the project renders content via JavaScript (a React app, a todo list built with DOM manipulation, data fetched and displayed), the screenshots may appear mostly empty. This is a capture limitation, NOT a defect in the student's work.
    - Do NOT penalize a submission for content that a client-side script would have added at runtime.
    - If the screenshots appear mostly empty, say so honestly in the feedback, and score against what IS visible (page structure, styling of static elements, colours, typography of any static text).

Rules:
  - Score each visual requirement as met / not met based on what is visible.
  - If you cannot tell whether a requirement is met from the screenshots, mark it "met": false and explain in the evidence field why the capture was insufficient.
  - Write feedback addressed to the student.
  - Respond with valid JSON only. No prose before or after the JSON object.

The JSON response must match this shape exactly:

{
  "score": <integer 0–100>,
  "categoryScores": [
    {
      "category": "<must match a category from the code evaluator's rubric, spelled exactly>",
      "score": <integer 0–weight>,
      "max": <the category's weight>,
      "notes": "<one or two sentences citing specific visual evidence>"
    }
  ],
  "requirementResults": [
    {
      "requirement": "<exact text from the design or accessibility requirements>",
      "met": <true | false>,
      "evidence": "<what in the screenshot supports this, or why it cannot be determined>"
    }
  ],
  "overallFeedback": "<3–6 sentences addressed to the student, acknowledging the script-strip caveat if it applies>"
}`;

  /* ─── Build the user message with image parts ──────────────────── */

  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; mimeType: string; dataUrl: string }
  > = [];

  parts.push({
    type: 'text',
    text: `# Project: ${project.title}

## Design Requirements

${designReqs}

## Accessibility Requirements

${a11yReqs}

## Rubric Reference

The following rubric categories are used to score this project. Use the same category names in your response so the scores can be aggregated.

${formatRubric(project)}

## Screenshots

The following images show the student's rendered project.`,
  });

  if (submission.screenshots?.desktop) {
    parts.push({
      type: 'text',
      text: `Desktop viewport (${submission.screenshots.desktop.width}×${submission.screenshots.desktop.height}):`,
    });
    parts.push({
      type: 'image',
      mimeType: 'image/png',
      dataUrl: submission.screenshots.desktop.dataUrl,
    });
  }

  if (submission.screenshots?.mobile) {
    parts.push({
      type: 'text',
      text: `Mobile viewport (${submission.screenshots.mobile.width}×${submission.screenshots.mobile.height}):`,
    });
    parts.push({
      type: 'image',
      mimeType: 'image/png',
      dataUrl: submission.screenshots.mobile.dataUrl,
    });
  }

  parts.push({
    type: 'text',
    text: 'Evaluate the visual output against the design and accessibility requirements. Respond with JSON only.',
  });

  return [
    { role: 'system', content: system },
    { role: 'user', content: parts },
  ];
}

/* ─── Public dispatch ────────────────────────────────────────────── */

export type PromptVersion = 'v1';

export function buildCodeEvaluationPrompt(input: {
  project: ProjectPromptInput;
  submission: SubmissionPromptInput;
  promptVersion: PromptVersion;
}): AIMessage[] {
  switch (input.promptVersion) {
    case 'v1':
      return buildCodeEvaluationPromptV1({
        project: input.project,
        submission: input.submission,
      });
    default: {
      const _exhaustive: never = input.promptVersion;
      throw new Error(`Unknown code prompt version: ${_exhaustive}`);
    }
  }
}

export function buildVisionEvaluationPrompt(input: {
  project: ProjectPromptInput;
  submission: SubmissionPromptInput;
  promptVersion: PromptVersion;
}): AIMessage[] {
  switch (input.promptVersion) {
    case 'v1':
      return buildVisionEvaluationPromptV1({
        project: input.project,
        submission: input.submission,
      });
    default: {
      const _exhaustive: never = input.promptVersion;
      throw new Error(`Unknown vision prompt version: ${_exhaustive}`);
    }
  }
}