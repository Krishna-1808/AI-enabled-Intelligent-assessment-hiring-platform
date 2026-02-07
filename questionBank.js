// Question Types Database
const questionBank = {
    mcq: [
        {
            id: "q1",
            type: "mcq",
            skill: "JavaScript",
            difficulty: "medium",
            text: "What is the output of: console.log(typeof null)?",
            options: ["'object'", "'null'", "'undefined'", "'string'"],
            correct: 0,
            explanation: "In JavaScript, typeof null returns 'object' (historical bug)",
            points: 2
        }
    ],
    coding: [
        {
            id: "q2",
            type: "coding",
            skill: "Python",
            difficulty: "hard",
            text: "Write a function to find the longest palindrome in a string",
            language: "python",
            template: "def longest_palindrome(s):\n    # Your code here\n    pass",
            testCases: [
                {input: "'babad'", expected: "'bab'", isHidden: false},
                {input: "'cbbd'", expected: "'bb'", isHidden: false},
                {input: "'racecar'", expected: "'racecar'", isHidden: true}
            ],
            points: 10
        }
    ],
    subjective: [
        {
            id: "q3",
            type: "subjective",
            skill: "System Design",
            difficulty: "hard",
            text: "Explain the difference between REST and GraphQL APIs",
            rubric: {
                pointsForRest: 3,
                pointsForGraphQL: 3,
                pointsForComparison: 4,
                keywords: ["stateless", "endpoints", "over-fetching", "under-fetching", "schema"]
            },
            modelAnswer: "REST is stateless with fixed endpoints...",
            points: 10
        }
    ]
};