/**
 * The Commander — LifeOS Executive Coach & Command Center
 * Clean Apple Human Interface Guidelines (HIG) Design System
 * 
 * Features:
 * - Refined typographic coaching directives
 * - Apple-style segmented domain navigation
 * - Precision SVG iconography (zero emojis)
 * - Single actionable mission card with fluid Skip / Swap
 * - Overdue rollover task management with future scheduling
 */

import {
  getState,
  getStreakAndGrace,
  getMustDoCategorized,
  getRecommendedMission,
  getSpacedReviewDue,
  addMustDo,
  toggleMustDo,
  deleteMustDo,
  setCommanderEnergyAndTime,
  setCommanderDomain,
  skipCurrentMission,
  toggleExamMode,
  startTimer
} from './store.js';
import { getLocalDateString, addLocalDays, formatDisplayDate } from './dateUtils.js';

export function renderCommander(container, onNavigateToDeepWork) {
  const state = getState();
  const streakInfo = getStreakAndGrace();
  const mustDo = getMustDoCategorized();
  const reviewDue = getSpacedReviewDue();
  const recommendedMission = getRecommendedMission();

  // Dynamic coaching greeting
  const hour = new Date().getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else if (hour >= 22 || hour < 5) timeOfDay = 'night';

  let coachNote = '';
  if (state.settings.examMode) {
    coachNote = 'Exam Mode active. Cognitive capacity prioritized for academic finals and core theory.';
  } else if (timeOfDay === 'night') {
    coachNote = 'Late night flow. Lock into a single high-yield objective without multitasking.';
  } else if (streakInfo.focusMinutesToday >= 100) {
    coachNote = 'High execution velocity today. Solidify current progress or document key takeaways.';
  } else {
    coachNote = 'Momentum begins with single-task commitment. Execute your recommended objective below.';
  }

  const overdueCount = mustDo.overdue.length;
  const isExam = state.settings.examMode;

  container.innerHTML = `
    <div class="commander-cockpit">
      
      <!-- Top Coaching Header -->
      <section class="cockpit-coach-card glass-panel">
        <div class="coach-header-row">
          <div>
            <div class="apple-eyebrow">Executive Directive</div>
            <h2 class="cockpit-title">Good ${timeOfDay}, ${state.user.name || 'Hussein'}</h2>
          </div>
          
          <div class="coach-stats-cluster">
            <div class="stat-pill streak-pill" title="5-of-7 days streak with grace protection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pill-svg"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span class="stat-val">${streakInfo.streak} Days</span>
              <span class="shield-badge" title="Grace shields remaining">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ${streakInfo.graceShieldsRemaining}/2
              </span>
            </div>
            
            <div class="stat-pill focus-pill" title="Total focus minutes logged today">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pill-svg"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="stat-val">${streakInfo.focusMinutesToday}m</span>
              <span class="stat-sub">today</span>
            </div>
          </div>
        </div>

        <p class="coach-directive">${coachNote}</p>

        <!-- Exam Mode Toggle Card -->
        <div class="exam-mode-banner ${isExam ? 'active' : ''}">
          <div class="exam-banner-left">
            <div class="exam-icon-plate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div>
              <div class="exam-banner-title">${isExam ? 'Academic Exam Mode Active' : 'Software Engineering Track'}</div>
              <div class="exam-banner-sub">${isExam ? 'Missions aligned with University computer science curriculum' : 'Roadmap, technical problems, and client engineering'}</div>
            </div>
          </div>
          <button id="toggle-exam-mode-btn" class="toggle-exam-btn ${isExam ? 'active' : ''}">
            ${isExam ? 'Deactivate' : 'Activate Exam Mode'}
          </button>
        </div>
      </section>

      <!-- Apple Segmented Track Selector -->
      <section class="energy-domain-bar glass-panel">
        <div class="selector-group">
          <label class="group-label">Focus Track</label>
          <div class="apple-segmented-control" id="domain-pill-group">
            <button class="seg-item ${state.commander.activeFocusDomain === 'roadmap' ? 'active' : ''}" data-domain="roadmap">
              Roadmap
            </button>
            <button class="seg-item ${state.commander.activeFocusDomain === 'leetcode' ? 'active' : ''}" data-domain="leetcode">
              LeetCode
            </button>
            <button class="seg-item ${state.commander.activeFocusDomain === 'sales' ? 'active' : ''}" data-domain="sales">
              Client Engineering
            </button>
            <button class="seg-item ${state.commander.activeFocusDomain === 'reading' ? 'active' : ''}" data-domain="reading">
              Architecture
            </button>
            ${reviewDue.length > 0 ? `
              <button class="seg-item urgent-seg ${state.commander.activeFocusDomain === 'review' ? 'active' : ''}" data-domain="review">
                Review (${reviewDue.length})
              </button>
            ` : ''}
          </div>
        </div>

        <div class="selector-row">
          <div class="selector-group">
            <label class="group-label">Energy Level</label>
            <div class="apple-segmented-control mini" id="energy-pill-group">
              <button class="seg-item ${state.commander.energy === 'low' ? 'active' : ''}" data-energy="low">Low</button>
              <button class="seg-item ${state.commander.energy === 'med' ? 'active' : ''}" data-energy="med">Medium</button>
              <button class="seg-item ${state.commander.energy === 'high' ? 'active' : ''}" data-energy="high">High</button>
            </div>
          </div>

          <div class="selector-group">
            <label class="group-label">Session Duration</label>
            <div class="apple-segmented-control mini" id="time-pill-group">
              <button class="seg-item ${state.commander.availableMinutes === 25 ? 'active' : ''}" data-time="25">25 min</button>
              <button class="seg-item ${state.commander.availableMinutes === 50 ? 'active' : ''}" data-time="50">50 min</button>
              <button class="seg-item ${state.commander.availableMinutes === 90 ? 'active' : ''}" data-time="90">90 min</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Recommended Mission Card -->
      <section class="current-mission-card glass-panel" id="mission-card-view">
        <div class="mission-top-row">
          <div class="mission-badges">
            <span class="mission-type-tag ${recommendedMission.type || 'study'}">
              ${recommendedMission.type === 'build' ? 'BUILD' : recommendedMission.type === 'review' ? 'REVIEW' : 'STUDY'}
            </span>
            ${recommendedMission.phaseTitle ? `<span class="mission-phase-tag">Phase ${recommendedMission.phaseNumber}</span>` : ''}
            ${recommendedMission.difficulty ? `<span class="mission-diff-tag">${recommendedMission.difficulty}</span>` : ''}
            ${recommendedMission.tag ? `<span class="mission-custom-tag">${recommendedMission.tag}</span>` : ''}
          </div>
          <span class="mission-duration-badge">${recommendedMission.minutes || state.commander.availableMinutes || 50} min</span>
        </div>

        <h3 class="mission-headline">${recommendedMission.title}</h3>
        <p class="mission-objective">${recommendedMission.goal}</p>

        ${recommendedMission.resource ? `
          <div class="mission-doc-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="link-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            <a href="${recommendedMission.resource}" target="_blank" rel="noopener noreferrer">Reference Documentation</a>
          </div>
        ` : ''}

        <div class="mission-action-row">
          <button id="start-mission-btn" class="apple-primary-btn" data-mission-id="${recommendedMission.id}">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-svg"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Start Deep Work (${recommendedMission.minutes || 50}m)</span>
          </button>
          
          <button id="skip-mission-btn" class="apple-secondary-btn" data-mission-id="${recommendedMission.id}" title="Select alternate mission">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Alternate</span>
          </button>
        </div>
      </section>

      <!-- Must Do Today List with Overdue Rollover -->
      <section class="must-do-section glass-panel">
        <div class="must-do-header">
          <div class="must-do-title-area">
            <h3 class="section-title">Critical Commitments</h3>
            <span class="must-do-subtitle">Unfinished tasks automatically roll over. Overdue items persist until completed.</span>
          </div>
          ${overdueCount > 0 ? `
            <span class="apple-alert-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              ${overdueCount} Overdue
            </span>
          ` : ''}
        </div>

        <!-- Overdue Tasks (Rolled Over) -->
        ${overdueCount > 0 ? `
          <div class="overdue-box">
            <div class="overdue-box-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              <span>Overdue Items (Rolled Over)</span>
            </div>
            <div class="must-do-list overdue-items">
              ${mustDo.overdue.map(item => renderMustDoItem(item, true)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Due Today -->
        <div class="today-must-do-group">
          <div class="subgroup-title">Due Today (${mustDo.todayItems.length})</div>
          <div class="must-do-list" id="today-must-do-list">
            ${mustDo.todayItems.length > 0 ? mustDo.todayItems.map(item => renderMustDoItem(item, false)).join('') : `
              <div class="empty-state-notice">All critical tasks completed. Primary focus is Deep Work.</div>
            `}
          </div>
        </div>

        <!-- Add Must Do Input Form -->
        <form id="add-must-do-form" class="must-do-input-form">
          <div class="input-line-main">
            <input type="text" id="must-do-text" placeholder="Add urgent exam, client delivery, or sales task..." required />
            <select id="must-do-category" class="apple-select">
              <option value="urgent">Urgent</option>
              <option value="deadline">Client Deadline</option>
              <option value="exam">University Exam</option>
              <option value="sales">Sales Call</option>
            </select>
          </div>
          
          <div class="input-line-sub">
            <div class="date-selector-row">
              <label class="inline-label">Due Date:</label>
              <select id="must-do-date-preset" class="apple-select">
                <option value="today">Today (${formatDisplayDate(getLocalDateString())})</option>
                <option value="tomorrow">Tomorrow (${formatDisplayDate(addLocalDays(getLocalDateString(), 1))})</option>
                <option value="custom">Specific Date...</option>
              </select>
              <input type="date" id="must-do-custom-date" class="hidden apple-input" value="${getLocalDateString()}" min="${getLocalDateString()}" />
              <input type="time" id="must-do-time" class="apple-input" title="Optional due time for 1-hour prior alert" style="max-width: 105px;" />
            </div>

            <button type="submit" class="apple-submit-btn">
              <span>Add Task</span>
            </button>
          </div>
        </form>

        <!-- Scheduled Future Items -->
        ${mustDo.upcoming.length > 0 ? `
          <details class="upcoming-details">
            <summary class="upcoming-summary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="summary-caret"><polyline points="9 18 15 12 9 6"/></svg>
              <span>Upcoming Scheduled Commitments (${mustDo.upcoming.length})</span>
            </summary>
            <div class="must-do-list upcoming-items">
              ${mustDo.upcoming.map(item => renderMustDoItem(item, false, true)).join('')}
            </div>
          </details>
        ` : ''}

        <!-- Completed Today -->
        ${mustDo.completedToday.length > 0 ? `
          <div class="completed-today-group">
            <div class="subgroup-title muted-title">Completed Today (${mustDo.completedToday.length})</div>
            <div class="must-do-list completed-items">
              ${mustDo.completedToday.map(item => renderMustDoItem(item, false, false, true)).join('')}
            </div>
          </div>
        ` : ''}
      </section>

    </div>
  `;

  attachCommanderEvents(container, recommendedMission, onNavigateToDeepWork);
}

function renderMustDoItem(item, isOverdueItem = false, isFutureItem = false, isCompleted = false) {
  const categoryLabels = {
    exam: '<span class="cat-tag tag-exam">Exam</span>',
    deadline: '<span class="cat-tag tag-deadline">Client</span>',
    sales: '<span class="cat-tag tag-sales">Sales</span>',
    urgent: '<span class="cat-tag tag-urgent">Urgent</span>'
  };

  return `
    <div class="must-do-item ${isOverdueItem ? 'item-overdue' : ''} ${isCompleted ? 'item-done' : ''}" data-id="${item.id}">
      <label class="must-do-checkbox-wrap">
        <input type="checkbox" class="must-do-check" data-id="${item.id}" ${isCompleted ? 'checked' : ''} />
        <span class="custom-checkbox"></span>
      </label>

      <div class="must-do-content">
        <span class="must-do-text ${isCompleted ? 'strikethrough' : ''}">${escapeHtml(item.text)}</span>
        <div class="must-do-meta">
          ${categoryLabels[item.category] || categoryLabels.urgent}
          ${item.dueTime ? `<span class="due-time-tag">${item.dueTime}</span>` : ''}
          ${isOverdueItem ? `
            <span class="due-warning-tag">Overdue (${formatDisplayDate(item.dueDate)})</span>
          ` : isFutureItem ? `
            <span class="due-future-tag">Due ${formatDisplayDate(item.dueDate)}</span>
          ` : `
            <span class="due-today-tag">Due Today</span>
          `}
        </div>
      </div>

      <button class="delete-must-do-btn" data-id="${item.id}" title="Remove item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trash-icon"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
      </button>
    </div>
  `;
}

function attachCommanderEvents(container, recommendedMission, onNavigateToDeepWork) {
  // Exam Mode Toggle
  const examBtn = container.querySelector('#toggle-exam-mode-btn');
  if (examBtn) {
    examBtn.addEventListener('click', () => {
      toggleExamMode();
      renderCommander(container, onNavigateToDeepWork);
    });
  }

  // Segmented Domain Selector
  container.querySelectorAll('#domain-pill-group .seg-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const domain = btn.getAttribute('data-domain');
      setCommanderDomain(domain);
      renderCommander(container, onNavigateToDeepWork);
    });
  });

  // Energy & Duration segmented controls
  container.querySelectorAll('#energy-pill-group .seg-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const energy = btn.getAttribute('data-energy');
      setCommanderEnergyAndTime(energy, null);
      renderCommander(container, onNavigateToDeepWork);
    });
  });

  container.querySelectorAll('#time-pill-group .seg-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = Number(btn.getAttribute('data-time'));
      setCommanderEnergyAndTime(null, mins);
      renderCommander(container, onNavigateToDeepWork);
    });
  });

  // Start Deep Work Button
  const startBtn = container.querySelector('#start-mission-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const mission = recommendedMission;
      startTimer({
        durationMinutes: mission.minutes || 50,
        mode: mission.type || 'study',
        missionId: mission.id,
        missionTitle: mission.title,
        phaseId: mission.phaseId || 'phase-1'
      });
      if (onNavigateToDeepWork) {
        onNavigateToDeepWork();
      }
    });
  }

  // Skip / Swap Alternate Mission Button
  const skipBtn = container.querySelector('#skip-mission-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      skipCurrentMission(recommendedMission.id);
      renderCommander(container, onNavigateToDeepWork);
    });
  }

  // Must Do Checkbox toggle
  container.querySelectorAll('.must-do-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.getAttribute('data-id');
      toggleMustDo(id);
      renderCommander(container, onNavigateToDeepWork);
    });
  });

  // Delete Must Do
  container.querySelectorAll('.delete-must-do-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteMustDo(id);
      renderCommander(container, onNavigateToDeepWork);
    });
  });

  // Add Must Do Form
  const addForm = container.querySelector('#add-must-do-form');
  const datePreset = container.querySelector('#must-do-date-preset');
  const customDateInput = container.querySelector('#must-do-custom-date');

  if (datePreset && customDateInput) {
    datePreset.addEventListener('change', () => {
      if (datePreset.value === 'custom') {
        customDateInput.classList.remove('hidden');
      } else {
        customDateInput.classList.add('hidden');
      }
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textInput = container.querySelector('#must-do-text');
      const catSelect = container.querySelector('#must-do-category');
      const text = textInput ? textInput.value.trim() : '';
      const category = catSelect ? catSelect.value : 'urgent';

      let dueDate = getLocalDateString();
      if (datePreset && datePreset.value === 'tomorrow') {
        dueDate = addLocalDays(dueDate, 1);
      } else if (datePreset && datePreset.value === 'custom' && customDateInput && customDateInput.value) {
        dueDate = customDateInput.value;
      }

      const timeInput = container.querySelector('#must-do-time');
      const dueTime = timeInput && timeInput.value ? timeInput.value : null;

      if (text) {
        addMustDo({ text, category, dueDate, dueTime });
        renderCommander(container, onNavigateToDeepWork);
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
