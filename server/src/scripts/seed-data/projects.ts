import type { SeedProject } from './types.js';

export const projects: SeedProject[] = [
  {
    title: 'Personal Profile Card',
    slug: 'profile-card',
    description: 'A responsive personal profile card with HTML & CSS.',
    longDescription:
      'Build a card with an avatar, name, bio, and social links. Uses semantic HTML and Flexbox.',
    category: 'frontend',
    difficulty: 'beginner',
    topics: ['html', 'css', 'flexbox'],
    previewMode: 'html',
    estimatedMinutes: 30,
    xpReward: 50,
    mode: 'required',
    instructions:
      'Use semantic HTML and CSS Flexbox to center a card on the page. Style the avatar as a circle.',
    specification: {
      objective: 'Build a centered profile card with an avatar and links.',
      requiredFeatures: [
        'A .card element',
        'An .avatar element',
        'An h1 with the name',
        'A .bio paragraph',
      ],
      technicalRequirements: [
        'Use Flexbox or Grid for layout',
        'The avatar should be a circle',
      ],
      designRequirements: ['Cards should have padding and rounded corners'],
      accessibilityRequirements: ['Images must have alt text'],
      expectedBehaviour: 'The card is centered, styled, and readable.',
    },
    rubric: [
      { category: 'Layout', weight: 40 },
      { category: 'Styling', weight: 40 },
      { category: 'Accessibility', weight: 20 },
    ],
    files: [
      {
        name: 'index.html',
        language: 'html',
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
        language: 'css',
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
    tests: [
      {
        name: 'Card element exists',
        check: { type: 'dom-exists', selector: '.card' },
      },
      {
        name: 'Avatar element exists',
        check: { type: 'dom-exists', selector: '.avatar' },
      },
      {
        name: 'Bio element exists',
        check: { type: 'dom-exists', selector: '.bio' },
      },
      {
        name: 'Name heading exists',
        check: { type: 'dom-exists', selector: 'h1' },
      },
    ],
  },
  {
    title: 'Todo List App',
    slug: 'todo-list',
    description: 'A working todo app with vanilla JavaScript and localStorage.',
    longDescription:
      'Build a complete todo list with add, toggle, delete, and localStorage persistence.',
    category: 'javascript',
    difficulty: 'intermediate',
    topics: ['javascript', 'dom', 'localstorage'],
    previewMode: 'html',
    estimatedMinutes: 60,
    xpReward: 100,
    mode: 'required',
    instructions:
      'Wire up the form to add todos, click to toggle complete, and persist to localStorage.',
    specification: {
      objective: 'Build a todo app with add, toggle, and delete.',
      requiredFeatures: [
        'A form to add todos',
        'A list that renders todos',
        'Persistence in localStorage',
      ],
      technicalRequirements: [
        'Use addEventListener or onsubmit',
        'Write to localStorage on every change',
      ],
      expectedBehaviour:
        'Adding a todo renders it; toggling marks it done; reloading preserves state.',
    },
    rubric: [
      { category: 'Functionality', weight: 60 },
      { category: 'Code quality', weight: 25 },
      { category: 'UI polish', weight: 15 },
    ],
    files: [
      {
        name: 'index.html',
        language: 'html',
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
        language: 'css',
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
        language: 'javascript',
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
    tests: [
      {
        name: 'Form exists',
        check: { type: 'dom-exists', selector: '#form' },
      },
      {
        name: 'Input exists',
        check: { type: 'dom-exists', selector: '#input' },
      },
      {
        name: 'List exists',
        check: { type: 'dom-exists', selector: '#list' },
      },
    ],
  },
  {
    title: 'React Counter',
    slug: 'react-counter',
    description: 'Your first React component with useState.',
    longDescription:
      'A simple counter with increment, decrement, and reset using React hooks.',
    category: 'react',
    difficulty: 'beginner',
    topics: ['react', 'hooks', 'usestate'],
    previewMode: 'react',
    estimatedMinutes: 30,
    xpReward: 50,
    mode: 'required',
    instructions:
      'Use useState to track count. Three buttons: −, Reset, +.',
    specification: {
      objective: 'Build a counter with three controls.',
      requiredFeatures: [
        'A number displayed',
        'A − button',
        'A Reset button',
        'A + button',
      ],
      expectedBehaviour:
        'Clicking + increments, − decrements, Reset returns to 0.',
    },
    rubric: [
      { category: 'Functionality', weight: 70 },
      { category: 'Code quality', weight: 30 },
    ],
    files: [
      {
        name: 'App.jsx',
        language: 'jsx',
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
    tests: [
      {
        name: 'Counter heading exists',
        check: { type: 'dom-exists', selector: 'h1' },
      },
    ],
  },
  {
    title: 'Styled Hero Section',
    slug: 'styled-hero',
    description: 'A marketing-style hero section with a heading and CTA.',
    longDescription:
      'Practice layout and typography by building a hero section.',
    category: 'frontend',
    difficulty: 'beginner',
    topics: ['html', 'css', 'layout'],
    previewMode: 'html',
    estimatedMinutes: 45,
    xpReward: 75,
    mode: 'recommended',
    instructions:
      'Build a hero section with a heading, subheading, and call-to-action button.',
    specification: {
      objective: 'Build a hero section.',
      requiredFeatures: [
        'An h1 heading',
        'A subheading paragraph',
        'A .cta button or link',
      ],
      designRequirements: ['Center the content', 'Add some vertical spacing'],
      expectedBehaviour: 'The hero looks like a real landing page hero.',
    },
    rubric: [
      { category: 'Layout', weight: 50 },
      { category: 'Typography', weight: 30 },
      { category: 'CTA visibility', weight: 20 },
    ],
    files: [
      {
        name: 'index.html',
        language: 'html',
        isEntry: true,
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Hero</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <section class="hero">
    <h1>Build something real.</h1>
    <p>Learn by building.</p>
    <a class="cta" href="#">Get started</a>
  </section>
</body>
</html>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body { font-family: system-ui; margin: 0; }
.hero {
  display: grid;
  place-items: center;
  min-height: 60vh;
  text-align: center;
  padding: 4rem 1rem;
  background: #f7faf8;
}
h1 { color: #092328; margin: 0 0 0.5rem; }
p { color: #60736d; margin: 0 0 1.5rem; }
.cta {
  background: #2a835f;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
}`,
      },
    ],
    tests: [
      {
        name: 'Hero section exists',
        check: { type: 'dom-exists', selector: '.hero' },
      },
      {
        name: 'Heading exists',
        check: { type: 'dom-exists', selector: 'h1' },
      },
      {
        name: 'CTA exists',
        check: { type: 'dom-exists', selector: '.cta' },
      },
    ],
  },
  {
    title: 'Interactive Quiz Card',
    slug: 'interactive-quiz',
    description:
      'A single-question quiz card with clickable answer options.',
    longDescription:
      'Build a quiz card where clicking an option reveals whether it is correct.',
    category: 'javascript',
    difficulty: 'intermediate',
    topics: ['javascript', 'dom', 'events'],
    previewMode: 'html',
    estimatedMinutes: 60,
    xpReward: 100,
    mode: 'open_choice',
    instructions:
      'Render a question and three options. Clicking an option marks it correct or incorrect.',
    specification: {
      objective: 'Build an interactive quiz card.',
      requiredFeatures: [
        'A .question element',
        'At least three .option buttons',
        'Clicking an option reveals correctness',
      ],
      expectedBehaviour:
        'Clicking a wrong option marks it red; clicking the right one marks it green.',
    },
    rubric: [
      { category: 'Functionality', weight: 60 },
      { category: 'UI feedback', weight: 40 },
    ],
    files: [
      {
        name: 'index.html',
        language: 'html',
        isEntry: true,
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Quiz</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <p class="question">What does HTML stand for?</p>
    <button class="option" data-correct="false">Hyper Text Markup Language</button>
    <button class="option" data-correct="false">Home Tool Markup Language</button>
    <button class="option" data-correct="true">Hyperlinks and Text Markup Language</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body { font-family: system-ui; background: #f7faf8; margin: 0; padding: 2rem; }
.card { max-width: 420px; margin: 0 auto; background: white; padding: 1.5rem; border-radius: 12px; }
.question { font-weight: 600; margin: 0 0 1rem; color: #092328; }
.option { display: block; width: 100%; text-align: left; padding: 0.6rem 0.8rem; margin: 0.5rem 0; border: 1px solid #d4e2d8; border-radius: 8px; background: white; cursor: pointer; }
.option.correct { background: #d1fae5; border-color: #22c55e; }
.option.incorrect { background: #fee2e2; border-color: #ef4444; }`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `document.querySelectorAll('.option').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.correct === 'true') {
      btn.classList.add('correct');
    } else {
      btn.classList.add('incorrect');
    }
  });
});`,
      },
    ],
    tests: [
      {
        name: 'Question exists',
        check: { type: 'dom-exists', selector: '.question' },
      },
      {
        name: 'At least three options',
        check: { type: 'dom-count', selector: '.option', count: 3 },
      },
    ],
  },
];