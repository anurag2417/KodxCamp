import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Problem } from '../models/Problem.model.js';
import { Counter } from '../models/Counter.model.js';
import { Course } from '../models/Course.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for the Batch 3 problem system.
 *
 * For every problem missing a `problemId`:
 *   1. Infer programming vs SQL from `starterCode`.
 *   2. Assign the next free number in the appropriate range.
 *
 * Then set defaults:
 *   - `scope`   -> 'global'
 *   - `tier`    -> 'starter'
 *
 * Then reclassify the Web Dev practice problems (slugs starting with
 * `web-`) as course-scoped, attached to the HTML/CSS course.
 *
 * Idempotent. Safe to run multiple times.
 *
 * Usage:
 *   npm run migrate:problems -w server
 */
async function migrate() {
  console.log('🔧 Migrating problems for Batch 3...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const problems = await Problem.find().sort({ _id: 1 });
  console.log(`   Problems found: ${problems.length}`);

  let assigned = 0;
  let scopeSet = 0;
  let courseScoped = 0;

  // Find the HTML/CSS course once, for the Web Dev problems.
  const htmlCssCourse = await Course.findOne({ slug: 'html-css' })
    .select('_id')
    .lean();
  if (!htmlCssCourse) {
    console.warn('⚠️  HTML/CSS course not found; Web Dev problems will not be reclassified.');
  }

  for (const problem of problems) {
    const updates: Record<string, unknown> = {};
    let dirty = false;

    // 1. problemId
    if (!problem.problemId) {
      const isSql = Object.prototype.hasOwnProperty.call(
        problem.starterCode ?? {},
        'sql'
      );
      const counterId = isSql ? 'problem_sql' : 'problem_programming';
      const base = isSql ? 20000 : 10000;

      const doc = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      const seq = doc?.seq ?? 1;
      updates.problemId = base + seq;
      assigned++;
      dirty = true;
      console.log(
        `   → ${problem.slug}: ${updates.problemId} (${isSql ? 'SQL' : 'programming'})`
      );
    }

    // 2. scope
    if (!problem.scope) {
      updates.scope = 'global';
      scopeSet++;
      dirty = true;
    }

    // 3. tier
    if (!problem.tier) {
      updates.tier = 'starter';
      dirty = true;
    }

    // 4. Course-scope the Web Dev problems.
    if (
      htmlCssCourse &&
      problem.slug.startsWith('web-') &&
      problem.scope !== 'course'
    ) {
      updates.scope = 'course';
      updates.courseId = htmlCssCourse._id.toString();
      courseScoped++;
      dirty = true;
      console.log(`   → ${problem.slug}: reclassified as course-scoped`);
    }

    if (dirty) {
      await Problem.updateOne(
        { _id: problem._id },
        { $set: updates },
        { runValidators: false }
      );
    }
  }

  console.log(`✅ problemId assigned: ${assigned}`);
  console.log(`✅ scope defaulted to global: ${scopeSet}`);
  console.log(`✅ course-scoped: ${courseScoped}`);
  console.log('🎉 Migration complete.');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Problem migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});