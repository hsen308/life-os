/**
 * Central State Store for LifeOS
 * 
 * Rules:
 * 1. Dates are ALWAYS local 'YYYY-MM-DD' via dateUtils.
 * 2. Old localStorage key ('lifeos_data') is preserved untouched.
 * 3. activeTimer is kept in localStorage ONLY and NEVER pushed to Supabase.
 * 4. totalFocusMinutesToday is dynamically computed from sessions[].
 * 5. Milestones record doneAt: 'YYYY-MM-DD' on completion.
 * 6. Streak follows the 5-of-7 Grace Shield model.
 */

import { getLocalDateString, addLocalDays, getLastNDays, isOverdue, isToday, isFuture } from './dateUtils.js';
import { ROADMAP_PHASES, LEETCODE_MISSIONS, SALES_MISSIONS, READING_MISSIONS, EXAM_MISSIONS } from './missions.js';
import { pushDataToCloud, pullDataFromCloud, subscribeToRealtime } from './supabase.js';
import { scheduleMustDoReminder, cancelMustDoReminder } from './notificationHooks.js';

const STORAGE_KEY = 'lifeos_cognitive_v2';
const TIMER_STORAGE_KEY = 'lifeos_active_timer_v2';
const OLD_STORAGE_KEY = 'lifeos_data';

// Subscribers for reactive UI updates
const listeners = new Set();

export function subscribeStore(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => {
    try { fn(state); } catch (e) { console.error('Store listener error:', e); }
  });
}

function generateId() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Initial State with defaults
 */
function createInitialState() {
  return {
    user: {
      name: 'Hussein',
      motto: 'Focus on what you can control. Action cures anxiety.'
    },
    settings: {
      currency: 'USD',
      lbpRate: 89500,
      examMode: false,
      soundAlert: true,
      vibrateAlert: true,
      notificationsEnabled: false
    },
    mustDo: [
      {
        id: 'must_welcome_1',
        text: 'Review Week 1 JavaScript Goals & complete 1 Deep Work block',
        category: 'urgent',
        dueDate: getLocalDateString(),
        done: false,
        completedAt: null,
        createdAt: getLocalDateString()
      }
    ],
    // Milestone progress map: { [milestoneId]: { done: boolean, doneAt: string|null, note: string } }
    milestones: {},
    // Spaced repetition review queue: [{ id, milestoneId, topicTitle, phaseId, rating, dueDate, reviewsCount, lastReviewedAt }]
    reviewQueue: [],
    // Session history: [{ id, date: 'YYYY-MM-DD', timestamp, durationMinutes, mode: 'study'|'build'|'review', missionTitle, phaseId, rating, buildNote }]
    sessions: [],
    // Streamlined finances
    finances: {
      transactions: [],
      dailyBudget: 0
    },
    // Coach / Commander UI ephemeral choices
    commander: {
      energy: 'high', // 'low' | 'med' | 'high'
      availableMinutes: 50, // 25 | 50 | 90
      activeFocusDomain: 'roadmap', // 'roadmap' | 'leetcode' | 'sales' | 'reading' | 'exam'
      currentMission: null,
      skippedIds: []
    }
  };
}

/**
 * Migration helper: loads old data without deleting or overwriting the old key
 */
function migrateOldDataIfPresent(initial) {
  try {
    const rawOld = localStorage.getItem(OLD_STORAGE_KEY);
    if (!rawOld) return initial;
    const old = JSON.parse(rawOld);
    if (!old || typeof old !== 'object') return initial;

    console.log('Safe migration: found old LifeOS data. Porting user history...');

    if (old.user && old.user.name) {
      initial.user.name = old.user.name;
    }
    if (old.user && old.user.motto) {
      initial.user.motto = old.user.motto;
    }

    // Port finances
    if (old.finances && Array.isArray(old.finances.transactions)) {
      initial.finances.transactions = old.finances.transactions.map(t => ({
        id: t.id || generateId(),
        type: t.type === 'income' ? 'income' : 'expense',
        amount: Number(t.amount) || 0,
        currency: t.currency === 'LBP' ? 'LBP' : 'USD',
        category: t.category || 'Other',
        description: t.description || 'Legacy transaction',
        date: t.date || getLocalDateString(),
        timestamp: t.timestamp || Date.now()
      }));
    }

    // Port past sessions if any
    if (Array.isArray(old.sessions)) {
      initial.sessions = old.sessions;
    }

    // Port any checked milestones if any existed
    if (old.milestones && typeof old.milestones === 'object') {
      Object.keys(old.milestones).forEach(k => {
        initial.milestones[k] = {
          done: Boolean(old.milestones[k]?.done),
          doneAt: old.milestones[k]?.doneAt || getLocalDateString(),
          note: old.milestones[k]?.note || ''
        };
      });
    }

    return initial;
  } catch (err) {
    console.warn('Migration warning:', err);
    return initial;
  }
}

// In-memory state
let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure essential arrays exist
      if (!Array.isArray(parsed.mustDo)) parsed.mustDo = [];
      if (!parsed.milestones) parsed.milestones = {};
      if (!Array.isArray(parsed.reviewQueue)) parsed.reviewQueue = [];
      if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
      if (!parsed.finances || !Array.isArray(parsed.finances.transactions)) {
        parsed.finances = { transactions: [], dailyBudget: 0 };
      }
      if (!parsed.commander) {
        parsed.commander = { energy: 'high', availableMinutes: 50, activeFocusDomain: 'roadmap', currentMission: null, skippedIds: [] };
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed reading localStorage, using initial state:', e);
  }

  const initial = createInitialState();
  return migrateOldDataIfPresent(initial);
})();

/**
 * Local Active Timer State (Stored completely separately, NEVER pushed to cloud)
 */
function createInitialTimer() {
  return {
    running: false,
    paused: false,
    mode: 'study', // 'study' | 'build' | 'review'
    durationMinutes: 50,
    remainingMs: 50 * 60 * 1000,
    endTimestamp: null,
    missionId: 'p1-m1-s1',
    missionTitle: 'Fetch & JSON Error Handling',
    phaseId: 'phase-1'
  };
}

let activeTimer = (() => {
  try {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate timestamps: if endTimestamp has passed while closed
      if (parsed.running && !parsed.paused && parsed.endTimestamp) {
        const remaining = parsed.endTimestamp - Date.now();
        if (remaining <= 0) {
          // Timer finished while page was closed
          parsed.remainingMs = 0;
          parsed.running = false;
          parsed.paused = false;
        } else {
          parsed.remainingMs = remaining;
        }
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load activeTimer:', e);
  }
  return createInitialTimer();
})();

/**
 * Save state locally and schedule cloud sync (EXCLUDING activeTimer)
 */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  // Push to Supabase cloud safely without activeTimer
  const cloudData = getCloudPayload();
  pushDataToCloud(cloudData);

  notify();
}

/**
 * Save active timer strictly to local storage
 */
export function saveActiveTimer() {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimer));
  } catch (e) {
    console.error('Failed to save activeTimer:', e);
  }
  notify();
}

/**
 * Returns cloud payload stripped of activeTimer and ephemeral DOM states
 */
export function getCloudPayload() {
  return {
    user: state.user,
    settings: state.settings,
    mustDo: state.mustDo,
    milestones: state.milestones,
    reviewQueue: state.reviewQueue,
    sessions: state.sessions,
    finances: state.finances,
    version: 2,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Merges cloud data into local state without ever overwriting activeTimer
 */
export function mergeRemoteData(remote) {
  if (!remote || typeof remote !== 'object') return;
  console.log('Merging remote state update from Supabase...');

  if (remote.user) state.user = { ...state.user, ...remote.user };
  if (remote.settings) state.settings = { ...state.settings, ...remote.settings };
  if (Array.isArray(remote.mustDo)) state.mustDo = remote.mustDo;
  if (remote.milestones) state.milestones = { ...state.milestones, ...remote.milestones };
  if (Array.isArray(remote.reviewQueue)) state.reviewQueue = remote.reviewQueue;
  if (Array.isArray(remote.sessions)) state.sessions = remote.sessions;
  if (remote.finances && Array.isArray(remote.finances.transactions)) {
    state.finances = remote.finances;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}

  notify();
}

// Subscribe to Supabase realtime updates
subscribeToRealtime((remoteData) => {
  mergeRemoteData(remoteData);
});

// Initial pull on boot
pullDataFromCloud().then(remoteData => {
  if (remoteData) mergeRemoteData(remoteData);
});

// ==========================================
// Getters & Computed Selectors
// ==========================================

export function getState() {
  return state;
}

export function getActiveTimer() {
  return activeTimer;
}

/**
 * Dynamically computes total focus minutes today from sessions[]
 * SINGLE SOURCE OF TRUTH.
 */
export function getFocusMinutesToday() {
  const today = getLocalDateString();
  return state.sessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
}

export function getSessionsToday() {
  const today = getLocalDateString();
  return state.sessions.filter(s => s.date === today);
}

/**
 * Must Do Items with Rollover Logic:
 * - Overdue: dueDate < today && !done
 * - Today: dueDate === today && !done
 * - Completed Today: done && completedAt === today
 * - Upcoming / Future: dueDate > today && !done
 */
export function getMustDoCategorized() {
  const today = getLocalDateString();
  const overdue = [];
  const todayItems = [];
  const upcoming = [];
  const completedToday = [];

  state.mustDo.forEach(item => {
    if (item.done) {
      if (item.completedAt === today) {
        completedToday.push(item);
      }
    } else {
      if (isOverdue(item.dueDate)) {
        overdue.push(item);
      } else if (isToday(item.dueDate)) {
        todayItems.push(item);
      } else if (isFuture(item.dueDate)) {
        upcoming.push(item);
      } else {
        todayItems.push(item);
      }
    }
  });

  // Sort: highest priority / oldest overdue first
  overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return { overdue, todayItems, upcoming, completedToday };
}

/**
 * Streak with Grace Logic:
 * Rule: 
 * - An "active day" requires at least 25 minutes of deep focus.
 * - Streak tracks continuous active days.
 * - The user receives 2 "Grace Shields" per rolling 7-day period.
 * - If a day is missed, 1 Grace Shield keeps the streak intact.
 * - If 2 consecutive days or more than 2 days in 7 days are missed, streak breaks.
 */
export function getStreakAndGrace() {
  const today = getLocalDateString();
  const last7Days = getLastNDays(7);

  // Map of date -> total minutes
  const dayMinutes = {};
  state.sessions.forEach(s => {
    if (s.date) {
      dayMinutes[s.date] = (dayMinutes[s.date] || 0) + (Number(s.durationMinutes) || 0);
    }
  });

  const isDayActive = (dateStr) => (dayMinutes[dateStr] || 0) >= 25;
  const isTodayActive = isDayActive(today);

  // Calculate active days in the rolling 7-day window
  const activeDaysIn7 = last7Days.filter(d => isDayActive(d)).length;
  // Grace shields used in the 7-day window (days with < 25m)
  const missedIn7 = 7 - activeDaysIn7;
  const graceShieldsRemaining = Math.max(0, 2 - (missedIn7 > 0 ? 1 : 0));

  // Compute consecutive streak working backwards
  let currentStreak = 0;
  let shieldsAllowed = 2;
  let consecutiveMissed = 0;

  // Start from today if active, otherwise check from yesterday
  let checkDate = today;
  if (!isTodayActive) {
    // If today is not active yet, don't count it as a broken streak unless yesterday was also missed
    checkDate = addLocalDays(today, -1);
  }

  for (let i = 0; i < 60; i++) {
    const d = addLocalDays(checkDate, -i);
    if (isDayActive(d)) {
      currentStreak++;
      consecutiveMissed = 0;
    } else {
      consecutiveMissed++;
      if (consecutiveMissed >= 2 || shieldsAllowed <= 0) {
        break; // Streak broke
      }
      shieldsAllowed--; // Grace consumed
    }
  }

  return {
    streak: currentStreak,
    graceShieldsRemaining,
    daysActiveThisWeek: activeDaysIn7,
    isTodayActive,
    focusMinutesToday: getFocusMinutesToday()
  };
}

/**
 * Spaced Repetition Due Items
 */
export function getSpacedReviewDue() {
  const today = getLocalDateString();
  return state.reviewQueue.filter(item => item.dueDate <= today);
}

/**
 * Weekly Summary Progress:
 * Calculates focus hours, completed sessions, Lost topics,
 * and milestone completion deltas (e.g. "Phase 1: 18% -> 42%").
 */
export function getWeeklySummary() {
  const today = getLocalDateString();
  const sevenDaysAgo = addLocalDays(today, -7);

  // Sessions in last 7 days
  const weeklySessions = state.sessions.filter(s => s.date >= sevenDaysAgo && s.date <= today);
  const totalMinutes = weeklySessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Lost topics in last 7 days
  const lostSessions = weeklySessions.filter(s => s.rating === 'lost');

  // Phase progress deltas
  const phaseProgress = ROADMAP_PHASES.map(phase => {
    const totalMilestones = phase.milestones.length;
    if (totalMilestones === 0) return { id: phase.id, title: phase.title, pastPct: 0, currentPct: 0, delta: 0 };

    let doneBeforeWeek = 0;
    let doneNow = 0;

    phase.milestones.forEach(m => {
      const record = state.milestones[m.id];
      if (record && record.done) {
        doneNow++;
        // If it was completed before this week
        if (record.doneAt && record.doneAt < sevenDaysAgo) {
          doneBeforeWeek++;
        }
      }
    });

    const pastPct = Math.round((doneBeforeWeek / totalMilestones) * 100);
    const currentPct = Math.round((doneNow / totalMilestones) * 100);

    return {
      id: phase.id,
      number: phase.number,
      title: phase.title,
      totalMilestones,
      doneNow,
      pastPct,
      currentPct,
      delta: currentPct - pastPct
    };
  });

  return {
    totalHours,
    sessionCount: weeklySessions.length,
    lostCount: lostSessions.length,
    lostSessions,
    phaseProgress,
    weeklySessions
  };
}

// ==========================================
// Mutators / Actions
// ==========================================

export function setUserNameAndMotto(name, motto) {
  if (name) state.user.name = name.trim();
  if (motto !== undefined) state.user.motto = motto.trim();
  saveState();
}

export function setSettings(newSettings) {
  state.settings = { ...state.settings, ...newSettings };
  saveState();
}

export function toggleExamMode() {
  state.settings.examMode = !state.settings.examMode;
  saveState();
}

// --- Must Do Actions ---

export function addMustDo({ text, category = 'urgent', dueDate, dueTime }) {
  if (!text || !text.trim()) return null;
  const today = getLocalDateString();
  const newItem = {
    id: generateId(),
    text: text.trim(),
    category: category || 'urgent',
    dueDate: dueDate || today,
    dueTime: dueTime || null,
    done: false,
    completedAt: null,
    createdAt: today
  };
  state.mustDo.unshift(newItem);
  saveState();
  scheduleMustDoReminder(newItem);
  return newItem;
}

export function toggleMustDo(id) {
  const item = state.mustDo.find(i => i.id === id);
  if (!item) return;
  item.done = !item.done;
  item.completedAt = item.done ? getLocalDateString() : null;
  saveState();

  if (item.done) {
    cancelMustDoReminder(id);
  } else {
    scheduleMustDoReminder(item);
  }
}

export function deleteMustDo(id) {
  state.mustDo = state.mustDo.filter(i => i.id !== id);
  saveState();
  cancelMustDoReminder(id);
}

// --- Roadmap & Milestone Actions ---

export function toggleMilestone(milestoneId) {
  const current = state.milestones[milestoneId];
  const isDone = current ? !current.done : true;
  const today = getLocalDateString();

  state.milestones[milestoneId] = {
    done: isDone,
    doneAt: isDone ? today : null,
    note: current?.note || ''
  };

  saveState();
  return isDone;
}

export function isMilestoneDone(milestoneId) {
  return Boolean(state.milestones[milestoneId]?.done);
}

export function getMilestoneDoneAt(milestoneId) {
  return state.milestones[milestoneId]?.doneAt || null;
}

// --- Spaced Repetition Actions ---

/**
 * Records a spaced repetition rating:
 * - 'lost': due tomorrow (+1 day)
 * - 'okay': due in 3 days (+3 days)
 * - 'solid': due in 7 days (+7 days)
 */
export function recordReviewRating({ milestoneId, topicTitle, phaseId, rating }) {
  const today = getLocalDateString();
  let daysToAdd = 1;
  if (rating === 'okay') daysToAdd = 3;
  if (rating === 'solid') daysToAdd = 7;

  const nextDue = addLocalDays(today, daysToAdd);

  // Link to milestoneId or normalized topic ID
  const normalizedId = milestoneId || ('topic_' + topicTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'));

  const existingIndex = state.reviewQueue.findIndex(r => r.milestoneId === normalizedId);

  if (existingIndex >= 0) {
    state.reviewQueue[existingIndex].rating = rating;
    state.reviewQueue[existingIndex].dueDate = nextDue;
    state.reviewQueue[existingIndex].lastReviewedAt = today;
    state.reviewQueue[existingIndex].reviewsCount = (state.reviewQueue[existingIndex].reviewsCount || 0) + 1;
  } else {
    state.reviewQueue.push({
      id: generateId(),
      milestoneId: normalizedId,
      topicTitle: topicTitle || 'Study Review',
      phaseId: phaseId || 'phase-1',
      rating,
      dueDate: nextDue,
      reviewsCount: 1,
      lastReviewedAt: today
    });
  }

  saveState();
}

// --- Deep Work Sessions ---

export function addCompletedSession({ durationMinutes, mode, missionTitle, phaseId, rating = null, buildNote = null }) {
  const today = getLocalDateString();
  const session = {
    id: generateId(),
    date: today,
    timestamp: Date.now(),
    durationMinutes: Number(durationMinutes) || 50,
    mode: mode || 'study',
    missionTitle: missionTitle || 'Deep Work Session',
    phaseId: phaseId || 'phase-1',
    rating,
    buildNote
  };

  state.sessions.unshift(session);
  saveState();
  return session;
}

// --- Active Timer Controls (Local only) ---

export function startTimer({ durationMinutes, mode, missionId, missionTitle, phaseId }) {
  const mins = durationMinutes || activeTimer.durationMinutes || 50;
  const durationMs = mins * 60 * 1000;

  activeTimer.running = true;
  activeTimer.paused = false;
  activeTimer.mode = mode || activeTimer.mode || 'study';
  activeTimer.durationMinutes = mins;
  activeTimer.remainingMs = durationMs;
  activeTimer.endTimestamp = Date.now() + durationMs;
  if (missionId) activeTimer.missionId = missionId;
  if (missionTitle) activeTimer.missionTitle = missionTitle;
  if (phaseId) activeTimer.phaseId = phaseId;

  saveActiveTimer();
}

export function pauseTimer() {
  if (!activeTimer.running || activeTimer.paused) return;
  // Calculate remaining time precisely
  if (activeTimer.endTimestamp) {
    activeTimer.remainingMs = Math.max(0, activeTimer.endTimestamp - Date.now());
  }
  activeTimer.endTimestamp = null;
  activeTimer.paused = true;
  saveActiveTimer();
}

export function resumeTimer() {
  if (!activeTimer.running || !activeTimer.paused) return;
  activeTimer.endTimestamp = Date.now() + activeTimer.remainingMs;
  activeTimer.paused = false;
  saveActiveTimer();
}

export function resetTimer() {
  activeTimer.running = false;
  activeTimer.paused = false;
  activeTimer.endTimestamp = null;
  activeTimer.remainingMs = activeTimer.durationMinutes * 60 * 1000;
  saveActiveTimer();
}

export function setTimerConfig({ durationMinutes, mode, missionTitle, missionId, phaseId }) {
  if (durationMinutes) {
    activeTimer.durationMinutes = durationMinutes;
    activeTimer.remainingMs = durationMinutes * 60 * 1000;
  }
  if (mode) activeTimer.mode = mode;
  if (missionTitle) activeTimer.missionTitle = missionTitle;
  if (missionId) activeTimer.missionId = missionId;
  if (phaseId) activeTimer.phaseId = phaseId;
  saveActiveTimer();
}

// --- Commander Pick & Mission Switcher ---

export function setCommanderEnergyAndTime(energy, minutes) {
  if (energy) state.commander.energy = energy;
  if (minutes) state.commander.availableMinutes = minutes;
  saveState();
}

export function setCommanderDomain(domain) {
  state.commander.activeFocusDomain = domain;
  state.commander.skippedIds = [];
  saveState();
}

export function skipCurrentMission(currentMissionId) {
  if (currentMissionId && !state.commander.skippedIds.includes(currentMissionId)) {
    state.commander.skippedIds.push(currentMissionId);
  }
  saveState();
}

/**
 * Intelligent Mission Selector
 * Picks the most relevant next mission based on exam mode, energy, time, and current roadmap progress
 */
export function getRecommendedMission() {
  // 1. If Exam Mode is toggled on, prioritize Uni Exam revision
  if (state.settings.examMode) {
    const unskippedExam = EXAM_MISSIONS.filter(m => !state.commander.skippedIds.includes(m.id));
    return unskippedExam[0] || EXAM_MISSIONS[0];
  }

  const domain = state.commander.activeFocusDomain || 'roadmap';

  if (domain === 'leetcode') {
    const unskipped = LEETCODE_MISSIONS.filter(m => !state.commander.skippedIds.includes(m.id));
    return unskipped[0] || LEETCODE_MISSIONS[0];
  }

  if (domain === 'sales') {
    const unskipped = SALES_MISSIONS.filter(m => !state.commander.skippedIds.includes(m.id));
    return unskipped[0] || SALES_MISSIONS[0];
  }

  if (domain === 'reading') {
    const unskipped = READING_MISSIONS.filter(m => !state.commander.skippedIds.includes(m.id));
    return unskipped[0] || READING_MISSIONS[0];
  }

  // Check Spaced Repetition Review Queue first if any items are due today
  const reviewDue = getSpacedReviewDue();
  if (reviewDue.length > 0 && domain === 'review') {
    const rev = reviewDue[0];
    return {
      id: rev.id,
      milestoneId: rev.milestoneId,
      title: `Spaced Review: ${rev.topicTitle}`,
      goal: `Active recall test on ${rev.topicTitle}. Rate your recall honestly to schedule the next repetition interval.`,
      minutes: 25,
      type: 'review',
      phaseId: rev.phaseId,
      isReviewItem: true
    };
  }

  // Default: Find the first uncompleted milestone in the roadmap
  for (const phase of ROADMAP_PHASES) {
    for (const milestone of phase.milestones) {
      if (!isMilestoneDone(milestone.id)) {
        // Find first sub-mission not skipped
        const sub = milestone.subMissions.find(s => !state.commander.skippedIds.includes(s.id)) || milestone.subMissions[0];
        return {
          id: sub.id,
          milestoneId: milestone.id,
          phaseId: phase.id,
          phaseNumber: phase.number,
          phaseTitle: phase.title,
          title: sub.title,
          goal: sub.goal,
          minutes: sub.minutes || 50,
          type: sub.type || 'study',
          resource: sub.resource || null
        };
      }
    }
  }

  // All roadmap completed fallback
  return {
    id: 'lc-fallback',
    title: 'LeetCode Problem Challenge',
    goal: 'Solve a Medium Two Pointers or Sliding Window challenge on NeetCode.',
    minutes: 50,
    type: 'study'
  };
}

// --- Finances ---

export function addTransaction({ type, amount, currency, category, description, date }) {
  const num = Math.abs(Number(amount));
  if (isNaN(num) || num <= 0) return null;

  const item = {
    id: generateId(),
    type: type === 'income' ? 'income' : 'expense',
    amount: num,
    currency: currency === 'LBP' ? 'LBP' : 'USD',
    category: category || 'Other',
    description: (description || '').trim(),
    date: date || getLocalDateString(),
    timestamp: Date.now()
  };

  state.finances.transactions.unshift(item);
  saveState();
  return item;
}

export function deleteTransaction(id) {
  state.finances.transactions = state.finances.transactions.filter(t => t.id !== id);
  saveState();
}

// --- Export & Import ---

export function exportBackupData() {
  const data = {
    ...state,
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifeos_backup_${getLocalDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure');
    state = {
      ...createInitialState(),
      ...parsed
    };
    saveState();
    return { success: true };
  } catch (err) {
    console.error('Import failed:', err);
    return { success: false, error: err.message };
  }
}
