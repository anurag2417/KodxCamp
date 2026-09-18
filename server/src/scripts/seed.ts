import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Problem } from '../models/Problem.model.js';
import { Project } from '../models/Project.model.js';
import { UserProject } from '../models/UserProject.model.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import { Class } from '../models/Class.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { activityService } from '../services/activity.service.js';
import { achievementService } from '../services/achievement.service.js';
import { Activity } from '../models/Activity.model.js';
import { UserAchievement } from '../models/UserAchievement.model.js';

interface LessonSeed {
    title: string;
    slug: string;
    content: string;
    starterCode: string;
    solution: string;
    testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
}

interface CourseSeed {
    title: string;
    slug: string;
    description: string;
    language:
    | 'html-css'
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'sql'
    | 'react'
    | 'tailwind'
    | 'dsa-python'
    | 'dsa-javascript';
    lessons: LessonSeed[];
}

const courses: CourseSeed[] = [
    {
        title: 'HTML & CSS Fundamentals',
        slug: 'html-css',
        description: 'Build your foundation for web development with modern HTML and CSS.',
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
        description: 'Learn programming fundamentals with JavaScript — the language of the web.',
        language: 'javascript',
        lessons: [
            {
                title: 'Hello, Console!',
                slug: 'hello-console',
                content:
                    'Use `console.log()` to print messages.\n\n**Task:** Print `Hello, KodxCamp!` to the console.',
                starterCode: '// Use console.log below\n',
                solution: 'console.log("Hello, KodxCamp!");',
                testCases: [{ input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false }],
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
                title: 'Functions',
                slug: 'functions',
                content:
                    'Functions encapsulate reusable logic.\n\n**Task:** Write a function `double(n)` that returns `n * 2`. Print `double(21)`.',
                starterCode: 'function double(n) {\n  // TODO\n}\n\nconsole.log(double(21));\n',
                solution: 'function double(n) {\n  return n * 2;\n}\n\nconsole.log(double(21));',
                testCases: [{ input: '', expectedOutput: '42', isHidden: false }],
            },
        ],
    },
    {
        title: 'TypeScript for JavaScript Developers',
        slug: 'typescript',
        description: 'Add type safety to your JavaScript with TypeScript.',
        language: 'typescript',
        lessons: [
            {
                title: 'Type Annotations',
                slug: 'type-annotations',
                content:
                    'TypeScript lets you annotate variables.\n\n**Task:** Create a variable `name` of type `string`, set it to `"KodxCamp"`, and print it.',
                starterCode: '// Add type annotation\nconst name = "KodxCamp";\nconsole.log(name);\n',
                solution: 'const name: string = "KodxCamp";\nconsole.log(name);',
            },
        ],
    },
    {
        title: 'Python Fundamentals',
        slug: 'python',
        description: 'Learn programming basics with Python — clean, readable, powerful.',
        language: 'python',
        lessons: [
            {
                title: 'Print Statements',
                slug: 'print-statements',
                content:
                    'Python uses `print()` to show output.\n\n**Task:** Print `Hello, KodxCamp!`',
                starterCode: '# Write your print below\n',
                solution: 'print("Hello, KodxCamp!")',
                testCases: [{ input: '', expectedOutput: 'Hello, KodxCamp!', isHidden: false }],
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
    {
        title: 'React Essentials',
        slug: 'react',
        description: 'Build modern UIs with React — components, props, and state.',
        language: 'react',
        lessons: [
            {
                title: 'Your First Component',
                slug: 'first-component',
                content:
                    'React components are functions that return JSX.\n\n**Task:** Create a `Hello` component that renders `<h1>Hello, React!</h1>`.',
                starterCode:
                    'function Hello() {\n  return null; // TODO\n}\n\nexport default Hello;\n',
                solution:
                    'function Hello() {\n  return <h1>Hello, React!</h1>;\n}\n\nexport default Hello;\n',
            },
        ],
    },
    {
        title: 'Tailwind CSS',
        slug: 'tailwind',
        description: 'Style applications rapidly with utility-first CSS.',
        language: 'tailwind',
        lessons: [
            {
                title: 'Utility Classes',
                slug: 'utility-classes',
                content:
                    'Tailwind provides utility classes.\n\n**Task:** Create a `<div>` with classes `p-4 bg-green-500 text-white`.',
                starterCode: '<!-- Use Tailwind classes -->\n<div>Hello</div>\n',
                solution:
                    '<div class="p-4 bg-green-500 text-white">Hello</div>',
            },
        ],
    },
    {
        title: 'DSA with Python',
        slug: 'dsa-python',
        description: 'Master Data Structures & Algorithms using Python.',
        language: 'dsa-python',
        lessons: [
            {
                title: 'Reverse a List',
                slug: 'reverse-list',
                content:
                    'Reverse a list in-place or return a new reversed list.\n\n**Task:** Print the reversed list of `[1, 2, 3, 4]`.',
                starterCode: 'nums = [1, 2, 3, 4]\n# print reversed\n',
                solution: 'nums = [1, 2, 3, 4]\nprint(nums[::-1])',
                testCases: [{ input: '', expectedOutput: '[4, 3, 2, 1]', isHidden: false }],
            },
        ],
    },
    {
        title: 'DSA with JavaScript',
        slug: 'dsa-javascript',
        description: 'Master Data Structures & Algorithms using JavaScript.',
        language: 'dsa-javascript',
        lessons: [
            {
                title: 'Two Sum',
                slug: 'two-sum',
                content:
                    'Find two numbers that add to a target.\n\n**Task:** Print the indices `[0, 1]` for `nums = [2, 7]`, `target = 9`.',
                starterCode: 'const nums = [2, 7];\nconst target = 9;\n// print the two indices\n',
                solution:
                    'const nums = [2, 7];\nconst target = 9;\nconsole.log([0, 1]);',
                testCases: [{ input: '', expectedOutput: '[0, 1]', isHidden: false }],
            },
        ],
    },
];

// Problems for the DSA practice area (used in Part G, but seeded now)
const problems = [
    {
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'easy' as const,
        topics: ['array', 'hashmap'],
        statement:
            'Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`.',
        starterCode: {
            javascript: 'function twoSum(nums, target) {\n  // TODO\n}',
            python: 'def two_sum(nums, target):\n    # TODO\n    pass',
        },
        testCases: [
            { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
            { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
            { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: false },
            { input: '[1,5,8,3], 11', expectedOutput: '[2,3]', isHidden: true },
            { input: '[0,4,3,0], 0', expectedOutput: '[0,3]', isHidden: true },
            { input: '[-1,-2,-3,-4,-5], -8', expectedOutput: '[2,4]', isHidden: true },
            { input: '[10,20,30,40,50], 90', expectedOutput: '[3,4]', isHidden: true },
            { input: '[1,2,3,4,5,6,7,8,9,10], 19', expectedOutput: '[8,9]', isHidden: true },
            { input: '[100,200,300], 500', expectedOutput: '[1,2]', isHidden: true },
            { input: '[7,3,9,5,1], 16', expectedOutput: '[0,2]', isHidden: true },
        ],
    },
    {
        title: 'Reverse String',
        slug: 'reverse-string',
        difficulty: 'easy' as const,
        topics: ['string', 'two-pointers'],
        statement:
            'Write a function that reverses a string. The input string is given as an array of characters.',
        starterCode: {
            javascript: 'function reverseString(s) {\n  // TODO\n}',
            python: 'def reverse_string(s):\n    # TODO\n    pass',
        },
        testCases: [
            { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
            { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
            { input: '["a"]', expectedOutput: '["a"]', isHidden: false },
            { input: '["a","b"]', expectedOutput: '["b","a"]', isHidden: true },
            { input: '["x","y","z"]', expectedOutput: '["z","y","x"]', isHidden: true },
            { input: '[]', expectedOutput: '[]', isHidden: true },
            { input: '["K","o","d","x"]', expectedOutput: '["x","d","o","K"]', isHidden: true },
            { input: '["1","2","3","4"]', expectedOutput: '["4","3","2","1"]', isHidden: true },
            { input: '["!", "@", "#"]', expectedOutput: '["#","@","!"]', isHidden: true },
            { input: '["A","B","C","D","E"]', expectedOutput: '["E","D","C","B","A"]', isHidden: true },
        ],
    },
    {
        title: 'Palindrome Number',
        slug: 'palindrome-number',
        difficulty: 'easy' as const,
        topics: ['math'],
        statement:
            'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
        starterCode: {
            javascript: 'function isPalindrome(x) {\n  // TODO\n}',
            python: 'def is_palindrome(x):\n    # TODO\n    pass',
        },
        testCases: [
            { input: '121', expectedOutput: 'true', isHidden: false },
            { input: '-121', expectedOutput: 'false', isHidden: false },
            { input: '10', expectedOutput: 'false', isHidden: false },
            { input: '0', expectedOutput: 'true', isHidden: true },
            { input: '12321', expectedOutput: 'true', isHidden: true },
            { input: '1001', expectedOutput: 'true', isHidden: true },
            { input: '123', expectedOutput: 'false', isHidden: true },
            { input: '999', expectedOutput: 'true', isHidden: true },
            { input: '1234567', expectedOutput: 'false', isHidden: true },
            { input: '9', expectedOutput: 'true', isHidden: true },
        ],
    },
];

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
    {
        title: 'Weather Dashboard',
        slug: 'weather-dashboard',
        description: 'Fetch weather data from an API and display it beautifully.',
        longDescription:
            'Learn fetch(), async/await, and how to handle loading + error states.',
        category: 'api' as const,
        difficulty: 'intermediate' as const,
        topics: ['fetch', 'async', 'api', 'dom'],
        previewMode: 'html' as const,
        estimatedMinutes: 60,
        xpReward: 100,
        instructions:
            'Use Open-Meteo API (no key needed). Fetch weather for a city and display temperature + conditions.',
        files: [
            {
                name: 'index.html',
                language: 'html' as const,
                isEntry: true,
                content: `<!DOCTYPE html>
<html>
<head>
  <title>Weather</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <h1>🌤️ Weather</h1>
    <div class="search">
      <input id="city" placeholder="Enter city..." value="Mumbai" />
      <button id="go">Get</button>
    </div>
    <div id="out">Pick a city and click Get</div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
            },
            {
                name: 'style.css',
                language: 'css' as const,
                content: `body { font-family: system-ui; background: #f7faf8; margin: 0; padding: 2rem; }
.app { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
h1 { color: #092328; margin: 0 0 1rem; }
.search { display: flex; gap: 0.5rem; }
input { flex: 1; padding: 0.6rem; border: 1px solid #d4e2d8; border-radius: 8px; }
button { padding: 0.6rem 1rem; background: #2a835f; color: white; border: none; border-radius: 8px; cursor: pointer; }
#out { margin-top: 1rem; padding: 1rem; background: #f0f6f2; border-radius: 8px; color: #092328; }`,
            },
            {
                name: 'script.js',
                language: 'javascript' as const,
                content: `const cityInput = document.getElementById('city');
const goBtn = document.getElementById('go');
const out = document.getElementById('out');

async function getWeather(city) {
  out.textContent = 'Loading...';
  try {
    const geo = await fetch(
      \`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(city)}&count=1\`
    ).then(r => r.json());
    if (!geo.results?.length) { out.textContent = 'City not found'; return; }

    const { latitude, longitude, name } = geo.results[0];
    const w = await fetch(
      \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,weather_code\`
    ).then(r => r.json());

    out.innerHTML = \`<strong>\${name}</strong><br/>\${w.current.temperature_2m}°C<br/>Code: \${w.current.weather_code}\`;
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  }
}

goBtn.onclick = () => getWeather(cityInput.value.trim());
getWeather('Mumbai');`,
            },
        ],
    },
    {
        title: 'SQL Sales Report',
        slug: 'sql-sales-report',
        description: 'Query a small sales database to build a report.',
        longDescription:
            'Use SELECT, WHERE, GROUP BY, and ORDER BY to analyze sales data.',
        category: 'sql' as const,
        difficulty: 'beginner' as const,
        topics: ['sql', 'aggregation', 'group-by'],
        previewMode: 'sql' as const,
        estimatedMinutes: 40,
        xpReward: 75,
        instructions:
            'Seed a sales table, then write a query that shows total sales per product, sorted by total descending.',
        files: [
            {
                name: 'query.sql',
                language: 'sql' as const,
                isEntry: true,
                content: `-- Setup (feel free to edit)
CREATE TABLE sales (product TEXT, amount INTEGER);
INSERT INTO sales VALUES
  ('Laptop', 1200),
  ('Laptop', 1500),
  ('Phone', 800),
  ('Phone', 950),
  ('Tablet', 600);

-- TODO: show total sales per product, sorted by total desc
SELECT product, SUM(amount) AS total
FROM sales
GROUP BY product
ORDER BY total DESC;`,
            },
        ],
    },
    {
        title: 'Animated Bar Chart',
        slug: 'animated-bar-chart',
        description: 'Draw an animated bar chart with SVG and JavaScript.',
        longDescription:
            'Generate an SVG bar chart from an array of numbers. Add CSS transitions for animation.',
        category: 'dataviz' as const,
        difficulty: 'intermediate' as const,
        topics: ['svg', 'dataviz', 'animation'],
        previewMode: 'html' as const,
        estimatedMinutes: 50,
        xpReward: 100,
        instructions:
            'Generate SVG bars from the data array. Scale heights to fit the chart area.',
        files: [
            {
                name: 'index.html',
                language: 'html' as const,
                isEntry: true,
                content: `<!DOCTYPE html>
<html>
<head>
  <title>Bar Chart</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <h1>📊 Weekly Sales</h1>
    <svg id="chart" viewBox="0 0 400 240"></svg>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
            },
            {
                name: 'style.css',
                language: 'css' as const,
                content: `body { font-family: system-ui; background: #f7faf8; margin: 0; padding: 2rem; }
.app { max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
h1 { color: #092328; margin: 0 0 1rem; }
rect { fill: #2a835f; transition: all 0.4s ease; }
rect:hover { fill: #12544f; }
text { fill: #60736d; font-size: 10px; text-anchor: middle; }`,
            },
            {
                name: 'script.js',
                language: 'javascript' as const,
                content: `const data = [120, 200, 150, 80, 170, 220, 90];
const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const svg = document.getElementById('chart');
const chartW = 400, chartH = 240, pad = 20;
const barW = (chartW - pad * 2) / data.length - 8;
const max = Math.max(...data);

data.forEach((v, i) => {
  const h = ((v / max) * (chartH - pad * 2 - 20));
  const x = pad + i * ((chartW - pad * 2) / data.length);
  const y = chartH - pad - h;

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', barW);
  rect.setAttribute('height', h);
  rect.setAttribute('rx', 4);
  svg.appendChild(rect);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x + barW / 2);
  text.setAttribute('y', chartH - 4);
  text.textContent = labels[i];
  svg.appendChild(text);
});`,
            },
        ],
    },
];

async function seedInstructorAndClasses() {
    // Create or reuse a demo instructor
    let instructor = await User.findOne({ email: 'instructor@kodxcamp.dev' });
    if (!instructor) {
        instructor = await User.create({
            name: 'Riya Sharma',
            email: 'instructor@kodxcamp.dev',
            password: await bcrypt.hash('instructor123', 12),
            role: 'instructor',
        });
        console.log('  ✅ Demo instructor: instructor@kodxcamp.dev / instructor123');
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
            meetLink: 'https://meet.google.com/demo-closures-room',
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
            meetLink: 'https://meet.google.com/demo-express-room',
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
            meetLink: 'https://meet.google.com/demo-bigo-room',
            // Demo recording — will point to a placeholder served from /uploads
            recording: {
                url: '/uploads/recordings/sample-lecture.mp4',
                durationSec: 0,
                sizeBytes: 0,
                uploadedAt: new Date(),
                chapters: [
                    { title: 'What is Big-O', startSec: 0 },
                    { title: 'Common complexities', startSec: 60 },
                    { title: 'Real-world examples', startSec: 120 },
                ],
            },
        },
    ];

    for (const c of classSeeds) {
        await Class.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
        console.log(`  ✅ Class: ${c.title}`);
    }
}

async function seed() {
    console.log('🌱 Seeding KodxCamp database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected');

    // Wipe only seeded data (safer than wiping the entire DB)
    await Promise.all([
        Course.deleteMany({}),
        Lesson.deleteMany({}),
        Problem.deleteMany({}),
        Project.deleteMany({}),
        UserProject.deleteMany({}),
        Class.deleteMany({}),
        Enrollment.deleteMany({}),
        Activity.deleteMany({}),
        UserAchievement.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing courses / lessons / problems');

    for (const c of courses) {
        const created = await Course.create({
            title: c.title,
            slug: c.slug,
            description: c.description,
            language: c.language,
            totalLessons: c.lessons.length,
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

    for (const p of projects) {
        await Project.create(p);
        console.log(`  ✅ Project: ${p.title}`);
    }

    await seedInstructorAndClasses();

    await achievementService.seedDefinitions();
    console.log(`  ✅ Seeded achievement definitions`);

    console.log('\n🎉 Seed complete!');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});