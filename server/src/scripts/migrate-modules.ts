import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Module } from '../models/Module.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for the Course > Module > Lesson hierarchy.
 *
 * For every course that has at least one lesson with no `moduleId`:
 *   1. Create one module named "Lessons" at order 1.
 *   2. Assign every ungrouped lesson in that course to it.
 *
 * Idempotent. Safe to re-run. Courses whose lessons already have a
 * `moduleId` are skipped.
 *
 * Courses that already have modules (created after the schema change)
 * are also skipped — the migration only creates the implicit "Lessons"
 * module for courses that predate the module feature.
 *
 * Usage:
 *   npm run migrate:modules -w server
 */
async function migrate() {
  console.log('🔧 Migrating courses to the module hierarchy...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const courses = await Course.find({}).select('_id title slug').lean();
  console.log(`   Courses to consider: ${courses.length}`);

  let coursesCreatedModule = 0;
  let lessonsAssigned = 0;
  let coursesSkipped = 0;

  for (const course of courses) {
    const courseId = course._id.toString();

    // Does this course already have modules? If so, skip — the author
    // has already organized it.
    const existingModuleCount = await Module.countDocuments({ courseId });
    if (existingModuleCount > 0) {
      coursesSkipped++;
      continue;
    }

    // Does this course have any lessons at all?
    const ungrouped = await Lesson.find({
      courseId,
      moduleId: { $in: [undefined, null, ''] },
    }).select('_id').lean();

    if (ungrouped.length === 0) {
      // No lessons to migrate. Skip creating an empty "Lessons" module.
      coursesSkipped++;
      continue;
    }

    // Create the implicit module.
    const mod = await Module.create({
      courseId,
      title: 'Lessons',
      order: 1,
    });
    coursesCreatedModule++;

    // Assign every ungrouped lesson to it.
    const ids = ungrouped.map((l) => l._id);
    const result = await Lesson.updateMany(
      { _id: { $in: ids } },
      { $set: { moduleId: mod._id.toString() } }
    );
    lessonsAssigned += result.modifiedCount;

    console.log(
      `   → ${course.slug}: created "Lessons" module, assigned ${result.modifiedCount} lesson(s)`
    );
  }

  console.log(`✅ Modules created: ${coursesCreatedModule}`);
  console.log(`✅ Lessons assigned: ${lessonsAssigned}`);
  console.log(`✅ Courses skipped (already modular or empty): ${coursesSkipped}`);
  console.log('🎉 Migration complete.');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Module migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});