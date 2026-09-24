import { Achievement } from '../models/Achievement.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';
import { Activity } from '../models/Activity.model.js';
import { User } from '../models/User.model.js';
import { Submission } from '../models/Submission.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { Progress } from '../models/Progress.model.js';
import { Problem } from '../models/Problem.model.js';
import { logger } from '../utils/logger.js';

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  category:
  | 'learning'
  | 'practice'
  | 'projects'
  | 'classes'
  | 'streak'
  | 'milestones';
  icon: string;
  xpReward: number;
  secret: boolean;
  predicate: (s: StatsSnapshot) => boolean;
}

interface StatsSnapshot {
  xp: number;
  streak: number;
  lessonsCompleted: number;
  problemsSolved: number;
  problemsAttempted: number;
  projectsStarted: number;
  projectsCompleted: number;
  classesAttended: number;
  recordingsWatched: number;
  activeDays30: number;
  differentCourses: number;
  difficultySolved: { easy: number; medium: number; hard: number };
}

const DEFS: AchievementDefinition[] = [
  // Milestones
  {
    key: 'welcome',
    title: 'Welcome Aboard',
    description: 'You joined KodxCamp. Let the journey begin.',
    category: 'milestones',
    icon: '👋',
    xpReward: 10,
    secret: false,
    predicate: () => true,
  },
  // Learning
  {
    key: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson.',
    category: 'learning',
    icon: '🎓',
    xpReward: 25,
    secret: false,
    predicate: (s) => s.lessonsCompleted >= 1,
  },
  {
    key: 'ten_lessons',
    title: 'Getting Warm',
    description: 'Complete 10 lessons.',
    category: 'learning',
    icon: '📚',
    xpReward: 50,
    secret: false,
    predicate: (s) => s.lessonsCompleted >= 10,
  },
  {
    key: 'fifty_lessons',
    title: 'Scholar',
    description: 'Complete 50 lessons.',
    category: 'learning',
    icon: '🎯',
    xpReward: 150,
    secret: false,
    predicate: (s) => s.lessonsCompleted >= 50,
  },
  // Practice
  {
    key: 'first_problem',
    title: 'First Solve',
    description: 'Solve your first DSA problem.',
    category: 'practice',
    icon: '⚡',
    xpReward: 25,
    secret: false,
    predicate: (s) => s.problemsSolved >= 1,
  },
  {
    key: 'ten_problems',
    title: 'Problem Solver',
    description: 'Solve 10 DSA problems.',
    category: 'practice',
    icon: '🧩',
    xpReward: 100,
    secret: false,
    predicate: (s) => s.problemsSolved >= 10,
  },
  {
    key: 'easy_master',
    title: 'Easy Master',
    description: 'Solve 5 easy problems.',
    category: 'practice',
    icon: '🌱',
    xpReward: 50,
    secret: false,
    predicate: (s) => s.difficultySolved.easy >= 5,
  },
  {
    key: 'medium_master',
    title: 'Medium Master',
    description: 'Solve 5 medium problems.',
    category: 'practice',
    icon: '🌿',
    xpReward: 100,
    secret: false,
    predicate: (s) => s.difficultySolved.medium >= 5,
  },
  {
    key: 'hard_master',
    title: 'Hard Master',
    description: 'Solve a hard problem.',
    category: 'practice',
    icon: '🌳',
    xpReward: 200,
    secret: false,
    predicate: (s) => s.difficultySolved.hard >= 1,
  },
  // Projects
  {
    key: 'first_project',
    title: 'Builder',
    description: 'Start your first project.',
    category: 'projects',
    icon: '🚀',
    xpReward: 25,
    secret: false,
    predicate: (s) => s.projectsStarted >= 1,
  },
  {
    key: 'project_finisher',
    title: 'Shipped It',
    description: 'Complete a project.',
    category: 'projects',
    icon: '🏗️',
    xpReward: 100,
    secret: false,
    predicate: (s) => s.projectsCompleted >= 1,
  },
  {
    key: 'three_projects',
    title: 'Portfolio Builder',
    description: 'Complete 3 projects.',
    category: 'projects',
    icon: '📦',
    xpReward: 200,
    secret: false,
    predicate: (s) => s.projectsCompleted >= 3,
  },
  // Classes
  {
    key: 'first_class',
    title: 'Class Act',
    description: 'Attend your first live class.',
    category: 'classes',
    icon: '🎤',
    xpReward: 30,
    secret: false,
    predicate: (s) => s.classesAttended >= 1,
  },
  {
    key: 'binge_watcher',
    title: 'Binge Watcher',
    description: 'Finish watching 3 recordings.',
    category: 'classes',
    icon: '🍿',
    xpReward: 80,
    secret: false,
    predicate: (s) => s.recordingsWatched >= 3,
  },
  // Streak
  {
    key: 'streak_3',
    title: 'On a Roll',
    description: '3-day streak.',
    category: 'streak',
    icon: '🔥',
    xpReward: 30,
    secret: false,
    predicate: (s) => s.streak >= 3,
  },
  {
    key: 'streak_7',
    title: 'Week Warrior',
    description: '7-day streak.',
    category: 'streak',
    icon: '🔥',
    xpReward: 75,
    secret: false,
    predicate: (s) => s.streak >= 7,
  },
  {
    key: 'streak_30',
    title: 'Iron Discipline',
    description: '30-day streak.',
    category: 'streak',
    icon: '💎',
    xpReward: 500,
    secret: false,
    predicate: (s) => s.streak >= 30,
  },
  // Milestones
  {
    key: 'xp_1000',
    title: 'Four Digits',
    description: 'Earn 1,000 XP.',
    category: 'milestones',
    icon: '💯',
    xpReward: 100,
    secret: false,
    predicate: (s) => s.xp >= 1000,
  },
  {
    key: 'xp_5000',
    title: 'XP Overlord',
    description: 'Earn 5,000 XP.',
    category: 'milestones',
    icon: '👑',
    xpReward: 500,
    secret: false,
    predicate: (s) => s.xp >= 5000,
  },
  {
    key: 'secret_night_owl',
    title: 'Night Owl',
    description: 'You did something at an unusual hour. Welcome to the club.',
    category: 'milestones',
    icon: '🦉',
    xpReward: 50,
    secret: true,
    predicate: () => {
      const h = new Date().getHours();
      return h >= 0 && h < 5;
    },
  },
];

async function buildStats(userId: string): Promise<StatsSnapshot> {
  const [
    user,
    progresses,
    problemsSolvedDistinct,
    problemsAttempted,
    projectsStarted,
    projectsCompleted,
    classesAttended,
    recordingsWatched,
    activityRows,
  ] = await Promise.all([
    User.findById(userId).lean(),
    Progress.find({ userId }).lean(),
    Submission.distinct('problemId', { userId, status: 'accepted' }),
    Submission.distinct('problemId', { userId }),
    UserProject.countDocuments({ userId }),
    UserProject.countDocuments({ userId, status: 'completed' }),
    Activity.countDocuments({ userId, type: 'class_attended' }),
    Activity.countDocuments({ userId, type: 'recording_watched' }),
    Activity.find({ userId }).select('day').lean(),
  ]);

  const lessonsCompleted = progresses.reduce(
    (sum, p) => sum + (p.completedLessons?.length ?? 0),
    0
  );
  const differentCourses = progresses.filter(
    (p) => (p.completedLessons?.length ?? 0) > 0
  ).length;

  const solvedProblems = await Problem.find({ _id: { $in: problemsSolvedDistinct } })
    .select('difficulty')
    .lean();
  const difficultySolved = { easy: 0, medium: 0, hard: 0 };
  for (const p of solvedProblems) {
    difficultySolved[p.difficulty as 'easy' | 'medium' | 'hard']++;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const activeDaySet = new Set(
    activityRows.filter((a) => a.day >= cutoffKey).map((a) => a.day)
  );

  return {
    xp: user?.xp ?? 0,
    streak: user?.streak ?? 0,
    lessonsCompleted,
    problemsSolved: problemsSolvedDistinct.length,
    problemsAttempted: problemsAttempted.length,
    projectsStarted,
    projectsCompleted,
    classesAttended,
    recordingsWatched,
    activeDays30: activeDaySet.size,
    differentCourses,
    difficultySolved,
  };
}

export const achievementService = {
  /**
   * Evaluate all achievements for a user. Idempotent - uses a unique index
   * on {userId, achievementKey} so concurrent calls can't double-award XP.
   */
  async evaluate(userId: string): Promise<string[]> {
    const stats = await buildStats(userId);

    const existing = await UserAchievement.find({ userId }).lean();
    const existingSet = new Set(existing.map((e) => e.achievementKey));

    const newlyUnlocked: string[] = [];
    let totalBonusXp = 0;

    for (const def of DEFS) {
      if (existingSet.has(def.key)) continue;

      let passed: boolean;
      try {
        passed = def.predicate(stats);
      } catch (err) {
        logger.warn('Achievement predicate threw', {
          key: def.key,
          userId,
          err: err instanceof Error ? err.message : String(err),
        });
        continue;
      }

      if (!passed) continue;

      try {
        await UserAchievement.create({
          userId,
          achievementKey: def.key,
        });
        newlyUnlocked.push(def.key);
        totalBonusXp += def.xpReward;
      } catch (err) {
        // Duplicate key = another request already unlocked it. Ignore.
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: number }).code === 11000
        ) {
          continue;
        }
        logger.warn('UserAchievement.create failed', {
          userId,
          key: def.key,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (totalBonusXp > 0) {
      await User.updateOne({ _id: userId }, { $inc: { xp: totalBonusXp } });

      // Also log one activity row per unlocked achievement so analytics
      // and the recent-activity feed stay in sync with User.xp.
      void Promise.all(
        newlyUnlocked.map((key) =>
          Activity.create({
            userId,
            type: 'achievement_unlocked',
            refId: key,
            xp: DEFS.find((d) => d.key === key)?.xpReward ?? 0,
            day: new Date().toISOString().slice(0, 10),
          })
        )
      ).catch(() => {
        /* best-effort; ignore */
      });
    }

    return newlyUnlocked;
  },

  async seedDefinitions(): Promise<void> {
    for (const def of DEFS) {
      const { predicate, ...rest } = def;
      void predicate;
      await Achievement.updateOne({ key: def.key }, { $set: rest }, { upsert: true });
    }
  },

  async listDefinitions() {
    return Achievement.find().sort({ category: 1, key: 1 }).lean();
  },

  async listUnlocked(userId: string) {
    return UserAchievement.find({ userId }).sort({ unlockedAt: -1 }).lean();
  },
};