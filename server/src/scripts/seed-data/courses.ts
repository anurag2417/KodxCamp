import type { SeedCourse } from './types.js';

const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KodxCamp</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <!-- Your markup goes here -->
  <script src="script.js"></script>
</body>
</html>`;

const EMPTY_CSS = `/* Your styles go here */\n`;
const EMPTY_JS = `// Your JavaScript goes here\n`;

export const courses: SeedCourse[] = [
  /* ─── 1. HTML & CSS Fundamentals (web, steps) ─────────────────── */
  {
    title: 'HTML & CSS Fundamentals',
    slug: 'html-css-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?auto=format&fit=crop&w=800&q=80',
    description:
      'Build your foundation for web development with modern HTML and CSS. Step-by-step lessons that produce working pages.',
    language: 'html-css',
    courseType: 'web',
    published: true,
    isFree: true,
    tagline: 'Your first real pages',
    tags: ['html', 'css', 'beginner', 'free'],
    badge: 'POPULAR',
    features: [
      { icon: '🎨', label: 'Live preview' },
      { icon: '🧩', label: 'Guided steps' },
      { icon: '✅', label: 'Instant feedback' },
    ],
    sellingPoints: [
      {
        icon: '👨‍💻',
        title: 'Write real HTML from lesson one',
        subtitle: 'No "hello world" filler — you build pages.',
      },
      {
        icon: '⚡',
        title: 'See changes live',
        subtitle: 'The preview updates as you type.',
      },
    ],
    sellingHeadline: 'Stop reading about HTML. Start building pages.',
    learningOutcomes: [
      'Structure a page with semantic HTML',
      'Style text, boxes, and images with CSS',
      'Build a responsive layout with Flexbox',
      'Ship a complete profile card project',
    ],
    curriculum: [
      {
        title: 'Getting Started',
        lessons: 2,
        duration: '20 min',
        items: ['Your First HTML Page', 'Styling with CSS'],
      },
      {
        title: 'Structured Pages',
        lessons: 3,
        duration: '45 min',
        items: [
          'Lists, Links, and Images',
          'The Box Model',
          'Build a Profile Card',
        ],
      },
    ],
    projects: [
      {
        title: 'Personal Profile Card',
        subtitle: 'A responsive card with avatar and social links',
      },
    ],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
      bio: 'Riya has shipped design systems at two product companies and now teaches frontend full-time.',
      links: [
        { label: 'GitHub', url: 'https://github.com' },
        { label: 'Website', url: 'https://example.com' },
      ],
    },
    certificateIncluded: true,
    faq: [
      {
        question: 'Do I need to install anything?',
        answer:
          'No. Everything runs in your browser. Open a lesson and start typing.',
      },
      {
        question: 'Is this course beginner-friendly?',
        answer:
          'Yes. No prior coding experience is assumed.',
      },
    ],
    lessons: [
      {
        title: 'Your First HTML Page',
        slug: 'first-html-page',
        content:
          'HTML is the skeleton of every webpage. In this lesson you will create a simple heading using the `<h1>` tag.\n\n**Task:** Write an `<h1>` tag containing the text `Hello, KodxCamp!`',
        starterCode: '',
        solution: '<h1>Hello, KodxCamp!</h1>',
        starterFiles: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My First Page</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <!-- Write your <h1> below -->
  <script src="script.js"></script>
</body>
</html>`,
          'styles.css': EMPTY_CSS,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: ['<h1>', 'Hello, KodxCamp!'],
          requiredCss: [],
          requiredJs: [],
        },
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Styling with CSS',
        slug: 'styling-with-css',
        content:
          'CSS controls how HTML looks. Give an element a class and write a rule in `styles.css`.\n\n**Task:** Give the `<h1>` the class `heading` and add `.heading { color: green; }` to `styles.css`.',
        starterCode: '',
        solution: '<h1 class="heading">Styled Text</h1>',
        starterFiles: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Styled Text</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <h1>Styled Text</h1>
  <script src="script.js"></script>
</body>
</html>`,
          'styles.css': `/* Add a .heading rule here */\n`,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: ['class="heading"'],
          requiredCss: ['.heading', 'color'],
          requiredJs: [],
        },
        testCases: [
          { input: '', expectedOutput: 'Styled Text', isHidden: false },
        ],
      },
      {
        title: 'Lists, Links, and Images',
        slug: 'lists-links-images',
        content:
          'Add a list of three items, a link, and an image to the page.\n\n**Task:** Create a `<ul>` with three `<li>` items, an `<a>` with href, and an `<img>` with alt text.',
        starterCode: '',
        solution: `<ul><li>A</li><li>B</li><li>C</li></ul>
<a href="https://example.com">Example</a>
<img src="https://placehold.co/100" alt="placeholder" />`,
        starterFiles: {
          'index.html': HTML_SHELL,
          'styles.css': EMPTY_CSS,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: ['<ul>', '<li>', '<a ', '<img ', 'alt='],
          requiredCss: [],
          requiredJs: [],
        },
        testCases: [
          { input: '', expectedOutput: 'A', isHidden: false },
        ],
      },
      {
        title: 'The Box Model',
        slug: 'the-box-model',
        content:
          'Every element is a box with content, padding, border, and margin.\n\n**Task:** Add a `.box` rule with padding, border, and margin.',
        starterCode: '',
        solution: '',
        starterFiles: {
          'index.html': HTML_SHELL,
          'styles.css': `/* Add a .box rule */\n.box {\n}\n`,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: [],
          requiredCss: ['.box', 'padding', 'border', 'margin'],
          requiredJs: [],
        },
        testCases: [{ input: '', expectedOutput: 'box', isHidden: false }],
      },
      {
        title: 'Build a Profile Card',
        slug: 'build-a-profile-card',
        content:
          'Follow the steps to build a complete profile card. Each step adds one piece — you cannot skip ahead until the current step passes.',
        starterCode: '',
        solution: '',
        steps: [
          {
            title: 'Add the card container',
            instructions:
              'Add a `<div>` with class `card` inside `<body>`.\n\nStyling comes next.',
            hint: 'Use `<div class="card"></div>` between `<body>` and `</body>`.',
            starterFiles: {
              'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Profile Card</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <!-- Add a div with class "card" here -->
  <script src="script.js"></script>
</body>
</html>`,
              'styles.css': EMPTY_CSS,
              'script.js': EMPTY_JS,
            },
            webChecks: {
              requiredHtml: ['<div class="card"', '</div>'],
              requiredCss: [],
              requiredJs: [],
            },
          },
          {
            title: 'Add the name and bio',
            instructions:
              'Inside the card, add an `<h1>` with your name and a `<p class="bio">` with a one-line intro.',
            hint: 'Two siblings inside the card div.',
            starterFiles: { 'index.html': '' },
            webChecks: {
              requiredHtml: ['<h1>', '<p class="bio"'],
              requiredCss: [],
              requiredJs: [],
            },
          },
          {
            title: 'Style the card',
            instructions:
              'Add a `.card` rule in `styles.css` with a background, border-radius, and padding.',
            hint: '`.card { background: white; border-radius: 16px; padding: 2rem; }`',
            starterFiles: {
              'styles.css': `/* Style .card */\n.card {\n}\n`,
            },
            webChecks: {
              requiredHtml: [],
              requiredCss: [
                '.card',
                'background',
                'border-radius',
                'padding',
              ],
              requiredJs: [],
            },
          },
        ],
      },
    ],
  },

  /* ─── 2. JavaScript Essentials (challenges) ────────────────────── */
  {
    title: 'JavaScript Essentials',
    slug: 'javascript-essentials',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
    description:
      'Learn programming fundamentals with JavaScript — the language of the web. Guided challenges get you writing code from the first minute.',
    language: 'javascript',
    courseType: 'programming',
    published: true,
    isFree: true,
    tagline: 'The language of the web',
    tags: ['javascript', 'beginner', 'free'],
    badge: 'NEW',
    features: [
      { icon: '⚡', label: 'In-browser runtime' },
      { icon: '🎯', label: 'Guided challenges' },
      { icon: '📝', label: 'Auto-graded tests' },
    ],
    learningOutcomes: [
      'Understand variables, types, and operators',
      'Write functions with parameters and return values',
      'Use conditionals and loops',
      'Solve real problems in JavaScript',
    ],
    curriculum: [
      {
        title: 'Getting Started',
        lessons: 2,
        duration: '30 min',
        items: ['Hello, Console!', 'Variables & Math'],
      },
      {
        title: 'Control Flow',
        lessons: 2,
        duration: '40 min',
        items: ['Conditionals', 'Loops'],
      },
    ],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
      bio: 'Riya has shipped design systems at two product companies.',
    },
    certificateIncluded: true,
    lessons: [
      {
        title: 'Hello, Console!',
        slug: 'hello-console',
        content:
          'Use `console.log()` to print messages.\n\n**Task:** Print `Hello, KodxCamp!`.',
        starterCode: '// Use console.log below\n',
        solution: 'console.log("Hello, KodxCamp!");',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
        tutorialChallenges: [
          {
            title: 'Print the greeting',
            instructions:
              'Call `console.log` with the exact string `Hello, KodxCamp!`.',
            hint: 'Wrap the string in quotes.',
            starterCode: '// your code here\n',
            checks: [
              { type: 'includes', value: 'console.log', label: 'calls console.log' },
              {
                type: 'includes',
                value: 'Hello, KodxCamp!',
                label: 'prints the greeting',
              },
            ],
            language: 'javascript',
          },
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
      {
        title: 'Conditionals',
        slug: 'conditionals',
        content:
          'Use `if` / `else` to branch on values.\n\n**Task:** Write a function `checkSign(n)` that returns `"positive"`, `"negative"`, or `"zero"`.',
        starterCode:
          'function checkSign(n) {\n  // TODO\n}\n',
        solution: `function checkSign(n) {
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "zero";
}`,
        functionName: 'checkSign',
        outputMode: 'return',
        testCases: [
          { input: '[5]', expectedOutput: '"positive"', isHidden: false },
          { input: '[-3]', expectedOutput: '"negative"', isHidden: false },
          { input: '[0]', expectedOutput: '"zero"', isHidden: false },
          { input: '[100]', expectedOutput: '"positive"', isHidden: true },
          { input: '[-100]', expectedOutput: '"negative"', isHidden: true },
        ],
      },
      {
        title: 'Loops',
        slug: 'loops',
        content:
          'Loop over a list with `for` or `while`.\n\n**Task:** Write `sum(nums)` that returns the total of an array of numbers.',
        starterCode: 'function sum(nums) {\n  // TODO\n}\n',
        solution: `function sum(nums) {
  let total = 0;
  for (const n of nums) total += n;
  return total;
}`,
        functionName: 'sum',
        outputMode: 'return',
        testCases: [
          { input: '[[1, 2, 3]]', expectedOutput: '6', isHidden: false },
          { input: '[[]]', expectedOutput: '0', isHidden: false },
          {
            input: '[[10, -5, 3]]',
            expectedOutput: '8',
            isHidden: true,
          },
        ],
      },
    ],
  },

  /* ─── 3. Python Fundamentals ───────────────────────────────────── */
  {
    title: 'Python Fundamentals',
    slug: 'python-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=80',
    description:
      'Learn programming basics with Python — clean syntax, powerful standard library, great for beginners and data work alike.',
    language: 'python',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['python', 'beginner', 'free'],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    lessons: [
      {
        title: 'Print Statements',
        slug: 'print-statements',
        content:
          'Python uses `print()` to show output.\n\n**Task:** Print `Hello, KodxCamp!`.',
        starterCode: '# Write your print below\n',
        solution: 'print("Hello, KodxCamp!")',
        testCases: [
          { input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false },
        ],
      },
      {
        title: 'Variables & Arithmetic',
        slug: 'variables-arithmetic-python',
        content:
          'Python variables are dynamically typed.\n\n**Task:** Print the sum of 7 and 8.',
        starterCode: 'a = 7\nb = 8\n# print the sum\n',
        solution: 'a = 7\nb = 8\nprint(a + b)',
        testCases: [{ input: '', expectedOutput: '15', isHidden: false }],
      },
    ],
  },

  /* ─── 4. Ruby Fundamentals ─────────────────────────────────────── */
  {
    title: 'Ruby Fundamentals',
    slug: 'ruby-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
    description:
      'Learn programming basics with Ruby — clean syntax, powerful objects, and a community that values programmer happiness.',
    language: 'ruby',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['ruby', 'beginner', 'free'],
    lessons: [
      {
        title: 'Hello, Ruby!',
        slug: 'hello-ruby',
        content:
          'Ruby uses `puts` to print a line.\n\n**Task:** Print `Hello, KodxCamp!`.',
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

  /* ─── 5. Java Fundamentals ─────────────────────────────────────── */
  {
    title: 'Java Fundamentals',
    slug: 'java-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    description:
      'Learn programming basics with Java — statically typed, object-oriented, and one of the most widely deployed languages in the world.',
    language: 'java',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['java', 'beginner', 'free'],
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

  /* ─── 6. SQL Fundamentals ──────────────────────────────────────── */
  {
    title: 'SQL Fundamentals',
    slug: 'sql-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    description:
      'Query relational databases with structured query language. Learn SELECT, WHERE, GROUP BY, and JOIN on real data.',
    language: 'sql',
    courseType: 'database',
    published: true,
    isFree: true,
    tags: ['sql', 'beginner', 'free'],
    lessons: [
      {
        title: 'SELECT Basics',
        slug: 'select-basics',
        content:
          '`SELECT` fetches columns from a table.\n\n**Task:** Select all columns from the `users` table.',
        starterCode: '-- Write your SELECT\n',
        solution: 'SELECT * FROM users;',
        testCases: [
          {
            input: '',
            expectedOutput: 'id | name\n--- | ---\n1 | Ada',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Filtering with WHERE',
        slug: 'filtering-with-where',
        content:
          'Use `WHERE` to filter rows.\n\n**Task:** Select `name` from `users` where `age > 18`.',
        starterCode: '-- SELECT name FROM users WHERE ...\n',
        solution: 'SELECT name FROM users WHERE age > 18;',
        testCases: [
          {
            input: '',
            expectedOutput: 'name\n---\nAda',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Grouping & Aggregate Functions',
        slug: 'grouping-aggregates',
        content:
          'Use `GROUP BY` with `COUNT`, `SUM`, `AVG` to summarise rows.\n\n**Task:** Count users per country.',
        starterCode: '-- SELECT country, COUNT(*)...\n',
        solution:
          'SELECT country, COUNT(*) AS n FROM users GROUP BY country;',
        testCases: [
          {
            input: '',
            expectedOutput: 'country | n\n--- | ---\nIndia | 3',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 7. TypeScript for JavaScript Developers ──────────────────── */
  {
    title: 'TypeScript for JavaScript Developers',
    slug: 'typescript-for-js-devs',
    description:
      'Add static types to your JavaScript. Catch bugs at compile time, improve tooling, and write code that scales.',
    language: 'typescript',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['typescript', 'javascript', 'intermediate', 'free'],
    lessons: [
      {
        title: 'Types & Annotations',
        slug: 'types-and-annotations',
        content:
          'TypeScript adds types on top of JavaScript.\n\n**Task:** Write a function `greet(name: string): string` that returns `"Hello, " + name`.',
        starterCode:
          'function greet(name: string): string {\n  // TODO\n  return "";\n}\n',
        solution:
          'function greet(name: string): string {\n  return "Hello, " + name;\n}\nconsole.log(greet("Ada"));',
        testCases: [
          {
            input: '',
            expectedOutput: 'Hello, Ada',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 8. React Fundamentals ────────────────────────────────────── */
  {
    title: 'React Fundamentals',
    slug: 'react-fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    description:
      'Build interactive UIs with React. Components, props, state, and hooks — explained by building a real app.',
    language: 'react',
    courseType: 'framework',
    published: true,
    isFree: false,
    price: 149900,
    originalPrice: 249900,
    badge: 'POPULAR',
    tags: ['react', 'javascript', 'frontend'],
    learningOutcomes: [
      'Build and compose components',
      'Manage state with useState',
      'Handle side effects with useEffect',
      'Fetch data and render lists',
    ],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    lessons: [
      {
        title: 'Your First Component',
        slug: 'first-component',
        content:
          'A React component is a function that returns JSX.\n\n**Task:** Write a component that renders `<h1>Hello, React!</h1>`.',
        starterCode: `export default function App() {
  return (
    <div>
      {/* TODO */}
    </div>
  );
}
`,
        solution: `export default function App() {
  return (
    <div>
      <h1>Hello, React!</h1>
    </div>
  );
}
`,
        starterFiles: {
          'index.html': HTML_SHELL,
          'styles.css': EMPTY_CSS,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: [],
          requiredCss: [],
          requiredJs: [],
        },
        testCases: [
          {
            input: '',
            expectedOutput: 'Hello, React!',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 9. Tailwind CSS ──────────────────────────────────────────── */
  {
    title: 'Tailwind CSS Essentials',
    slug: 'tailwind-essentials',
    description:
      'Style pages with utility classes. No context-switching between HTML and CSS files.',
    language: 'tailwind',
    courseType: 'framework',
    published: true,
    isFree: true,
    tags: ['tailwind', 'css', 'frontend'],
    lessons: [
      {
        title: 'Utility Classes 101',
        slug: 'utility-classes-101',
        content:
          'Tailwind provides small utility classes for every common style.\n\n**Task:** Style a `<div>` with `p-4`, `bg-blue-500`, and `text-white`.',
        starterCode: '',
        solution:
          '<div class="p-4 bg-blue-500 text-white">Styled</div>',
        starterFiles: {
          'index.html': HTML_SHELL,
          'styles.css': EMPTY_CSS,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: ['class="p-4', 'bg-blue-500', 'text-white'],
          requiredCss: [],
          requiredJs: [],
        },
        testCases: [
          { input: '', expectedOutput: 'Styled', isHidden: false },
        ],
      },
    ],
  },

  /* ─── 10. Data Structures & Algorithms (modules) ───────────────── */
  {
    title: 'Data Structures & Algorithms',
    slug: 'data-structures-algorithms',
    description:
      'Patterns every developer should know. Arrays, hashing, two pointers, recursion, and more — taught through practice.',
    language: 'javascript',
    courseType: 'programming',
    published: true,
    isFree: false,
    price: 199900,
    originalPrice: 299900,
    badge: 'LIVE',
    tags: ['dsa', 'interview', 'intermediate'],
    instructor: {
      name: 'Riya Sharma',
      role: 'Frontend Engineer',
    },
    lessons: [
      {
        title: 'Arrays and Two Pointers',
        slug: 'arrays-and-two-pointers',
        content:
          'Walk arrays from both ends to find pairs efficiently.\n\n**Task:** Implement `twoSum(nums, target)` returning the two indices.',
        starterCode:
          'function twoSum(nums, target) {\n  // TODO\n}\n',
        solution: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
        functionName: 'twoSum',
        outputMode: 'return',
        testCases: [
          {
            input: '[[2, 7, 11, 15], 9]',
            expectedOutput: '[0,1]',
            isHidden: false,
          },
          {
            input: '[[3, 2, 4], 6]',
            expectedOutput: '[1,2]',
            isHidden: false,
          },
          {
            input: '[[3, 3], 6]',
            expectedOutput: '[0,1]',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Hash Maps',
        slug: 'hash-maps',
        content:
          'Use a hash map for O(1) lookups.\n\n**Task:** Count character occurrences in a string.',
        starterCode:
          'function countChars(s) {\n  // TODO: return { char: count }\n}\n',
        solution: `function countChars(s) {
  const out = {};
  for (const c of s) out[c] = (out[c] || 0) + 1;
  return out;
}`,
        functionName: 'countChars',
        outputMode: 'return',
        testCases: [
          {
            input: '["aab"]',
            expectedOutput: '{"a":2,"b":1}',
            isHidden: false,
          },
        ],
      },
    ],
    modules: [
      {
        title: 'Foundations',
        description: 'Arrays, hashing, and simple loops.',
        lessonSlugs: ['arrays-and-two-pointers', 'hash-maps'],
      },
    ],
  },

  /* ─── 11. Advanced JavaScript Patterns ─────────────────────────── */
  {
    title: 'Advanced JavaScript Patterns',
    slug: 'advanced-js-patterns',
    description:
      'Closures, prototypes, async/await, and the patterns that separate intermediate from advanced JavaScript developers.',
    language: 'javascript',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['javascript', 'advanced', 'patterns'],
    lessons: [
      {
        title: 'Closures in Practice',
        slug: 'closures-in-practice',
        content:
          'A closure captures variables from its enclosing scope.\n\n**Task:** Write `counter()` that returns a function incrementing an internal count.',
        starterCode: `function counter() {
  // TODO: return a function that increments
}
`,
        solution: `function counter() {
  let n = 0;
  return () => ++n;
}`,
        testCases: [
          {
            input: '',
            expectedOutput: '1',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 12. Git & Command Line for Developers ────────────────────── */
  {
    title: 'Git & Command Line for Developers',
    slug: 'git-and-cli',
    description:
      'Everyday Git workflows and the shell commands you will actually use. No GUI required.',
    language: 'javascript',
    courseType: 'tools',
    published: true,
    isFree: true,
    tags: ['git', 'cli', 'tools'],
    lessons: [
      {
        title: 'The Essential Git Workflow',
        slug: 'essential-git-workflow',
        content:
          'Status, add, commit, push. The four commands you will type a hundred times a day.\n\n**Task:** List the four commands in order.',
        starterCode: '// Type the four commands\n',
        solution:
          '// git status\ngit add .\ngit commit -m "message"\ngit push\n',
        testCases: [
          {
            input: '',
            expectedOutput: 'git add',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 13. Testing JavaScript with Vitest ───────────────────────── */
  {
    title: 'Testing JavaScript with Vitest',
    slug: 'testing-javascript',
    description:
      'Write tests that catch bugs, document behaviour, and let you refactor safely.',
    language: 'javascript',
    courseType: 'programming',
    published: true,
    isFree: true,
    tags: ['testing', 'vitest', 'intermediate'],
    lessons: [
      {
        title: 'Your First Test',
        slug: 'your-first-test',
        content:
          'A test asserts that a function produces the expected output.\n\n**Task:** Write a test that `add(2, 3) === 5`.',
        starterCode: `function add(a, b) { return a + b; }
// Write a test for add(2, 3) === 5
`,
        solution: `function add(a, b) { return a + b; }
if (add(2, 3) !== 5) throw new Error("failed");
console.log("ok");`,
        testCases: [
          { input: '', expectedOutput: 'ok', isHidden: false },
        ],
      },
    ],
  },

  /* ─── 14. A paid draft course (test unpublished state) ─────────── */
  {
    title: 'Advanced React Patterns (Coming Soon)',
    slug: 'advanced-react-patterns',
    thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    description:
      'Hooks, context, suspense, and the patterns that production React codebases rely on.',
    language: 'react',
    courseType: 'framework',
    published: false,
    isFree: false,
    price: 249900,
    originalPrice: 299900,
    badge: 'STARTING SOON',
    tags: ['react', 'advanced'],
    lessons: [
      {
        title: 'Introduction',
        slug: 'intro',
        content: 'Coming soon.',
        starterCode: '',
        solution: '',
        testCases: [],
      },
    ],
  },

  /* ─── 15. HTML Forms & Accessibility ───────────────────────────── */
  {
    title: 'HTML Forms & Accessibility',
    slug: 'html-forms-accessibility',
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=800&q=80',
    description:
      'Build forms that everyone can use — labels, input types, error handling, ARIA, and keyboard navigation.',
    language: 'html-css',
    courseType: 'web',
    published: true,
    isFree: true,
    tags: ['html', 'forms', 'a11y'],
    lessons: [
      {
        title: 'Labels and Inputs',
        slug: 'labels-and-inputs',
        content:
          'Every input needs a label. Use `<label for="...">` matched to the input id.\n\n**Task:** Build a form with a labelled email input.',
        starterCode: '',
        solution: `<label for="email">Email</label>
<input id="email" type="email" />`,
        starterFiles: {
          'index.html': HTML_SHELL,
          'styles.css': EMPTY_CSS,
          'script.js': EMPTY_JS,
        },
        webChecks: {
          requiredHtml: ['<label', 'for=', '<input', 'type="email"'],
          requiredCss: [],
          requiredJs: [],
        },
        testCases: [
          { input: '', expectedOutput: 'Email', isHidden: false },
        ],
      },
    ],
  },
  /* ─── 16. Full-Stack Web Development ─────────────────────────── */
  {
    title: 'Full-Stack Web Development',
    slug: 'fullstack-web-development',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    description:
      'Learn how the modern web connects together. Build full-stack applications with React on the client and Express APIs on the backend.',
    language: 'javascript',
    courseType: 'general',
    published: true,
    isFree: true,
    tagline: 'Connect Frontend and Backend',
    tags: ['react', 'node', 'fullstack', 'api'],
    badge: 'NEW',
    features: [
      { icon: '🌐', label: 'Full-stack flow' },
      { icon: '⚡', label: 'Async patterns' },
      { icon: '🔒', label: 'Authentication basics' },
    ],
    lessons: [
      {
        title: 'Making HTTP Requests',
        slug: 'making-http-requests',
        content:
          'In modern JavaScript, fetch returns a Promise that resolves to the Response object. Learn to parse JSON and handle errors safely.',
        starterCode: 'function formatUserProfile(user) {\n  // Return user info formatted as: Name - Role\n  // TODO\n}\n',
        solution: 'function formatUserProfile(user) {\n  return user.name + " - " + user.role;\n}\n',
        functionName: 'formatUserProfile',
        outputMode: 'return',
        testCases: [
          {
            input: '[{"name": "Alice", "role": "Developer"}]',
            expectedOutput: '"Alice - Developer"',
            isHidden: false,
          },
          {
            input: '[{"name": "Bob", "role": "Admin"}]',
            expectedOutput: '"Bob - Admin"',
            isHidden: false,
          },
        ],
      },
    ],
  },

  /* ─── 17. Advanced SQL & Database Modeling ────────────────────── */
  {
    title: 'Relational Database Design & Advanced SQL',
    slug: 'advanced-sql-database-design',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    description:
      'Master relational data modeling, multi-table joins, subqueries, and index optimization using in-browser SQLite.',
    language: 'sql',
    courseType: 'general',
    published: true,
    isFree: true,
    tagline: 'Write queries that scale',
    tags: ['sql', 'database', 'sqlite', 'backend'],
    badge: 'POPULAR',
    features: [
      { icon: '📊', label: 'Multi-table JOINs' },
      { icon: '🔍', label: 'Complex aggregations' },
      { icon: '⚡', label: 'Subqueries & CTEs' },
    ],
    lessons: [
      {
        title: 'Multi-Table JOINs',
        slug: 'multi-table-joins',
        content:
          'INNER JOIN matches rows from both tables when the condition is met. Use it to join foreign keys to primary keys.',
        starterCode: '-- Select customers and their order amounts\nSELECT users.name, orders.amount FROM users\n-- JOIN orders ON ...\n',
        solution: 'SELECT users.name, orders.amount FROM users INNER JOIN orders ON users.id = orders.user_id;',
        testCases: [
          {
            input: '',
            expectedOutput: 'Alice|150\nBob|220',
            isHidden: false,
          },
        ],
      },
    ],
  },
];
