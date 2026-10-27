import type { SeedAccount } from './types.js';

/**
 * Test accounts.
 *
 * Every account is idempotently upserted by email — re-running the
 * seed does not reset passwords or duplicate accounts.
 *
 * The `student-enrolled` account is the one whose progress is
 * seeded. The `student-new` account is intentionally empty so you
 * can test the "no progress yet" states on the dashboard, the
 * progress page, and the achievements page.
 *
 * `ta` and `course-author` exist to test the three-axis auth model:
 * a global student with a course-scoped role. They are members of
 * Course 1's team, not global staff.
 */
export const accounts: SeedAccount[] = [
  {
    key: 'admin',
    name: 'Admin User',
    email: 'admin@kodxcamp.dev',
    password: 'admin12345',
    role: 'admin',
    permissions: [],
  },
  {
    key: 'instructor',
    name: 'Riya Sharma',
    email: 'instructor@kodxcamp.dev',
    password: 'instructor123',
    role: 'instructor',
    permissions: ['course_author', 'problem_author', 'project_author'],
  },
  {
    key: 'student-enrolled',
    name: 'Aarav Patel',
    email: 'student-enrolled@kodxcamp.dev',
    password: 'student12345',
    role: 'student',
    permissions: [],
    withProgress: true,
  },
  {
    key: 'student-new',
    name: 'Mira Verma',
    email: 'student-new@kodxcamp.dev',
    password: 'student12345',
    role: 'student',
    permissions: [],
  },
  {
    key: 'ta',
    name: 'Tara Iyer',
    email: 'ta@kodxcamp.dev',
    password: 'ta123456789',
    role: 'student',
    permissions: ['class_coordinator'],
  },
  {
    key: 'course-author',
    name: 'Karan Mehta',
    email: 'course-author@kodxcamp.dev',
    password: 'author123456',
    role: 'student',
    permissions: ['course_author'],
  },
];