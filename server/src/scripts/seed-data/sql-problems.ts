import type { SeedProblem } from './types.js';

const EMPLOYEES_SETUP = `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, department, salary) VALUES
  (1, 'Ada', 'Engineering', 120000),
  (2, 'Alan', 'Research', 110000),
  (3, 'Grace', 'Engineering', 130000),
  (4, 'Linus', 'Engineering', 115000),
  (5, 'Margaret', 'Research', 125000),
  (6, 'Barbara', 'Engineering', 140000),
  (7, 'Donald', 'Design', 95000);
`;

export const sqlProblems: SeedProblem[] = [
  {
    title: 'Select All Employees',
    slug: 'sql-select-all-employees',
    difficulty: 'easy',
    topics: ['sql', 'select'],
    statement:
      'Write a query that returns **every row** from `employees`, with all columns, ordered by `id` ascending.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Return all employees, ordered by id\nSELECT * FROM employees;',
    },
    testCases: [
      {
        input: '',
        expectedOutput:
          'id | name | department | salary\n--- | --- | --- | ---\n1 | Ada | Engineering | 120000\n2 | Alan | Research | 110000\n3 | Grace | Engineering | 130000\n4 | Linus | Engineering | 115000\n5 | Margaret | Research | 125000\n6 | Barbara | Engineering | 140000\n7 | Donald | Design | 95000',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Filter by Department',
    slug: 'sql-filter-by-department',
    difficulty: 'easy',
    topics: ['sql', 'where'],
    statement:
      'Return the `name` of every Engineering employee, ordered by name ascending. Only the name column should appear.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: "-- Return names in Engineering\nSELECT name FROM employees;",
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name\n---\nAda\nBarbara\nGrace\nLinus',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Count Rows by Group',
    slug: 'sql-count-by-group',
    difficulty: 'medium',
    topics: ['sql', 'aggregate'],
    statement:
      'Return the number of employees per department. Output two columns: `department` and `count`, ordered by count descending, then department ascending to break ties.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Count employees per department\nSELECT department, COUNT(*) AS count FROM employees GROUP BY department;',
    },
    testCases: [
      {
        input: '',
        expectedOutput:
          'department | count\n--- | ---\nEngineering | 4\nResearch | 2\nDesign | 1',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Average Salary by Department',
    slug: 'sql-average-salary',
    difficulty: 'medium',
    topics: ['sql', 'aggregate'],
    statement:
      'Return the average salary per department, rounded to the nearest integer. Order by department name ascending.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Average salary per department\nSELECT department, AVG(salary) FROM employees GROUP BY department;',
    },
    testCases: [
      {
        input: '',
        expectedOutput:
          'department | avg_salary\n--- | ---\nDesign | 95000\nEngineering | 126250\nResearch | 117500',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Highest Paid Employee',
    slug: 'sql-highest-paid',
    difficulty: 'medium',
    topics: ['sql', 'order-by'],
    statement:
      'Return the `name` and `salary` of the highest-paid employee.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Return the top earner\nSELECT name, salary FROM employees;',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name | salary\n--- | ---\nBarbara | 140000',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Lowest Paid Engineer',
    slug: 'sql-lowest-paid-engineer',
    difficulty: 'medium',
    topics: ['sql', 'where', 'aggregate'],
    statement:
      'Return the `name` of the Engineering employee with the lowest salary.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Lowest paid engineer\nSELECT name FROM employees;',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name\n---\nLinus',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Employees Earning Above 120k',
    slug: 'sql-above-120k',
    difficulty: 'easy',
    topics: ['sql', 'where'],
    statement:
      'Return the `name` of every employee earning strictly more than 120000, ordered by salary descending.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Employees earning above 120k\nSELECT name FROM employees;',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name\n---\nBarbara\nGrace\nMargaret',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Departments With Multiple Employees',
    slug: 'sql-multi-employee-depts',
    difficulty: 'medium',
    topics: ['sql', 'having'],
    statement:
      'Return the `department` of every department that has at least 2 employees, ordered alphabetically.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Departments with 2+ employees\nSELECT department FROM employees GROUP BY department;',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'department\n---\nEngineering\nResearch',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Names Starting With A',
    slug: 'sql-names-start-with-a',
    difficulty: 'easy',
    topics: ['sql', 'like'],
    statement:
      'Return the `name` of every employee whose name starts with the letter A, ordered alphabetically.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Names starting with A\nSELECT name FROM employees WHERE name LIKE \'A%\';',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name\n---\nAda\nAlan',
        isHidden: false,
      },
    ],
  },
  {
    title: 'Case-Insensitive Name Search',
    slug: 'sql-case-insensitive-search',
    difficulty: 'medium',
    topics: ['sql', 'like', 'lower'],
    statement:
      'Return the `name` of every employee whose name contains "ar" (case-insensitive), ordered alphabetically.',
    functionName: 'query',
    outputMode: 'print',
    sqlSetup: EMPLOYEES_SETUP,
    starterCode: {
      sql: '-- Names containing "ar"\nSELECT name FROM employees;',
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'name\n---\nBarbara\nMargaret',
        isHidden: false,
      },
    ],
  },
];