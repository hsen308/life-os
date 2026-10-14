import confetti from 'canvas-confetti';
import {
  initSupabase,
  getSupabase,
  isSupabaseConfigured,
  saveCredentials,
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  pushDataToCloud,
  pullDataFromCloud,
  subscribeToRealtime
} from './supabase.js';

// ========================================================
// Fresh Clean State Database (No Mock Data)
// ========================================================

const STORAGE_KEY = 'lifeos_app_data_clean_v11';

// Clear out legacy mock and test data keys
try {
  ['lifeos_app_data_v1', 'lifeos_app_data_v2', 'lifeos_app_data_v3', 'lifeos_app_data_clean_v5', 'lifeos_app_data_clean_v6', 'lifeos_app_data_clean_v7', 'lifeos_app_data_clean_v8', 'lifeos_app_data_clean_v9', 'lifeos_app_data_clean_v10'].forEach(k => localStorage.removeItem(k));
} catch (e) {}

const CLEAN_DEFAULT_DATA = {
  profile: {
    name: 'Hussein',
    role: 'Clinic Software Sales & Founder of NovuStudios',
    secondaryRole: 'Senior CS @ Lebanese University',
    currency: 'USD',
    dailyBudget: 0,
    theme: 'light',
    motto: 'Close clinic software deals, keep NovuStudios sharp, master SWE & AI, and graduate Lebanese University strong.'
  },
  university: {
    todayMode: 'classes', // 'classes' | 'study_day' | 'exam_prep' | 'off'
    todayClasses: [
      { id: 'c_1', name: 'Advanced Algorithms & Complexity', time: '09:00 AM – 11:00 AM', room: 'Hall 3', attended: false },
      { id: 'c_2', name: 'Software Architecture & Distributed Systems', time: '11:30 AM – 01:30 PM', room: 'Lab B', attended: false }
    ],
    projects: [
      {
        id: 'p_1',
        title: 'Senior Capstone Project',
        subject: 'Computer Science',
        description: 'Full-stack distributed system with integrated LLM tool workflows.',
        milestone: 'API Schema & Agent Architecture Draft',
        progress: 40,
        dueDate: 'Dec 15',
        status: 'In Progress'
      },
      {
        id: 'p_2',
        title: 'Database & Systems Lab Assignment',
        subject: 'Databases',
        description: 'B-Tree query indexing benchmarks and concurrency deadlock analysis.',
        milestone: 'Benchmark Execution & Query Plans',
        progress: 65,
        dueDate: 'Nov 04',
        status: 'Active'
      },
      {
        id: 'p_3',
        title: 'Operating Systems & Concurrency Assignment',
        subject: 'Systems',
        description: 'Worker pool implementation with mutex locking and synchronization.',
        milestone: 'Unit tests passing',
        progress: 85,
        dueDate: 'Oct 28',
        status: 'Near Complete'
      }
    ]
  },
  growth: {
    currentMood: 'High Focus',
    pillarsAndGoals: [
      { id: 'g_clinic', title: 'Scale Clinic Management System Sales & Book 30+ Demos', pillar: 'Clinic Software Sales', progress: 35, milestone: 'Active doctor outreach & demos' },
      { id: 'g_agency', title: 'Revitalize NovuStudios & Close High-Ticket Client Websites', pillar: 'NovuStudios Agency', progress: 20, milestone: 'Inbound demos & portfolio audit' },
      { id: 'g_lu', title: 'Graduate Lebanese University CS (Senior Year)', pillar: 'Lebanese University CS', progress: 75, milestone: 'Final year coursework & capstone' },
      { id: 'g_tech', title: 'Explore SWE vs AI Career Path with Hands-on Projects', pillar: 'SWE & AI Engineering', progress: 40, milestone: 'Full-stack apps + modern AI agent prototypes' }
    ],
    routines: {
      morning: [
        { id: 'r_m1', text: 'Review target medical clinics & doctor contact list', done: false },
        { id: 'r_m2', text: 'Check NovuStudios agency messages and inbound inquiries', done: false },
        { id: 'r_m3', text: 'Prepare clinic software pitch & personalized demo links', done: false }
      ],
      evening: [
        { id: 'r_e1', text: 'Log booked clinic demos, notes & follow-up agreements', done: false },
        { id: 'r_e2', text: 'Lebanese University CS senior coursework & lecture study', done: false },
        { id: 'r_e3', text: 'Late-night deep coding: SWE & AI agent project experimentation', done: false },
        { id: 'r_e4', text: 'Queue up tomorrow\'s clinic call batch & priority checklist', done: false }
      ]
    },
    insights: [
      { id: 'in_1', title: 'Selling to Clinics & Doctors', body: 'Clinic receptionists and assistants are the frontline gatekeepers. Pitch how the clinic system eliminates manual booking errors, saves them 2 hours daily, and speeds up patient check-in.', pillar: 'Clinic Sales', date: 'Oct 14' },
      { id: 'in_2', title: 'NovuStudios Agency Strategy', body: 'Sell outcomes and business credibility rather than lines of code. Offer turnkey website design with instant mockups and fast 7-day turnaround.', pillar: 'NovuStudios', date: 'Oct 14' },
      { id: 'in_3', title: 'Senior Year CS: SWE vs AI Direction', body: 'Strong Software Engineering fundamentals (clean architecture, APIs, databases) make you a 10x better AI engineer. Build both full-stack apps and LLM agents to find what excites you most.', pillar: 'CS & AI', date: 'Oct 14' }
    ]
  },
  tasks: [
    { id: 't_1', title: 'Morning clinic outreach: Call 15 receptionists & private practices', category: 'Work', priority: 'high', completed: false, date: 'today' },
    { id: 't_2', title: 'Check today\'s Lebanese University lecture schedule & professor updates', category: 'Uni', priority: 'high', completed: false, date: 'today' },
    { id: 't_3', title: 'Senior Capstone Project: complete module architecture diagram', category: 'Uni', priority: 'high', completed: false, date: 'today' },
    { id: 't_4', title: 'Send personalized clinic management system demo & walkthrough', category: 'Work', priority: 'high', completed: false, date: 'today' },
    { id: 't_5', title: 'NovuStudios audit: Check website portfolio & respond to inquiries', category: 'Work', priority: 'medium', completed: false, date: 'today' },
    { id: 't_6', title: 'Late-night coding sprint: Build an AI agent tool-calling prototype', category: 'Learning', priority: 'medium', completed: false, date: 'today' }
  ],
  habits: [
    { id: 'h_calls', name: 'Clinic Cold Calls', current: 0, target: 30, unit: 'calls', streak: 0 },
    { id: 'h_demos', name: 'Clinic Demos Booked', current: 0, target: 2, unit: 'demos', streak: 0 },
    { id: 'h_followups', name: 'Follow-ups Sent', current: 0, target: 10, unit: 'sent', streak: 0 },
    { id: 'h_cs', name: 'LU CS Study', current: 0, target: 60, unit: 'mins', streak: 0 },
    { id: 'h_coding', name: 'Late-Night Coding / AI', current: 0, target: 90, unit: 'mins', streak: 0 },
    { id: 'h_reading', name: 'Reading & Mind', current: 0, target: 20, unit: 'mins', streak: 0 }
  ],
  schedule: [
    { id: 's_1', title: 'Clinic Outreach & Doctor Discovery Calls (Batch 1)', start: '10:30 AM', end: '12:30 PM', location: 'Sales Desk', priority: true },
    { id: 's_2', title: 'Clinic Demos & NovuStudios Inbound Follow-ups', start: '03:00 PM', end: '04:30 PM', location: 'Office / Remote', priority: false },
    { id: 's_3', title: 'Clinic Outreach Batch 2 & Pipeline Review', start: '05:30 PM', end: '06:30 PM', location: 'Sales Desk', priority: false },
    { id: 's_4', title: 'Lebanese University CS Senior Coursework & Review', start: '08:30 PM', end: '09:45 PM', location: 'Study Space', priority: true },
    { id: 's_5', title: 'Late-Night Deep Coding: SWE & AI Project Lab', start: '10:30 PM', end: '12:30 AM', location: 'Dev Environment', priority: true }
  ],
  expenses: [
    { id: 'exp_1', desc: 'High-Speed Internet & Fiber', amount: 28, type: 'expense', category: 'Utilities', currency: 'USD', date: 'Oct 1', time: '10:00 AM' },
    { id: 'exp_2', desc: 'Mobile Plan & 4G Data Recharge', amount: 16, type: 'expense', category: 'Utilities', currency: 'USD', date: 'Oct 2', time: '11:30 AM' },
    { id: 'exp_3', desc: 'Gym Membership', amount: 35, type: 'expense', category: 'Health', currency: 'USD', date: 'Oct 5', time: '02:15 PM' },
    { id: 'exp_4', desc: 'Dev & AI Tools Subscription', amount: 20, type: 'expense', category: 'Learning', currency: 'USD', date: 'Oct 5', time: '04:00 PM' }
  ],
  journal: {
    todayReflection: '',
    notes: [
      {
        id: 'n_1',
        title: 'Clinic Software Pitch & Objection Playbook',
        body: 'Core Value: Eliminates lost appointments with automated WhatsApp reminders and gives doctors immediate access to patient history.\n\nGatekeeper line: "Hi, I\'m calling regarding how Dr. [Name] currently manages patient booking overflow and WhatsApp confirmations. Who handles that system for the practice?"\n\nDoctor question: "How many patients on average cancel or no-show in a week? If we recover just 4 of those slots, that covers the entire system cost in the first week."',
        date: 'Oct 14',
        pillar: 'Clinic Sales'
      },
      {
        id: 'n_2',
        title: 'NovuStudios: Agency Revival Strategy',
        body: '1. Offer simple fixed packages: 5-page modern responsive site with mobile-first layout and Google Maps/Reviews embed.\n2. Leverage clinic outreach connections: Many clinics need modern websites or doctor bio pages along with their management system.\n3. Outreach approach: Send a 60-second video audit pointing out 2 mobile responsiveness issues on their current website.',
        date: 'Oct 14',
        pillar: 'NovuStudios'
      },
      {
        id: 'n_3',
        title: 'Lebanese University (LU) Senior Year: SWE vs AI Direction',
        body: 'Decision Framework:\n- Software Engineering: Focus on API design, database schemas, full-stack React/Node/Postgres, clean code.\n- AI Engineering: Focus on LLM APIs, function calling, agentic loops, RAG, prompt optimization.\n- Verdict: Both require solid SWE fundamentals. Build production full-stack systems with agentic capabilities to stay ahead of 99% of candidates.',
        date: 'Oct 14',
        pillar: 'CS & AI'
      }
    ]
  }
};

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.university) {
          parsed.university = JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA.university));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved database state, using defaults', e);
    }
    return JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA));
  }

  save(skipCloudPush = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      if (!skipCloudPush && currentSupabaseUser) {
        pushDataToCloud(this.data, (s) => updateSyncStatusBadge(s, currentSupabaseUser?.email));
      }
    } catch (e) {
      console.error('Storage quota exceeded or error saving to database', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA));
    this.save();
  }
}

let currentSupabaseUser = null;

function updateSyncStatusBadge(status, email) {
  const pill = document.getElementById('cloud-sync-pill');
  const pillText = document.getElementById('cloud-sync-text');
  const modalBadge = document.getElementById('supabase-modal-badge');
  const loggedOutView = document.getElementById('supabase-logged-out-view');
  const loggedInView = document.getElementById('supabase-logged-in-view');
  const userDisplay = document.getElementById('supabase-user-display');

  if (status === 'synced') {
    if (pill) {
      pill.className = 'db-status-pill synced';
      pill.title = `Cloud Synced (${email || currentSupabaseUser?.email || 'Active'})`;
    }
    if (pillText) pillText.textContent = 'Cloud Synced';
    if (modalBadge) {
      modalBadge.className = 'supabase-sync-badge connected';
      modalBadge.textContent = 'Synced';
    }
  } else if (status === 'syncing') {
    if (pill) {
      pill.className = 'db-status-pill syncing';
      pill.title = 'Syncing with Supabase cloud...';
    }
    if (pillText) pillText.textContent = 'Syncing...';
    if (modalBadge) {
      modalBadge.className = 'supabase-sync-badge syncing';
      modalBadge.textContent = 'Syncing...';
    }
  } else if (status === 'error') {
    if (pill) {
      pill.className = 'db-status-pill error';
      pill.title = 'Sync error. Check connection or project keys.';
    }
    if (pillText) pillText.textContent = 'Sync Error';
    if (modalBadge) {
      modalBadge.className = 'supabase-sync-badge error';
      modalBadge.textContent = 'Error';
    }
  } else {
    if (pill) {
      pill.className = 'db-status-pill offline';
      pill.title = 'Local persistent database';
    }
    if (pillText) pillText.textContent = 'On-Device Storage';
    if (modalBadge) {
      modalBadge.className = 'supabase-sync-badge';
      modalBadge.textContent = 'Offline';
    }
  }

  if (currentSupabaseUser) {
    loggedOutView?.classList.add('hidden');
    loggedInView?.classList.remove('hidden');
    if (userDisplay) userDisplay.textContent = currentSupabaseUser.email;
  } else {
    loggedOutView?.classList.remove('hidden');
    loggedInView?.classList.add('hidden');
  }
}

const store = new Store();

// State
let selectedTaskCategory = 'All';
let selectedFinanceFilter = 'all'; // 'all' | 'expense' | 'income'
let activeQuickFinanceType = 'expense'; // 'expense' | 'income'
let selectedRecCategory = 'All'; // 'All' | 'Sales' | 'CS' | 'AI' | 'Psychology' | 'Focus'

// Curated Knowledge & Recommendation Catalog
const CURATED_RECOMMENDATIONS = [
  // Sales & Closing
  {
    id: 'rec_fanatical',
    category: 'Sales',
    title: 'Fanatical Prospecting',
    author: 'Jeb Blount',
    format: 'Book / Playbook',
    takeaway: 'The 30-Day Rule: Prospecting done today dictates your pipeline and income 90 days later. Protect daily telephone call blocks without distraction.',
    actionTask: 'Complete 30 cold dials and log 2 meeting follow-ups',
    actionNote: 'Fanatical Prospecting Takeaways:\n1. 30-Day Rule: Slacking on outreach today destroys revenue next quarter.\n2. Three Laws of Need: The more desperate you are, the worse you negotiate.\n3. Protect Call Blocks: Turn off emails and tabs during prospecting sprints.'
  },
  {
    id: 'rec_negotiate',
    category: 'Sales',
    title: 'Never Split the Difference',
    author: 'Chris Voss',
    format: 'Book / Playbook',
    takeaway: 'Tactical empathy and calibrated questions. Neutralize prospect resistance with "It seems like..." and anchor with "How am I supposed to do that?".',
    actionTask: 'Practice calibrated "How / What" questions on next sales conversation',
    actionNote: 'Tactical Empathy Framework:\n1. Mirroring: Repeat the last 1-3 critical words.\n2. Labeling: "It sounds like you have a strict timeline."\n3. Calibrated Questions: Use "How" or "What" instead of "Why".'
  },
  {
    id: 'rec_spin',
    category: 'Sales',
    title: 'SPIN Selling Discovery',
    author: 'Neil Rackham',
    format: 'Framework',
    takeaway: 'Situation, Problem, Implication, Need-Payoff. Guide prospects to articulate the financial and operational pain of inaction.',
    actionTask: 'Write 3 Implication questions for upcoming prospect discovery call',
    actionNote: 'SPIN Framework:\n- Situation: Background context.\n- Problem: Explicit dissatisfaction.\n- Implication: Cost and risk of not solving the problem.\n- Need-Payoff: Value of the proposed outcome.'
  },
  {
    id: 'rec_cold_call',
    category: 'Sales',
    title: 'Pattern Interrupts & Cold Calling 2.0',
    author: 'Sales Execution',
    format: 'Tactical Guide',
    takeaway: 'Avoid "How are you today?". Open with: "I know you were not expecting my call, do you have two minutes to see if this makes sense for your team?"',
    actionTask: 'Test direct pattern interrupt on next 10 cold dials',
    actionNote: 'Cold Call Framework:\n1. Pattern Interrupt: Acknowledge the interruption directly.\n2. Clear Value Proposition: Highlight a relevant workflow problem.\n3. Low-Friction Close: Ask for a 10-minute discovery chat, not an instant sale.'
  },
  {
    id: 'rec_clinic_sales',
    category: 'Sales',
    title: 'Selling SaaS to Medical Clinics & Practices',
    author: 'Healthcare Tech Sales Blueprint',
    format: 'Playbook',
    takeaway: 'Doctors and clinic managers care about 3 things: zero missed appointments (automated WhatsApp reminders), faster patient check-in, and reliable billing. Win over the front-desk coordinator first.',
    actionTask: 'Prepare a 60-second clinic receptionist pitch focusing on no-show reduction',
    actionNote: 'Clinic Software Selling Blueprint:\n1. The Receptionist Ally: If the receptionist likes the system, the doctor will buy it.\n2. ROI Focus: Quantify lost revenue from no-shows (e.g. 5 missed patient visits/week = $500+ lost).\n3. Frictionless Demo: Show the appointment scheduler and patient file in under 3 minutes.'
  },
  {
    id: 'rec_novustudios',
    category: 'Sales',
    title: 'Web Agency Client Acquisition (NovuStudios)',
    author: 'Agency Growth Playbook',
    format: 'Playbook',
    takeaway: 'Never pitch "custom code" to local business owners. Pitch a high-converting, mobile-perfect digital storefront with Google review integration and instant contact buttons.',
    actionTask: 'Audit 3 local businesses with poor websites and draft a 2-minute video audit',
    actionNote: 'NovuStudios Web Client Playbook:\n1. Audit Outreach: Send a quick 60-second screen recording showing 2 mobile bugs on their existing site.\n2. Fixed Pricing: Keep packages simple (Starter Landing Page, Growth Business Suite).\n3. Speed to Delivery: Promise a working staging link in 7 days.'
  },

  // Computer Science
  {
    id: 'rec_swe_vs_ai',
    category: 'CS',
    title: 'SWE vs AI Engineering: Senior Career Guide',
    author: 'Engineering Career Roadmap',
    format: 'Career Guide',
    takeaway: 'Don\'t stress choosing prematurely in your senior year: Modern AI engineers need strong software engineering foundations (clean architecture, APIs, data schemas). Building full-stack systems with LLM tool capabilities gives you an unfair advantage.',
    actionTask: 'Build one end-to-end full stack feature with an integrated LLM tool',
    actionNote: 'SWE vs AI Path Strategy:\n- Software Engineering core: Clean architecture, database indexing, Git workflows, distributed state.\n- AI Engineering layer: Prompt chaining, vector search (RAG), evals, and agent tool execution.\n- The Sweet Spot: An engineer who can build both the backend architecture AND agent pipelines is unbeatable.'
  },
  {
    id: 'rec_ddia',
    category: 'CS',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    format: 'Book',
    takeaway: 'Core fundamentals of scalable systems: Storage engines, partitioning, replication, transactions, and distributed consensus.',
    actionTask: 'Study Chapter 3: Storage Engines & Indexing (B-Trees vs LSM-Trees)',
    actionNote: 'System Design Notes:\n- LSM-Trees optimize for fast write throughput.\n- B-Trees optimize for fast read queries and in-place page updates.\n- Replication strategies: Single-leader vs multi-leader vs leaderless consensus.'
  },
  {
    id: 'rec_neetcode',
    category: 'CS',
    title: 'Algorithmic Problem Patterns (NeetCode)',
    author: 'Computer Science',
    format: 'Roadmap',
    takeaway: 'Master fundamental algorithmic blueprints: Two Pointers, Sliding Window, Trees/Graphs, Binary Search, and Dynamic Programming.',
    actionTask: 'Solve 2 Two-Pointer or Sliding Window algorithm problems',
    actionNote: 'Algorithm Patterns:\n1. Two Pointers: Sorted arrays, palindrome verification.\n2. Sliding Window: Longest substring without repeats, subarray sums.\n3. Fast & Slow Pointers: Linked list cycle detection.'
  },
  {
    id: 'rec_system_design',
    category: 'CS',
    title: 'System Design & High-Scalability Architectures',
    author: 'Engineering Guide',
    format: 'Architecture Guide',
    takeaway: 'Load balancers, CDN edge caching, relational vs NoSQL databases, connection pooling, and horizontal scaling strategies.',
    actionTask: 'Review system design diagram for real-time messaging architecture',
    actionNote: 'Core System Design Building Blocks:\n- Caching: Redis for sub-millisecond query caching (Cache-Aside pattern).\n- Load Balancing: NGINX / Cloud load balancers with health checks.\n- Message Queues: Kafka/RabbitMQ for asynchronous task decoupling.'
  },

  // AI & Automation
  {
    id: 'rec_ai_agents',
    category: 'AI',
    title: 'Building Agentic Workflows with LLMs',
    author: 'Andrew Ng / DeepLearning.AI',
    format: 'Guide & Video',
    takeaway: 'The 4 essential agent design patterns: Reflection, Tool Use, Planning, and Multi-Agent Collaboration. Moving beyond single-turn prompts.',
    actionTask: 'Experiment with function-calling prompt schema for API integration',
    actionNote: 'Agentic Patterns Framework:\n1. Reflection: Model evaluates and critiques its own generated output.\n2. Tool Use: Invoking calculators, web search, database APIs.\n3. Planning: Decomposing a complex prompt into sequential executable steps.\n4. Multi-Agent: Specialized roles collaborating to accomplish end-to-end tasks.'
  },
  {
    id: 'rec_rag_arch',
    category: 'AI',
    title: 'Modern RAG & Vector Embeddings Architecture',
    author: 'AI Engineering',
    format: 'Architecture Guide',
    takeaway: 'Retrieval-Augmented Generation: Document chunking, hybrid keyword+semantic vector search, and reranking for reliable factual responses.',
    actionTask: 'Review embedding models and chunking strategies for knowledge retrieval',
    actionNote: 'RAG Pipeline Components:\n- Ingestion: Parsing PDFs, codebases, and notes into structured text chunks.\n- Embeddings: Generating vector representations (e.g., text-embedding-3).\n- Retrieval: Cosine similarity + BM25 hybrid search, followed by cross-encoder reranking.'
  },
  {
    id: 'rec_sales_ai',
    category: 'AI',
    title: 'AI Lead Enrichment & Outreach Automation',
    author: 'Practical Automation',
    format: 'Automation Blueprint',
    takeaway: 'Combining Python scripts with LLM APIs to automatically enrich company lead lists and generate hyper-tailored outreach talking points.',
    actionTask: 'Draft a Python script or prompt template for prospect company research',
    actionNote: 'Automated Prospecting Stack:\n1. Lead Scraping: Collect target domains & executive titles.\n2. Company Summarization: LLM reads company homepages to identify active hiring or recent funding.\n3. Cold Call Talking Points: Generate 3 bullet points of relevant pain points.'
  },

  // Psychology & Influence
  {
    id: 'rec_influence',
    category: 'Psychology',
    title: 'Influence: The Psychology of Persuasion',
    author: 'Robert B. Cialdini',
    format: 'Book',
    takeaway: '7 Persuasion Principles: Reciprocity, Consistency, Social Proof, Authority, Liking, Scarcity, and Unity.',
    actionTask: 'Incorporate social proof or reciprocity into today’s sales pitch',
    actionNote: 'Cialdini’s 7 Principles of Persuasion:\n- Reciprocity: Give value first before asking for time.\n- Social Proof: Mention similar clients or companies achieving results.\n- Scarcity: Highlight limited calendar availability or time-sensitive opportunities.'
  },
  {
    id: 'rec_thinking_fast',
    category: 'Psychology',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    format: 'Book',
    takeaway: 'System 1 (fast, intuitive) vs System 2 (slow, logical). Decision makers are emotionally motivated by loss aversion more than potential gain.',
    actionTask: 'Frame next proposal around avoiding risk (loss aversion)',
    actionNote: 'Cognitive Biases in Decision Making:\n- Loss Aversion: People are twice as motivated to avoid a loss as they are to seek a gain.\n- Framing Effect: How options are presented fundamentally shifts perceived value.\n- Anchoring: The first number spoken sets the baseline for the entire conversation.'
  },

  // Deep Focus & Habits
  {
    id: 'rec_deep_work',
    category: 'Focus',
    title: 'Deep Work: Rules for Focused Success',
    author: 'Cal Newport',
    format: 'Book',
    takeaway: 'Monotasking without distraction. The ability to perform deep work is rare and high-leverage. Eliminate notification tab switching.',
    actionTask: 'Execute a 90-minute phone-free deep work session today',
    actionNote: 'Deep Work Rules:\n1. Work deeply: Schedule fixed 90-minute distraction-free blocks.\n2. Embrace boredom: Resist immediate urge to check phone notifications.\n3. Quit social media during work hours: Protect dopamine and working memory.'
  },
  {
    id: 'rec_atomic_habits',
    category: 'Focus',
    title: 'Atomic Habits',
    author: 'James Clear',
    format: 'Book',
    takeaway: 'You do not rise to the level of your goals; you fall to the level of your systems. Make habits obvious, attractive, easy, and satisfying.',
    actionTask: 'Habit stack your morning routine (Cold calling directly after morning coffee)',
    actionNote: 'The 4 Laws of Behavior Change:\n1. Cue: Make it obvious.\n2. Craving: Make it attractive.\n3. Response: Make it easy.\n4. Reward: Make it satisfying.'
  }
];

// ========================================================
// Utilities & Formatting
// ========================================================

function formatCurrency(amount, cur) {
  const currency = cur || store.data.profile.currency || 'USD';
  const num = Number(amount || 0);
  if (currency === 'LBP') {
    return `${Math.round(num).toLocaleString()} LBP`;
  }
  return `$${num.toFixed(2)}`;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function triggerCelebration() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors: ['#18181B', '#10B981', '#60A5FA', '#F59E0B']
  });
}

function updateHeaderDateAndGreeting() {
  const now = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const dateNum = now.getDate();
  const year = now.getFullYear();

  const badge = document.getElementById('current-date-badge');
  if (badge) {
    badge.textContent = `${dayName}, ${monthName} ${dateNum}, ${year}`;
  }

  const hour = now.getHours();
  let timeGreeting = 'Welcome back';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  const greetingElem = document.getElementById('header-greeting-text');
  const name = store.data.profile.name || 'Hussein';
  if (greetingElem) {
    greetingElem.textContent = `${timeGreeting}, ${name}.`;
  }

  const initialElem = document.getElementById('user-initial-display');
  if (initialElem) {
    initialElem.textContent = name.charAt(0).toUpperCase();
  }

  const sidebarInitial = document.getElementById('sidebar-user-initial');
  if (sidebarInitial) {
    sidebarInitial.textContent = name.charAt(0).toUpperCase();
  }

  const sidebarName = document.getElementById('sidebar-user-name');
  if (sidebarName) {
    sidebarName.textContent = name;
  }
}

// ========================================================
// Theme Toggle & Initial Setup
// ========================================================

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sunIcon = document.getElementById('theme-sun-icon');
  const moonIcon = document.getElementById('theme-moon-icon');
  if (theme === 'dark') {
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
  } else {
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
  }
  store.data.profile.theme = theme;
  store.save();
}

function initTheme() {
  const savedTheme = store.data.profile.theme || 'light';
  applyTheme(savedTheme);

  const toggleHandler = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  };

  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleHandler);
  document.getElementById('sidebar-theme-toggle')?.addEventListener('click', toggleHandler);
}

// ========================================================
// Navigation Router
// ========================================================

let currentView = 'today';

function switchView(viewName) {
  currentView = viewName;

  // Sync mobile bottom nav buttons
  document.querySelectorAll('.bottom-nav-bar .nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Sync desktop sidebar buttons
  document.querySelectorAll('.sidebar-nav .sidebar-nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Toggle view panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`view-${viewName}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  renderActiveView();
}

function initNavigation() {
  // Mobile Nav Click
  document.querySelectorAll('.bottom-nav-bar .nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Desktop Sidebar Nav Click
  document.querySelectorAll('.sidebar-nav .sidebar-nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) switchView(view);
    });
  });
}

// ========================================================
// View Renderers
// ========================================================

let notificationBannerDismissed = false;

function renderTodayView() {
  const container = document.getElementById('view-today');
  if (!container) return;

  const totalTasks = store.data.tasks.length;
  const completedTasks = store.data.tasks.filter(t => t.completed).length;
  const topTasks = store.data.tasks.slice(0, 5);

  const totalSpentToday = store.data.expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncomeToday = store.data.expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const netToday = totalIncomeToday - totalSpentToday;
  const dailyBudget = Number(store.data.profile.dailyBudget) || 0;
  const remainingBudget = dailyBudget - totalSpentToday;

  const currentMood = store.data.growth.currentMood || 'High Focus';
  const motto = store.data.profile.motto || 'Focus on high-leverage priorities today.';

  const notifPermission = ('Notification' in window) ? Notification.permission : 'denied';
  const showNotifBanner = notifPermission !== 'granted' && !notificationBannerDismissed;

  const uni = store.data.university || {
    todayMode: 'classes',
    todayClasses: [],
    projects: []
  };

  container.innerHTML = `
    <!-- Top Notification Prompt Banner (Clean Apple Style) -->
    ${showNotifBanner ? `
      <div class="notification-prompt-banner" id="notif-prompt-banner">
        <div class="notification-prompt-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span>Enable notifications to get daily Lebanese University class alerts, outreach sprints, and budget updates.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="notification-prompt-btn" id="banner-enable-notif-btn">Enable</button>
          <button class="notification-dismiss-btn" id="banner-dismiss-notif-btn" aria-label="Dismiss">&times;</button>
        </div>
      </div>
    ` : ''}

    <!-- Top Focus & Energy Status Card (Apple Style) -->
    <div class="today-focus-card">
      <div class="today-focus-header">
        <span class="today-focus-label">Daily Focus</span>
        <button id="edit-focus-motto-btn" class="subtle-link-btn" title="Edit focus statement">Edit</button>
      </div>
      <div class="today-focus-text">"${escapeHTML(motto)}"</div>

      <div class="energy-segmented-wrap">
        <span class="energy-control-label">Focus State</span>
        <div class="apple-segmented-control">
          ${['High Focus', 'Balanced', 'Low Energy'].map(state => `
            <button class="segmented-btn ${currentMood === state ? 'active' : ''}" data-mood="${state}">
              ${state}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="desktop-grid-2col">
      <!-- Left Column: Priorities & Habits -->
      <div class="desktop-col">
        <!-- Priorities Checklist -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Priorities (${completedTasks}/${totalTasks})</h2>
            <button class="section-action" id="see-all-tasks-link">All Tasks &rarr;</button>
          </div>
          <div class="task-list" id="today-tasks-container">
            ${topTasks.length === 0 ? `
              <div class="empty-state-card">
                <p>No tasks scheduled for today.</p>
                <button class="empty-state-btn" id="today-add-task-btn">+ Add Task</button>
              </div>
            ` : topTasks.map(task => `
              <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}"></div>
                <div class="task-details">
                  <div class="task-title">${escapeHTML(task.title)}</div>
                  <div class="task-meta">
                    <span class="task-tag">${escapeHTML(task.category)}</span>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Habits Counter Grid -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Habits</h2>
            <button class="section-action" id="habits-shortcut">Manage &rarr;</button>
          </div>
          <div class="habit-grid">
            ${store.data.habits.map(habit => {
              const isDone = habit.current >= habit.target;
              const pct = Math.min(100, Math.round((habit.current / habit.target) * 100));
              return `
                <div class="habit-card ${isDone ? 'completed' : ''}" data-habit-id="${habit.id}">
                  <div class="habit-header">
                    <span class="habit-name">${escapeHTML(habit.name)}</span>
                    <span class="habit-streak">${habit.streak}d streak</span>
                  </div>
                  <div class="habit-status-row">
                    <span class="habit-count-text">${habit.current} / ${habit.target} ${habit.unit}</span>
                    <span class="habit-pct-label">${pct}%</span>
                  </div>
                  <div class="habit-progress-bar-bg">
                    <div class="habit-progress-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Lebanese University, Schedule, Cashflow, Notes -->
      <div class="desktop-col">
        <!-- Lebanese University Dynamic Daily Status & Classes Card -->
        <div class="uni-status-card">
          <div class="uni-status-head">
            <span class="uni-status-title">Lebanese University — Daily Status</span>
            <span style="font-size: 11px; color: var(--text-muted);">Dynamic Schedule</span>
          </div>

          <div class="uni-segmented-control">
            <button class="uni-seg-btn ${uni.todayMode === 'classes' ? 'active' : ''}" data-unimode="classes">Classes Today</button>
            <button class="uni-seg-btn ${uni.todayMode === 'study_day' ? 'active' : ''}" data-unimode="study_day">Self-Study</button>
            <button class="uni-seg-btn ${uni.todayMode === 'exam_prep' ? 'active' : ''}" data-unimode="exam_prep">Exam Prep</button>
            <button class="uni-seg-btn ${uni.todayMode === 'off' ? 'active' : ''}" data-unimode="off">No Uni</button>
          </div>

          ${uni.todayMode === 'classes' ? `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Today's Classes (${uni.todayClasses.length})</span>
                <div style="display: flex; gap: 10px;">
                  <button id="today-add-class-btn" class="subtle-link-btn">+ Add Class</button>
                  <button id="today-clear-classes-btn" class="subtle-link-btn" style="color: var(--text-muted);">Clear</button>
                </div>
              </div>
              <div class="uni-classes-list">
                ${uni.todayClasses.length === 0 ? `
                  <div style="font-size: 12.5px; color: var(--text-muted); padding: 10px 0; text-align: center;">
                    No classes entered for today. Tap "+ Add Class" to enter today's lectures.
                  </div>
                ` : uni.todayClasses.map(cls => `
                  <div class="uni-class-item ${cls.attended ? 'attended' : ''}">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="uni-class-time">${cls.time}</span>
                        ${cls.room ? `<span class="uni-class-room">${escapeHTML(cls.room)}</span>` : ''}
                      </div>
                      <div class="uni-class-name">${escapeHTML(cls.name)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <button class="quick-bump-btn toggle-class-attended-btn ${cls.attended ? 'active' : ''}" data-class-id="${cls.id}">
                        ${cls.attended ? 'Attended' : 'Attend'}
                      </button>
                      <button class="delete-task-btn delete-uni-class-btn" data-class-id="${cls.id}">&times;</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="font-size: 12.5px; color: var(--text-secondary); padding: 6px 0; display: flex; justify-content: space-between; align-items: center;">
              <span>${uni.todayMode === 'study_day' ? 'Off-campus day: Focus on coursework, project milestones, and sales calls.' : (uni.todayMode === 'exam_prep' ? 'Exam prep mode: Problem sets, past exams, and algorithm review.' : 'No university scheduled today.')}</span>
              <button id="switch-today-classes-btn" class="subtle-link-btn">Got Classes Today?</button>
            </div>
          `}
        </div>

        <!-- Upcoming Schedule Timeline -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Schedule</h2>
            <button class="section-action" id="schedule-shortcut">Calendar &rarr;</button>
          </div>
          <div class="schedule-list">
            ${store.data.schedule.length === 0 ? `
              <div class="empty-state-card">
                <p>No events scheduled for today.</p>
                <button class="empty-state-btn" id="today-add-event-btn">+ Add Event</button>
              </div>
            ` : store.data.schedule.slice(0, 4).map(event => `
              <div class="schedule-item ${event.priority ? 'priority' : ''}">
                <div style="flex: 1;">
                  <div class="schedule-time-range">${event.start} – ${event.end}</div>
                  <div class="schedule-event-title">${escapeHTML(event.title)}</div>
                  ${event.location ? `<div class="schedule-event-location">${escapeHTML(event.location)}</div>` : ''}
                </div>
                ${event.priority ? `<span class="priority-badge priority-high">High</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cashflow & Budget Summary -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Finances Today</h2>
            <button class="section-action" id="finance-shortcut">Ledger &rarr;</button>
          </div>
          <div class="expense-tally-bar">
            ${store.data.expenses.length === 0 ? `
              <span style="font-size: 12.5px; color: var(--text-muted);">No transactions recorded today.</span>
            ` : store.data.expenses.slice(0, 5).map(exp => {
              const isIncome = exp.type === 'income';
              return `
                <div class="expense-pill ${isIncome ? 'income-pill' : ''}">
                  <span>${isIncome ? '+' : '-'}${formatCurrency(exp.amount)}</span>
                  <span style="color: var(--text-secondary);">${escapeHTML(exp.desc)}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-light); font-size: 13px; margin-top: 8px;">
            <span style="color: var(--text-secondary);">
              Net: <strong style="color: ${netToday >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">${netToday >= 0 ? '+' : ''}${formatCurrency(netToday)}</strong>
              ${totalIncomeToday > 0 ? ` <span style="font-size: 11px; color: var(--text-muted);">(+${formatCurrency(totalIncomeToday)} in)</span>` : ''}
            </span>
            <span style="font-weight: 600; color: ${remainingBudget >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
              ${dailyBudget > 0 ? (remainingBudget >= 0 ? `${formatCurrency(remainingBudget)} budget remaining` : `${formatCurrency(Math.abs(remainingBudget))} over budget`) : 'Flexible budget mode'}
            </span>
          </div>
        </div>

        <!-- Quick Notes Scratchpad -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Quick Notes</h2>
            <span style="font-size: 11px; color: var(--text-muted);">Auto-saves</span>
          </div>
          <textarea id="today-quick-reflection" class="journal-textarea" rows="3" placeholder="Write a note, task reminder, or reflection...">${escapeHTML(store.data.journal.todayReflection || '')}</textarea>
        </div>
      </div>
    </div>
  `;

  // Notification Banner actions
  document.getElementById('banner-enable-notif-btn')?.addEventListener('click', async () => {
    await requestNotificationPermission();
    notificationBannerDismissed = true;
    renderTodayView();
  });
  document.getElementById('banner-dismiss-notif-btn')?.addEventListener('click', () => {
    notificationBannerDismissed = true;
    renderTodayView();
  });

  // Focus statement edit
  document.getElementById('edit-focus-motto-btn')?.addEventListener('click', () => {
    const newFocus = prompt('Update your daily focus statement:', store.data.profile.motto || '');
    if (newFocus !== null) {
      store.data.profile.motto = newFocus.trim();
      store.save();
      renderTodayView();
      showToast('Focus statement updated');
    }
  });

  // Energy segmented control
  container.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      store.data.growth.currentMood = mood;
      store.save();
      renderTodayView();
      showToast(`Focus state: ${mood}`);
    });
  });

  // Lebanese University segment buttons
  container.querySelectorAll('.uni-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.unimode;
      setUniMode(mode);
    });
  });

  // Add uni class prompt
  document.getElementById('today-add-class-btn')?.addEventListener('click', () => {
    const name = prompt('Class or lecture name (e.g., Operating Systems, AI Lab):');
    if (!name || !name.trim()) return;
    const time = prompt('Time slot (e.g., 09:30 AM – 11:30 AM):', '09:00 AM – 11:00 AM') || 'TBD';
    const room = prompt('Hall or Lab room (optional):', 'Hall 3') || '';
    addUniClass({ name: name.trim(), time: time.trim(), room: room.trim() });
  });

  // Clear uni classes
  document.getElementById('today-clear-classes-btn')?.addEventListener('click', () => {
    if (confirm('Clear today\'s class list?')) {
      clearUniClasses();
    }
  });

  // Switch to classes mode helper
  document.getElementById('switch-today-classes-btn')?.addEventListener('click', () => {
    setUniMode('classes');
  });

  // Toggle class attendance
  container.querySelectorAll('.toggle-class-attended-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleUniClass(btn.dataset.classId);
    });
  });

  // Delete uni class
  container.querySelectorAll('.delete-uni-class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteUniClass(btn.dataset.classId);
    });
  });

  // Quick reflection input
  document.getElementById('today-quick-reflection')?.addEventListener('input', (e) => {
    store.data.journal.todayReflection = e.target.value;
    store.save();
  });

  // Tasks toggle
  container.querySelectorAll('.task-checkbox').forEach(box => {
    box.addEventListener('click', (e) => {
      const taskId = e.target.closest('.task-item').dataset.taskId;
      toggleTask(taskId);
    });
  });

  // Habit increment
  container.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('click', () => {
      const habitId = card.dataset.habitId;
      incrementHabit(habitId);
    });
  });

  // Quick add helpers from empty states
  document.getElementById('today-add-task-btn')?.addEventListener('click', () => {
    document.getElementById('universal-quick-add')?.click() || document.getElementById('sidebar-quick-add-btn')?.click();
  });
  document.getElementById('today-add-event-btn')?.addEventListener('click', () => {
    document.getElementById('universal-quick-add')?.click() || document.getElementById('sidebar-quick-add-btn')?.click();
    document.querySelector('.capture-tab-btn[data-tab="event"]')?.click();
  });

  document.getElementById('see-all-tasks-link')?.addEventListener('click', () => switchView('tasks'));
  document.getElementById('habits-shortcut')?.addEventListener('click', () => switchView('tasks'));
  document.getElementById('schedule-shortcut')?.addEventListener('click', () => switchView('schedule'));
  document.getElementById('finance-shortcut')?.addEventListener('click', () => switchView('finances'));
}

function renderGrowthView() {
  const container = document.getElementById('view-growth');
  if (!container) return;

  const motto = store.data.profile.motto || 'Execute high-leverage sales calls, master CS & AI, and eliminate distractions.';
  const goals = store.data.growth.pillarsAndGoals || [];
  const routines = store.data.growth.routines || { morning: [], evening: [] };
  const insights = store.data.growth.insights || [];
  const uni = store.data.university || { projects: [] };

  const filteredRecs = CURATED_RECOMMENDATIONS.filter(r => {
    if (selectedRecCategory === 'All') return true;
    return r.category === selectedRecCategory;
  });

  container.innerHTML = `
    <!-- Personal Focus Card -->
    <div class="today-focus-card" style="margin-bottom: 20px;">
      <div class="today-focus-header">
        <span class="today-focus-label">Personal Focus & Vision</span>
        <button id="edit-growth-motto-btn" class="subtle-link-btn">Edit</button>
      </div>
      <div class="today-focus-text">"${escapeHTML(motto)}"</div>
    </div>

    <!-- Curated Knowledge & Playbooks Shelf -->
    <div class="section-block" style="margin-bottom: 20px;">
      <div class="section-head" style="margin-bottom: 8px;">
        <div>
          <h2 class="section-title">Curated Knowledge & Recommendations</h2>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            Actionable playbooks for sales executive mastery, computer science, AI, and psychology.
          </p>
        </div>
      </div>

      <!-- Recommendation Filter Pills -->
      <div class="transaction-filter-bar" style="margin-bottom: 14px;">
        ${[
          { id: 'All', label: 'All Recommendations' },
          { id: 'Sales', label: 'Sales & Closing' },
          { id: 'CS', label: 'Computer Science' },
          { id: 'AI', label: 'AI & Automation' },
          { id: 'Psychology', label: 'Psychology & Influence' },
          { id: 'Focus', label: 'Deep Focus' }
        ].map(cat => `
          <button class="transaction-filter-pill rec-filter-pill ${selectedRecCategory === cat.id ? 'active' : ''}" data-reccat="${cat.id}">
            ${cat.label}
          </button>
        `).join('')}
      </div>

      <!-- Recommendations Grid -->
      <div class="rec-grid">
        ${filteredRecs.map(rec => `
          <div class="rec-card" data-rec-id="${rec.id}">
            <div class="rec-header">
              <span class="rec-cat-badge">${rec.category}</span>
              <span class="rec-format-tag">${rec.format}</span>
            </div>
            <div class="rec-title">${escapeHTML(rec.title)}</div>
            <div class="rec-author">by ${escapeHTML(rec.author)}</div>
            <div class="rec-takeaway">${escapeHTML(rec.takeaway)}</div>
            <div class="rec-actions-row">
              <button class="rec-add-task-btn" data-rec-id="${rec.id}">+ Add to Tasks</button>
              <button class="rec-add-note-btn" data-rec-id="${rec.id}">+ Save Note</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="desktop-grid-2col">
      <!-- Left Column: Senior CS Projects & Objectives -->
      <div class="desktop-col">
        <!-- Senior CS Projects & Coursework Module (Lebanese University) -->
        <div class="section-block">
          <div class="section-head">
            <div>
              <h2 class="section-title">Senior CS Projects (${uni.projects.length})</h2>
              <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                Lebanese University semester projects & capstone delivery.
              </p>
            </div>
            <button class="section-action" id="growth-add-project-btn">+ Add Project</button>
          </div>
          <div>
            ${uni.projects.length === 0 ? `
              <div class="empty-state-card">
                <p>No active university projects logged.</p>
                <button class="empty-state-btn" id="empty-project-btn">+ Add Project</button>
              </div>
            ` : uni.projects.map(proj => `
              <div class="project-card" data-project-id="${proj.id}">
                <div class="project-head">
                  <span class="project-title">${escapeHTML(proj.title)}</span>
                  <span class="project-subject-badge">${escapeHTML(proj.subject)}</span>
                </div>
                <div class="project-desc">${escapeHTML(proj.description)}</div>
                <div class="project-meta-row">
                  <span>Milestone: <strong>${escapeHTML(proj.milestone)}</strong></span>
                  <span style="font-family: var(--font-mono);">${proj.progress}%</span>
                </div>
                <div class="goal-bar-bg" style="margin-bottom: 10px;">
                  <div class="goal-bar-fill" style="width: ${proj.progress}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: var(--text-muted);">Due: ${escapeHTML(proj.dueDate)}</span>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="quick-bump-btn bump-project-btn" data-proj-id="${proj.id}" data-delta="10">+10%</button>
                    <button class="delete-task-btn delete-project-btn" data-proj-id="${proj.id}">&times;</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Objectives & Goals -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Career & Life Objectives (${goals.length})</h2>
            <button class="section-action" id="growth-new-goal-btn">+ Add Goal</button>
          </div>
          <div>
            ${goals.length === 0 ? `
              <div class="empty-state-card">
                <p>No goals established yet.</p>
                <button class="empty-state-btn" id="empty-goal-btn">+ Add Goal</button>
              </div>
            ` : goals.map(goal => `
              <div class="pillar-card" data-goal-id="${goal.id}">
                <div class="pillar-head">
                  <span class="pillar-title">${escapeHTML(goal.title)}</span>
                  <span class="pillar-badge">${goal.pillar}</span>
                </div>
                <div class="goal-progress-wrap">
                  <div class="goal-progress-info">
                    <span>${escapeHTML(goal.milestone || '')}</span>
                    <span>${goal.progress}%</span>
                  </div>
                  <div class="goal-bar-bg">
                    <div class="goal-bar-fill" style="width: ${goal.progress}%;"></div>
                  </div>
                </div>
                <div class="goal-actions-row">
                  <button class="quick-bump-btn bump-goal-btn" data-goal-id="${goal.id}" data-delta="10">+10% Progress</button>
                  ${goal.progress >= 100 ? `<span class="completed-tag">Completed</span>` : ''}
                  <button class="delete-task-btn delete-goal-btn" data-goal-id="${goal.id}" title="Delete Goal">&times;</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Routines & Notes -->
      <div class="desktop-col">
        <!-- Daily Routines -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Daily Routines</h2>
          </div>
          
          <!-- Morning Routine -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
              Morning Routine
            </div>
            ${routines.morning.map(r => `
              <div class="task-item ${r.done ? 'completed' : ''}" style="margin-bottom: 6px;">
                <div class="task-checkbox ${r.done ? 'checked' : ''} routine-toggle-box" data-type="morning" data-routine-id="${r.id}"></div>
                <div class="task-details">
                  <div class="task-title" style="font-size: 13.5px;">${escapeHTML(r.text)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Evening Routine -->
          <div>
            <div style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
              Evening Routine
            </div>
            ${routines.evening.map(r => `
              <div class="task-item ${r.done ? 'completed' : ''}" style="margin-bottom: 6px;">
                <div class="task-checkbox ${r.done ? 'checked' : ''} routine-toggle-box" data-type="evening" data-routine-id="${r.id}"></div>
                <div class="task-details">
                  <div class="task-title" style="font-size: 13.5px;">${escapeHTML(r.text)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Notes & Reflections -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Notes & Reflections (${insights.length})</h2>
            <button class="section-action" id="growth-new-insight-btn">+ Add Note</button>
          </div>
          <div>
            ${insights.length === 0 ? `
              <div class="empty-state-card">
                <p>No notes saved yet.</p>
                <button class="empty-state-btn" id="empty-insight-btn">+ Add Note</button>
              </div>
            ` : insights.map(ins => `
              <div class="note-card" data-insight-id="${ins.id}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div class="note-title">${escapeHTML(ins.title)}</div>
                  <span class="pillar-badge" style="font-size: 10px;">${ins.pillar}</span>
                </div>
                <div class="note-preview">${escapeHTML(ins.body)}</div>
                <div class="note-footer">
                  <span>${ins.date}</span>
                  <button class="delete-task-btn delete-insight-btn" data-insight-id="${ins.id}">&times;</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Recommendation filter clicks
  container.querySelectorAll('.rec-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedRecCategory = pill.dataset.reccat;
      renderGrowthView();
    });
  });

  // Recommendation action: Add to Tasks
  container.querySelectorAll('.rec-add-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = CURATED_RECOMMENDATIONS.find(r => r.id === btn.dataset.recId);
      if (rec) {
        addTask({
          title: rec.actionTask,
          category: rec.category === 'Sales' ? 'Work' : 'Learning',
          priority: 'high'
        });
        showToast(`Added to tasks: ${rec.title}`);
      }
    });
  });

  // Recommendation action: Save Note
  container.querySelectorAll('.rec-add-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = CURATED_RECOMMENDATIONS.find(r => r.id === btn.dataset.recId);
      if (rec) {
        addInsight({
          title: `${rec.title} (${rec.author})`,
          body: rec.actionNote
        });
        showToast(`Note saved: ${rec.title}`);
      }
    });
  });

  // Edit motto
  document.getElementById('edit-growth-motto-btn')?.addEventListener('click', () => {
    document.getElementById('settings-btn')?.click() || document.getElementById('sidebar-user-btn')?.click();
  });

  // Add uni project helper
  const openAddProject = () => {
    const title = prompt('Project title (e.g. Senior Capstone, Distributed Systems Lab):');
    if (!title || !title.trim()) return;
    const subject = prompt('Course or Subject:', 'Computer Science') || 'CS';
    const description = prompt('Short description or deliverables:', '') || '';
    const milestone = prompt('Immediate milestone:', 'Module architecture') || 'In development';
    const dueDate = prompt('Target due date:', 'Dec 15') || 'End of Semester';
    addUniProject({ title: title.trim(), subject: subject.trim(), description: description.trim(), milestone: milestone.trim(), dueDate: dueDate.trim(), progress: 20 });
  };
  document.getElementById('growth-add-project-btn')?.addEventListener('click', openAddProject);
  document.getElementById('empty-project-btn')?.addEventListener('click', openAddProject);

  // Bump uni project progress
  container.querySelectorAll('.bump-project-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bumpUniProject(btn.dataset.projId, 10);
    });
  });

  // Delete uni project
  container.querySelectorAll('.delete-project-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteUniProject(btn.dataset.projId);
    });
  });

  // Goal Progress Bump
  container.querySelectorAll('.bump-goal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalId;
      const delta = parseInt(btn.dataset.delta, 10);
      const goal = store.data.growth.pillarsAndGoals.find(g => g.id === goalId);
      if (goal) {
        goal.progress = Math.min(100, goal.progress + delta);
        if (goal.progress >= 100) {
          triggerCelebration();
          showToast(`Goal Complete: ${goal.title}`);
        } else {
          showToast(`Progress: ${goal.progress}%`);
        }
        store.save();
        renderGrowthView();
      }
    });
  });

  // Goal Delete
  container.querySelectorAll('.delete-goal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const goalId = btn.dataset.goalId;
      store.data.growth.pillarsAndGoals = store.data.growth.pillarsAndGoals.filter(g => g.id !== goalId);
      store.save();
      renderGrowthView();
      showToast('Goal removed');
    });
  });

  // Routine check toggle
  container.querySelectorAll('.routine-toggle-box').forEach(box => {
    box.addEventListener('click', () => {
      const type = box.dataset.type;
      const id = box.dataset.routineId;
      const routine = store.data.growth.routines[type].find(r => r.id === id);
      if (routine) {
        routine.done = !routine.done;
        store.save();
        if (routine.done) {
          showToast('Routine completed');
        }
        renderGrowthView();
      }
    });
  });

  // Delete Insight
  container.querySelectorAll('.delete-insight-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.insightId;
      store.data.growth.insights = store.data.growth.insights.filter(ins => ins.id !== id);
      store.save();
      renderGrowthView();
      showToast('Note deleted');
    });
  });

  // Modal Launchers
  const openGoalTab = () => {
    document.getElementById('universal-quick-add')?.click() || document.getElementById('sidebar-quick-add-btn')?.click();
    document.querySelector('.capture-tab-btn[data-tab="goal"]')?.click();
  };
  const openInsightTab = () => {
    document.getElementById('universal-quick-add')?.click() || document.getElementById('sidebar-quick-add-btn')?.click();
    document.querySelector('.capture-tab-btn[data-tab="reflection"]')?.click();
  };

  document.getElementById('growth-new-goal-btn')?.addEventListener('click', openGoalTab);
  document.getElementById('empty-goal-btn')?.addEventListener('click', openGoalTab);
  document.getElementById('growth-new-insight-btn')?.addEventListener('click', openInsightTab);
  document.getElementById('empty-insight-btn')?.addEventListener('click', openInsightTab);
}

function renderTasksView() {
  const container = document.getElementById('view-tasks');
  if (!container) return;

  const categories = ['All', 'Uni', 'Work', 'Learning', 'Personal'];
  const filteredTasks = selectedTaskCategory === 'All'
    ? store.data.tasks
    : store.data.tasks.filter(t => t.category.toLowerCase() === selectedTaskCategory.toLowerCase());

  container.innerHTML = `
    <div class="desktop-grid-2col">
      <!-- Left Column: Filter Pills, Task Creator, Task List -->
      <div class="desktop-col">
        <!-- Add Task Bar -->
        <div class="section-block" style="padding: 12px 14px;">
          <form id="inline-task-form" style="display: flex; gap: 8px;">
            <input type="text" id="inline-task-input" placeholder="Add a new task..." required style="flex: 1;" />
            <select id="inline-task-cat" style="width: 105px;">
              <option value="Uni">Uni</option>
              <option value="Work">Work</option>
              <option value="Learning">Learning</option>
              <option value="Personal">Personal</option>
            </select>
            <button type="submit" class="submit-btn" style="margin-top: 0; padding: 0 16px;">Add</button>
          </form>
        </div>

        <!-- Task List with Category Filters -->
        <div class="section-block">
          <div class="section-head" style="margin-bottom: 8px;">
            <h2 class="section-title">Tasks (${filteredTasks.filter(t => !t.completed).length} Pending)</h2>
          </div>

          <!-- Category Filter Pills -->
          <div class="category-filter-bar">
            ${categories.map(cat => `
              <button class="category-filter-pill ${selectedTaskCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat}
              </button>
            `).join('')}
          </div>

          <div class="task-list">
            ${filteredTasks.length === 0 ? `
              <div class="empty-state-card">
                <p>No tasks found ${selectedTaskCategory !== 'All' ? `under "${selectedTaskCategory}"` : 'in your list'}.</p>
                <p style="font-size: 11.5px; color: var(--text-muted);">Type above or press + to add your first task!</p>
              </div>
            ` : filteredTasks.map(task => `
              <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
                <div class="task-details">
                  <div class="task-title">${escapeHTML(task.title)}</div>
                  <div class="task-meta">
                    <span class="task-tag">${task.category}</span>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                  </div>
                </div>
                <button class="delete-task-btn" title="Delete Task" aria-label="Delete">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Habits Tracker -->
      <div class="desktop-col">
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Daily Habits & Streaks</h2>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Click any habit card to increment your daily counter.</p>
          <div class="habit-grid">
            ${store.data.habits.map(habit => {
              const isDone = habit.current >= habit.target;
              const pct = Math.min(100, Math.round((habit.current / habit.target) * 100));
              return `
                <div class="habit-card ${isDone ? 'completed' : ''}" data-habit-id="${habit.id}">
                  <div class="habit-header">
                    <span class="habit-name">${escapeHTML(habit.name)}</span>
                    <span class="habit-streak">${habit.streak}d streak</span>
                  </div>
                  <div class="habit-status-row">
                    <span class="habit-count-text">${habit.current}/${habit.target} ${habit.unit}</span>
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${pct}%</span>
                  </div>
                  <div class="habit-progress-bar-bg">
                    <div class="habit-progress-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Category filter clicks
  container.querySelectorAll('.category-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedTaskCategory = pill.dataset.cat;
      renderTasksView();
    });
  });

  // Inline Task Submit
  document.getElementById('inline-task-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('inline-task-input');
    const cat = document.getElementById('inline-task-cat');
    if (input.value.trim()) {
      addTask({
        title: input.value.trim(),
        category: cat.value,
        priority: 'medium'
      });
      input.value = '';
    }
  });

  container.querySelectorAll('.task-checkbox').forEach(box => {
    box.addEventListener('click', (e) => {
      const taskId = e.target.closest('.task-item').dataset.taskId;
      toggleTask(taskId);
    });
  });

  container.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = e.target.closest('.task-item').dataset.taskId;
      deleteTask(taskId);
    });
  });

  container.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('click', () => {
      const habitId = card.dataset.habitId;
      incrementHabit(habitId);
    });
  });
}

function renderScheduleView() {
  const container = document.getElementById('view-schedule');
  if (!container) return;

  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  container.innerHTML = `
    <div class="desktop-grid-2col">
      <!-- Left Column: Day Schedule List -->
      <div class="desktop-col">
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Schedule & Time Blocks</h2>
            <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">${todayDateStr}</span>
          </div>
          <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px;">Organize your appointments, meetings, and deep work intervals.</p>
          
          <div class="schedule-list">
            ${store.data.schedule.length === 0 ? `
              <div class="empty-state-card">
                <p>No time blocks scheduled for today.</p>
                <p style="font-size: 11.5px; color: var(--text-muted);">Use the form on the right or press + to add your agenda!</p>
              </div>
            ` : store.data.schedule.map(event => `
              <div class="schedule-item ${event.priority ? 'priority' : ''}">
                <div style="flex: 1;">
                  <div class="schedule-time-range">${event.start} – ${event.end}</div>
                  <div class="schedule-event-title">${escapeHTML(event.title)}</div>
                  ${event.location ? `<div class="schedule-event-location">${escapeHTML(event.location)}</div>` : ''}
                </div>
                <button class="delete-task-btn delete-event-btn" data-event-id="${event.id}" title="Remove Event">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Add Event Form -->
      <div class="desktop-col">
        <div class="section-block">
          <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; color: var(--text-secondary);">+ New Time Block</h3>
          <form id="schedule-add-form" class="capture-form">
            <input type="text" id="sch-title" placeholder="Event title or focus block" required />
            <div class="form-row">
              <input type="text" id="sch-start" placeholder="Start (e.g. 10:00 AM)" required />
              <input type="text" id="sch-end" placeholder="End (e.g. 11:00 AM)" required />
            </div>
            <input type="text" id="sch-loc" placeholder="Location or link (optional)" />
            <button type="submit" class="submit-btn">Schedule Event</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('schedule-add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('sch-title').value.trim();
    const start = document.getElementById('sch-start').value.trim();
    const end = document.getElementById('sch-end').value.trim();
    const loc = document.getElementById('sch-loc').value.trim();
    if (title && start && end) {
      addEvent({ title, start, end, location: loc, priority: false });
      e.target.reset();
    }
  });

  container.querySelectorAll('.delete-event-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.eventId;
      store.data.schedule = store.data.schedule.filter(ev => ev.id !== id);
      store.save();
      renderScheduleView();
      showToast('Event removed');
    });
  });
}

function renderFinancesView() {
  const container = document.getElementById('view-finances');
  if (!container) return;

  const totalSpent = store.data.expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = store.data.expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalIncome - totalSpent;
  const dailyBudget = Number(store.data.profile.dailyBudget) || 0;
  const remainingBudget = dailyBudget - totalSpent;

  const expenseCount = store.data.expenses.filter(e => e.type !== 'income').length;
  const incomeCount = store.data.expenses.filter(e => e.type === 'income').length;
  const totalCount = store.data.expenses.length;

  const budgetPctUsed = dailyBudget > 0 ? Math.min(100, Math.round((totalSpent / dailyBudget) * 100)) : 0;
  let budgetBarColor = 'var(--accent-success)';
  if (budgetPctUsed > 100 || remainingBudget < 0) {
    budgetBarColor = 'var(--accent-danger)';
  } else if (budgetPctUsed > 80) {
    budgetBarColor = 'var(--accent-warning)';
  }

  // Filtered transactions
  const filteredTransactions = store.data.expenses.filter(tx => {
    if (selectedFinanceFilter === 'expense') return tx.type !== 'income';
    if (selectedFinanceFilter === 'income') return tx.type === 'income';
    return true;
  });

  // Category breakdown for expenses
  const expenseCategories = {};
  store.data.expenses.filter(e => e.type !== 'income').forEach(e => {
    expenseCategories[e.category] = (expenseCategories[e.category] || 0) + Number(e.amount);
  });

  // Source breakdown for income
  const incomeSources = {};
  store.data.expenses.filter(e => e.type === 'income').forEach(e => {
    const srcKey = e.source ? `From: ${e.source}` : (e.category || 'Direct Income');
    incomeSources[srcKey] = (incomeSources[srcKey] || 0) + Number(e.amount);
  });

  container.innerHTML = `
    <!-- Currency Switcher (USD vs LBP) -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Active Currency</span>
      <div class="apple-segmented-control" style="max-width: 190px;">
        <button class="segmented-btn currency-seg-btn ${store.data.profile.currency === 'USD' ? 'active' : ''}" data-currency="USD">USD ($)</button>
        <button class="segmented-btn currency-seg-btn ${store.data.profile.currency === 'LBP' ? 'active' : ''}" data-currency="LBP">LBP (LL)</button>
      </div>
    </div>

    <!-- Top Financial Cashflow Summary Cards -->
    <div class="cashflow-summary-grid">
      <div class="cashflow-card">
        <div class="cashflow-label">Net Balance</div>
        <div class="cashflow-amount ${netBalance >= 0 ? 'positive' : 'negative'}">
          ${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance)}
        </div>
        <div class="cashflow-sub">${incomeCount} received • ${expenseCount} spent</div>
      </div>

      <div class="cashflow-card">
        <div class="cashflow-label">Money Received</div>
        <div class="cashflow-amount positive">
          +${formatCurrency(totalIncome)}
        </div>
        <div class="cashflow-sub">${incomeCount} income log${incomeCount === 1 ? '' : 's'}</div>
      </div>

      <div class="cashflow-card">
        <div class="cashflow-label">Total Spent</div>
        <div class="cashflow-amount" style="color: var(--text-main);">
          ${formatCurrency(totalSpent)}
        </div>
        <div class="cashflow-sub">${dailyBudget > 0 ? `Budget: ${formatCurrency(dailyBudget)}` : 'Flexible (No daily cap)'}</div>
      </div>
    </div>

    <!-- Daily Budget Health Gauge -->
    ${dailyBudget > 0 ? `
      <div class="budget-gauge-card">
        <div class="budget-gauge-header">
          <span class="budget-gauge-title">Daily Budget Status (${budgetPctUsed}% used)</span>
          <button id="quick-edit-budget-btn" style="background: none; border: none; font-size: 11.5px; font-weight: 700; color: var(--accent-primary); cursor: pointer; text-decoration: underline;">
            Adjust Target (${formatCurrency(dailyBudget)})
          </button>
        </div>
        <div class="budget-gauge-bar-bg">
          <div class="budget-gauge-bar-fill" style="width: ${budgetPctUsed}%; background: ${budgetBarColor};"></div>
        </div>
        <div class="budget-gauge-footer">
          <span>${formatCurrency(totalSpent)} spent today</span>
          <span style="font-weight: 700; color: ${remainingBudget >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
            ${remainingBudget >= 0 ? `${formatCurrency(remainingBudget)} remaining` : `${formatCurrency(Math.abs(remainingBudget))} over budget!`}
          </span>
        </div>
      </div>
    ` : `
      <div class="budget-gauge-card">
        <div class="budget-gauge-header">
          <span class="budget-gauge-title">Flexible Budget Mode (No Daily Cap)</span>
          <button id="quick-edit-budget-btn" style="background: none; border: none; font-size: 11.5px; font-weight: 700; color: var(--accent-primary); cursor: pointer; text-decoration: underline;">
            Set Budget Cap
          </button>
        </div>
        <div class="budget-gauge-footer" style="margin-top: 4px;">
          <span>${formatCurrency(totalSpent)} total spent</span>
          <span style="font-weight: 600; color: var(--text-secondary);">Tracking cashflow flexibly</span>
        </div>
      </div>
    `}

    <!-- Action Buttons for Logging Money -->
    <div class="finance-actions-bar">
      <button class="finance-action-btn finance-income-btn" id="finances-add-income-btn">
        + Add Income
      </button>
      <button class="finance-action-btn finance-expense-btn" id="finances-add-exp-btn">
        – Add Expense
      </button>
    </div>

    <!-- Filter Pills Bar (Horizontal Touch Scrollable) -->
    <div class="transaction-filter-bar">
      <button class="transaction-filter-pill ${selectedFinanceFilter === 'all' ? 'active' : ''}" data-filter="all">
        All (${totalCount})
      </button>
      <button class="transaction-filter-pill ${selectedFinanceFilter === 'expense' ? 'active' : ''}" data-filter="expense">
        Expenses (${expenseCount})
      </button>
      <button class="transaction-filter-pill ${selectedFinanceFilter === 'income' ? 'active' : ''}" data-filter="income">
        Income (${incomeCount})
      </button>
    </div>

    <div class="desktop-grid-2col">
      <!-- Left Column: Transactions Ledger -->
      <div class="desktop-col">
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Ledger (${filteredTransactions.length})</h2>
          </div>
          <div>
            ${filteredTransactions.length === 0 ? `
              <div class="empty-state-card">
                <p>No ${selectedFinanceFilter === 'income' ? 'income' : (selectedFinanceFilter === 'expense' ? 'expenses' : 'transactions')} recorded yet.</p>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px;">
                  <button class="empty-state-btn" id="empty-add-income-btn">+ Add Income</button>
                  <button class="empty-state-btn" id="empty-add-expense-btn">– Add Expense</button>
                </div>
              </div>
            ` : filteredTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              return `
                <div class="transaction-item" data-tx-id="${tx.id}">
                  <div class="transaction-left">
                    <div class="transaction-badge ${isIncome ? 'income' : 'expense'}">
                      ${isIncome ? '+' : '–'}
                    </div>
                    <div class="transaction-info">
                      <div class="transaction-desc">${escapeHTML(tx.desc)}</div>
                      <div class="transaction-meta">
                        ${isIncome && tx.source ? `<span class="transaction-source-tag">From: ${escapeHTML(tx.source)}</span>` : ''}
                        <span>${tx.category}</span>
                        <span>•</span>
                        <span>${tx.time || tx.date || 'Today'}</span>
                      </div>
                    </div>
                  </div>
                  <div class="transaction-right">
                    <span class="transaction-amount-text ${isIncome ? 'income' : 'expense'}">
                      ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
                    </span>
                    <button class="delete-task-btn delete-transaction-btn" data-tx-id="${tx.id}" title="Delete Record">&times;</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Breakdowns -->
      <div class="desktop-col">
        <!-- Income by Source Breakdown -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Income by Source</h2>
          </div>
          <div>
            ${Object.keys(incomeSources).length === 0 ? `
              <div style="text-align: center; padding: 16px 0; color: var(--text-muted); font-size: 12.5px;">
                No income logged yet. Tap "+ Add Income" to record incoming funds.
              </div>
            ` : Object.entries(incomeSources).map(([src, amt]) => {
              const pct = Math.min(100, Math.round((amt / (totalIncome || 1)) * 100));
              return `
                <div class="category-breakdown-row">
                  <span style="font-weight: 600; color: var(--accent-success);">${escapeHTML(src)}</span>
                  <span style="font-family: var(--font-mono); font-weight: 700;">+${formatCurrency(amt)} (${pct}%)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Spending by Category Breakdown -->
        <div class="section-block">
          <div class="section-head">
            <h2 class="section-title">Spending by Category</h2>
          </div>
          <div>
            ${Object.keys(expenseCategories).length === 0 ? `
              <div style="text-align: center; padding: 16px 0; color: var(--text-muted); font-size: 12.5px;">
                Category breakdown will appear here once you log an expense.
              </div>
            ` : Object.entries(expenseCategories).map(([cat, amt]) => {
              const pct = Math.min(100, Math.round((amt / (totalSpent || 1)) * 100));
              return `
                <div class="category-breakdown-row">
                  <span style="font-weight: 500;">${escapeHTML(cat)}</span>
                  <span style="font-family: var(--font-mono); font-weight: 600;">${formatCurrency(amt)} (${pct}%)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Currency toggle clicks
  container.querySelectorAll('.currency-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.data.profile.currency = btn.dataset.currency;
      store.save();
      renderFinancesView();
      showToast(`Currency changed to ${btn.dataset.currency}`);
    });
  });

  // Filter clicks
  container.querySelectorAll('.transaction-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedFinanceFilter = pill.dataset.filter;
      renderFinancesView();
    });
  });

  // Action Button Listeners
  const openFinanceModal = (type) => {
    activeQuickFinanceType = type;
    document.getElementById('universal-quick-add')?.click() || document.getElementById('sidebar-quick-add-btn')?.click();
    document.querySelector('.capture-tab-btn[data-tab="finance"]')?.click();
    setQuickFinanceType(type);
  };

  document.getElementById('finances-add-income-btn')?.addEventListener('click', () => openFinanceModal('income'));
  document.getElementById('empty-add-income-btn')?.addEventListener('click', () => openFinanceModal('income'));

  document.getElementById('finances-add-exp-btn')?.addEventListener('click', () => openFinanceModal('expense'));
  document.getElementById('empty-add-expense-btn')?.addEventListener('click', () => openFinanceModal('expense'));

  // Quick adjust budget target
  document.getElementById('quick-edit-budget-btn')?.addEventListener('click', () => {
    const newTarget = prompt('Enter your new daily budget target ($):', store.data.profile.dailyBudget || 60);
    if (newTarget !== null) {
      const parsed = parseFloat(newTarget);
      if (!isNaN(parsed) && parsed > 0) {
        store.data.profile.dailyBudget = parsed;
        store.save();
        renderFinancesView();
        showToast(`Daily budget set to $${parsed}`);
      }
    }
  });

  // Delete transaction
  container.querySelectorAll('.delete-transaction-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.txId;
      store.data.expenses = store.data.expenses.filter(x => x.id !== id);
      store.save();
      renderFinancesView();
      showToast('Record deleted');
    });
  });
}

function renderActiveView() {
  updateHeaderDateAndGreeting();
  switch (currentView) {
    case 'today':
      renderTodayView();
      break;
    case 'growth':
      renderGrowthView();
      break;
    case 'tasks':
      renderTasksView();
      break;
    case 'schedule':
      renderScheduleView();
      break;
    case 'finances':
      renderFinancesView();
      break;
  }
}

// ========================================================
// Mutation Helpers
// ========================================================

function toggleTask(taskId) {
  const task = store.data.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  store.save();

  if (task.completed) {
    triggerCelebration();
    showToast('Task completed');
  }

  renderActiveView();
}

function addTask(taskData) {
  const newTask = {
    id: 't_' + Date.now(),
    title: taskData.title,
    category: taskData.category || 'General',
    priority: taskData.priority || 'medium',
    completed: false,
    date: 'today'
  };
  store.data.tasks.unshift(newTask);
  store.save();
  renderActiveView();
  showToast('Task added');
}

function deleteTask(taskId) {
  store.data.tasks = store.data.tasks.filter(t => t.id !== taskId);
  store.save();
  renderActiveView();
  showToast('Task deleted');
}

function incrementHabit(habitId) {
  const habit = store.data.habits.find(h => h.id === habitId);
  if (!habit) return;

  if (habit.current < habit.target) {
    let delta = 1;
    if (habit.unit === 'mins' || habit.unit === 'min') {
      delta = 15;
    } else if (habit.unit === 'calls') {
      delta = 5;
    } else if (habit.unit === 'steps') {
      delta = 1000;
    }
    habit.current = Math.min(habit.target, habit.current + delta);

    if (habit.current >= habit.target) {
      triggerCelebration();
      showToast(`Target reached: ${habit.name}`);
    } else {
      const addedText = delta > 1 ? `+${delta} ${habit.unit}` : '+1';
      showToast(`${habit.name}: ${addedText}`);
    }
  } else {
    habit.current = 0;
    showToast(`Reset ${habit.name}`);
  }

  store.save();
  renderActiveView();
}

function addFinanceTransaction(txData) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const numAmount = parseFloat(txData.amount);
  const type = txData.type || 'expense';
  const cur = txData.currency || store.data.profile.currency || 'USD';

  const newTx = {
    id: 'tx_' + Date.now(),
    type: type,
    desc: txData.desc || (type === 'income' ? (txData.source || 'Income') : 'Expense'),
    source: txData.source || (type === 'income' ? 'Direct Income' : ''),
    amount: numAmount,
    currency: cur,
    category: txData.category || (type === 'income' ? 'Salary / Wages' : 'Other'),
    time: timeStr,
    date: dateStr
  };

  store.data.expenses.unshift(newTx);
  store.save();
  renderActiveView();

  if (type === 'income') {
    triggerCelebration();
    showToast(`Income added: +${formatCurrency(numAmount, cur)}`);
    sendAppNotification(
      'Income Received',
      `+${formatCurrency(numAmount, cur)} from ${newTx.source || newTx.desc}.`
    );
  } else {
    showToast(`Expense recorded: -${formatCurrency(numAmount, cur)}`);
    const dailyBudget = Number(store.data.profile.dailyBudget) || 0;
    if (dailyBudget > 0) {
      const totalSpent = store.data.expenses.filter(e => e.type !== 'income').reduce((s, e) => s + Number(e.amount), 0);
      const remaining = dailyBudget - totalSpent;
      if (remaining < 0) {
        sendAppNotification(
          'Budget Notice',
          `Daily budget exceeded by ${formatCurrency(Math.abs(remaining), cur)}.`
        );
      } else {
        sendAppNotification(
          'Expense Recorded',
          `-${formatCurrency(numAmount, cur)} on ${newTx.desc}. ${formatCurrency(remaining, cur)} remaining today.`
        );
      }
    } else {
      sendAppNotification(
        'Expense Recorded',
        `-${formatCurrency(numAmount, cur)} on ${newTx.desc}.`
      );
    }
  }
}

function addExpense(expData) {
  addFinanceTransaction({
    type: 'expense',
    desc: expData.desc,
    amount: expData.amount,
    category: expData.category
  });
}

function addEvent(eventData) {
  const newEvent = {
    id: 's_' + Date.now(),
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    location: eventData.location || '',
    priority: !!eventData.priority
  };
  store.data.schedule.push(newEvent);
  store.save();
  renderActiveView();
  showToast('Event scheduled');
}

function addGoal(goalData) {
  const newGoal = {
    id: 'g_' + Date.now(),
    title: goalData.title,
    pillar: goalData.pillar || 'Mind & Learning',
    progress: parseInt(goalData.progress, 10) || 0,
    milestone: `${goalData.progress || 0}% completed`
  };
  store.data.growth.pillarsAndGoals.push(newGoal);
  store.save();
  renderActiveView();
  showToast('Goal created');
}

function addInsight(insightData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const newInsight = {
    id: 'in_' + Date.now(),
    title: insightData.title || 'Note',
    body: insightData.body,
    pillar: 'Mind & Learning',
    date: dateStr
  };
  store.data.growth.insights.unshift(newInsight);
  store.save();
  renderActiveView();
  showToast('Note saved');
}

function setUniMode(mode) {
  if (!store.data.university) {
    store.data.university = JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA.university));
  }
  store.data.university.todayMode = mode;
  store.save();
  renderTodayView();
  showToast(`Uni status: ${mode === 'classes' ? 'Classes Today' : (mode === 'study_day' ? 'Self-Study Day' : (mode === 'exam_prep' ? 'Exam Prep' : 'No Uni Today'))}`);
}

function addUniClass(cls) {
  if (!store.data.university) {
    store.data.university = JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA.university));
  }
  const newClass = {
    id: 'c_' + Date.now(),
    name: cls.name,
    time: cls.time || 'TBD',
    room: cls.room || '',
    attended: false
  };
  store.data.university.todayClasses.push(newClass);
  store.save();
  renderTodayView();
  showToast(`Class added: ${cls.name}`);
}

function toggleUniClass(classId) {
  if (!store.data.university) return;
  const cls = store.data.university.todayClasses.find(c => c.id === classId);
  if (!cls) return;
  cls.attended = !cls.attended;
  store.save();
  if (cls.attended) {
    triggerCelebration();
    showToast(`Attended: ${cls.name}`);
  }
  renderTodayView();
}

function deleteUniClass(classId) {
  if (!store.data.university) return;
  store.data.university.todayClasses = store.data.university.todayClasses.filter(c => c.id !== classId);
  store.save();
  renderTodayView();
  showToast('Class removed');
}

function clearUniClasses() {
  if (!store.data.university) return;
  store.data.university.todayClasses = [];
  store.save();
  renderTodayView();
  showToast('Classes cleared for today');
}

function addUniProject(proj) {
  if (!store.data.university) {
    store.data.university = JSON.parse(JSON.stringify(CLEAN_DEFAULT_DATA.university));
  }
  const newProject = {
    id: 'p_' + Date.now(),
    title: proj.title,
    subject: proj.subject || 'CS Senior',
    description: proj.description || '',
    milestone: proj.milestone || 'In development',
    progress: Number(proj.progress) || 10,
    dueDate: proj.dueDate || 'End of Semester',
    status: 'In Progress'
  };
  store.data.university.projects.unshift(newProject);
  store.save();
  renderGrowthView();
  showToast(`Project added: ${proj.title}`);
}

function bumpUniProject(projId, delta = 10) {
  if (!store.data.university) return;
  const proj = store.data.university.projects.find(p => p.id === projId);
  if (!proj) return;
  proj.progress = Math.min(100, Math.max(0, proj.progress + delta));
  if (proj.progress >= 100) {
    proj.status = 'Completed';
    triggerCelebration();
    showToast(`Project complete: ${proj.title}`);
  } else {
    showToast(`${proj.title}: ${proj.progress}%`);
  }
  store.save();
  renderGrowthView();
}

function deleteUniProject(projId) {
  if (!store.data.university) return;
  store.data.university.projects = store.data.university.projects.filter(p => p.id !== projId);
  store.save();
  renderGrowthView();
  showToast('Project deleted');
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ========================================================
// Universal Quick Capture Modal
// ========================================================

const EXPENSE_CATEGORIES = [
  'Food & Coffee',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Other'
];

const INCOME_CATEGORIES = [
  'Salary / Wages',
  'Freelance / Client',
  'Gift / Family',
  'Investment / Dividends',
  'Sales / Side Hustle',
  'Reimbursement / Refund',
  'Other'
];

function setQuickFinanceType(type) {
  activeQuickFinanceType = type;
  const switchBtns = document.querySelectorAll('.fin-type-btn');
  switchBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fintype === type);
  });

  const descInput = document.getElementById('quick-finance-desc');
  const sourceGroup = document.getElementById('quick-finance-source-group');
  const catSelect = document.getElementById('quick-finance-category');
  const submitBtn = document.getElementById('quick-finance-submit-btn');

  if (type === 'income') {
    if (descInput) descInput.placeholder = 'Income source or description (e.g. Salary, Client payment)';
    if (sourceGroup) sourceGroup.classList.remove('hidden');
    if (submitBtn) submitBtn.textContent = 'Save Income';

    if (catSelect) {
      catSelect.innerHTML = INCOME_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  } else {
    if (descInput) descInput.placeholder = 'Expense description';
    if (sourceGroup) sourceGroup.classList.add('hidden');
    if (submitBtn) submitBtn.textContent = 'Save Expense';

    if (catSelect) {
      catSelect.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }
}

function initQuickCaptureModal() {
  const modal = document.getElementById('quick-capture-modal');
  const closeBtn = document.getElementById('close-quick-modal');
  const tabBtns = document.querySelectorAll('.capture-tab-btn');

  const openModal = () => {
    modal?.classList.remove('hidden');
    document.getElementById('quick-task-title')?.focus();
  };

  document.getElementById('universal-quick-add')?.addEventListener('click', openModal);
  document.getElementById('sidebar-quick-add-btn')?.addEventListener('click', openModal);

  closeBtn?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tab = btn.dataset.tab;
      document.querySelectorAll('.capture-form').forEach(form => form.classList.add('hidden'));

      const targetForm = document.getElementById(`form-quick-${tab}`);
      targetForm?.classList.remove('hidden');
      targetForm?.querySelector('input, textarea')?.focus();

      if (tab === 'finance') {
        setQuickFinanceType(activeQuickFinanceType);
      }
    });
  });

  // Switch between Expense and Income in Quick Capture
  document.querySelectorAll('.fin-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.fintype;
      setQuickFinanceType(type);
    });
  });

  // Task Form
  document.getElementById('form-quick-task')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('quick-task-title').value.trim();
    const category = document.getElementById('quick-task-category').value;
    const priority = document.getElementById('quick-task-priority').value;
    if (title) {
      addTask({ title, category, priority });
      e.target.reset();
      modal?.classList.add('hidden');
    }
  });

  // Goal Form
  document.getElementById('form-quick-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('quick-goal-title').value.trim();
    const pillar = document.getElementById('quick-goal-pillar').value;
    const progress = document.getElementById('quick-goal-target').value;
    if (title) {
      addGoal({ title, pillar, progress });
      e.target.reset();
      modal?.classList.add('hidden');
    }
  });

  // Finance Form (Unified for Expense and Income!)
  document.getElementById('form-quick-finance')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('quick-finance-desc').value.trim();
    const amount = document.getElementById('quick-finance-amount').value;
    const currency = document.getElementById('quick-finance-currency')?.value || store.data.profile.currency || 'USD';
    const source = document.getElementById('quick-finance-source')?.value.trim() || '';
    const category = document.getElementById('quick-finance-category').value;
    if (desc && amount) {
      addFinanceTransaction({
        type: activeQuickFinanceType,
        desc,
        source,
        amount,
        currency,
        category
      });
      e.target.reset();
      setQuickFinanceType('expense'); // reset default to expense
      modal?.classList.add('hidden');
    }
  });

  // Event Form
  document.getElementById('form-quick-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('quick-event-title').value.trim();
    const start = document.getElementById('quick-event-start').value;
    const end = document.getElementById('quick-event-end').value;
    const location = document.getElementById('quick-event-location').value.trim();
    if (title && start && end) {
      const formatTime = (t) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayH = hour % 12 || 12;
        return `${displayH}:${m} ${ampm}`;
      };
      addEvent({
        title,
        start: formatTime(start),
        end: formatTime(end),
        location,
        priority: false
      });
      sendAppNotification('Event Scheduled', `${title} (${formatTime(start)} – ${formatTime(end)})`);
      e.target.reset();
      modal?.classList.add('hidden');
    }
  });

  // Insight / Reflection Form
  document.getElementById('form-quick-reflection')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('quick-reflection-title').value.trim();
    const body = document.getElementById('quick-reflection-body').value.trim();
    if (body) {
      addInsight({ title, body });
      e.target.reset();
      modal?.classList.add('hidden');
    }
  });
}

// ========================================================
// Notifications Engine (Web Push & Local Alerts)
// ========================================================

function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function updateNotificationUI() {
  const perm = getNotificationPermission();
  const badge = document.getElementById('notification-status-badge');
  const enableBtn = document.getElementById('enable-notifications-btn');
  const headerBtn = document.getElementById('header-notify-btn');
  const sidebarBtn = document.getElementById('sidebar-notify-btn');

  if (badge) {
    if (perm === 'granted') {
      badge.textContent = 'Active';
      badge.style.color = 'var(--accent-success)';
      if (enableBtn) enableBtn.textContent = 'Active';
    } else if (perm === 'denied') {
      badge.textContent = 'Blocked';
      badge.style.color = 'var(--accent-danger)';
      if (enableBtn) enableBtn.textContent = 'Permission Blocked';
    } else {
      badge.textContent = 'Off';
      badge.style.color = 'var(--text-muted)';
      if (enableBtn) enableBtn.textContent = 'Enable Notifications';
    }
  }

  [headerBtn, sidebarBtn].forEach(btn => {
    if (!btn) return;
    if (perm === 'granted') {
      btn.style.color = 'var(--accent-success)';
      btn.setAttribute('title', 'Notifications Enabled');
    } else {
      btn.style.color = '';
      btn.setAttribute('title', 'Enable Notifications');
    }
  });
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications are not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    updateNotificationUI();
    if (permission === 'granted') {
      showToast('Notifications enabled');
      sendAppNotification('LifeOS', 'Notifications enabled for reminders and budget alerts.');
      return true;
    } else if (permission === 'denied') {
      showToast('Notifications blocked. Enable them in site settings.');
      return false;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
  }
  return false;
}

async function sendAppNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // 1. Try Service Worker showNotification if active
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'lifeos-alert',
          renotify: true
        });
        return;
      }
    } catch (e) {
      console.warn('SW notification fallback:', e);
    }
  }

  // 2. Fallback to standard web Notification
  try {
    new Notification(title, {
      body: body,
      icon: '/icon.svg',
      badge: '/icon.svg'
    });
  } catch (e) {
    console.warn('Native notification failed:', e);
  }
}

function checkProactiveNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  // Check last briefing sent today
  const lastBriefing = localStorage.getItem('lifeos_last_briefing_date');
  if (lastBriefing !== todayKey && hour >= 8 && hour < 14) {
    localStorage.setItem('lifeos_last_briefing_date', todayKey);
    const uniMode = store.data.university?.todayMode === 'classes' ? 'Classes Today' : 'Study & Outreach Day';
    sendAppNotification(
      'LifeOS Morning Focus',
      `Welcome Hussein. Status: ${uniMode}. 30 clinic dials & senior CS coursework queued.`
    );
  }
}

// ========================================================
// Settings & Offline Backup / Restore
// ========================================================

function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('close-settings-modal');
  const nameInput = document.getElementById('settings-username');
  const mottoInput = document.getElementById('settings-motto');
  const budgetInput = document.getElementById('settings-daily-budget');
  const currencySelect = document.getElementById('settings-currency');
  const exportBtn = document.getElementById('export-data-btn');
  const importInput = document.getElementById('import-data-file');
  const resetBtn = document.getElementById('reset-sample-btn');

  const enableNotifyBtn = document.getElementById('enable-notifications-btn');
  const testNotifyBtn = document.getElementById('test-notification-btn');
  const headerNotifyBtn = document.getElementById('header-notify-btn');
  const sidebarNotifyBtn = document.getElementById('sidebar-notify-btn');

  const openSettings = () => {
    if (nameInput) nameInput.value = store.data.profile.name || 'Hussein';
    if (mottoInput) mottoInput.value = store.data.profile.motto || '';
    if (budgetInput) budgetInput.value = store.data.profile.dailyBudget !== undefined ? store.data.profile.dailyBudget : 0;
    if (currencySelect) currencySelect.value = store.data.profile.currency || 'USD';
    updateNotificationUI();
    modal?.classList.remove('hidden');
  };

  document.getElementById('settings-btn')?.addEventListener('click', openSettings);
  document.getElementById('sidebar-user-btn')?.addEventListener('click', openSettings);

  // Notification button triggers
  enableNotifyBtn?.addEventListener('click', async () => {
    await requestNotificationPermission();
  });

  testNotifyBtn?.addEventListener('click', () => {
    if (getNotificationPermission() !== 'granted') {
      requestNotificationPermission().then(granted => {
        if (granted) {
          sendAppNotification('LifeOS Test Alert', 'Budget tracking & reminder alerts are active.');
        }
      });
    } else {
      sendAppNotification('LifeOS Test Alert', 'Budget tracking & reminder alerts are active.');
      showToast('Test notification sent');
    }
  });

  headerNotifyBtn?.addEventListener('click', () => {
    if (getNotificationPermission() !== 'granted') {
      requestNotificationPermission();
    } else {
      sendAppNotification('LifeOS Active', 'All reminders and budget alerts are enabled.');
      showToast('Notifications are active');
    }
  });

  sidebarNotifyBtn?.addEventListener('click', () => {
    if (getNotificationPermission() !== 'granted') {
      requestNotificationPermission();
    } else {
      sendAppNotification('LifeOS Active', 'All reminders and budget alerts are enabled.');
      showToast('Notifications are active');
    }
  });

  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  nameInput?.addEventListener('change', () => {
    store.data.profile.name = nameInput.value.trim() || 'Hussein';
    store.save();
    updateHeaderDateAndGreeting();
    showToast('Name updated');
  });

  mottoInput?.addEventListener('change', () => {
    store.data.profile.motto = mottoInput.value.trim();
    store.save();
    renderActiveView();
    showToast('Focus statement updated');
  });

  budgetInput?.addEventListener('change', () => {
    store.data.profile.dailyBudget = parseFloat(budgetInput.value) || 0;
    store.save();
    renderActiveView();
    showToast('Budget target updated');
  });

  currencySelect?.addEventListener('change', () => {
    store.data.profile.currency = currencySelect.value;
    store.save();
    renderActiveView();
    showToast(`Currency set to ${currencySelect.value}`);
  });

  // Export JSON file
  exportBtn?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database exported');
  });

  // Import JSON file
  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.profile) {
          store.data = { ...CLEAN_DEFAULT_DATA, ...importedData };
          store.save();
          renderActiveView();
          modal?.classList.add('hidden');
          showToast('Database imported successfully');
        } else {
          showToast('Invalid backup file format');
        }
      } catch (err) {
        showToast('Error reading backup file');
      }
    };
    reader.readAsText(file);
  });

  // Supabase Cloud Sync UI Handlers
  const toggleKeysBtn = document.getElementById('supabase-toggle-keys-btn');
  const toggleKeysLoggedBtn = document.getElementById('supabase-toggle-keys-logged-btn');
  const keysDrawer = document.getElementById('supabase-keys-drawer');
  const projectUrlInput = document.getElementById('supabase-project-url');
  const projectKeyInput = document.getElementById('supabase-project-key');
  const saveKeysBtn = document.getElementById('supabase-save-keys-btn');
  const statusMsg = document.getElementById('supabase-status-msg');

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const storedUrl = localStorage.getItem('lifeos_supabase_url') || envUrl;
  const storedKey = localStorage.getItem('lifeos_supabase_anon_key') || envKey;
  if (projectUrlInput && storedUrl) projectUrlInput.value = storedUrl;
  if (projectKeyInput && storedKey) projectKeyInput.value = storedKey;

  const toggleDrawer = () => keysDrawer?.classList.toggle('hidden');
  toggleKeysBtn?.addEventListener('click', toggleDrawer);
  toggleKeysLoggedBtn?.addEventListener('click', toggleDrawer);

  saveKeysBtn?.addEventListener('click', () => {
    const url = projectUrlInput?.value.trim() || '';
    const key = projectKeyInput?.value.trim() || '';
    saveCredentials(url, key);
    showToast('Supabase credentials saved');
    if (statusMsg) {
      statusMsg.className = 'supabase-status-message success';
      statusMsg.textContent = 'Credentials saved. You can now sign in or sign up.';
    }
    keysDrawer?.classList.add('hidden');
  });

  const emailInput = document.getElementById('supabase-email-input');
  const passwordInput = document.getElementById('supabase-password-input');
  const signInBtn = document.getElementById('supabase-signin-btn');
  const signUpBtn = document.getElementById('supabase-signup-btn');
  const signOutBtn = document.getElementById('supabase-signout-btn');
  const syncNowBtn = document.getElementById('supabase-sync-now-btn');

  signInBtn?.addEventListener('click', async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    if (!email || !password) {
      if (statusMsg) {
        statusMsg.className = 'supabase-status-message error';
        statusMsg.textContent = 'Please enter both email and password.';
      }
      return;
    }

    try {
      signInBtn.disabled = true;
      signInBtn.textContent = 'Signing in...';
      if (statusMsg) statusMsg.textContent = '';

      const authData = await signIn(email, password);
      currentSupabaseUser = authData.user;
      updateSyncStatusBadge('syncing', authData.user.email);

      const cloudData = await pullDataFromCloud();
      if (cloudData && typeof cloudData === 'object') {
        store.data = { ...CLEAN_DEFAULT_DATA, ...cloudData };
        store.save(true);
        renderActiveView();
        showToast('Data synced from cloud');
      } else {
        pushDataToCloud(store.data, (s) => updateSyncStatusBadge(s, authData.user.email));
      }

      updateSyncStatusBadge('synced', authData.user.email);
      showToast(`Signed in as ${authData.user.email}`);

      subscribeToRealtime((remoteData) => {
        if (remoteData && typeof remoteData === 'object') {
          store.data = { ...CLEAN_DEFAULT_DATA, ...remoteData };
          store.save(true);
          renderActiveView();
          showToast('Updated from another device');
        }
      });
    } catch (err) {
      console.error('Sign in error:', err);
      if (statusMsg) {
        statusMsg.className = 'supabase-status-message error';
        statusMsg.textContent = err.message || 'Failed to sign in. Verify credentials.';
      }
    } finally {
      signInBtn.disabled = false;
      signInBtn.textContent = 'Sign In';
    }
  });

  signUpBtn?.addEventListener('click', async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    if (!email || !password) {
      if (statusMsg) {
        statusMsg.className = 'supabase-status-message error';
        statusMsg.textContent = 'Please enter both email and password.';
      }
      return;
    }

    try {
      signUpBtn.disabled = true;
      signUpBtn.textContent = 'Creating account...';
      if (statusMsg) statusMsg.textContent = '';

      const authData = await signUp(email, password);
      currentSupabaseUser = authData.user;

      if (authData.user) {
        updateSyncStatusBadge('syncing', authData.user.email);
        pushDataToCloud(store.data, (s) => updateSyncStatusBadge(s, authData.user.email));
        updateSyncStatusBadge('synced', authData.user.email);
        showToast('Account created & synced to cloud');
        subscribeToRealtime((remoteData) => {
          if (remoteData && typeof remoteData === 'object') {
            store.data = { ...CLEAN_DEFAULT_DATA, ...remoteData };
            store.save(true);
            renderActiveView();
            showToast('Updated from another device');
          }
        });
      } else {
        if (statusMsg) {
          statusMsg.className = 'supabase-status-message success';
          statusMsg.textContent = 'Check your email to confirm registration.';
        }
      }
    } catch (err) {
      console.error('Sign up error:', err);
      if (statusMsg) {
        statusMsg.className = 'supabase-status-message error';
        statusMsg.textContent = err.message || 'Failed to sign up.';
      }
    } finally {
      signUpBtn.disabled = false;
      signUpBtn.textContent = 'Sign Up';
    }
  });

  signOutBtn?.addEventListener('click', async () => {
    try {
      await signOut();
      currentSupabaseUser = null;
      updateSyncStatusBadge('offline');
      showToast('Signed out of Supabase');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  });

  syncNowBtn?.addEventListener('click', async () => {
    if (!currentSupabaseUser) return;
    try {
      updateSyncStatusBadge('syncing', currentSupabaseUser.email);
      pushDataToCloud(store.data, (s) => updateSyncStatusBadge(s, currentSupabaseUser.email));
      showToast('Sync initiated');
    } catch (err) {
      showToast('Sync failed');
    }
  });

  // Reset to clean default
  resetBtn?.addEventListener('click', () => {
    if (confirm('Clear all data and start completely fresh?')) {
      store.reset();
      renderActiveView();
      modal?.classList.add('hidden');
      showToast('Database cleared to fresh start');
    }
  });
}

// ========================================================
// PWA & Service Worker Setup
// ========================================================

let deferredPrompt = null;

function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        updateNotificationUI();
      }).catch((err) => {
        console.log('SW registration note:', err);
      });
    });
  }

  const pwaBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    pwaBtn?.classList.remove('hidden');
  });

  pwaBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      pwaBtn.classList.add('hidden');
      showToast('LifeOS installed');
    }
    deferredPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    pwaBtn?.classList.add('hidden');
  });
}

// ========================================================
// Keyboard Shortcuts
// ========================================================

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      return;
    }

    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      document.getElementById('sidebar-quick-add-btn')?.click() || document.getElementById('universal-quick-add')?.click();
    } else if (e.key === '1') {
      switchView('today');
    } else if (e.key === '2') {
      switchView('growth');
    } else if (e.key === '3') {
      switchView('tasks');
    } else if (e.key === '4') {
      switchView('schedule');
    } else if (e.key === '5') {
      switchView('finances');
    } else if (e.key === 'd' || e.key === 'D') {
      document.getElementById('sidebar-theme-toggle')?.click() || document.getElementById('theme-toggle-btn')?.click();
    }
  });
}

async function initCloudSync() {
  try {
    initSupabase();
    const user = await getCurrentUser();
    if (user) {
      currentSupabaseUser = user;
      updateSyncStatusBadge('syncing', user.email);

      const cloudData = await pullDataFromCloud();
      if (cloudData && typeof cloudData === 'object') {
        store.data = { ...CLEAN_DEFAULT_DATA, ...cloudData };
        store.save(true);
        renderActiveView();
      }
      updateSyncStatusBadge('synced', user.email);

      subscribeToRealtime((remoteData) => {
        if (remoteData && typeof remoteData === 'object') {
          store.data = { ...CLEAN_DEFAULT_DATA, ...remoteData };
          store.save(true);
          renderActiveView();
          showToast('Updated from another device');
        }
      });
    } else {
      updateSyncStatusBadge('offline');
    }
  } catch (err) {
    console.warn('Initial cloud sync check:', err);
    updateSyncStatusBadge('offline');
  }
}

// ========================================================
// Bootstrap
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initQuickCaptureModal();
  initSettingsModal();
  initKeyboardShortcuts();
  initPWA();
  initCloudSync();
  updateNotificationUI();
  checkProactiveNotifications();
  setInterval(checkProactiveNotifications, 30 * 60 * 1000);
  renderActiveView();
});
