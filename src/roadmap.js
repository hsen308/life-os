/**
 * The Roadmap — Software Engineering Mastery Path
 * Clean Apple Human Interface Guidelines (HIG) Design System
 * 
 * Features:
 * - 6 Phases starting strictly at 0%
 * - Milestone completion tracking with doneAt: 'YYYY-MM-DD'
 * - Weekly Summary view with progress deltas, focus hours, and review queue
 * - Granular sub-missions with documentation links and 1-click Deep Work launch
 * - Zero emojis, clean typography and SVG iconography
 */

import { ROADMAP_PHASES } from './missions.js';
import {
  getState,
  toggleMilestone,
  isMilestoneDone,
  getMilestoneDoneAt,
  getWeeklySummary,
  startTimer
} from './store.js';
import { formatDisplayDate } from './dateUtils.js';

export function renderRoadmap(container, onNavigateToDeepWork) {
  const state = getState();

  container.innerHTML = `
    <div class="roadmap-cockpit">
      
      <!-- Top Overview Bar -->
      <div class="roadmap-header-card glass-panel">
        <div class="header-info">
          <div class="apple-eyebrow">Engineering Curriculum</div>
          <h2 class="cockpit-title">Full-Stack to Autonomous AI Systems</h2>
          <p class="roadmap-tagline">Milestone-driven technical mastery with production deployments.</p>
        </div>

        <button id="open-weekly-summary-btn" class="apple-summary-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          <span>Weekly Report</span>
        </button>
      </div>

      <!-- Phases List -->
      <div class="phases-container">
        ${ROADMAP_PHASES.map((phase) => renderPhaseCard(phase, state)).join('')}
      </div>

    </div>

    <!-- Weekly Summary Modal -->
    <div id="weekly-summary-modal" class="modal-overlay hidden">
      <div class="modal-card weekly-summary-card">
        <div class="modal-header">
          <div class="summary-modal-title-wrap">
            <span class="apple-eyebrow">Rolling 7-Day Performance</span>
            <h3>Weekly Engineering Summary</h3>
          </div>
          <button class="close-modal-btn" id="close-weekly-summary-modal" aria-label="Close">&times;</button>
        </div>

        <div id="weekly-summary-modal-body" class="summary-modal-body">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
  `;

  attachRoadmapEvents(container, onNavigateToDeepWork);
}

function renderPhaseCard(phase, state) {
  const totalMilestones = phase.milestones.length;
  let doneCount = 0;

  phase.milestones.forEach(m => {
    if (isMilestoneDone(m.id)) doneCount++;
  });

  const progressPercent = totalMilestones > 0 ? Math.round((doneCount / totalMilestones) * 100) : 0;

  return `
    <section class="phase-card glass-panel" data-phase-id="${phase.id}">
      <div class="phase-card-header">
        <div class="phase-meta">
          <span class="phase-num-badge">Phase ${phase.number}</span>
          <span class="phase-dur-tag">${phase.duration}</span>
        </div>
        <div class="phase-progress-pill">${progressPercent}% (${doneCount}/${totalMilestones})</div>
      </div>

      <h3 class="phase-title">${phase.title}</h3>
      <p class="phase-goal"><strong>Target Outcome:</strong> ${phase.primaryGoal}</p>

      <!-- Documentation & Resource Links -->
      <div class="phase-links-row">
        <span class="links-label">Core References:</span>
        ${phase.docLinks.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="phase-resource-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chip-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            <span>${link.name}</span>
          </a>
        `).join('')}
      </div>

      <!-- Visual Progress Bar (Starts strictly at 0%) -->
      <div class="phase-progress-bar-wrap">
        <div class="phase-progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <!-- Milestones List -->
      <div class="milestones-list">
        ${phase.milestones.map((m) => renderMilestoneItem(m, phase)).join('')}
      </div>
    </section>
  `;
}

function renderMilestoneItem(milestone, phase) {
  const done = isMilestoneDone(milestone.id);
  const doneAt = getMilestoneDoneAt(milestone.id);

  return `
    <div class="milestone-block ${done ? 'milestone-done' : ''}" data-milestone-id="${milestone.id}">
      <div class="milestone-main-row">
        <label class="milestone-checkbox-wrap">
          <input type="checkbox" class="milestone-check" data-id="${milestone.id}" ${done ? 'checked' : ''} />
          <span class="custom-checkbox"></span>
        </label>

        <div class="milestone-info">
          <div class="milestone-title-line">
            <span class="milestone-title ${done ? 'strikethrough' : ''}">${escapeHtml(milestone.title)}</span>
            ${done && doneAt ? `
              <span class="done-at-tag">Completed ${formatDisplayDate(doneAt)}</span>
            ` : ''}
          </div>
          <p class="milestone-desc">${escapeHtml(milestone.desc)}</p>
        </div>
      </div>

      <!-- Granular Sub-Missions -->
      <div class="sub-missions-tray">
        <div class="sub-missions-header">Target Work Blocks (${milestone.subMissions.length}):</div>
        <div class="sub-missions-grid">
          ${milestone.subMissions.map((sub) => `
            <div class="sub-mission-item">
              <div class="sub-mission-header">
                <span class="sub-type-badge ${sub.type}">${sub.type === 'build' ? 'BUILD' : 'STUDY'}</span>
                <span class="sub-duration">${sub.minutes}m</span>
              </div>
              <div class="sub-mission-name">${escapeHtml(sub.title)}</div>
              <div class="sub-mission-goal">${escapeHtml(sub.goal)}</div>
              
              <div class="sub-mission-actions">
                ${sub.resource ? `
                  <a href="${sub.resource}" target="_blank" rel="noopener noreferrer" class="sub-doc-btn" title="Open documentation">
                    Docs
                  </a>
                ` : ''}
                <button class="launch-sub-mission-btn" 
                  data-sub-id="${sub.id}"
                  data-milestone-id="${milestone.id}"
                  data-phase-id="${phase.id}"
                  data-title="${escapeHtml(sub.title)}"
                  data-type="${sub.type}"
                  data-minutes="${sub.minutes}">
                  Focus
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function attachRoadmapEvents(container, onNavigateToDeepWork) {
  // Milestone check/uncheck
  container.querySelectorAll('.milestone-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.getAttribute('data-id');
      toggleMilestone(id);
      renderRoadmap(container, onNavigateToDeepWork);
    });
  });

  // Launch sub-mission into deep work
  container.querySelectorAll('.launch-sub-mission-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const missionId = btn.getAttribute('data-sub-id');
      const missionTitle = btn.getAttribute('data-title');
      const phaseId = btn.getAttribute('data-phase-id');
      const mode = btn.getAttribute('data-type') || 'study';
      const durationMinutes = Number(btn.getAttribute('data-minutes')) || 50;

      startTimer({
        durationMinutes,
        mode,
        missionId,
        missionTitle,
        phaseId
      });

      if (onNavigateToDeepWork) {
        onNavigateToDeepWork();
      }
    });
  });

  // Weekly Summary Modal
  const openSummaryBtn = container.querySelector('#open-weekly-summary-btn');
  const summaryModal = container.querySelector('#weekly-summary-modal');
  const closeSummaryBtn = container.querySelector('#close-weekly-summary-modal');
  const summaryBody = container.querySelector('#weekly-summary-modal-body');

  if (openSummaryBtn && summaryModal && summaryBody) {
    openSummaryBtn.addEventListener('click', () => {
      const summary = getWeeklySummary();
      summaryBody.innerHTML = `
        <div class="summary-stats-grid">
          <div class="summary-stat-box">
            <span class="stat-big-val">${summary.totalHours}h</span>
            <span class="stat-label">Focus Logged</span>
          </div>
          <div class="summary-stat-box">
            <span class="stat-big-val">${summary.sessionCount}</span>
            <span class="stat-label">Blocks Completed</span>
          </div>
          <div class="summary-stat-box ${summary.lostCount > 0 ? 'alert-box' : ''}">
            <span class="stat-big-val">${summary.lostCount}</span>
            <span class="stat-label">Review Topics</span>
          </div>
        </div>

        <div class="summary-section">
          <h4>Roadmap Progress Delta (Last 7 Days)</h4>
          <p class="summary-hint">Direct milestone progress achieved over the rolling 7-day period:</p>
          <div class="phase-deltas-list">
            ${summary.phaseProgress.map(p => `
              <div class="phase-delta-row">
                <div class="phase-delta-name">Phase ${p.number}: ${p.title}</div>
                <div class="phase-delta-badge">
                  <span class="past-pct">${p.pastPct}%</span>
                  <span class="arrow">&rarr;</span>
                  <span class="current-pct">${p.currentPct}%</span>
                  ${p.delta > 0 ? `
                    <span class="positive-delta">+${p.delta}% this week</span>
                  ` : `
                    <span class="neutral-delta">No change</span>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${summary.lostCount > 0 ? `
          <div class="summary-section">
            <h4>Topics Queued for Spaced Review</h4>
            <div class="lost-topics-list">
              ${summary.lostSessions.map(s => `
                <div class="lost-topic-item">
                  <span class="lost-topic-title">${escapeHtml(s.missionTitle)}</span>
                  <span class="lost-topic-date">${formatDisplayDate(s.date)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="summary-section good-news-box">
            <span>No topics marked for retention review this week.</span>
          </div>
        `}
      `;

      summaryModal.classList.remove('hidden');
    });

    closeSummaryBtn.addEventListener('click', () => {
      summaryModal.classList.add('hidden');
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
