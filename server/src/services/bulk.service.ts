import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { z } from 'zod';
import crypto from 'node:crypto';

const canonicalizationSchema = z.enum([
  'trim-trailing-newline',
  'trim-all',
  'exact',
]);

type Canonicalization = z.infer<typeof canonicalizationSchema>;

function canonicalize(value: string, mode: Canonicalization): string {
  switch (mode) {
    case 'trim-all':
      return value.trim();
    case 'exact':
      return value;
    case 'trim-trailing-newline':
      return value.replace(/(?:\r\n|\n|\r)+$/, '');
  }
}

const visibleTestCaseSchema = z
  .object({
    input: z.string().default(''),
    isHidden: z.literal(false).default(false),
    expectedOutput: z.string().min(1),
  })
  .strict();

const hiddenTestCaseSchema = z
  .object({
    input: z.string().default(''),
    isHidden: z.literal(true),
    expectedOutputHash: z.string().regex(/^[0-9a-f]{64}$/),
    canonicalization: canonicalizationSchema.default('trim-trailing-newline'),
  })
  .strict();

/**
 * Bulk import accepts EITHER the hashed form OR a plaintext
 * `expectedOutput` for hidden tests — because a bulk JSON file is a
 * convenient place to store the expected output in plaintext and let
 * the server hash it. The hash is computed here, in-process, and the
 * plaintext is discarded immediately.
 */
const testCaseSchema = z.union([
  visibleTestCaseSchema,
  hiddenTestCaseSchema,
  z
    .object({
      input: z.string().default(''),
      isHidden: z.literal(true),
      expectedOutput: z.string().min(1),
      canonicalization: canonicalizationSchema.default('trim-trailing-newline'),
    })
    .strict(),
]);

function materializeTestCase(raw: unknown) {
  const tc = raw as {
    input: string;
    isHidden: boolean;
    expectedOutput?: string;
    expectedOutputHash?: string;
    canonicalization?: 'trim-trailing-newline' | 'trim-all' | 'exact';
  };

  if (!tc.isHidden) {
    return {
      input: tc.input ?? '',
      isHidden: false,
      expectedOutput: tc.expectedOutput ?? '',
    };
  }

  if (tc.expectedOutputHash) {
    return {
      input: tc.input ?? '',
      isHidden: true,
      expectedOutputHash: tc.expectedOutputHash,
      canonicalization: tc.canonicalization ?? 'trim-trailing-newline',
    };
  }

  const canon = tc.canonicalization ?? 'trim-trailing-newline';
  const hash = crypto
    .createHash('sha256')
    .update(canonicalize(tc.expectedOutput!, canon))
    .digest('hex');
  return {
    input: tc.input ?? '',
    isHidden: true,
    expectedOutputHash: hash,
    canonicalization: canon,
  };
}

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
  number: z.number().int().positive().optional(),
});

const projectFileSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['html', 'css', 'javascript', 'jsx', 'sql', 'json', 'markdown']),
  content: z.string().default(''),
  isEntry: z.boolean().optional(),
});

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
    'sql',
    'react',
    'tailwind',
    'dsa-python',
    'dsa-javascript',
  ]),
  lessons: z.array(lessonSchema).min(1),
});

export type ImportMode = 'merge' | 'replace';

export interface ImportReport {
  created: number;
  updated: number;
  skipped: number;
  failed: { index: number; slug?: string; error: string }[];
  totalProcessed: number;
}

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

async function nextProblemNumber(): Promise<number> {
  const last = await Problem.findOne().sort({ number: -1 }).select('number').lean();
  return (last?.number ?? 0) + 1;
}

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

    const seenSlugs = new Set<string>();
    const seenNumbers = new Set<number>();
    const deduped: unknown[] = [];
    valid.forEach((item, i) => {
      const { slug, number } = item as { slug: string; number?: number };
      if (seenSlugs.has(slug)) {
        report.failed.push({
          index: i,
          slug,
          error: 'Duplicate slug within import batch',
        });
        return;
      }
      if (number !== undefined && seenNumbers.has(number)) {
        report.failed.push({
          index: i,
          slug,
          error: `Duplicate problem number ${number} within import batch`,
        });
        return;
      }
      seenSlugs.add(slug);
      if (number !== undefined) seenNumbers.add(number);
      deduped.push(item);
    });

    if (dryRun) return report;

    if (mode === 'replace') {
      await Problem.deleteMany({});
    }

    for (const item of deduped) {
      const doc = item as {
        slug: string;
        number?: number;
        testCases: unknown[];
      };
      // Materialize hidden test cases (hash plaintext if present).
      const materialized = {
        ...doc,
        testCases: (doc.testCases ?? []).map(materializeTestCase),
      };

      const existing = await Problem.findOne({ slug: doc.slug });

      if (existing) {
        if (mode === 'merge') {
          const { number, ...rest } = materialized;
          Object.assign(existing, rest);
          if (number !== undefined && number !== existing.number) {
            const clash = await Problem.findOne({ number }).lean();
            if (clash && clash._id.toString() !== existing._id.toString()) {
              report.failed.push({
                index: report.created + report.updated,
                slug: doc.slug,
                error: `Problem number ${number} already used by "${clash.title}"`,
              });
              continue;
            }
            existing.number = number;
          }
          await existing.save();
          report.updated++;
        } else {
          const num = doc.number ?? (await nextProblemNumber());
          await Problem.create({ ...materialized, number: num });
          report.created++;
        }
      } else {
        const num = doc.number ?? (await nextProblemNumber());
        const clash = await Problem.findOne({ number: num }).lean();
        if (clash) {
          report.failed.push({
            index: report.created + report.updated,
            slug: doc.slug,
            error: `Problem number ${num} already used by "${clash.title}"`,
          });
          continue;
        }
        await Problem.create({ ...materialized, number: num });
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

    if (dryRun) return report;

    if (mode === 'replace') {
      await Project.deleteMany({});
    }

    for (const item of valid) {
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

    const { valid, errors } = zipValidationErrors(items, courseSchema);
    report.failed = errors;

    if (dryRun) return report;

    for (const item of valid) {
      const courseData = item as z.infer<typeof courseSchema>;
      const existing = await Course.findOne({ slug: courseData.slug });

      const materializedLessons = courseData.lessons.map((l) => ({
        ...l,
        testCases: (l.testCases ?? []).map(materializeTestCase),
      }));

      if (existing && mode === 'merge') {
        Object.assign(existing, {
          title: courseData.title,
          description: courseData.description,
          language: courseData.language,
          totalLessons: materializedLessons.length,
        });
        await existing.save();

        await Lesson.deleteMany({ courseId: existing._id.toString() });
        for (const l of materializedLessons) {
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
          totalLessons: materializedLessons.length,
        });
        for (const l of materializedLessons) {
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