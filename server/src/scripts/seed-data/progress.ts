import type { SeedProgressFixture } from './types.js';

export const progress: SeedProgressFixture = {
  accountKey: 'student-enrolled',

  courses: [
    {
      courseSlug: 'html-css-fundamentals',
      // completed 4 of 5 lessons
      completedLessonSlugs: [
        'first-html-page',
        'styling-with-css',
        'lists-links-images',
        'the-box-model',
      ],
      currentLessonSlug: 'build-a-profile-card',
      // Steps 0 and 1 completed in the profile card lesson
      completedSteps: [0, 1],
      currentStepIndex: 2,
    },
    {
      courseSlug: 'javascript-essentials',
      // completed 3 of 4 lessons
      completedLessonSlugs: [
        'hello-console',
        'variables-math',
        'conditionals',
      ],
      currentLessonSlug: 'loops',
      // Challenge 0 of the hello-console lesson completed
      completedChallenges: { 'hello-console': [0] },
    },
    {
      courseSlug: 'sql-fundamentals',
      // 1 of 3 lessons completed
      completedLessonSlugs: ['select-basics'],
      currentLessonSlug: 'filtering-with-where',
    },
  ],

  // 30 days of activity, deliberately leaving 4-5 gap days so the
  // heatmap and streak counters have something to look like a real
  // learner's history.
  activity: [
    // Week 1
    { daysAgo: 30, events: [{ type: 'login', xp: 0 }] },
    {
      daysAgo: 29,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'first-html-page' },
      ],
    },
    {
      daysAgo: 28,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'styling-with-css' },
      ],
    },
    { daysAgo: 27, events: [{ type: 'login', xp: 0 }] },
    {
      daysAgo: 26,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'add-two-numbers' },
      ],
    },
    // gap 25
    {
      daysAgo: 24,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'lists-links-images' },
        {
          type: 'problem_attempted',
          xp: 5,
          refKey: 'find-maximum',
        },
      ],
    },
    // Week 2
    {
      daysAgo: 22,
      events: [{ type: 'problem_solved', xp: 30, refKey: 'find-maximum' }],
    },
    {
      daysAgo: 21,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'the-box-model' },
      ],
    },
    // gap 20
    { daysAgo: 19, events: [{ type: 'login', xp: 0 }] },
    {
      daysAgo: 18,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'reverse-string' },
        { type: 'problem_solved', xp: 30, refKey: 'even-or-odd' },
      ],
    },
    // Week 3
    {
      daysAgo: 16,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'sum-of-array' },
      ],
    },
    {
      daysAgo: 15,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'hello-console' },
        { type: 'achievement_unlocked', xp: 50, refKey: 'first_lesson' },
      ],
    },
    // gap 14
    {
      daysAgo: 13,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'variables-math' },
      ],
    },
    {
      daysAgo: 12,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'count-vowels' },
        { type: 'problem_solved', xp: 30, refKey: 'fizzbuzz' },
      ],
    },
    // Week 4
    {
      daysAgo: 10,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'conditionals' },
      ],
    },
    { daysAgo: 9, events: [{ type: 'login', xp: 0 }] },
    {
      daysAgo: 8,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'is-palindrome' },
      ],
    },
    // gap 7
    {
      daysAgo: 6,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'find-index' },
        { type: 'problem_solved', xp: 30, refKey: 'remove-duplicates' },
      ],
    },
    {
      daysAgo: 5,
      events: [
        { type: 'project_saved', xp: 10, refKey: 'profile-card' },
      ],
    },
    {
      daysAgo: 4,
      events: [
        {
          type: 'project_completed',
          xp: 50,
          refKey: 'profile-card',
        },
      ],
    },
    {
      daysAgo: 3,
      events: [
        { type: 'lesson_completed', xp: 20, refKey: 'select-basics' },
        {
          type: 'problem_solved',
          xp: 30,
          refKey: 'sql-select-all-employees',
        },
      ],
    },
    {
      daysAgo: 2,
      events: [
        { type: 'problem_solved', xp: 30, refKey: 'two-sum' },
        { type: 'problem_solved', xp: 30, refKey: 'valid-parentheses' },
      ],
    },
    {
      daysAgo: 1,
      events: [
        {
          type: 'problem_solved',
          xp: 30,
          refKey: 'sql-filter-by-department',
        },
        { type: 'class_attended', xp: 15 },
      ],
    },
    {
      daysAgo: 0,
      events: [
        { type: 'login', xp: 0 },
        {
          type: 'problem_solved',
          xp: 30,
          refKey: 'maximum-subarray',
        },
      ],
    },
  ],

  // Submissions — mix of accepted and one wrong_answer so the
  // "solved vs attempted" counters differ.
  submissions: [
    { problemSlug: 'add-two-numbers', language: 'javascript', daysAgo: 26, status: 'accepted', passedTests: 5, totalTests: 5, runtimeMs: 12 },
    { problemSlug: 'find-maximum', language: 'javascript', daysAgo: 24, status: 'wrong_answer', passedTests: 3, totalTests: 5, runtimeMs: 18 },
    { problemSlug: 'find-maximum', language: 'javascript', daysAgo: 22, status: 'accepted', passedTests: 5, totalTests: 5, runtimeMs: 15 },
    { problemSlug: 'reverse-string', language: 'javascript', daysAgo: 18, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 9 },
    { problemSlug: 'even-or-odd', language: 'javascript', daysAgo: 18, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 5 },
    { problemSlug: 'sum-of-array', language: 'javascript', daysAgo: 16, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 7 },
    { problemSlug: 'count-vowels', language: 'javascript', daysAgo: 12, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 6 },
    { problemSlug: 'fizzbuzz', language: 'javascript', daysAgo: 12, status: 'accepted', passedTests: 2, totalTests: 2, runtimeMs: 11 },
    { problemSlug: 'is-palindrome', language: 'javascript', daysAgo: 8, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 8 },
    { problemSlug: 'find-index', language: 'javascript', daysAgo: 6, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 6 },
    { problemSlug: 'remove-duplicates', language: 'javascript', daysAgo: 6, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 9 },
    { problemSlug: 'sql-select-all-employees', language: 'sql', daysAgo: 3, status: 'accepted', passedTests: 1, totalTests: 1, runtimeMs: 20 },
    { problemSlug: 'two-sum', language: 'javascript', daysAgo: 2, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 14 },
    { problemSlug: 'valid-parentheses', language: 'javascript', daysAgo: 2, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 10 },
    { problemSlug: 'sql-filter-by-department', language: 'sql', daysAgo: 1, status: 'accepted', passedTests: 1, totalTests: 1, runtimeMs: 22 },
    { problemSlug: 'maximum-subarray', language: 'javascript', daysAgo: 0, status: 'accepted', passedTests: 3, totalTests: 3, runtimeMs: 13 },
  ],

  // Two project submissions: one awaiting review, one already reviewed.
  projectSubmissions: [
    {
      projectSlug: 'profile-card',
      studentKey: 'student-enrolled',
      attemptNumber: 1,
      daysAgo: 4,
      status: 'submitted',
    },
    {
      projectSlug: 'todo-list',
      studentKey: 'student-enrolled',
      attemptNumber: 1,
      daysAgo: 8,
      status: 'passed',
      instructorReview: {
        instructorKey: 'instructor',
        finalScore: 88,
        feedback:
          'Clean, readable JavaScript. The localStorage persistence works well. Next time, consider extracting the render logic into smaller functions as the app grows.',
        requestResubmission: false,
        status: 'passed',
        categoryOverrides: [
          { category: 'Functionality', score: 60, note: 'All requirements met.' },
          { category: 'Code quality', score: 20, note: 'Consider splitting render.' },
          { category: 'UI polish', score: 8, note: 'Clean.' },
        ],
      },
    },
  ],
};