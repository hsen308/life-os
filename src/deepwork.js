/**
 * Deep Work Module for LifeOS
 * Clean Apple Human Interface Guidelines (HIG) Design System
 * 
 * Features:
 * - Study, Build, and Review modes
 * - Precision timestamp timer with pause/resume math
 * - Screen WakeLock with visibilitychange handling
 * - Multi-layer alerts (vibration, synthesizer chord, notification)
 * - Apple-style post-session rating modal (zero emojis)
 */

import {
  getActiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  setTimerConfig,
  addCompletedSession,
  recordReviewRating
} from './store.js';
import { fireSessionCompleteAlert } from './audioAlert.js';
import { scheduleFocusTimerNotification, cancelFocusTimerNotification } from './notificationHooks.js';
import confetti from 'canvas-confetti';

let wakeLockSentinel = null;
let timerTicker = null;

// Re-request wake lock when returning to tab
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    const timer = getActiveTimer();
    if (document.visibilityState === 'visible' && timer.running && !timer.paused) {
      await requestWakeLock();
    }
  });
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && (!wakeLockSentinel || wakeLockSentinel.released)) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock acquired.');
      wakeLockSentinel.addEventListener('release', () => {
        console.log('Screen Wake Lock released.');
      });
    }
  } catch (err) {
    console.warn('Wake Lock request skipped:', err);
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (e) {}
}

export function renderDeepWork(container) {
  const timer = getActiveTimer();

  // If timer is running and has endTimestamp, check if already finished
  if (timer.running && !timer.paused && timer.endTimestamp) {
    const now = Date.now();
    if (now >= timer.endTimestamp) {
      handleSessionFinished(container);
      return;
    }
  }

  const currentRemaining = getDisplayRemainingMs(timer);
  const totalDurationMs = (timer.durationMinutes || 50) * 60 * 1000;
  const progressRatio = Math.max(0, Math.min(1, 1 - (currentRemaining / totalDurationMs)));
  const formattedTime = formatTimeMs(currentRemaining);

  container.innerHTML = `
    <div class="deepwork-cockpit">
      
      <!-- Apple Mode Selection Bar -->
      <div class="deepwork-mode-bar glass-panel">
        <button class="deepwork-mode-btn ${timer.mode === 'study' ? 'active' : ''}" data-mode="study" ${timer.running ? 'disabled' : ''}>
          <div class="mode-icon-plate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div class="mode-text">
            <span class="mode-title">Study & Theory</span>
            <span class="mode-desc">Documentation & recall tests</span>
          </div>
        </button>

        <button class="deepwork-mode-btn ${timer.mode === 'build' ? 'active' : ''}" data-mode="build" ${timer.running ? 'disabled' : ''}>
          <div class="mode-icon-plate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="mode-text">
            <span class="mode-title">Build & Ship</span>
            <span class="mode-desc">Implementation & real commits</span>
          </div>
        </button>

        <button class="deepwork-mode-btn ${timer.mode === 'review' ? 'active' : ''}" data-mode="review" ${timer.running ? 'disabled' : ''}>
          <div class="mode-icon-plate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="mode-text">
            <span class="mode-title">Spaced Review</span>
            <span class="mode-desc">Reinforce retention intervals</span>
          </div>
        </button>
      </div>

      <!-- Current Objective Header -->
      <div class="timer-target-card glass-panel">
        <div class="apple-eyebrow">Session Target</div>
        <h2 class="target-title" id="timer-mission-title">${escapeHtml(timer.missionTitle || 'Focused Engineering Block')}</h2>
        
        <div class="duration-quick-picks ${timer.running ? 'hidden' : ''}">
          <button class="quick-dur-btn ${timer.durationMinutes === 25 ? 'active' : ''}" data-dur="25">25 min (Sprint)</button>
          <button class="quick-dur-btn ${timer.durationMinutes === 50 ? 'active' : ''}" data-dur="50">50 min (Standard)</button>
          <button class="quick-dur-btn ${timer.durationMinutes === 90 ? 'active' : ''}" data-dur="90">90 min (Deep Flow)</button>
        </div>
      </div>

      <!-- Large Circular Timer View -->
      <div class="timer-dial-container glass-panel">
        <div class="dial-wrapper">
          <svg class="dial-svg" viewBox="0 0 280 280">
            <circle class="dial-bg-track" cx="140" cy="140" r="120" stroke-width="8" />
            <circle class="dial-progress-track" cx="140" cy="140" r="120" stroke-width="8"
              stroke-dasharray="754"
              stroke-dashoffset="${754 * (1 - progressRatio)}" />
          </svg>

          <div class="dial-center-content">
            <div class="timer-display-digits" id="timer-digits">${formattedTime}</div>
            <div class="timer-status-caption">
              ${timer.running ? (timer.paused ? 'PAUSED' : 'FOCUS IN PROGRESS') : 'STANDBY'}
            </div>
          </div>
        </div>

        <!-- Controls Bar -->
        <div class="timer-control-row">
          ${!timer.running ? `
            <button id="deepwork-start-btn" class="apple-primary-btn start-btn-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" class="btn-svg"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Begin Session</span>
            </button>
          ` : timer.paused ? `
            <button id="deepwork-resume-btn" class="apple-primary-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" class="btn-svg"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Resume</span>
            </button>
            <button id="deepwork-reset-btn" class="apple-secondary-btn" title="Reset timer">
              <span>Reset</span>
            </button>
          ` : `
            <button id="deepwork-pause-btn" class="apple-secondary-btn pause-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" class="btn-svg"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              <span>Pause</span>
            </button>
            <button id="deepwork-finish-btn" class="apple-secondary-btn finish-early-btn" title="Complete session now">
              <span>Finish Early</span>
            </button>
          `}
        </div>

        <div class="wake-lock-status-indicator">
          <span class="status-pulse-dot ${timer.running && !timer.paused ? 'active' : ''}"></span>
          <span>${timer.running && !timer.paused ? 'Screen Wake Lock Active' : 'Wake Lock Standby'}</span>
        </div>
      </div>

    </div>

    <!-- Post-Session Reflection Modal -->
    <div id="session-reflection-modal" class="modal-overlay hidden">
      <div class="modal-card reflection-card">
        <div class="reflection-header">
          <div class="reflection-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3>Session Complete</h3>
          <p class="reflection-subtitle" id="reflection-sub-text">Record the outcome of this deep work block.</p>
        </div>

        <div id="reflection-body-content">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
  `;

  attachDeepWorkEvents(container);
  startVisualTimerTicker(container);
}

function getDisplayRemainingMs(timer) {
  if (!timer.running) {
    return timer.remainingMs || (timer.durationMinutes || 50) * 60 * 1000;
  }
  if (timer.paused) {
    return timer.remainingMs || 0;
  }
  if (timer.endTimestamp) {
    return Math.max(0, timer.endTimestamp - Date.now());
  }
  return timer.remainingMs || 0;
}

function formatTimeMs(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startVisualTimerTicker(container) {
  if (timerTicker) clearInterval(timerTicker);

  timerTicker = setInterval(() => {
    const timer = getActiveTimer();
    if (!timer.running || timer.paused) return;

    const remaining = getDisplayRemainingMs(timer);
    if (remaining <= 0) {
      clearInterval(timerTicker);
      handleSessionFinished(container);
      return;
    }

    const digits = container.querySelector('#timer-digits');
    if (digits) digits.textContent = formatTimeMs(remaining);

    const progressTrack = container.querySelector('.dial-progress-track');
    if (progressTrack) {
      const totalDurationMs = (timer.durationMinutes || 50) * 60 * 1000;
      const ratio = Math.max(0, Math.min(1, 1 - (remaining / totalDurationMs)));
      progressTrack.style.strokeDashoffset = String(754 * (1 - ratio));
    }
  }, 500);
}

function attachDeepWorkEvents(container) {
  // Mode selection
  container.querySelectorAll('.deepwork-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      setTimerConfig({ mode });
      renderDeepWork(container);
    });
  });

  // Duration quick picks
  container.querySelectorAll('.quick-dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dur = Number(btn.getAttribute('data-dur'));
      setTimerConfig({ durationMinutes: dur });
      renderDeepWork(container);
    });
  });

  // Start Button
  const startBtn = container.querySelector('#deepwork-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      startTimer({});
      await requestWakeLock();
      scheduleFocusTimerNotification(getActiveTimer());
      renderDeepWork(container);
    });
  }

  // Pause Button
  const pauseBtn = container.querySelector('#deepwork-pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', async () => {
      pauseTimer();
      await releaseWakeLock();
      cancelFocusTimerNotification();
      renderDeepWork(container);
    });
  }

  // Resume Button
  const resumeBtn = container.querySelector('#deepwork-resume-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', async () => {
      resumeTimer();
      await requestWakeLock();
      scheduleFocusTimerNotification(getActiveTimer());
      renderDeepWork(container);
    });
  }

  // Reset Button
  const resetBtn = container.querySelector('#deepwork-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      resetTimer();
      await releaseWakeLock();
      cancelFocusTimerNotification();
      renderDeepWork(container);
    });
  }

  // Finish Early Button
  const finishBtn = container.querySelector('#deepwork-finish-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      cancelFocusTimerNotification();
      handleSessionFinished(container);
    });
  }
}

function handleSessionFinished(container) {
  const timer = getActiveTimer();
  cancelFocusTimerNotification();
  resetTimer();
  releaseWakeLock();

  // Multi-layer alert (Notification, Vibration, Audio Synthesizer)
  fireSessionCompleteAlert(timer.missionTitle);

  // Subtle celebration
  try {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
  } catch (e) {}

  showPostSessionModal(container, timer);
}

function showPostSessionModal(container, timer) {
  const modal = container.querySelector('#session-reflection-modal');
  const body = container.querySelector('#reflection-body-content');
  if (!modal || !body) {
    renderDeepWork(container);
    return;
  }

  modal.classList.remove('hidden');

  if (timer.mode === 'build') {
    // Build mode reflection: ask what was built
    body.innerHTML = `
      <div class="build-reflection-form">
        <label class="reflection-label">What tangible code did you ship in this block?</label>
        <textarea id="build-note-input" class="build-note-textarea" rows="4" placeholder="Document completed components, commits, or technical breakthroughs..." autofocus></textarea>
        
        <button id="save-build-session-btn" class="apple-primary-btn" style="width: 100%; margin-top: 14px;">
          <span>Log Build Block</span>
        </button>
      </div>
    `;

    const saveBtn = body.querySelector('#save-build-session-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const noteInput = body.querySelector('#build-note-input');
        const note = noteInput ? noteInput.value.trim() : '';

        addCompletedSession({
          durationMinutes: timer.durationMinutes || 50,
          mode: 'build',
          missionTitle: timer.missionTitle,
          phaseId: timer.phaseId,
          buildNote: note
        });

        modal.classList.add('hidden');
        renderDeepWork(container);
      });
    }
  } else {
    // Study or Review mode reflection: ask for recall quality (Lost / Okay / Solid)
    body.innerHTML = `
      <div class="study-reflection-form">
        <div class="recall-prompt">Evaluate Active Recall Quality</div>
        <p class="recall-subtext">This calibrates the spaced repetition algorithm to schedule future reviews.</p>
        
        <div class="recall-rating-grid">
          <button class="recall-btn lost-btn" data-rating="lost">
            <span class="status-indicator-dot dot-red"></span>
            <div class="recall-info">
              <span class="rating-name">Low Retention (Lost)</span>
              <span class="rating-schedule">Review Scheduled Tomorrow (+1d)</span>
            </div>
          </button>

          <button class="recall-btn okay-btn" data-rating="okay">
            <span class="status-indicator-dot dot-amber"></span>
            <div class="recall-info">
              <span class="rating-name">Moderate Retention (Okay)</span>
              <span class="rating-schedule">Review Scheduled in 3 Days (+3d)</span>
            </div>
          </button>

          <button class="recall-btn solid-btn" data-rating="solid">
            <span class="status-indicator-dot dot-green"></span>
            <div class="recall-info">
              <span class="rating-name">Strong Retention (Solid)</span>
              <span class="rating-schedule">Review Scheduled in 7 Days (+7d)</span>
            </div>
          </button>
        </div>
      </div>
    `;

    body.querySelectorAll('.recall-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.getAttribute('data-rating');

        recordReviewRating({
          milestoneId: timer.missionId,
          topicTitle: timer.missionTitle,
          phaseId: timer.phaseId,
          rating
        });

        addCompletedSession({
          durationMinutes: timer.durationMinutes || 50,
          mode: timer.mode || 'study',
          missionTitle: timer.missionTitle,
          phaseId: timer.phaseId,
          rating
        });

        modal.classList.add('hidden');
        renderDeepWork(container);
      });
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
