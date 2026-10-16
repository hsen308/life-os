/**
 * LifeOS Mission Pool
 * Rich source of granular 50-minute missions for Roadmap phases,
 * LeetCode problem patterns, Sales & Client outreach, Reading/Architecture,
 * and University Final Year Exam revision.
 */

export const ROADMAP_PHASES = [
  {
    id: 'phase-1',
    number: 1,
    title: 'Solid JavaScript + Git',
    duration: 'Weeks 1–3',
    primaryGoal: 'Build small interactive frontends completely from scratch without copying code.',
    docLinks: [
      { name: 'javascript.info', url: 'https://javascript.info' },
      { name: 'Git Handbook', url: 'https://guides.github.com/introduction/git-handbook/' }
    ],
    milestones: [
      {
        id: 'p1-m1',
        title: 'Async/Await & Fetch Deep Dive',
        desc: 'Master Promise chains, error handling with try/catch, async iterators, and API calls.',
        subMissions: [
          {
            id: 'p1-m1-s1',
            title: 'Fetch & JSON Error Handling',
            goal: 'Implement a resilient fetch wrapper with automatic timeout, error status inspection, and JSON decoding.',
            minutes: 50,
            type: 'study',
            resource: 'https://javascript.info/fetch'
          },
          {
            id: 'p1-m1-s2',
            title: 'Promise.all & Promise.allSettled',
            goal: 'Build a concurrent data fetcher that runs 3 parallel mock requests and handles partial network failures gracefully.',
            minutes: 50,
            type: 'build',
            resource: 'https://javascript.info/promise-api'
          },
          {
            id: 'p1-m1-s3',
            title: 'Async Retries with Exponential Backoff',
            goal: 'Write a zero-dependency async retry function with exponential jitter backoff from memory.',
            minutes: 50,
            type: 'build',
            resource: 'https://javascript.info/async-await'
          }
        ]
      },
      {
        id: 'p1-m2',
        title: 'Modern Array Methods & Immutability',
        desc: 'Deep fluency with map, filter, reduce, flatMap, some, every, and immutable state updates.',
        subMissions: [
          {
            id: 'p1-m2-s1',
            title: 'Complex Data Transformations with Reduce',
            goal: 'Group, pivot, and calculate aggregate sums from a raw transactions JSON array using a single reduce pass.',
            minutes: 50,
            type: 'study',
            resource: 'https://javascript.info/array-methods'
          },
          {
            id: 'p1-m2-s2',
            title: 'Custom Polyfill Implementation',
            goal: 'Implement custom polyfills for Array.prototype.map, filter, and reduce without looking at reference code.',
            minutes: 50,
            type: 'build',
            resource: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'
          }
        ]
      },
      {
        id: 'p1-m3',
        title: 'ES Modules, Scopes & Closures',
        desc: 'Understand execution context, closure memory behavior, and clean modular code separation.',
        subMissions: [
          {
            id: 'p1-m3-s1',
            title: 'Closures & Private Encapsulation',
            goal: 'Build an event emitter and a private token store using closures and WeakMaps.',
            minutes: 50,
            type: 'study',
            resource: 'https://javascript.info/closure'
          },
          {
            id: 'p1-m3-s2',
            title: 'Event Loop, Microtasks & Macrotasks',
            goal: 'Trace script execution order through setTimeout, Promise.then, and queueMicrotask with concrete experiments.',
            minutes: 50,
            type: 'study',
            resource: 'https://javascript.info/event-loop'
          }
        ]
      },
      {
        id: 'p1-m4',
        title: 'Git & GitHub Pro Workflow',
        desc: 'Branch management, interactive rebase, pull requests, and resolving messy merge conflicts.',
        subMissions: [
          {
            id: 'p1-m4-s1',
            title: 'Interactive Rebase & Commit Squashing',
            goal: 'Practice git rebase -i on a sandbox repo: squash 4 messy commits into 1 clean conventional commit.',
            minutes: 50,
            type: 'build',
            resource: 'https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History'
          },
          {
            id: 'p1-m4-s2',
            title: 'Merge Conflict Drills & Cherry-Pick',
            goal: 'Simulate conflicting branch edits, resolve conflicts via terminal, and cherry-pick a hotfix commit.',
            minutes: 50,
            type: 'study',
            resource: 'https://git-scm.com/docs/git-merge'
          }
        ]
      },
      {
        id: 'p1-m5',
        title: 'Interactive Mini-Project from Scratch',
        desc: 'Code a complete interactive web app using zero external UI libraries.',
        subMissions: [
          {
            id: 'p1-m5-s1',
            title: 'Vanilla Reactive State Store',
            goal: 'Build a Pub/Sub mini state store that rerenders DOM nodes when state changes.',
            minutes: 50,
            type: 'build',
            resource: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model'
          },
          {
            id: 'p1-m5-s2',
            title: 'Keyboard Command Palette (Cmd+K)',
            goal: 'Build a keyboard-navigable command palette modal with fuzzy filtering and arrow key selection.',
            minutes: 50,
            type: 'build',
            resource: 'https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent'
          }
        ]
      }
    ]
  },
  {
    id: 'phase-2',
    number: 2,
    title: 'TypeScript + React & Next.js',
    duration: 'Months 1–3',
    primaryGoal: 'Rebuild a production restaurant web app with real menus, admin dashboard, and cart state.',
    docLinks: [
      { name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      { name: 'React.dev Learn', url: 'https://react.dev/learn' }
    ],
    milestones: [
      {
        id: 'p2-m1',
        title: 'TypeScript Foundations & Generics',
        desc: 'Interfaces, type unions, generics, mapped types, and narrowing.',
        subMissions: [
          {
            id: 'p2-m1-s1',
            title: 'TypeScript Generics & Utility Types',
            goal: 'Define generic API response types and practice Record, Pick, Omit, and Partial.',
            minutes: 50,
            type: 'study',
            resource: 'https://www.typescriptlang.org/docs/handbook/2/generics.html'
          },
          {
            id: 'p2-m1-s2',
            title: 'Type Narrowing & Discriminated Unions',
            goal: 'Model complex UI loading, error, and success states with type-safe discriminated unions.',
            minutes: 50,
            type: 'build',
            resource: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'
          }
        ]
      },
      {
        id: 'p2-m2',
        title: 'React Core & Deep Hooks Fluency',
        desc: 'Understanding re-renders, useEffect lifecycles, and custom hooks.',
        subMissions: [
          {
            id: 'p2-m2-s1',
            title: 'Custom Hooks Architecture',
            goal: 'Write useDebounce, useLocalStorage, and useMediaQuery custom hooks in TypeScript.',
            minutes: 50,
            type: 'build',
            resource: 'https://react.dev/learn/reusing-logic-with-custom-hooks'
          },
          {
            id: 'p2-m2-s2',
            title: 'Render Optimization & memo/useCallback',
            goal: 'Profile a sluggish list render using React DevTools and fix unnecessary re-renders.',
            minutes: 50,
            type: 'study',
            resource: 'https://react.dev/reference/react/memo'
          }
        ]
      },
      {
        id: 'p2-m3',
        title: 'Restaurant App: Real Admin & Cart',
        desc: 'Rebuild client project into a full dynamic application with state management.',
        subMissions: [
          {
            id: 'p2-m3-s1',
            title: 'Interactive Order Cart & Modifier System',
            goal: 'Code the item variant modifier system (size, toppings, spice level) and cart total calculations.',
            minutes: 50,
            type: 'build',
            resource: 'https://react.dev'
          },
          {
            id: 'p2-m3-s2',
            title: 'Admin Menu Editor UI',
            goal: 'Build an admin view to add/edit menu items, toggle availability, and upload photos.',
            minutes: 50,
            type: 'build',
            resource: 'https://react.dev'
          }
        ]
      }
    ]
  },
  {
    id: 'phase-3',
    number: 3,
    title: 'Backend + Databases',
    duration: 'Months 3–5',
    primaryGoal: 'Build secure REST/GraphQL APIs with Node.js/PostgreSQL from Full Stack Open.',
    docLinks: [
      { name: 'Full Stack Open', url: 'https://fullstackopen.com/en/' }
    ],
    milestones: [
      {
        id: 'p3-m1',
        title: 'Node.js, Express & REST Principles',
        desc: 'Middleware pipeline, error handling, input validation with Zod.',
        subMissions: [
          {
            id: 'p3-m1-s1',
            title: 'Express REST Router & Zod Validation',
            goal: 'Build strict request body schemas using Zod and a central error-handling middleware.',
            minutes: 50,
            type: 'build',
            resource: 'https://fullstackopen.com/en/part3'
          }
        ]
      },
      {
        id: 'p3-m2',
        title: 'PostgreSQL Relational Schema & Indexing',
        desc: 'Relational data modeling, foreign keys, composite indexes, and queries.',
        subMissions: [
          {
            id: 'p3-m2-s1',
            title: 'Relational Schema Design & Migration',
            goal: 'Design a clean schema for users, restaurants, menu categories, items, and order receipts in SQL.',
            minutes: 50,
            type: 'study',
            resource: 'https://www.postgresql.org/docs/'
          }
        ]
      },
      {
        id: 'p3-m3',
        title: 'JWT Authentication & Password Security',
        desc: 'Bcrypt hashing, refresh tokens, HTTP-only cookies, role-based access.',
        subMissions: [
          {
            id: 'p3-m3-s1',
            title: 'Auth Pipeline & Cookie Tokens',
            goal: 'Implement user registration, bcrypt salting, and secure cookie session verification.',
            minutes: 50,
            type: 'build',
            resource: 'https://fullstackopen.com/en/part4'
          }
        ]
      }
    ]
  },
  {
    id: 'phase-4',
    number: 4,
    title: 'Ship Real Production Projects',
    duration: 'Months 5–6',
    primaryGoal: 'Deploy scalable apps with CI/CD, Docker, monitoring, and live client usage.',
    docLinks: [
      { name: 'Docker Docs', url: 'https://docs.docker.com/get-started/' }
    ],
    milestones: [
      {
        id: 'p4-m1',
        title: 'Dockerizing the Full Stack',
        desc: 'Multi-stage Dockerfile builds for frontend and backend.',
        subMissions: [
          {
            id: 'p4-m1-s1',
            title: 'Multi-Stage Production Dockerfile',
            goal: 'Write a lean Node/Next.js Dockerfile using alpine images and non-root execution.',
            minutes: 50,
            type: 'build',
            resource: 'https://docs.docker.com'
          }
        ]
      },
      {
        id: 'p4-m2',
        title: 'Automated CI/CD GitHub Actions',
        desc: 'Test runs, linting, build verification, and automatic cloud deployments.',
        subMissions: [
          {
            id: 'p4-m2-s1',
            title: 'GitHub Actions Deployment Pipeline',
            goal: 'Configure a YAML workflow that tests code and deploys to Railway or VPS on git push.',
            minutes: 50,
            type: 'build',
            resource: 'https://docs.github.com/en/actions'
          }
        ]
      }
    ]
  },
  {
    id: 'phase-5',
    number: 5,
    title: 'Go (Golang) Systems & High Performance',
    duration: 'Month 6+',
    primaryGoal: 'High-throughput microservices, concurrency patterns with goroutines & channels.',
    docLinks: [
      { name: 'Tour of Go', url: 'https://go.dev/tour/' }
    ],
    milestones: [
      {
        id: 'p5-m1',
        title: 'Go Syntax, Pointers & Structs',
        desc: 'Memory model, interfaces, error handling idioms in Go.',
        subMissions: [
          {
            id: 'p5-m1-s1',
            title: 'Idiomatic Go Interface Design',
            goal: 'Build a file/S3 storage interface with clean mock implementations in Go.',
            minutes: 50,
            type: 'study',
            resource: 'https://go.dev/tour'
          }
        ]
      },
      {
        id: 'p5-m2',
        title: 'Goroutines, Channels & Worker Pools',
        desc: 'Safe concurrent execution, buffered channels, select timeouts, sync.WaitGroup.',
        subMissions: [
          {
            id: 'p5-m2-s1',
            title: 'Concurrent Worker Pool in Go',
            goal: 'Build a worker pool that processes a queue of 1,000 tasks with rate limiting and context cancellation.',
            minutes: 50,
            type: 'build',
            resource: 'https://go.dev/blog/pipelines'
          }
        ]
      }
    ]
  },
  {
    id: 'phase-6',
    number: 6,
    title: 'AI & LLM Integration Systems',
    duration: 'Month 7+',
    primaryGoal: 'Production RAG, embeddings, agentic tool-calling workflows.',
    docLinks: [
      { name: 'OpenAI Cookbook', url: 'https://cookbook.openai.com' }
    ],
    milestones: [
      {
        id: 'p6-m1',
        title: 'Vector Embeddings & Semantic Search',
        desc: 'pgvector setup, chunking strategies, similarity search.',
        subMissions: [
          {
            id: 'p6-m1-s1',
            title: 'Vector Search Pipeline with pgvector',
            goal: 'Store text embeddings in Postgres and query top-3 cosine similarity results in Node/Python.',
            minutes: 50,
            type: 'build',
            resource: 'https://github.com/pgvector/pgvector'
          }
        ]
      },
      {
        id: 'p6-m2',
        title: 'Structured Function Calling Agents',
        desc: 'Tool calling loops, JSON schema enforcement, multi-step problem solving.',
        subMissions: [
          {
            id: 'p6-m2-s1',
            title: 'Agentic Tool Loop from Scratch',
            goal: 'Implement an autonomous agent loop that executes SQL queries or weather lookups to answer complex prompts.',
            minutes: 50,
            type: 'build',
            resource: 'https://platform.openai.com/docs/guides/function-calling'
          }
        ]
      }
    ]
  }
];

export const LEETCODE_MISSIONS = [
  {
    id: 'lc-twopointers-1',
    pattern: 'Two Pointers',
    title: 'Two Pointers: Valid Palindrome & Two Sum II',
    goal: 'Solve Two Sum II (Sorted Array) and Valid Palindrome without extra memory allocation. Time limit: 35 mins, then analyze time/space complexity.',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://neetcode.io/practice'
  },
  {
    id: 'lc-slidingwindow-1',
    pattern: 'Sliding Window',
    title: 'Sliding Window: Longest Substring Without Repeating Characters',
    goal: 'Implement dynamically resizing sliding window using a hash set. Write down the edge cases (empty string, all identical characters).',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
  },
  {
    id: 'lc-fastslow-1',
    pattern: 'Fast & Slow Pointers',
    title: 'Fast & Slow: Linked List Cycle & Happy Number',
    goal: 'Use Floyd\'s Cycle-Finding algorithm. Explain why slow and fast pointers must meet inside any cycle in O(N).',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://leetcode.com/problems/linked-list-cycle/'
  },
  {
    id: 'lc-binarysearch-1',
    pattern: 'Binary Search',
    title: 'Modified Binary Search: Rotated Sorted Array',
    goal: 'Solve Search in Rotated Sorted Array in O(log N). Identify which half is sorted on each step.',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://leetcode.com/problems/search-in-rotated-sorted-array/'
  },
  {
    id: 'lc-trees-1',
    pattern: 'Trees & BFS/DFS',
    title: 'Binary Tree: Level Order Traversal & Invert Tree',
    goal: 'Implement BFS queue traversal and recursive DFS. Diagram the call stack for a tree of height 4.',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://leetcode.com/problems/binary-tree-level-order-traversal/'
  },
  {
    id: 'lc-dp-1',
    pattern: 'Dynamic Programming',
    title: 'DP Foundations: Coin Change & Climbing Stairs',
    goal: 'Write the top-down memoization solution, then convert it to bottom-up 1D array tabulation.',
    minutes: 50,
    difficulty: 'Medium',
    type: 'study',
    resource: 'https://leetcode.com/problems/coin-change/'
  }
];

export const SALES_MISSIONS = [
  {
    id: 'sales-audit-1',
    title: 'Website Friction Audit for 3 Local Restaurants',
    goal: 'Find 3 restaurants in Beirut/Mount Lebanon with PDF-only menus or non-mobile websites. Screenshot 3 critical conversion friction points for each.',
    minutes: 50,
    type: 'build',
    tag: 'Sales & Outreach'
  },
  {
    id: 'sales-video-1',
    title: 'Record a 90-Second Mobile Redesign Video Audit',
    goal: 'Pick the best restaurant candidate. Record a quick, respectful screen recording walking through their menu UX and showing a live interactive mobile demo prototype.',
    minutes: 50,
    type: 'build',
    tag: 'Outreach'
  },
  {
    id: 'sales-dm-1',
    title: 'Direct Outreach to 5 Business Decision Makers',
    goal: 'Send 5 personalized Instagram / WhatsApp messages to restaurant managers with the video audit link and zero pushiness—offer free menu speed optimization.',
    minutes: 50,
    type: 'build',
    tag: 'Outreach'
  },
  {
    id: 'sales-pricing-1',
    title: 'Polish Modular Pitch & Pricing Tier Sheet',
    goal: 'Finalize standard proposal: Tier 1 Fast Digital Menu ($250), Tier 2 Online Ordering + WhatsApp notifications ($700). Include clear delivery timeline.',
    minutes: 50,
    type: 'build',
    tag: 'NovuStudios'
  },
  {
    id: 'sales-followup-1',
    title: 'Pipeline Follow-up & Past Client Check-in',
    goal: 'Follow up with 3 previously contacted leads. Ask existing happy clients for a short 2-sentence testimonial and if they know any other business owner.',
    minutes: 50,
    type: 'build',
    tag: 'Pipeline'
  }
];

export const READING_MISSIONS = [
  {
    id: 'read-vitals-1',
    title: 'Core Web Vitals & Real-World LCP/CLS Fixes',
    goal: 'Read Google\'s web.dev guides on Largest Contentful Paint and Cumulative Layout Shift. Learn how font swapping and unoptimized images cause layout thrashing.',
    minutes: 50,
    type: 'study',
    resource: 'https://web.dev/explore/fast'
  },
  {
    id: 'read-caching-1',
    title: 'System Design Primer: Caching & CDN Invalidation',
    goal: 'Study Cache-Control headers, stale-while-revalidate, Redis caching patterns (Cache-Aside vs Write-Through), and cache stampede protection.',
    minutes: 50,
    type: 'study',
    resource: 'https://github.com/donnemartin/system-design-primer'
  },
  {
    id: 'read-db-index-1',
    title: 'How Database Indexes Actually Work Under the Hood',
    goal: 'Understand B-Tree structure, leaf node lookups, clustered vs non-clustered indexes, and why adding too many indexes harms write throughput.',
    minutes: 50,
    type: 'study',
    resource: 'https://use-the-index-luke.com'
  },
  {
    id: 'read-security-1',
    title: 'OWASP Top 10: XSS, CSRF & SQL Injection in Modern Apps',
    goal: 'Review how CSP headers, SameSite cookie flags, and parameterized queries defend modern web apps against standard vulnerabilities.',
    minutes: 50,
    type: 'study',
    resource: 'https://owasp.org/www-project-top-ten/'
  }
];

export const EXAM_MISSIONS = [
  {
    id: 'exam-algo-1',
    subject: 'Algorithms & Complexity',
    title: 'Algorithms: Dynamic Programming & Recurrence Trees',
    goal: 'Solve 2 exam recurrence relations using the Master Theorem and write out the state matrix for 0/1 Knapsack.',
    minutes: 50,
    type: 'study'
  },
  {
    id: 'exam-db-1',
    subject: 'Database Systems',
    title: 'Database Systems: BCNF Normalization & ACID Transactions',
    goal: 'Practice 3 normalization problems (1NF -> 2NF -> 3NF -> BCNF) and write concurrency conflict serializability schedules.',
    minutes: 50,
    type: 'study'
  },
  {
    id: 'exam-os-1',
    subject: 'Operating Systems',
    title: 'Operating Systems: Virtual Memory & Page Replacement',
    goal: 'Calculate page faults for FIFO, LRU, and Optimal algorithms on an 8-page reference string. Review deadlock Banker\'s algorithm.',
    minutes: 50,
    type: 'study'
  },
  {
    id: 'exam-networks-1',
    subject: 'Computer Networks',
    title: 'Networks: TCP Flow & Congestion Control Mechanisms',
    goal: 'Trace TCP 3-way handshake, Reno/Tahoe congestion window growth, fast retransmit, and subnet mask CIDR routing calculations.',
    minutes: 50,
    type: 'study'
  },
  {
    id: 'exam-se-1',
    subject: 'Software Engineering',
    title: 'Software Engineering: UML & Architecture Design Patterns',
    goal: 'Draw class diagrams for Factory, Observer, and Strategy patterns. Review architectural trade-offs in microservices vs monoliths.',
    minutes: 50,
    type: 'study'
  }
];
