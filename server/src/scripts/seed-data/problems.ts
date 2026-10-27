import type { SeedProblem } from './types.js';

export const problems: SeedProblem[] = [
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: 'easy',
    topics: ['math', 'basics'],
    statement:
      'Given two integers `a` and `b`, return their sum.\n\n**Example 1**\n```\nInput: 2, 3\nOutput: 5\n```\n\n**Example 2**\n```\nInput: -4, 7\nOutput: 3\n```',
    functionName: 'addTwo',
    outputMode: 'return',
    starterCode: {
      javascript: 'function addTwo(a, b) {\n  // TODO\n}',
      python: 'def addTwo(a, b):\n    # TODO\n    pass',
      ruby: 'def addTwo(a, b)\n  # TODO\nend',
      java: `public class Main {
  public static int addTwo(int a, int b) {
    // TODO
    return 0;
  }
}
`,
    },
    testCases: [
      { input: '[2, 3]', expectedOutput: '5', isHidden: false },
      { input: '[0, 0]', expectedOutput: '0', isHidden: false },
      { input: '[-1, 1]', expectedOutput: '0', isHidden: false },
      { input: '[100, 200]', expectedOutput: '300', isHidden: true },
      { input: '[-5, -7]', expectedOutput: '-12', isHidden: true },
    ],
  },
  {
    title: 'Find Maximum',
    slug: 'find-maximum',
    difficulty: 'easy',
    topics: ['array', 'basics'],
    statement:
      'Given an array of integers `nums`, return the largest value. The array always has at least one element.',
    functionName: 'findMax',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function findMax(nums) {\n  // TODO\n}',
      python: 'def findMax(nums):\n    # TODO\n    pass',
      ruby: 'def find_max(nums)\n  # TODO\nend',
      java: `public class Main {
  public static int findMax(int[] nums) {
    // TODO
    return 0;
  }
}
`,
    },
    testCases: [
      { input: '[[3, 1, 4, 1, 5, 9, 2, 6]]', expectedOutput: '9', isHidden: false },
      { input: '[[42]]', expectedOutput: '42', isHidden: false },
      { input: '[[1, 2, 3]]', expectedOutput: '3', isHidden: false },
      { input: '[[-10, -3, -25, -8]]', expectedOutput: '-3', isHidden: true },
      { input: '[[0, -1, -2]]', expectedOutput: '0', isHidden: true },
    ],
  },
  {
    title: 'Reverse a String',
    slug: 'reverse-string',
    difficulty: 'easy',
    topics: ['string', 'basics'],
    statement:
      'Return the reverse of a string.\n\n**Example**\n```\nInput: "hello"\nOutput: "olleh"\n```',
    functionName: 'reverseString',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function reverseString(s) {\n  // TODO\n}',
      python: 'def reverseString(s):\n    # TODO\n    pass',
      ruby: 'def reverse_string(s)\n  # TODO\nend',
    },
    testCases: [
      { input: '["hello"]', expectedOutput: '"olleh"', isHidden: false },
      { input: '[""]', expectedOutput: '""', isHidden: false },
      { input: '["ab"]', expectedOutput: '"ba"', isHidden: true },
    ],
  },
  {
    title: 'Even or Odd',
    slug: 'even-or-odd',
    difficulty: 'easy',
    topics: ['math', 'basics'],
    statement:
      'Return `"even"` if `n` is even, `"odd"` otherwise.',
    functionName: 'evenOrOdd',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function evenOrOdd(n) {\n  // TODO\n}',
      python: 'def evenOrOdd(n):\n    # TODO\n    pass',
      ruby: 'def evenOrOdd(n)\n  # TODO\nend',
    },
    testCases: [
      { input: '[4]', expectedOutput: '"even"', isHidden: false },
      { input: '[7]', expectedOutput: '"odd"', isHidden: false },
      { input: '[0]', expectedOutput: '"even"', isHidden: true },
    ],
  },
  {
    title: 'Sum of Array',
    slug: 'sum-of-array',
    difficulty: 'easy',
    topics: ['array', 'basics'],
    statement: 'Return the sum of all numbers in an array.',
    functionName: 'sumArray',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function sumArray(nums) {\n  // TODO\n}',
      python: 'def sumArray(nums):\n    # TODO\n    pass',
      ruby: 'def sum_array(nums)\n  # TODO\nend',
    },
    testCases: [
      { input: '[[1, 2, 3]]', expectedOutput: '6', isHidden: false },
      { input: '[[]]', expectedOutput: '0', isHidden: false },
      { input: '[[10, -5, 3]]', expectedOutput: '8', isHidden: true },
    ],
  },
  {
    title: 'Count Vowels',
    slug: 'count-vowels',
    difficulty: 'easy',
    topics: ['string', 'basics'],
    statement:
      'Return the number of vowels (a, e, i, o, u) in a string. Case-insensitive.',
    functionName: 'countVowels',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function countVowels(s) {\n  // TODO\n}',
      python: 'def countVowels(s):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '["hello"]', expectedOutput: '2', isHidden: false },
      { input: '["AEIOU"]', expectedOutput: '5', isHidden: false },
      { input: '["xyz"]', expectedOutput: '0', isHidden: true },
    ],
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'easy',
    topics: ['math', 'basics'],
    statement:
      'Return an array from 1 to n where multiples of 3 become `"Fizz"`, multiples of 5 become `"Buzz"`, multiples of both become `"FizzBuzz"`, and everything else stays a number.',
    functionName: 'fizzBuzz',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function fizzBuzz(n) {\n  // TODO\n}',
      python: 'def fizzBuzz(n):\n    # TODO\n    pass',
    },
    testCases: [
      {
        input: '[5]',
        expectedOutput: '[1,2,"Fizz",4,"Buzz"]',
        isHidden: false,
      },
      {
        input: '[15]',
        expectedOutput:
          '[1,2,"Fizz",4,"Buzz","Fizz",7,8,"Fizz","Buzz",11,"Fizz",13,14,"FizzBuzz"]',
        isHidden: true,
      },
    ],
  },
  {
    title: 'Is Palindrome',
    slug: 'is-palindrome',
    difficulty: 'easy',
    topics: ['string'],
    statement:
      'Return true if a string reads the same forwards and backwards (ignoring case).',
    functionName: 'isPalindrome',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function isPalindrome(s) {\n  // TODO\n}',
      python: 'def isPalindrome(s):\n    # TODO\n    pass',
      ruby: 'def is_palindrome(s)\n  # TODO\nend',
    },
    testCases: [
      { input: '["racecar"]', expectedOutput: 'true', isHidden: false },
      { input: '["hello"]', expectedOutput: 'false', isHidden: false },
      { input: '["AbBa"]', expectedOutput: 'true', isHidden: true },
    ],
  },
  {
    title: 'Find Index of Target',
    slug: 'find-index',
    difficulty: 'easy',
    topics: ['array', 'search'],
    statement:
      'Return the index of `target` in `nums`, or `-1` if not present.',
    functionName: 'findIndex',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function findIndex(nums, target) {\n  // TODO\n}',
      python: 'def findIndex(nums, target):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[1,2,3], 2]', expectedOutput: '1', isHidden: false },
      { input: '[[1,2,3], 5]', expectedOutput: '-1', isHidden: false },
      { input: '[[9,9,9], 9]', expectedOutput: '0', isHidden: true },
    ],
  },
  {
    title: 'Remove Duplicates',
    slug: 'remove-duplicates',
    difficulty: 'easy',
    topics: ['array', 'set'],
    statement:
      'Return a new array with duplicates removed, preserving original order.',
    functionName: 'removeDuplicates',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function removeDuplicates(nums) {\n  // TODO\n}',
      python: 'def removeDuplicates(nums):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[1,2,2,3,3,3]]', expectedOutput: '[1,2,3]', isHidden: false },
      { input: '[[]]', expectedOutput: '[]', isHidden: false },
      { input: '[[1,1,1]]', expectedOutput: '[1]', isHidden: true },
    ],
  },

  /* ─── Medium ──────────────────────────────────────────────────── */
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'medium',
    topics: ['array', 'hashmap'],
    statement:
      'Given `nums` and `target`, return the indices of the two numbers that add up to target. Exactly one solution exists.',
    functionName: 'twoSum',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function twoSum(nums, target) {\n  // TODO\n}',
      python: 'def twoSum(nums, target):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[2,7,11,15], 9]', expectedOutput: '[0,1]', isHidden: false },
      { input: '[[3,2,4], 6]', expectedOutput: '[1,2]', isHidden: false },
      { input: '[[3,3], 6]', expectedOutput: '[0,1]', isHidden: true },
    ],
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'medium',
    topics: ['array', 'dp'],
    statement:
      "Return the largest sum of any contiguous subarray (Kadane's algorithm).",
    functionName: 'maxSubarray',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function maxSubarray(nums) {\n  // TODO\n}',
      python: 'def maxSubarray(nums):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[-2,1,-3,4,-1,2,1,-5,4]]', expectedOutput: '6', isHidden: false },
      { input: '[[1]]', expectedOutput: '1', isHidden: false },
      { input: '[[-1,-2,-3]]', expectedOutput: '-1', isHidden: true },
    ],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'medium',
    topics: ['stack', 'string'],
    statement:
      'Return true if a string of brackets `()[]{}` is balanced.',
    functionName: 'isValid',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function isValid(s) {\n  // TODO\n}',
      python: 'def isValid(s):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '["()"]', expectedOutput: 'true', isHidden: false },
      { input: '["([)]"]', expectedOutput: 'false', isHidden: false },
      { input: '["{[]}"]', expectedOutput: 'true', isHidden: true },
    ],
  },
  {
    title: 'Merge Two Sorted Arrays',
    slug: 'merge-sorted',
    difficulty: 'medium',
    topics: ['array', 'two-pointers'],
    statement:
      'Merge two sorted arrays into one sorted array.',
    functionName: 'mergeSorted',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function mergeSorted(a, b) {\n  // TODO\n}',
      python: 'def mergeSorted(a, b):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[1,3,5],[2,4,6]]', expectedOutput: '[1,2,3,4,5,6]', isHidden: false },
      { input: '[[],[]]', expectedOutput: '[]', isHidden: false },
      { input: '[[1],[2]]', expectedOutput: '[1,2]', isHidden: true },
    ],
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'medium',
    topics: ['array', 'set'],
    statement: 'Return true if any value appears twice.',
    functionName: 'containsDuplicate',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function containsDuplicate(nums) {\n  // TODO\n}',
      python: 'def containsDuplicate(nums):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[1,2,3,1]]', expectedOutput: 'true', isHidden: false },
      { input: '[[1,2,3,4]]', expectedOutput: 'false', isHidden: false },
      { input: '[[]]', expectedOutput: 'false', isHidden: true },
    ],
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-except-self',
    difficulty: 'medium',
    topics: ['array', 'prefix'],
    statement:
      'Return an array where each element is the product of all others. Division is not allowed.',
    functionName: 'productExceptSelf',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function productExceptSelf(nums) {\n  // TODO\n}',
      python: 'def productExceptSelf(nums):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[1,2,3,4]]', expectedOutput: '[24,12,8,6]', isHidden: false },
      { input: '[[2,3]]', expectedOutput: '[3,2]', isHidden: false },
    ],
  },
  {
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    difficulty: 'medium',
    topics: ['string'],
    statement:
      'Find the longest common prefix among an array of strings.',
    functionName: 'longestCommonPrefix',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function longestCommonPrefix(strs) {\n  // TODO\n}',
      python: 'def longestCommonPrefix(strs):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[["flower","flow","flight"]]', expectedOutput: '"fl"', isHidden: false },
      { input: '[["dog","racecar","car"]]', expectedOutput: '""', isHidden: false },
    ],
  },

  /* ─── Hard ────────────────────────────────────────────────────── */
  {
    title: 'Longest Increasing Subsequence',
    slug: 'lis',
    difficulty: 'hard',
    topics: ['dp', 'binary-search'],
    statement:
      'Return the length of the longest strictly increasing subsequence.',
    functionName: 'lis',
    outputMode: 'return',
    starterCode: {
      javascript: 'function lis(nums) {\n  // TODO\n}',
      python: 'def lis(nums):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[10,9,2,5,3,7,101,18]]', expectedOutput: '4', isHidden: false },
      { input: '[[1,2,3,4]]', expectedOutput: '4', isHidden: false },
      { input: '[[5,4,3,2,1]]', expectedOutput: '1', isHidden: true },
    ],
  },
  {
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'hard',
    topics: ['dp', 'string'],
    statement:
      'Return true if a string can be segmented into space-separated words from a dictionary.',
    functionName: 'wordBreak',
    outputMode: 'return',
    starterCode: {
      javascript:
        'function wordBreak(s, dict) {\n  // TODO\n}',
      python: 'def wordBreak(s, dict):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '["leetcode",["leet","code"]]', expectedOutput: 'true', isHidden: false },
      { input: '["catsandog",["cat","dog"]]', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'hard',
    topics: ['array', 'two-pointers'],
    statement:
      'Given elevation heights, return the total water that can be trapped.',
    functionName: 'trap',
    outputMode: 'return',
    starterCode: {
      javascript: 'function trap(height) {\n  // TODO\n}',
      python: 'def trap(height):\n    # TODO\n    pass',
    },
    testCases: [
      { input: '[[0,1,0,2,1,0,1,3,2,1,2,1]]', expectedOutput: '6', isHidden: false },
      { input: '[[4,2,0,3,2,5]]', expectedOutput: '9', isHidden: false },
      { input: '[[]]', expectedOutput: '0', isHidden: true },
    ],
  },
];