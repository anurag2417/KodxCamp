import type { SeedRoadmap } from './types.js';

export const roadmaps: SeedRoadmap[] = [
  {
    title: 'Full-Stack Web Development',
    slug: 'full-stack-web',
    description:
      'From your first HTML page to a working full-stack app. HTML, CSS, JavaScript, TypeScript, React, and SQL — in the order you should learn them.',
    tagline: 'Zero to full-stack',
    tags: ['fullstack', 'web', 'career'],
    badge: 'POPULAR',
    sellingHeadline: 'One path, everything you need.',
    learningOutcomes: [
      'Build responsive pages with HTML and CSS',
      'Write modern JavaScript and TypeScript',
      'Ship a React app',
      'Query a relational database with SQL',
    ],
    features: [
      { icon: '🛤️', label: 'Curated order' },
      { icon: '🏗️', label: 'Real projects' },
      { icon: '📜', label: 'Certificate' },
    ],
    certificateIncluded: true,
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    courses: [
      { courseSlug: 'html-css-fundamentals', order: 1, isRequired: true },
      { courseSlug: 'javascript-essentials', order: 2, isRequired: true },
      { courseSlug: 'typescript-for-js-devs', order: 3, isRequired: true },
      { courseSlug: 'react-fundamentals', order: 4, isRequired: true },
      { courseSlug: 'sql-fundamentals', order: 5, isRequired: false },
    ],
    isFree: false,
    price: 499900,
    originalPrice: 799900,
    published: true,
  },
  {
    title: 'DSA Interview Prep',
    slug: 'dsa-interview-prep',
    description:
      'The patterns every interview expects. Solve the 20 core problems, then work through the DSA course.',
    tagline: 'Patterns, not memorisation',
    tags: ['dsa', 'interview', 'algorithms'],
    badge: 'LIVE',
    learningOutcomes: [
      'Recognise common interview patterns',
      'Write clean solutions under time pressure',
      'Analyse time and space complexity',
    ],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    courses: [
      { courseSlug: 'data-structures-algorithms', order: 1, isRequired: true },
      { courseSlug: 'advanced-js-patterns', order: 2, isRequired: false },
    ],
    isFree: false,
    price: 199900,
    originalPrice: 299900,
    published: true,
  },
  {
    title: 'Python for Data Work',
    slug: 'python-data',
    description:
      'Python fundamentals plus the SQL you need to move data around.',
    tags: ['python', 'sql', 'data'],
    learningOutcomes: [
      'Write clean Python',
      'Query databases with SQL',
      'Combine both for data work',
    ],
    courses: [
      { courseSlug: 'python-fundamentals', order: 1, isRequired: true },
      { courseSlug: 'sql-fundamentals', order: 2, isRequired: true },
    ],
    isFree: true,
    published: true,
  },
  {
    title: 'Language Sampler',
    slug: 'language-sampler',
    description:
      'Try Ruby, Java, and Python side by side. Learn the shape of each language before committing to one.',
    tags: ['ruby', 'java', 'python', 'beginner'],
    courses: [
      { courseSlug: 'ruby-fundamentals', order: 1, isRequired: false },
      { courseSlug: 'java-fundamentals', order: 2, isRequired: false },
      { courseSlug: 'python-fundamentals', order: 3, isRequired: false },
    ],
    isFree: true,
    published: true,
  },
  {
    title: 'Frontend Engineer Path',
    slug: 'frontend-engineer',
    description:
      'HTML, CSS, JavaScript, Tailwind, and React — the stack most frontend jobs actually ask for.',
    tagline: 'The 2026 frontend stack',
    tags: ['frontend', 'career', 'react'],
    badge: 'NEW',
    learningOutcomes: [
      'Build responsive layouts',
      'Ship a modern React app',
      'Style with Tailwind',
      'Test your code',
    ],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    certificateIncluded: true,
    courses: [
      { courseSlug: 'html-css-fundamentals', order: 1, isRequired: true },
      { courseSlug: 'javascript-essentials', order: 2, isRequired: true },
      { courseSlug: 'tailwind-essentials', order: 3, isRequired: true },
      { courseSlug: 'react-fundamentals', order: 4, isRequired: true },
      { courseSlug: 'testing-javascript', order: 5, isRequired: false },
    ],
    isFree: false,
    price: 399900,
    originalPrice: 599900,
    published: true,
  },
];