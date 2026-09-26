import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { validateSqlSetup } from './sqlSetupValidator.js';
import {
  allocateProblemId,
  inferProblemKind,
} from './problemNumber.service.js';
import { z } from 'zod';

/* ─── Zod schemas ────────────────────────────────────────────────── */

const testCaseSchema = z
  .object({
    input: z.string().default(''),
    expectedOutput: z.string().min(1),
    isHidden: z.boolean().default(false),
  })
  .strict();

const problemSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topics: z.array(z.string()).default([]),
  statement: z.string().min(10),
  functionName: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  outputMode: z.enum(['return', 'print']).default('return'),
  starterCode: z.record(z.string()).default({}),
  testCases: z.array(testCaseSchema).min(1),
  sqlSetup: z.string().optional(),
  scope: z.enum(['global', 'course']).default('global'),
  courseId: z.string().optional(),
  tier: z.enum(['starter', 'interview']).default('starter'),
});

const projectFileSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown']),
  content: z.string().default(''),
  isEntry: z.boolean().optional(),
});

const rubricCategorySchema = z
  .object({
    category: z.string().min(1).max(60),
    weight: z.number().int().min(0).max(100),
  })
  .strict();

const specificationSchema = z
  .object({
    objective: z.string().max(2000).optional(),
    requiredFeatures: z.array(z.string()).optional(),
    technicalRequirements: z.array(z.string()).optional(),
    designRequirements: z.array(z.string()).optional(),
    accessibilityRequirements: z.array(z.string()).optional(),
    expectedBehaviour: z.string().max(4000).optional(),
  })
  .strict();

const projectSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().min(5).max(500),
  longDescription: z.string().default(''),
  category: z.enum(['frontend', 'react', 'api', 'sql', 'dataviz', 'javascript']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()).default([]),
  files: z.array(projectFileSchema).min(1),
  previewMode: z.enum(['html', 'react', 'sql', 'none']).default('html'),
  instructions: z.string().default(''),
  estimatedMinutes: z.number().int().min(5).max(600).default(60),
  xpReward: z.number().int().min(0).max(1000).default(100),

  mode: z.enum(['required', 'recommended', 'open_choice']).default('required'),
  specification: specificationSchema.default({}),
  rubric: z.array(rubricCategorySchema).default([]),
});

const lessonSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(1),
  content: z.string().min(1),
  starterCode: z.string().default(''),
  solution: z.string().default(''),
  functionName: z.string().min(1).default('solve'),
  outputMode: z.enum(['return', 'print']).default('print'),
  testCases: z.array(testCaseSchema).default([]),
});

const courseSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().min(5).max(1000),
  language: z.enum([
    'html-css',
    'javascript',
    'typescript',
    'python',
    'ruby',
    'java',
    'sql',
    'react',
    'tailwind',
    'dsa-python',
    'dsa-javascript',
  ]),
  lessons: z.array(lessonSchema).min(1),
});

/* ─── Types ──────────────────────────────────────────────────────── */

export type ImportMode = 'merge' | 'replace';

export interface ImportReport {
  created: number;
  updated: number;
  skipped: number;
  failed: { index: number; slug?: string; error: string }[];
  totalProcessed: number;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function zipValidationErrors(
  items: unknown[],
  schema: z.ZodSchema
): { valid: unknown[]; errors: ImportReport['failed'] } {
  const valid: unknown[] = [];
  const errors: ImportReport['failed'] = [];

  items.forEach((item, i) => {
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      const slug =
        typeof item === 'object' && item !== null && 'slug' in item
          ? String((item as { slug: unknown }).slug)
          : undefined;
      errors.push({
        index: i,
        slug,
        error: parsed.error.issues
          .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
          .join('; '),
      });
    } else {
      valid.push(parsed.data);
    }
  });

  return { valid, errors };
}

/* ─── Service ────────────────────────────────────────────────────── */

export const bulkService = {
  async importProblems(
    items: unknown,
    mode: ImportMode,
    dryRun: boolean
  ): Promise<ImportReport> {
    if (!Array.isArray(items)) {
      throw new ApiError(400, 'Payload must be a JSON array');
    }

    const report: ImportReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: [],
      totalProcessed: items.length,
    };

    const { valid, errors } = zipValidationErrors(items, problemSchema);
    report.failed = errors;

    const structurallyValid: unknown[] = [];
    valid.forEach((item, i) => {
      const candidate = item as { slug: string; sqlSetup?: string };
      try {
        validateSqlSetup(candidate.sqlSetup);
        structurallyValid.push(item);
      } catch (err) {
        report.failed.push({
          index: i,
          slug: candidate.slug,
          error:
            err instanceof ApiError
              ? err.message
              : 'sqlSetup failed structural validation',
        });
      }
    });

    const scopeValid: unknown[] = [];
    structurallyValid.forEach((item, i) => {
      const c = item as {
        slug: string;
        scope: 'global' | 'course';
        courseId?: string;
      };
      if (c.scope === 'course' && !c.courseId) {
        report.failed.push({
          index: i,
          slug: c.slug,
          error: 'courseId is required when scope is "course"',
        });
        return;
      }
      scopeValid.push(item);
    });

    const seenSlugs = new Set<string>();
    const deduped: unknown[] = [];
    scopeValid.forEach((item, i) => {
      const { slug } = item as { slug: string };
      if (seenSlugs.has(slug)) {
        report.failed.push({
          index: i,
          slug,
          error: 'Duplicate slug within import batch',
        });
        return;
      }
      seenSlugs.add(slug);
      deduped.push(item);
    });

    if (dryRun) return report;

    if (mode === 'replace') {
      await Problem.deleteMany({});
    }

    for (const item of deduped) {
      const doc = item as {
        slug: string;
        starterCode: Record<string, string>;
      };
      const existing = await Problem.findOne({ slug: doc.slug });

      if (existing) {
        if (mode === 'merge') {
          const { ...rest } = doc;
          Object.assign(existing, rest);
          await existing.save();
          report.updated++;
        } else {
          const kind = inferProblemKind(doc.starterCode);
          const problemId = await allocateProblemId(kind);
          await Problem.create({ ...doc, problemId });
          report.created++;
        }
      } else {
        const kind = inferProblemKind(doc.starterCode);
        const problemId = await allocateProblemId(kind);
        await Problem.create({ ...doc, problemId });
        report.created++;
      }
    }

    return report;
  },

  async importProjects(
    items: unknown,
    mode: ImportMode,
    dryRun: boolean
  ): Promise<ImportReport> {
    if (!Array.isArray(items)) {
      throw new ApiError(400, 'Payload must be a JSON array');
    }

    const report: ImportReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: [],
      totalProcessed: items.length,
    };

    const { valid, errors } = zipValidationErrors(items, projectSchema);
    report.failed = errors;

    // Rubric-sum validation.
    const rubricValid: unknown[] = [];
    valid.forEach((item, i) => {
      const p = item as {
        slug: string;
        rubric?: { weight: number }[];
      };
      const rubric = p.rubric ?? [];
      if (rubric.length > 0) {
        const total = rubric.reduce((sum, r) => sum + r.weight, 0);
        if (total !== 100) {
          report.failed.push({
            index: i,
            slug: p.slug,
            error: `Rubric weights must sum to 100 (got ${total}).`,
          });
          return;
        }
      }
      rubricValid.push(item);
    });

    if (dryRun) return report;

    if (mode === 'replace') {
      await Project.deleteMany({});
    }

    for (const item of rubricValid) {
      const doc = item as { slug: string };
      const existing = await Project.findOne({ slug: doc.slug });
      if (existing) {
        if (mode === 'merge') {
          Object.assign(existing, item);
          await existing.save();
          report.updated++;
        } else {
          await Project.create(item);
          report.created++;
        }
      } else {
        await Project.create(item);
        report.created++;
      }
    }

    return report;
  },

  async importCourses(
    items: unknown,
    mode: ImportMode,
    dryRun: boolean,
    importerId: string
  ): Promise<ImportReport> {
    if (!Array.isArray(items)) {
      throw new ApiError(400, 'Payload must be a JSON array');
    }

    const report: ImportReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: [],
      totalProcessed: items.length,
    };

    const { valid, errors } = zipValidationErrors(items, courseSchema);
    report.failed = errors;

    if (dryRun) return report;

    for (const item of valid) {
      const courseData = item as z.infer<typeof courseSchema>;
      const existing = await Course.findOne({ slug: courseData.slug });

      if (existing && mode === 'merge') {
        Object.assign(existing, {
          title: courseData.title,
          description: courseData.description,
          language: courseData.language,
          totalLessons: courseData.lessons.length,
        });
        await existing.save();

        await Lesson.deleteMany({ courseId: existing._id.toString() });
        for (const l of courseData.lessons) {
          await Lesson.create({
            ...l,
            courseId: existing._id.toString(),
            language: courseData.language,
          });
        }
        report.updated++;
      } else {
        const created = await Course.create({
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          language: courseData.language,
          totalLessons: courseData.lessons.length,
          createdBy: importerId,
          published: false,
        });
        for (const l of courseData.lessons) {
          await Lesson.create({
            ...l,
            courseId: created._id.toString(),
            language: courseData.language,
          });
        }
        report.created++;
      }
    }

    return report;
  },
};