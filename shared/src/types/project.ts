/**
 * Projects.
 *
 * Master Spec, section 8:
 *   "Every project must have one of these modes:
 *      Required     — everyone must build the exact project
 *      Recommended  — instructor provides a default; student may pick an alternative
 *      Open Choice  — instructor defines outcomes; student builds whatever meets them."
 *
 * And section 12:
 *   "Every project should have explicit requirements:
 *      Functional, Technical, Design, Accessibility, Expected Behaviour."
 *
 * And section 13:
 *   "Projects should use automated tests wherever possible. Automated
 *    tests are responsible for objective checks."
 *
 * A project is a snapshot-able container. The student works in a
 * `UserProject` (their live workspace) and submits via `ProjectSubmission`
 * rows that are never overwritten. The last submission is not "the
 * submission" — every attempt is its own row.
 */

export type ProjectCategory =
  | 'frontend'
  | 'react'
  | 'api'
  | 'sql'
  | 'dataviz'
  | 'javascript';

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ProjectPreviewMode = 'html' | 'react' | 'sql' | 'none';

/**
 * Master Spec, section 8 — Project Modes.
 */
export type ProjectMode = 'required' | 'recommended' | 'open_choice';

export type ProjectFileLang =
  | 'html'
  | 'css'
  | 'javascript'
  | 'jsx'
  | 'sql'
  | 'json'
  | 'markdown';

export interface IProjectFile {
  name: string;
  language: ProjectFileLang;
  content: string;
  isEntry?: boolean;
}

export interface IProjectRubricCategory {
  category: string;
  weight: number;
}

export interface IProjectSpecification {
  objective?: string;
  requiredFeatures?: string[];
  technicalRequirements?: string[];
  designRequirements?: string[];
  accessibilityRequirements?: string[];
  expectedBehaviour?: string;
}

/* ─── Automated tests ────────────────────────────────────────────── */

/**
 * A `dom-*` assertion. Used both as a top-level test and as the
 * post-action assertion of an `event-*` test. That's the entire
 * grammar — two levels deep, no recursion.
 *
 * Every check is deterministic and runs client-side. The engine that
 * evaluates them lives in
 * `client/src/shared/runner/projectTestEngine.ts`.
 */
export type DomAssertion =
  | {
      type: 'dom-exists';
      selector: string;
    }
  | {
      type: 'dom-text';
      selector: string;
      mode: 'equals' | 'matches';
      value: string;
    }
  | {
      type: 'dom-attribute';
      selector: string;
      attribute: string;
      value: string;
    }
  | {
      type: 'dom-count';
      selector: string;
      count: number;
    };

/**
 * The full test grammar. `dom-*` tests stand alone. `event-*` tests
 * first perform an interaction, then assert a `dom-*` condition. The
 * `visual-nonblank` test checks that the rendered page has non-trivial
 * content, which is the closest we get to a structural existence
 * check without pixel diffing.
 */
export type ProjectTest =
  | DomAssertion
  | {
      type: 'event-click';
      selector: string;
      assert: DomAssertion;
    }
  | {
      type: 'event-input';
      selector: string;
      value: string;
      assert: DomAssertion;
    }
  | {
      type: 'visual-nonblank';
      /** Minimum number of visible text characters to consider "non-blank". */
      minimumChars: number;
    };

/**
 * A named test. The name is the display label; the check is what runs.
 */
export interface IProjectTest {
  name: string;
  check: ProjectTest;
  /**
   * Optional human-readable description of what the test verifies.
   * Shown to the instructor in the test editor and, when a test fails,
   * to the student as a "what was expected" hint.
   */
  description?: string;
}

/* ─── Test run results ───────────────────────────────────────────── */

export interface IProjectTestResult {
  name: string;
  check: ProjectTest;
  passed: boolean;
  /**
   * Actual value observed. Format depends on the check type:
   *   dom-exists      -> "found" | "not found"
   *   dom-text        -> the element's actual text
   *   dom-attribute   -> the attribute's actual value or "(missing)"
   *   dom-count       -> the actual count as a string
   *   event-click     -> same as the nested assertion
   *   event-input     -> same as the nested assertion
   *   visual-nonblank -> the actual visible character count
   */
  actual: string;
  /**
   * Human-readable failure message. Undefined when `passed` is true.
   */
  message?: string;
}

export interface IProjectTestRun {
  /** Total number of tests run. */
  totalTests: number;
  passedTests: number;
  failedTests: number;
  /** True iff every test passed. */
  allPassed: boolean;
  /** Total wall-clock duration of the run, in milliseconds. */
  durationMs: number;
  /** Per-test results, in the order the tests were defined. */
  results: IProjectTestResult[];
  /** When the run was performed (client clock). */
  ranAt: Date;
  /**
   * Set when the run could not be performed at all (e.g. the
   * sandboxed iframe refused to load). Never set when individual
   * tests failed.
   */
  error?: string;
}

/* ─── Screenshots ────────────────────────────────────────────────── */

/**
 * A single rendered screenshot. Stored as a base64 PNG data URL.
 * `width` and `height` are the viewport dimensions the screenshot was
 * captured at, not the resulting image's pixel dimensions.
 */
export interface IProjectScreenshot {
  viewport: 'desktop' | 'mobile';
  width: number;
  height: number;
  /** data:image/png;base64,... */
  dataUrl: string;
}

export interface IProjectScreenshotSet {
  desktop?: IProjectScreenshot;
  mobile?: IProjectScreenshot;
  /**
   * Set when any screenshot failed to capture. The successful
   * captures (if any) are still present in `desktop` / `mobile`.
   */
  error?: string;
}

/* ─── Project ────────────────────────────────────────────────────── */

export interface IProject {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  topics: string[];
  thumbnail?: string;
  files: IProjectFile[];
  previewMode: ProjectPreviewMode;
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;

  /** Master Spec, section 8. */
  mode: ProjectMode;

  /** Master Spec, section 12. */
  specification: IProjectSpecification;

  /**
   * Master Spec, section 21. Weights must sum to 100 when non-empty.
   */
  rubric: IProjectRubricCategory[];

  /**
   * Master Spec, section 13. Ordered. Every test runs on every
   * submission; the pass/fail count is part of the submission record.
   */
  tests: IProjectTest[];

  createdAt: Date;
  updatedAt: Date;
}

/* ─── Submissions ────────────────────────────────────────────────── */

export type ProjectSubmissionStatus =
  | 'submitted'
  | 'ai_evaluated'
  | 'instructor_reviewed'
  | 'passed'
  | 'needs_improvement'
  | 'resubmission_requested';

export interface IProjectSubmission {
  _id: string;
  userId: string;
  projectId: string;
  attemptNumber: number;
  files: IProjectFile[];
  status: ProjectSubmissionStatus;
  submittedAt: Date;
  notes?: string;

  /**
   * The result of running the project's automated tests against the
   * submitted files. Set on submit when the project has tests. Absent
   * for submissions made before this batch or when the runner failed.
   */
  testRun?: IProjectTestRun;

  /**
   * The result of rendering the submitted files at desktop and mobile
   * viewports and capturing screenshots. Set on submit for web
   * projects. Absent for programming projects and when capture failed.
   */
  screenshots?: IProjectScreenshotSet;

  createdAt: Date;
  updatedAt: Date;
}