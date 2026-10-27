import type { SeedAnnouncement } from './types.js';

export const announcements: SeedAnnouncement[] = [
  {
    title: 'Welcome to JavaScript Essentials!',
    body: 'Kick-off is on Monday. Bring your laptop, an idea, and a willingness to break things. Slack channel opens tonight.',
    authorKey: 'instructor',
    audience: { kind: 'course', slug: 'javascript-essentials' },
    publishedDaysAgo: 3,
    pinnedForDays: 7,
  },
  {
    title: 'Cohort kickoff — Spring 2026',
    body: 'Our first live session is on Thursday at 7pm IST. Join with the meeting link below.',
    authorKey: 'instructor',
    audience: { kind: 'cohort', slug: 'spring-2026-js' },
    publishedDaysAgo: 1,
  },
  {
    title: 'New practice problems added',
    body: 'We just added 10 new SQL problems to the practice set. Try them out and let us know what you think.',
    authorKey: 'admin',
    audience: { kind: 'all' },
    publishedDaysAgo: 0,
  },
];