import type { SeedClass } from './types.js';

export const classes: SeedClass[] = [
  {
    title: 'JavaScript Closures Deep Dive',
    slug: 'javascript-closures-deep-dive',
    description:
      'Live walk-through of closures, scope, and how they power common JS patterns.',
    instructorKey: 'instructor',
    courseSlug: 'javascript-essentials',
    when: 'future',
    offsetDays: 2,
    durationMinutes: 60,
    status: 'scheduled',
    meetLink: 'https://meet.google.com/aaa-bbbb-ccc',
  },
  {
    title: 'Building a REST API with Express',
    slug: 'building-a-rest-api-with-express',
    description:
      'Hands-on session: routes, controllers, error handling, and a working Express API.',
    instructorKey: 'instructor',
    when: 'future',
    offsetDays: 5,
    durationMinutes: 90,
    status: 'scheduled',
    meetLink: 'https://meet.google.com/ddd-eeee-fff',
  },
  {
    title: 'Intro to Big-O Notation',
    slug: 'intro-to-bigo-notation',
    description:
      'Recorded session explaining Big-O with real examples.',
    instructorKey: 'instructor',
    when: 'past',
    offsetDays: -3,
    durationMinutes: 45,
    status: 'ended',
    meetLink: 'https://meet.google.com/ggg-hhhh-iii',
    hasRecording: true,
  },
];