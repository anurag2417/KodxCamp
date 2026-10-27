import type { SeedCohort } from './types.js';

export const cohorts: SeedCohort[] = [
  {
    name: 'Spring 2026 — JavaScript Essentials',
    slug: 'spring-2026-js',
    description:
      'The first cohort working through JavaScript Essentials. Weekly live sessions.',
    entityKind: 'course',
    entitySlug: 'javascript-essentials',
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    archived: false,
    members: [
      { accountKey: 'instructor', role: 'instructor' },
      { accountKey: 'ta', role: 'assistant' },
      { accountKey: 'student-enrolled', role: 'student' },
      { accountKey: 'student-new', role: 'student' },
    ],
  },
  {
    name: 'Fall 2025 — Full-Stack Web (archived)',
    slug: 'fall-2025-fullstack',
    description: 'Archived cohort from the previous term.',
    entityKind: 'roadmap',
    entitySlug: 'full-stack-web',
    startDate: '2025-09-01',
    endDate: '2025-12-15',
    archived: true,
    members: [
      { accountKey: 'instructor', role: 'instructor' },
      { accountKey: 'student-enrolled', role: 'student' },
    ],
  },
];