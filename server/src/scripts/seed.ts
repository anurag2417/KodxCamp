import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

import { User } from '../models/User.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Module } from '../models/Module.model.js';
import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { Roadmap } from '../models/Roadmap.model.js';
import { Class } from '../models/Class.model.js';
import { Cohort } from '../models/Cohort.model.js';
import { CohortMembership } from '../models/CohortMembership.model.js';
import { CourseMembership } from '../models/CourseMembership.model.js';
import { Announcement } from '../models/Announcement.model.js';
import { Progress } from '../models/Progress.model.js';
import { Activity } from '../models/Activity.model.js';
import { Submission } from '../models/Submission.model.js';
import { ProjectSubmission } from '../models/ProjectSubmission.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { InstructorEvaluation } from '../models/InstructorEvaluation.model.js';
import { AIEvaluation } from '../models/AIEvaluation.model.js';
import { Counter } from '../models/Counter.model.js';
import { Achievement } from '../models/Achievement.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';
import { Notification } from '../models/Notification.model.js';

import { accounts } from './seed-data/accounts.js';
import { courses } from './seed-data/courses.js';
import { roadmaps } from './seed-data/roadmaps.js';
import { problems } from './seed-data/problems.js';
import { sqlProblems } from './seed-data/sql-problems.js';
import { projects } from './seed-data/projects.js';
import { classes } from './seed-data/classes.js';
import { cohorts } from './seed-data/cohorts.js';
import { announcements } from './seed-data/announcements.js';
import { progress as progressFixture } from './seed-data/progress.js';


/* ─────────────────────────────────────────────────────────────────
   Flags
   ───────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const force = args.includes('--force');
const wipeUsers = args.includes('--wipe-users');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',') : null;

const should = (kind: string) => !only || only.includes(kind);

/* ─────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────── */

const day = 24 * 60 * 60 * 1000;

function dayString(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * day);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * day);
}

async function hashPassword(p: string): Promise<string> {
  return bcrypt.hash(p, 12);
}

/* ─────────────────────────────────────────────────────────────────
   Wipe
   ───────────────────────────────────────────────────────────────── */

async function wipeContent(): Promise<void> {
  console.log('🧹 Wiping content collections...');

  await Promise.all([
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Module.deleteMany({}),
    Problem.deleteMany({}),
    Project.deleteMany({}),
    Roadmap.deleteMany({}),
    Class.deleteMany({}),
    Cohort.deleteMany({}),
    CohortMembership.deleteMany({}),
    CourseMembership.deleteMany({}),
    Announcement.deleteMany({}),
    Progress.deleteMany({}),
    Activity.deleteMany({}),
    Submission.deleteMany({}),
    ProjectSubmission.deleteMany({}),
    UserProject.deleteMany({}),
    InstructorEvaluation.deleteMany({}),
    AIEvaluation.deleteMany({}),
    UserAchievement.deleteMany({}),
    Notification.deleteMany({}),
    Achievement.deleteMany({}),
  ]);

  // Reset problem counters so problemIds are stable across runs.
  await Counter.updateOne(
    { _id: 'problem_programming' },
    { $set: { seq: 10000 } },
    { upsert: true }
  );
  await Counter.updateOne(
    { _id: 'problem_sql' },
    { $set: { seq: 20000 } },
    { upsert: true }
  );

  console.log('  ✅ Content wiped, counters reset.');
}

/* ─────────────────────────────────────────────────────────────────
   Accounts
   ───────────────────────────────────────────────────────────────── */

async function seedAccounts(): Promise<Map<string, string>> {
  console.log('👤 Seeding accounts...');

  if (wipeUsers) {
    await User.deleteMany({});
    console.log('  🧹 Wiped users as requested.');
  }

  const idByKey = new Map<string, string>();

  for (const a of accounts) {
    const passwordHash = await hashPassword(a.password);
    const doc = await User.findOneAndUpdate(
      { email: a.email },
      {
        $set: {
          name: a.name,
          email: a.email,
          password: passwordHash,
          role: a.role,
          permissions: a.permissions ?? [],
          emailVerified: true,
          accountStatus: 'active',
          authProvider: 'email',
        },
        $setOnInsert: {
          xp: 0,
          streak: 0,
        },
      },
      { upsert: true, new: true }
    );
    idByKey.set(a.key, doc._id.toString());
    console.log(`  ✅ ${a.email} (${a.role})`);
  }

  return idByKey;
}

/* ─────────────────────────────────────────────────────────────────
   Courses + lessons
   ───────────────────────────────────────────────────────────────── */

async function seedCourses(
  adminId: string,
  instructorId: string
): Promise<Map<string, string>> {
  console.log('📚 Seeding courses...');
  const courseIdBySlug = new Map<string, string>();

  for (const c of courses) {
    // 1. Create the course doc first (we need its _id for lessons).
    const courseDoc = await Course.create({
      title: c.title,
      slug: c.slug,
      description: c.description,
      language: c.language,
      courseType: c.courseType ?? 'general',
      totalLessons: c.lessons.length,
      createdBy: adminId,
      published: c.published,
      isFree: c.isFree ?? true,
      price: c.price,
      originalPrice: c.originalPrice,
      tagline: c.tagline,
      tags: c.tags ?? [],
      badge: c.badge,
      heroVideoUrl: c.heroVideoUrl,
      features: c.features ?? [],
      sellingPoints: c.sellingPoints ?? [],
      sellingHeadline: c.sellingHeadline,
      learningOutcomes: c.learningOutcomes ?? [],
      curriculum: c.curriculum ?? [],
      projects: c.projects ?? [],
      instructor: c.instructor,
      certificateIncluded: c.certificateIncluded ?? false,
      faq: c.faq ?? [],
    });
    courseIdBySlug.set(c.slug, courseDoc._id.toString());

    // 2. Create lessons.
    const lessonIdBySlug = new Map<string, string>();
    for (let i = 0; i < c.lessons.length; i++) {
      const l = c.lessons[i];
      const doc = await Lesson.create({
        courseId: courseDoc._id.toString(),
        title: l.title,
        slug: l.slug,
        order: i + 1,
        content: l.content,
        contentType: l.contentType ?? 'lesson',
        starterCode: l.starterCode,
        starterFiles: l.starterFiles,
        webChecks: l.webChecks,
        solution: l.solution,
        problemSlug: l.problemSlug,
        functionName: l.functionName ?? 'solve',
        outputMode: l.outputMode ?? 'print',
        language: c.language,
        testCases: l.testCases ?? [],
        steps: (l.steps ?? []).map((s) => ({
          title: s.title,
          instructions: s.instructions,
          hint: s.hint,
          starterFiles: {
            'index.html': s.starterFiles['index.html'] ?? '',
            'styles.css': s.starterFiles['styles.css'] ?? '',
            'script.js': s.starterFiles['script.js'] ?? '',
          },
          webChecks: s.webChecks,
        })),
        tutorialChallenges: l.tutorialChallenges ?? [],
      });
      lessonIdBySlug.set(l.slug, doc._id.toString());
    }

    // 3. Create modules if the course defines them.
    if (c.modules && c.modules.length > 0) {
      for (let i = 0; i < c.modules.length; i++) {
        const m = c.modules[i];
        const moduleDoc = await Module.create({
          courseId: courseDoc._id.toString(),
          title: m.title,
          description: m.description,
          order: i + 1,
        });
        // Assign lessons to the module.
        for (const slug of m.lessonSlugs) {
          const lessonId = lessonIdBySlug.get(slug);
          if (!lessonId) {
            console.warn(
              `    ⚠️  Module "${m.title}" references unknown lesson "${slug}"`
            );
            continue;
          }
          await Lesson.updateOne(
            { _id: lessonId },
            { $set: { moduleId: moduleDoc._id.toString() } }
          );
        }
      }
    }

    console.log(
      `  ✅ ${c.title} (${c.lessons.length} lessons, ${
        c.modules?.length ?? 0
      } modules)`
    );
  }

  // Give the course-author account a course_author membership on the
  // first course so the three-axis auth model can be tested.
  const firstCourseId = courseIdBySlug.get(courses[0].slug);
  const courseAuthorAccount = accounts.find((a) => a.key === 'course-author');
  const taAccount = accounts.find((a) => a.key === 'ta');
  if (firstCourseId && courseAuthorAccount) {
    const authorId = (
      await User.findOne({ email: courseAuthorAccount.email })
    )?._id.toString();
    if (authorId) {
      await CourseMembership.updateOne(
        { userId: authorId, courseId: firstCourseId },
        {
          $set: {
            role: 'course_author',
            addedAt: new Date(),
            addedBy: instructorId,
          },
        },
        { upsert: true }
      );
    }
  }
  if (firstCourseId && taAccount) {
    const taId = (await User.findOne({ email: taAccount.email }))?._id.toString();
    if (taId) {
      await CourseMembership.updateOne(
        { userId: taId, courseId: firstCourseId },
        {
          $set: {
            role: 'ta',
            addedAt: new Date(),
            addedBy: instructorId,
          },
        },
        { upsert: true }
      );
    }
  }

  return courseIdBySlug;
}

/* ─────────────────────────────────────────────────────────────────
   Problems
   ───────────────────────────────────────────────────────────────── */

async function nextProblemId(kind: 'programming' | 'sql'): Promise<number> {
  const _id = kind === 'programming' ? 'problem_programming' : 'problem_sql';
  const doc = await Counter.findOneAndUpdate(
    { _id },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}

async function seedProblems(): Promise<Map<string, string>> {
  console.log('🧩 Seeding DSA problems...');
  const idBySlug = new Map<string, string>();

  for (const p of problems) {
    const problemId = await nextProblemId('programming');
    const doc = await Problem.create({
      problemId,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topics: p.topics,
      statement: p.statement,
      functionName: p.functionName,
      outputMode: p.outputMode,
      starterCode: p.starterCode,
      testCases: p.testCases,
      sqlSetup: p.sqlSetup,
      scope: 'global',
      tier: p.tier ?? 'starter',
    });
    idBySlug.set(p.slug, doc._id.toString());
  }
  console.log(`  ✅ ${problems.length} DSA problems`);

  console.log('🗃️  Seeding SQL problems...');
  for (const p of sqlProblems) {
    const problemId = await nextProblemId('sql');
    const doc = await Problem.create({
      problemId,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topics: p.topics,
      statement: p.statement,
      functionName: p.functionName,
      outputMode: p.outputMode,
      starterCode: p.starterCode,
      testCases: p.testCases,
      sqlSetup: p.sqlSetup,
      scope: 'global',
      tier: p.tier ?? 'starter',
    });
    idBySlug.set(p.slug, doc._id.toString());
  }
  console.log(`  ✅ ${sqlProblems.length} SQL problems`);

  return idBySlug;
}

/* ─────────────────────────────────────────────────────────────────
   Projects
   ───────────────────────────────────────────────────────────────── */

async function seedProjects(): Promise<Map<string, string>> {
  console.log('🚀 Seeding projects...');
  const idBySlug = new Map<string, string>();
  for (const p of projects) {
    const doc = await Project.create(p);
    idBySlug.set(p.slug, doc._id.toString());
  }
  console.log(`  ✅ ${projects.length} projects`);
  return idBySlug;
}

/* ─────────────────────────────────────────────────────────────────
   Roadmaps
   ───────────────────────────────────────────────────────────────── */

async function seedRoadmaps(
  adminId: string,
  courseIdBySlug: Map<string, string>
): Promise<Map<string, string>> {
  console.log('🗺️  Seeding roadmaps...');
  const idBySlug = new Map<string, string>();

  for (const r of roadmaps) {
    const refs = r.courses
      .map((c) => {
        const courseId = courseIdBySlug.get(c.courseSlug);
        if (!courseId) {
          console.warn(
            `    ⚠️  Roadmap "${r.title}" references unknown course "${c.courseSlug}"`
          );
          return null;
        }
        return { courseId, order: c.order, isRequired: c.isRequired };
      })
      .filter((x): x is { courseId: string; order: number; isRequired: boolean } =>
        x !== null
      );

    const doc = await Roadmap.create({
      title: r.title,
      slug: r.slug,
      description: r.description,
      tagline: r.tagline,
      tags: r.tags ?? [],
      badge: r.badge,
      heroVideoUrl: r.heroVideoUrl,
      courses: refs,
      isFree: r.isFree,
      price: r.price,
      originalPrice: r.originalPrice,
      features: r.features ?? [],
      sellingPoints: r.sellingPoints ?? [],
      sellingHeadline: r.sellingHeadline,
      learningOutcomes: r.learningOutcomes ?? [],
      curriculum: r.curriculum ?? [],
      projects: r.projects ?? [],
      instructor: r.instructor,
      certificateIncluded: r.certificateIncluded ?? false,
      faq: r.faq ?? [],
      published: r.published,
      createdBy: adminId,
    });
    idBySlug.set(r.slug, doc._id.toString());
    console.log(`  ✅ ${r.title} (${refs.length} courses)`);
  }

  return idBySlug;
}

/* ─────────────────────────────────────────────────────────────────
   Classes
   ───────────────────────────────────────────────────────────────── */

async function seedClasses(
  accountIdByKey: Map<string, string>,
  courseIdBySlug: Map<string, string>,
  cohortIdBySlug: Map<string, string>
) {
  console.log('🎥 Seeding classes...');
  for (const c of classes) {
    const instructorId = accountIdByKey.get(c.instructorKey);
    if (!instructorId) continue;
    const instructor = await User.findById(instructorId).lean();
    if (!instructor) continue;

    const scheduledAt = daysFromNow(c.offsetDays);
    const courseId = c.courseSlug ? courseIdBySlug.get(c.courseSlug) : undefined;
    const cohortId = c.cohortSlug
      ? cohortIdBySlug.get(c.cohortSlug)
      : undefined;

    const recording = c.hasRecording
      ? {
          url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
          durationSec: c.durationMinutes * 60,
          sizeBytes: c.durationMinutes * 60 * 100_000,
          uploadedAt: scheduledAt,
          chapters: [
            { title: 'Introduction', startSec: 0 },
            { title: 'Time complexity', startSec: 600 },
            { title: 'Real examples', startSec: 1500 },
          ],
        }
      : undefined;

    await Class.updateOne(
      { slug: c.slug },
      {
        $set: {
          title: c.title,
          slug: c.slug,
          description: c.description,
          instructorId,
          instructorName: instructor.name,
          courseId,
          cohortId,
          scheduledAt,
          durationMinutes: c.durationMinutes,
          status: c.status,
          meetLink: c.meetLink,
          recording,
        },
      },
      { upsert: true }
    );
    console.log(`  ✅ ${c.title}`);
  }
}

/* ─────────────────────────────────────────────────────────────────
   Cohorts
   ───────────────────────────────────────────────────────────────── */

async function seedCohorts(
  accountIdByKey: Map<string, string>,
  courseIdBySlug: Map<string, string>,
  roadmapIdBySlug: Map<string, string>
): Promise<Map<string, string>> {
  console.log('👥 Seeding cohorts...');
  const idBySlug = new Map<string, string>();

  for (const c of cohorts) {
    const entityId =
      c.entityKind === 'course'
        ? courseIdBySlug.get(c.entitySlug)
        : roadmapIdBySlug.get(c.entitySlug);
    if (!entityId) {
      console.warn(
        `    ⚠️  Cohort "${c.name}" references unknown ${c.entityKind} "${c.entitySlug}"`
      );
      continue;
    }

    const instructorId = accountIdByKey.get('instructor')!;
    const doc = await Cohort.create({
      name: c.name,
      slug: c.slug,
      description: c.description,
      entityKind: c.entityKind,
      entityId,
      startDate: c.startDate,
      endDate: c.endDate,
      displayOrder: Date.now(),
      archived: c.archived,
      createdBy: instructorId,
    });
    idBySlug.set(c.slug, doc._id.toString());

    for (const m of c.members) {
      const userId = accountIdByKey.get(m.accountKey);
      if (!userId) continue;
      await CohortMembership.updateOne(
        { userId, cohortId: doc._id.toString() },
        {
          $set: {
            role: m.role,
            addedAt: new Date(),
            addedBy: instructorId,
          },
        },
        { upsert: true }
      );
    }
    console.log(
      `  ✅ ${c.name} (${c.members.length} members, ${
        c.archived ? 'archived' : 'active'
      })`
    );
  }

  return idBySlug;
}

/* ─────────────────────────────────────────────────────────────────
   Announcements
   ───────────────────────────────────────────────────────────────── */

async function seedAnnouncements(
  accountIdByKey: Map<string, string>,
  courseIdBySlug: Map<string, string>,
  roadmapIdBySlug: Map<string, string>,
  cohortIdBySlug: Map<string, string>
) {
  console.log('📣 Seeding announcements...');
  for (const a of announcements) {
    const authorId = accountIdByKey.get(a.authorKey);
    if (!authorId) continue;

    let audienceKind: 'all' | 'course' | 'roadmap' | 'cohort' = 'all';
    let audienceId: string | undefined;

    if (a.audience.kind === 'course') {
      audienceKind = 'course';
      audienceId = courseIdBySlug.get(a.audience.slug);
    } else if (a.audience.kind === 'roadmap') {
      audienceKind = 'roadmap';
      audienceId = roadmapIdBySlug.get(a.audience.slug);
    } else if (a.audience.kind === 'cohort') {
      audienceKind = 'cohort';
      audienceId = cohortIdBySlug.get(a.audience.slug);
    }

    if (audienceKind !== 'all' && !audienceId) {
      console.warn(`    ⚠️  Announcement "${a.title}" has unresolved audience.`);
      continue;
    }

    await Announcement.create({
      title: a.title,
      body: a.body,
      audienceKind,
      audienceId,
      authorId,
      publishedAt: new Date(Date.now() - a.publishedDaysAgo * day),
      pinnedUntil: a.pinnedForDays
        ? new Date(Date.now() + a.pinnedForDays * day)
        : undefined,
    });
    console.log(`  ✅ ${a.title}`);
  }
}

/* ─────────────────────────────────────────────────────────────────
   Progress, activity, submissions
   ───────────────────────────────────────────────────────────────── */

async function seedProgress(
  accountIdByKey: Map<string, string>,
  courseIdBySlug: Map<string, string>,
  problemIdBySlug: Map<string, string>,
  projectIdBySlug: Map<string, string>
) {
  console.log('📈 Seeding progress...');
  const studentId = accountIdByKey.get(progressFixture.accountKey);
  if (!studentId) {
    console.warn('  ⚠️  No progress account found.');
    return;
  }

  let totalXP = 0;

  // 1. Course progress rows
  for (const cp of progressFixture.courses) {
    const courseId = courseIdBySlug.get(cp.courseSlug);
    if (!courseId) {
      console.warn(`    ⚠️  Unknown course in progress: ${cp.courseSlug}`);
      continue;
    }

    // Look up lesson ids by slug within this course
    const lessons = await Lesson.find({ courseId }).lean();
    const lessonBySlug = new Map(lessons.map((l) => [l.slug, l]));

    const completedLessonIds: string[] = [];
    for (const slug of cp.completedLessonSlugs) {
      const lesson = lessonBySlug.get(slug);
      if (lesson) completedLessonIds.push(lesson._id.toString());
    }

    const totalLessons = lessons.length;
    const percentage =
      totalLessons === 0
        ? 0
        : Math.round((completedLessonIds.length / totalLessons) * 100);

    const currentLesson = cp.currentLessonSlug
      ? lessonBySlug.get(cp.currentLessonSlug)
      : undefined;

    await Progress.create({
      userId: studentId,
      courseId,
      completedLessons: completedLessonIds,
      currentLessonId: currentLesson?._id.toString(),
      currentStepIndex: cp.currentStepIndex ?? 0,
      completedSteps: cp.completedSteps ?? [],
      completedChallenges: cp.completedChallenges ?? {},
      percentage,
    });

    // Also create StudentEnrollment so the CourseDetail page knows
    // the student is enrolled (rather than a fresh signup).
    const { StudentEnrollment } = await import(
      '../models/StudentEnrollment.model.js'
    );
    await StudentEnrollment.updateOne(
      { userId: studentId, courseId },
      {
        $setOnInsert: {
          userId: studentId,
          courseId,
          joinedAt: new Date(Date.now() - 30 * day),
          source: 'manual',
        },
      },
      { upsert: true }
    );
  }
  console.log(`  ✅ ${progressFixture.courses.length} course progress rows`);

  // 2. Activity rows
  for (const dayEntry of progressFixture.activity) {
    const when = new Date(Date.now() - dayEntry.daysAgo * day);
    for (const ev of dayEntry.events) {
      totalXP += ev.xp;
      let refId: string | undefined;
      if (ev.refKey) {
        if (ev.type === 'lesson_completed') {
          // Look up lesson by slug anywhere in our content
          const lesson = await Lesson.findOne({ slug: ev.refKey }).lean();
          refId = lesson?._id.toString();
        } else if (ev.type === 'problem_solved' || ev.type === 'problem_attempted') {
          refId = problemIdBySlug.get(ev.refKey);
        } else if (ev.type === 'project_saved' || ev.type === 'project_completed') {
          refId = projectIdBySlug.get(ev.refKey);
        } else {
          refId = ev.refKey;
        }
      }
      await Activity.create({
        userId: studentId,
        type: ev.type,
        refId,
        xp: ev.xp,
        day: dayString(dayEntry.daysAgo),
        createdAt: when,
      });
    }
  }

  // Compute streak: count consecutive days ending at "today" (or
  // the most recent active day).
  const days = new Set(progressFixture.activity.map((a) => a.daysAgo));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    if (days.has(i)) streak++;
    else if (i === 0) continue; // allow a gap today
    else break;
  }

  await User.updateOne(
    { _id: studentId },
    {
      $set: {
        xp: totalXP,
        streak,
        lastActiveAt: new Date(),
        lastActiveDay: dayString(0),
      },
    }
  );
  console.log(
    `  ✅ ${progressFixture.activity.length} activity days, total XP ${totalXP}, streak ${streak}`
  );

  // 3. Problem submissions
  for (const s of progressFixture.submissions) {
    const problemId = problemIdBySlug.get(s.problemSlug);
    if (!problemId) continue;
    const when = new Date(Date.now() - s.daysAgo * day);
    await Submission.create({
      userId: studentId,
      problemId,
      language: s.language,
      code: '// seeded',
      status: s.status,
      passedTests: s.passedTests,
      totalTests: s.totalTests,
      runtimeMs: s.runtimeMs,
      createdAt: when,
      updatedAt: when,
    });
  }
  console.log(`  ✅ ${progressFixture.submissions.length} problem submissions`);

  // 4. Project submissions + instructor reviews
  for (const ps of progressFixture.projectSubmissions) {
    const projectId = projectIdBySlug.get(ps.projectSlug);
    if (!projectId) continue;
    const studentKeyId = accountIdByKey.get(ps.studentKey) ?? studentId;
    const project = await Project.findById(projectId).lean();
    if (!project) continue;

    const when = new Date(Date.now() - ps.daysAgo * day);

    // UserProject row (the student's working copy)
    await UserProject.updateOne(
      { userId: studentKeyId, projectId },
      {
        $set: {
          files: project.files,
          status: ps.status === 'passed' ? 'completed' : 'submitted',
          completedAt: ps.status === 'passed' ? when : undefined,
        },
      },
      { upsert: true }
    );

    // ProjectSubmission row
    const submission = await ProjectSubmission.create({
      userId: studentKeyId,
      projectId,
      attemptNumber: ps.attemptNumber,
      files: project.files,
      status: ps.status,
      submittedAt: when,
      createdAt: when,
      updatedAt: when,
    });

    // Instructor evaluation if requested
    if (ps.instructorReview) {
      const instructorId = accountIdByKey.get(ps.instructorReview.instructorKey);
      if (instructorId) {
        await InstructorEvaluation.create({
          submissionId: submission._id.toString(),
          projectId,
          instructorId,
          revisionNumber: 1,
          finalScore: ps.instructorReview.finalScore,
          categoryOverrides: ps.instructorReview.categoryOverrides,
          feedback: ps.instructorReview.feedback,
          requestResubmission: ps.instructorReview.requestResubmission,
          status: ps.instructorReview.status,
          evaluationDate: when,
        });
      }
    }
  }
  console.log(
    `  ✅ ${progressFixture.projectSubmissions.length} project submissions`
  );
}

/* ─────────────────────────────────────────────────────────────────
   Achievements
   ───────────────────────────────────────────────────────────────── */

async function seedAchievements(
  studentId: string
) {
  console.log('🏆 Seeding achievements...');

  // Import the service lazily so the seed doesn't crash if the
  // achievement module has import-time side effects.
  const { achievementService } = await import(
    '../services/achievement.service.js'
  );

  // Let the service define its own achievement rows.
  await achievementService.seedDefinitions();

  // Read them back so we know the real keys, not hardcoded ones.
  const defs = await Achievement.find().sort({ _id: 1 }).lean();
  console.log(`  ✅ ${defs.length} achievement definitions available`);

  // Unlock the first 5 achievements for the enrolled student. This is
  // deterministic (the same 5 across runs) and does not depend on the
  // service's internal keys.
  const toUnlock = defs.slice(0, 5);
  for (const d of toUnlock) {
    await UserAchievement.updateOne(
      { userId: studentId, achievementKey: d.key },
      {
        $setOnInsert: {
          userId: studentId,
          achievementKey: d.key,
          unlockedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
  console.log(`  ✅ ${toUnlock.length} achievements unlocked for test student`);
}

/* ─────────────────────────────────────────────────────────────────
   Main
   ───────────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n🌱 KodxCamp seed');

  if (env.NODE_ENV === 'production' && !force) {
    console.error(
      '\n❌ Refusing to seed production without --force.\n' +
        '   This will DELETE all content collections.\n' +
        '   User accounts are preserved unless --wipe-users is passed.\n' +
        '   Run: npm run seed:force\n'
    );
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  if (should('content')) {
    await wipeContent();
  } else {
    console.log('⏭️  Skipping content wipe (--only flag)');
  }

  const accountIdByKey = should('accounts')
    ? await seedAccounts()
    : new Map<string, string>();

  const adminId = accountIdByKey.get('admin')!;
  const instructorId = accountIdByKey.get('instructor')!;

  const courseIdBySlug = should('courses')
    ? await seedCourses(adminId, instructorId)
    : new Map<string, string>();

  const problemIdBySlug = should('problems')
    ? await seedProblems()
    : new Map<string, string>();

  const projectIdBySlug = should('projects')
    ? await seedProjects()
    : new Map<string, string>();

  const roadmapIdBySlug = should('roadmaps')
    ? await seedRoadmaps(adminId, courseIdBySlug)
    : new Map<string, string>();

  const cohortIdBySlug = should('cohorts')
    ? await seedCohorts(accountIdByKey, courseIdBySlug, roadmapIdBySlug)
    : new Map<string, string>();

  if (should('classes')) {
    await seedClasses(accountIdByKey, courseIdBySlug, cohortIdBySlug);
  }

  if (should('announcements')) {
    await seedAnnouncements(
      accountIdByKey,
      courseIdBySlug,
      roadmapIdBySlug,
      cohortIdBySlug
    );
  }

  if (should('progress')) {
    await seedProgress(
      accountIdByKey,
      courseIdBySlug,
      problemIdBySlug,
      projectIdBySlug
    );
  }

  if (should('achievements')) {
    const studentId = accountIdByKey.get('student-enrolled');
    if (studentId) {
      await seedAchievements(studentId);
    }
  }

  console.log('\n🎉 Seed complete.\n');
  console.log('Test accounts:');
  for (const a of accounts) {
    console.log(`  ${a.email.padEnd(34)} ${a.password.padEnd(16)} (${a.role})`);
  }
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});