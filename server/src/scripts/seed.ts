import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { User } from '../models/User.model.js';
import { Class } from '../models/Class.model.js';
import { achievementService } from '../services/achievement.service.js';

// ─── Types ────────────────────────────────────────────────────────

type CourseLanguage = 'html-css' | 'javascript' | 'python' | 'ruby' | 'java' | 'sql';

interface RawTestCase {
  input: string;
  expectedOutput: string;
  /** Display flag. Hides input/output from the student's test panel. */
  isHidden: boolean;
}

interface LessonSeed {
  title: string;
  slug: string;
  content: string;
  starterCode: string;
  solution: string;
  testCases?: RawTestCase[];
}

interface CourseSeed {
  title: string;
  slug: string;
  description: string;
  language: CourseLanguage;
  lessons: LessonSeed[];
}

// ─── Course seed data ─────────────────────────────────────────────

const courses: CourseSeed[] = [
  {
    title: 'HTML & CSS Fundamentals',
    slug: 'html-css',
    description:
      'Build your foundation for web development with modern HTML and CSS.',
    language: 'html-css',
    lessons: [
      {
        title: 'Your First HTML Page',
        slug: 'first-html-page',
        content:
          'HTML is the skeleton of every webpage. In this lesson, you will create a simple heading using the `<h1>` tag.\n\n**Task:** Write an `<h1>` tag containing the text `Hello, KodxCamp!`',
        starterCode: '<!-- Write your <h1> below -->\n',
        solution: '<h1>Hello, KodxCamp!</h1>',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Styling with CSS',
        slug: 'styling-with-css',
        content:
          'CSS controls how HTML looks. Use the `style` attribute to color text.\n\n**Task:** Make the heading green using inline styles.',
        starterCode: '<h1>Styled Text</h1>',
        solution: '<h1 style="color: green;">Styled Text</h1>',
      },
    ],
  },
  {
    title: 'JavaScript Essentials',
    slug: 'javascript',
    description:
      'Learn programming fundamentals with JavaScript — the language of the web.',
    language: 'javascript',
    lessons: [
      {
        title: 'Hello, Console!',
        slug: 'hello-console',
        content:
          'Use `console.log()` to print messages.\n\n**Task:** Print `Hello, KodxCamp!` to the console.',
        starterCode: '// Use console.log below\n',
        solution: 'console.log("Hello, KodxCamp!");',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Variables & Math',
        slug: 'variables-math',
        content:
          'Declare variables with `const` or `let`.\n\n**Task:** Create two numbers, add them, and print the result.',
        starterCode: 'const a = 5;\nconst b = 10;\n// Print a + b\n',
        solution: 'const a = 5;\nconst b = 10;\nconsole.log(a + b);',
        testCases: [{ input: '', expectedOutput: '15', isHidden: false }],
      },
    ],
  },
  {
    title: 'Python Fundamentals',
    slug: 'python',
    description:
      'Learn programming basics with Python — clean, readable, powerful.',
    language: 'python',
    lessons: [
      {
        title: 'Print Statements',
        slug: 'print-statements',
        content:
          'Python uses `print()` to show output.\n\n**Task:** Print `Hello, KodxCamp!`',
        starterCode: '# Write your print below\n',
        solution: 'print("Hello, KodxCamp!")',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Variables & Arithmetic',
        slug: 'variables-arithmetic',
        content:
          'Python variables are dynamically typed.\n\n**Task:** Print the sum of 7 and 8.',
        starterCode: 'a = 7\nb = 8\n# print the sum\n',
        solution: 'a = 7\nb = 8\nprint(a + b)',
        testCases: [{ input: '', expectedOutput: '15', isHidden: false }],
      },
    ],
  },
  {
    title: 'Ruby Fundamentals',
    slug: 'ruby',
    description:
      'Learn programming basics with Ruby — clean syntax, powerful objects.',
    language: 'ruby',
    lessons: [
      {
        title: 'Hello, Ruby!',
        slug: 'hello-ruby',
        content:
          'Ruby uses `puts` to print a line.\n\n**Task:** Print `Hello, KodxCamp!`',
        starterCode: '# Write your puts below\n',
        solution: 'puts "Hello, KodxCamp!"',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Variables & Arithmetic',
        slug: 'variables-arithmetic-ruby',
        content:
          "Ruby variables don't need declarations.\n\n**Task:** Print the sum of 7 and 8.",
        starterCode: 'a = 7\nb = 8\n# print the sum\n',
        solution: 'a = 7\nb = 8\nputs a + b',
        testCases: [{ input: '', expectedOutput: '15', isHidden: false }],
      },
    ],
  },
  {
    title: 'Java Fundamentals',
    slug: 'java',
    description:
      'Learn programming basics with Java — the language of enterprise.',
    language: 'java',
    lessons: [
      {
        title: 'Hello, Java!',
        slug: 'hello-java',
        content:
          'Every Java program starts with a `main` method.\n\n**Task:** Print `Hello, KodxCamp!` to stdout.',
        starterCode: `public class Main {
  public static void main(String[] args) {
    // Print Hello, KodxCamp! below
  }
}
`,
        solution: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, KodxCamp!");
  }
}
`,
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Variables & Arithmetic',
        slug: 'variables-arithmetic-java',
        content:
          'Java is statically typed. Declare variables with an explicit type.\n\n**Task:** Print the sum of 7 and 8.',
        starterCode: `public class Main {
  public static void main(String[] args) {
    int a = 7;
    int b = 8;
    // Print the sum below
  }
}
`,
        solution: `public class Main {
  public static void main(String[] args) {
    int a = 7;
    int b = 8;
    System.out.println(a + b);
  }
}
`,
        testCases: [{ input: '', expectedOutput: '15', isHidden: false }],
      },
    ],
  },
  {
    title: 'SQL Fundamentals',
    slug: 'sql',
    description: 'Query relational databases with structured query language.',
    language: 'sql',
    lessons: [
      {
        title: 'SELECT Basics',
        slug: 'select-basics',
        content:
          '`SELECT` fetches columns from a table.\n\n**Task:** Select all columns from the `users` table.',
        starterCode: '-- Write your SELECT\n',
        solution: 'SELECT * FROM users;',
      },
    ],
  },
];

// ─── DSA practice problems ────────────────────────────────────────
//
// Multi-language starters. Each problem declares `starterCode` for
// every language the picker should offer. Test cases are stored with
// plaintext expectedOutput; `isHidden` is a display flag that hides
// the input/output from the student while they work.

const problems = [
  {
    number: 1,
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: 'easy' as const,
    topics: ['math', 'basics'],
    statement:
      'Given two integers `a` and `b`, return their sum.\n\n**Example 1**\n```\nInput: 2, 3\nOutput: 5\n```\n\n**Example 2**\n```\nInput: -4, 7\nOutput: 3\n```',
    functionName: 'addTwo',
    outputMode: 'return' as const,
    starterCode: {
      javascript: 'function addTwo(a, b) {\n  // TODO: return a + b\n}',
      python: 'def addTwo(a, b):\n    # TODO: return a + b\n    pass',
      ruby: 'def add_two(a, b)\n  # TODO: return a + b\nend',
    },
    testCases: [
      { input: '[2, 3]', expectedOutput: '5', isHidden: false },
      { input: '[0, 0]', expectedOutput: '0', isHidden: false },
      { input: '[-1, 1]', expectedOutput: '0', isHidden: false },
      { input: '[100, 200]', expectedOutput: '300', isHidden: true },
      { input: '[-5, -7]', expectedOutput: '-12', isHidden: true },
      { input: '[42, 58]', expectedOutput: '100', isHidden: true },
    ],
  },
  {
    number: 2,
    title: 'Find Maximum',
    slug: 'find-maximum',
    difficulty: 'easy' as const,
    topics: ['array', 'basics'],
    statement:
      'Given an array of integers `nums`, return the largest value in the array. The array will always contain at least one element.\n\n**Example 1**\n```\nInput: [3, 1, 4, 1, 5, 9, 2, 6]\nOutput: 9\n```\n\n**Example 2**\n```\nInput: [-10, -3, -25, -8]\nOutput: -3\n```',
    functionName: 'findMax',
    outputMode: 'return' as const,
    starterCode: {
      javascript:
        'function findMax(nums) {\n  // TODO: return the largest number in nums\n}',
      python:
        'def findMax(nums):\n    # TODO: return the largest number in nums\n    pass',
      ruby: 'def find_max(nums)\n  # TODO: return the largest number in nums\nend',
    },
    testCases: [
      {
        input: '[[3, 1, 4, 1, 5, 9, 2, 6]]',
        expectedOutput: '9',
        isHidden: false,
      },
      { input: '[[42]]', expectedOutput: '42', isHidden: false },
      { input: '[[1, 2, 3]]', expectedOutput: '3', isHidden: false },
      {
        input: '[[-10, -3, -25, -8]]',
        expectedOutput: '-3',
        isHidden: true,
      },
      { input: '[[0, -1, -2]]', expectedOutput: '0', isHidden: true },
      { input: '[[100, 100, 100]]', expectedOutput: '100', isHidden: true },
    ],
  },
  {
    number: 3,
    title: 'Say Hello',
    slug: 'say-hello',
    difficulty: 'easy' as const,
    topics: ['basics', 'output'],
    statement:
      'This is a print-mode problem. Write a program that prints exactly `Hello, KodxCamp!` to stdout.\n\n**Example**\n```\nOutput: Hello, KodxCamp!\n```',
    functionName: 'main',
    outputMode: 'print' as const,
    starterCode: {
      javascript: '// Print the greeting below\n',
      python: '# Print the greeting below\n',
      ruby: '# Print the greeting below\n',
      java: `public class Main {
  public static void main(String[] args) {
    // Print the greeting below
  }
}
`,
    },
    testCases: [
      { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
      { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
      { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
    ],
  },
];

// ─── Projects ─────────────────────────────────────────────────────

const projects = [
  {
    title: 'Personal Profile Card',
    slug: 'profile-card',
    description: 'Build a responsive personal profile card with HTML & CSS.',
    longDescription:
      'Learn HTML structure and CSS styling by building a profile card from scratch. Includes avatar, name, bio, and social links.',
    category: 'frontend' as const,
    difficulty: 'beginner' as const,
    topics: ['html', 'css', 'flexbox'],
    previewMode: 'html' as const,
    estimatedMinutes: 30,
    xpReward: 50,
    instructions:
      'Use semantic HTML and CSS Flexbox to center a card on the page. Style the avatar as a circle.',
    files: [
      {
        name: 'index.html',
        language: 'html' as const,
        isEntry: true,
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Profile Card</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <img class="avatar" src="https://i.pravatar.cc/100" alt="avatar" />
    <h1>Your Name</h1>
    <p class="bio">Full-stack developer in training 🚀</p>
    <div class="links">
      <a href="#">GitHub</a>
      <a href="#">LinkedIn</a>
    </div>
  </div>
</body>
</html>`,
      },
      {
        name: 'style.css',
        language: 'css' as const,
        content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f7faf8;
  font-family: system-ui, sans-serif;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  min-width: 280px;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}
h1 { margin: 1rem 0 0.25rem; color: #092328; }
.bio { color: #60736d; margin: 0 0 1rem; }
.links a {
  color: #2a835f;
  text-decoration: none;
  margin: 0 0.5rem;
  font-weight: 600;
}
.links a:hover { text-decoration: underline; }`,
      },
    ],
  },
  {
    title: 'Todo List App',
    slug: 'todo-list',
    description: 'A working todo app with vanilla JavaScript and localStorage.',
    longDescription:
      'Build a complete todo list application with add, toggle, delete, and persistence in localStorage.',
    category: 'javascript' as const,
    difficulty: 'intermediate' as const,
    topics: ['javascript', 'dom', 'localstorage'],
    previewMode: 'html' as const,
    estimatedMinutes: 60,
    xpReward: 100,
    instructions:
      'Wire up the form to add todos, click to toggle complete, and click × to delete. Save to localStorage on every change.',
    files: [
      {
        name: 'index.html',
        language: 'html' as const,
        isEntry: true,
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Todo List</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <h1>📝 Todos</h1>
    <form id="form">
      <input id="input" placeholder="What needs doing?" autocomplete="off" />
      <button type="submit">Add</button>
    </form>
    <ul id="list"></ul>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        language: 'css' as const,
        content: `body { font-family: system-ui, sans-serif; background: #f7faf8; margin: 0; padding: 2rem; }
.app { max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
h1 { color: #092328; margin: 0 0 1rem; }
form { display: flex; gap: 0.5rem; }
input { flex: 1; padding: 0.6rem; border: 1px solid #d4e2d8; border-radius: 8px; }
button { padding: 0.6rem 1rem; background: #2a835f; color: white; border: none; border-radius: 8px; cursor: pointer; }
ul { list-style: none; padding: 0; margin: 1rem 0 0; }
li { display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #f0f6f2; cursor: pointer; }
li.done { text-decoration: line-through; color: #60736d; }`,
      },
      {
        name: 'script.js',
        language: 'javascript' as const,
        content: `const form = document.getElementById('form');
const input = document.getElementById('input');
const list = document.getElementById('list');

let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function render() {
  list.innerHTML = '';
  todos.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    li.textContent = t.text;
    li.onclick = () => toggle(i);
    li.oncontextmenu = (e) => { e.preventDefault(); remove(i); };
    list.appendChild(li);
  });
  localStorage.setItem('todos', JSON.stringify(todos));
}

function add(text) { todos.push({ text, done: false }); render(); }
function toggle(i) { todos[i].done = !todos[i].done; render(); }
function remove(i) { todos.splice(i, 1); render(); }

form.onsubmit = (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  add(input.value.trim());
  input.value = '';
};

render();`,
      },
    ],
  },
  {
    title: 'React Counter',
    slug: 'react-counter',
    description: 'Your first React component with useState.',
    longDescription:
      'Build a simple counter with increment, decrement, and reset buttons using React hooks.',
    category: 'react' as const,
    difficulty: 'beginner' as const,
    topics: ['react', 'hooks', 'usestate'],
    previewMode: 'react' as const,
    estimatedMinutes: 30,
    xpReward: 50,
    instructions: 'Use useState to track count. Three buttons: -, Reset, +.',
    files: [
      {
        name: 'App.jsx',
        language: 'jsx' as const,
        isEntry: true,
        content: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'system-ui', padding: 40 }}>
      <h1 style={{ color: '#092328' }}>{count}</h1>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(0)} style={{ margin: '0 8px' }}>Reset</button>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}`,
      },
    ],
  },
];

// ─── Seed helpers ─────────────────────────────────────────────────

async function ensureSeedAdmin(): Promise<string> {
  const existing = await User.findOne({ role: 'admin' }).lean();
  if (existing) {
    console.log(`  ✅ Reusing admin: ${existing.email}`);
    return existing._id.toString();
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to seed courses: no admin user exists. Run `npm run make-admin` first.'
    );
  }

  const email = 'admin@kodxcamp.dev';
  const password = await bcrypt.hash('admin12345', 12);
  const created = await User.create({
    name: 'Seed Admin',
    email,
    password,
    role: 'admin',
  });
  console.log(`  ✅ Demo admin: ${email} / admin12345`);
  return created._id.toString();
}

async function seedInstructorAndClasses() {
  if (env.NODE_ENV === 'production') {
    console.log('  ⚠️  Skipping demo instructor + classes in production.');
    return;
  }

  let instructor = await User.findOne({ email: 'instructor@kodxcamp.dev' });
  if (!instructor) {
    instructor = await User.create({
      name: 'Riya Sharma',
      email: 'instructor@kodxcamp.dev',
      password: await bcrypt.hash('instructor123', 12),
      role: 'instructor',
    });
    console.log(
      '  ✅ Demo instructor: instructor@kodxcamp.dev / instructor123'
    );
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const classSeeds = [
    {
      title: 'JavaScript Closures Deep Dive',
      slug: 'javascript-closures-deep-dive',
      description:
        'Live walk-through of closures, scope, and how they power common JS patterns.',
      instructorId: instructor._id.toString(),
      instructorName: instructor.name,
      scheduledAt: new Date(now + 2 * day),
      durationMinutes: 60,
      status: 'scheduled' as const,
      meetLink: 'https://meet.google.com/landing',
    },
    {
      title: 'Building a REST API with Express',
      slug: 'building-rest-api-with-express',
      description:
        'Hands-on session: routes, controllers, error handling, and a working Express API.',
      instructorId: instructor._id.toString(),
      instructorName: instructor.name,
      scheduledAt: new Date(now + 5 * day),
      durationMinutes: 90,
      status: 'scheduled' as const,
      meetLink: 'https://meet.google.com/landing',
    },
    {
      title: 'Intro to Big-O Notation',
      slug: 'intro-to-bigo-notation',
      description: 'Recorded session explaining Big-O with real examples.',
      instructorId: instructor._id.toString(),
      instructorName: instructor.name,
      scheduledAt: new Date(now - 3 * day),
      durationMinutes: 45,
      status: 'ended' as const,
      meetLink: 'https://meet.google.com/landing',
    },
  ];

  for (const c of classSeeds) {
    await Class.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
    console.log(`  ✅ Class: ${c.title}`);
  }
}

// ─── Main seed ────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding KodxCamp database...');

  const force = process.argv.includes('--force');
  if (env.NODE_ENV === 'production' && !force) {
    console.error(
      '❌ Refusing to seed in production without --force.\n' +
        '   This will DELETE all courses, lessons, problems, and projects.\n' +
        '   User data (progress, projects, activity, achievements) is NEVER wiped.\n' +
        '   Run: npm run seed -- --force'
    );
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  await Promise.all([
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Problem.deleteMany({}),
    Project.deleteMany({}),
  ]);
  console.log('🧹 Cleared courses / lessons / problems / projects');

  const adminId = await ensureSeedAdmin();

  for (const c of courses) {
    const created = await Course.create({
      title: c.title,
      slug: c.slug,
      description: c.description,
      language: c.language,
      totalLessons: c.lessons.length,
      createdBy: adminId,
      members: [],
      published: true,
    });

    for (let i = 0; i < c.lessons.length; i++) {
      const l = c.lessons[i];
      await Lesson.create({
        courseId: created._id.toString(),
        title: l.title,
        slug: l.slug,
        order: i + 1,
        content: l.content,
        starterCode: l.starterCode,
        solution: l.solution,
        language: c.language,
        testCases: l.testCases ?? [],
      });
    }
    console.log(`  ✅ ${c.title} (${c.lessons.length} lessons)`);
  }

  for (const p of problems) {
    await Problem.create(p);
    console.log(`  ✅ Problem: ${p.title}`);
  }

  for (const p of projects) {
    await Project.create(p);
    console.log(`  ✅ Project: ${p.title}`);
  }

  await seedInstructorAndClasses();
  await achievementService.seedDefinitions();
  console.log('  ✅ Seeded achievement definitions');

  console.log('\n🎉 Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});