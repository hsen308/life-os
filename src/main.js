/**
 * LifeOS Main Application Entry Point
 * 
 * Modular Architecture:
 * - commander.js: Executive coaching, dynamic mission card, Must Do list with overdue rollover
 * - deepwork.js: Timestamp-based timer, Study/Build/Review modes, WakeLock, multi-layer alerts
 * - roadmap.js: 6-phase engineering curriculum (starting at 0%), doneAt timestamps, weekly summary
 * - finance.js: Streamlined USD/LBP cashflow & transaction logging
 * - store.js: Central reactive store with local date consistency and cloud sync
 */

import { getState, subscribeStore, setUserNameAndMotto, setSettings, exportBackupData, importBackupData } from './store.js';
import { getLocalDateString, formatDisplayDate } from './dateUtils.js';
import { renderCommander } from './commander.js';
import { renderDeepWork } from './deepwork.js';
import { renderRoadmap } from './roadmap.js';
import { renderFinances } from './finance.js';
import { playChimeSound, triggerVibration, sendTimerNotification } from './audioAlert.js';
import {
  initSupabase,
  isSupabaseConfigured,
  saveCredentials,
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  pushDataToCloud
} from './supabase.js';
import {
  checkPushSupport,
  subscribeDeviceToPush,
  unsubscribeDeviceFromPush,
  getExistingSubscription,
  sendImmediateTestPush
} from './notifications.js';
import { syncAllScheduledNotifications } from './notificationHooks.js';

let notificationSyncTimeout = null;
function debouncedNotificationSync() {
  if (notificationSyncTimeout) clearTimeout(notificationSyncTimeout);
  notificationSyncTimeout = setTimeout(() => {
    syncAllScheduledNotifications(getState());
  }, 1500);
}

let currentView = 'commander';

// DOM Elements
const views = {
  commander: document.getElementById('view-commander'),
  deepwork: document.getElementById('view-deepwork'),
  roadmap: document.getElementById('view-roadmap'),
  finance: document.getElementById('view-finance')
};

function switchView(viewName) {
  if (!views[viewName]) return;
  currentView = viewName;

  // Update view panel classes
  Object.keys(views).forEach(key => {
    if (views[key]) {
      if (key === viewName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    }
  });

  // Update navigation items active state (desktop sidebar + mobile bottom nav)
  document.querySelectorAll('[data-view]').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  const navigateToDeepWork = () => switchView('deepwork');

  switch (currentView) {
    case 'commander':
      if (views.commander) renderCommander(views.commander, navigateToDeepWork);
      break;
    case 'deepwork':
      if (views.deepwork) renderDeepWork(views.deepwork);
      break;
    case 'roadmap':
      if (views.roadmap) renderRoadmap(views.roadmap, navigateToDeepWork);
      break;
    case 'finance':
      if (views.finance) renderFinances(views.finance);
      break;
  }

  updateHeader();
}

function updateHeader() {
  const state = getState();
  const today = getLocalDateString();

  const dateBadge = document.getElementById('current-date-badge');
  if (dateBadge) {
    dateBadge.textContent = formatDisplayDate(today).toUpperCase();
  }

  const greetingEl = document.getElementById('header-greeting-text');
  if (greetingEl) {
    const titles = {
      commander: `Command Center — ${state.user.name || 'Hussein'}`,
      deepwork: 'Deep Work Flow',
      roadmap: 'Engineering Mastery Roadmap',
      finance: 'Finances & Cashflow'
    };
    greetingEl.textContent = titles[currentView] || 'LifeOS';
  }

  const userInitial = document.getElementById('user-initial-display');
  const sidebarInitial = document.getElementById('sidebar-user-initial');
  const sidebarName = document.getElementById('sidebar-user-name');

  const initial = (state.user.name || 'H').charAt(0).toUpperCase();
  if (userInitial) userInitial.textContent = initial;
  if (sidebarInitial) sidebarInitial.textContent = initial;
  if (sidebarName) sidebarName.textContent = state.user.name || 'Hussein';
}

/**
 * Toast notifications
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Settings Modal Setup
 */
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const openBtns = [
    document.getElementById('settings-btn'),
    document.getElementById('sidebar-user-btn')
  ];
  const closeBtn = document.getElementById('close-settings-modal');

  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        populateSettingsInputs();
        if (modal) modal.classList.remove('hidden');
      });
    }
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      saveSettingsFromInputs();
      modal.classList.add('hidden');
    });
  }

  // Backup actions
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBackupData();
      showToast('Exporting data backup (JSON)...', 'success');
    });
  }

  const importInput = document.getElementById('import-data-file');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importBackupData(event.target.result);
        if (result.success) {
          showToast('Data imported successfully!', 'success');
          renderCurrentView();
        } else {
          showToast('Failed to import data: ' + result.error, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Web Push & Session Alerts
  const enableAlertsBtn = document.getElementById('enable-notifications-btn');
  const testAlertBtn = document.getElementById('test-alert-btn');
  const testPushBtn = document.getElementById('test-push-btn');
  const notifBadge = document.getElementById('notification-status-badge');
  const guidanceBox = document.getElementById('push-guidance-box');
  const guidanceText = document.getElementById('push-guidance-text');

  async function updateNotifBadge() {
    if (!notifBadge) return;
    const support = checkPushSupport();

    if (!support.supported) {
      notifBadge.textContent = support.isIOS ? 'Install PWA for iOS Push' : 'Not Supported';
      notifBadge.style.color = 'var(--accent-warning)';
      if (guidanceBox && guidanceText && support.reason) {
        guidanceBox.classList.remove('hidden');
        guidanceText.textContent = support.reason;
      }
      if (enableAlertsBtn) {
        enableAlertsBtn.disabled = !support.isIOS;
        enableAlertsBtn.textContent = support.isIOS ? 'Add to Home Screen' : 'Push Unavailable';
      }
      return;
    }

    if (guidanceBox) guidanceBox.classList.add('hidden');

    const sub = await getExistingSubscription();
    if (sub) {
      notifBadge.textContent = 'Active (Web Push Connected)';
      notifBadge.style.color = 'var(--accent-success)';
      if (enableAlertsBtn) {
        enableAlertsBtn.textContent = 'Disconnect Web Push';
        enableAlertsBtn.disabled = false;
      }
      if (testPushBtn) testPushBtn.disabled = false;
    } else if (Notification.permission === 'granted') {
      notifBadge.textContent = 'Permission Granted (Push Inactive)';
      notifBadge.style.color = 'var(--accent-blue)';
      if (enableAlertsBtn) {
        enableAlertsBtn.textContent = 'Connect Web Push';
        enableAlertsBtn.disabled = false;
      }
    } else {
      notifBadge.textContent = 'Needs Permission';
      notifBadge.style.color = 'var(--accent-warning)';
      if (enableAlertsBtn) {
        enableAlertsBtn.textContent = 'Enable Web Push';
        enableAlertsBtn.disabled = false;
      }
    }
  }

  updateNotifBadge();

  if (enableAlertsBtn) {
    enableAlertsBtn.addEventListener('click', async () => {
      try {
        const sub = await getExistingSubscription();
        if (sub) {
          await unsubscribeDeviceFromPush();
          showToast('Web Push disabled for this device.', 'info');
        } else {
          enableAlertsBtn.disabled = true;
          enableAlertsBtn.textContent = 'Connecting...';
          const res = await subscribeDeviceToPush();
          if (res.syncedToCloud) {
            showToast('Web Push active & synced to your cloud account!', 'success');
          } else {
            showToast('Web Push active on this device. Sign in below to sync across devices.', 'info');
          }
        }
      } catch (err) {
        console.error('Push toggle error:', err);
        showToast(err.message || 'Could not configure push notifications', 'error');
      } finally {
        await updateNotifBadge();
      }
    });
  }

  if (testPushBtn) {
    testPushBtn.addEventListener('click', async () => {
      try {
        testPushBtn.disabled = true;
        testPushBtn.textContent = 'Dispatching...';
        await sendImmediateTestPush();
        showToast('Test push dispatched! Lock your screen or minimize app to see banner.', 'success');
      } catch (err) {
        showToast(err.message || 'Could not send test push', 'warning');
      } finally {
        testPushBtn.disabled = false;
        testPushBtn.textContent = 'Send Test Push';
      }
    });
  }

  if (testAlertBtn) {
    testAlertBtn.addEventListener('click', () => {
      playChimeSound();
      triggerVibration();
      sendTimerNotification('LifeOS Test Alert', 'Chime and vibration are working perfectly!');
      showToast('Played test chime & vibration', 'info');
    });
  }

  // Supabase Auth & Keys UI
  initSupabaseUI();
}

function populateSettingsInputs() {
  const state = getState();
  const nameInput = document.getElementById('settings-username');
  const mottoInput = document.getElementById('settings-motto');
  const currInput = document.getElementById('settings-currency');
  const rateInput = document.getElementById('settings-lbp-rate');

  if (nameInput) nameInput.value = state.user.name || 'Hussein';
  if (mottoInput) mottoInput.value = state.user.motto || '';
  if (currInput) currInput.value = state.settings.currency || 'USD';
  if (rateInput) rateInput.value = state.settings.lbpRate || 89500;
}

function saveSettingsFromInputs() {
  const nameInput = document.getElementById('settings-username');
  const mottoInput = document.getElementById('settings-motto');
  const currInput = document.getElementById('settings-currency');
  const rateInput = document.getElementById('settings-lbp-rate');

  setUserNameAndMotto(
    nameInput ? nameInput.value : undefined,
    mottoInput ? mottoInput.value : undefined
  );

  setSettings({
    currency: currInput ? currInput.value : 'USD',
    lbpRate: rateInput ? Number(rateInput.value) || 89500 : 89500
  });

  renderCurrentView();
}

/**
 * Supabase Auth & Cloud Sync Interface
 */
function initSupabaseUI() {
  const loggedOutView = document.getElementById('supabase-logged-out-view');
  const loggedInView = document.getElementById('supabase-logged-in-view');
  const userDisplay = document.getElementById('supabase-user-display');
  const statusBadge = document.getElementById('supabase-modal-badge');
  const statusMsg = document.getElementById('supabase-status-msg');
  const cloudSyncPill = document.getElementById('cloud-sync-pill');
  const cloudSyncText = document.getElementById('cloud-sync-text');

  const emailInput = document.getElementById('supabase-email-input');
  const passInput = document.getElementById('supabase-password-input');
  const signInBtn = document.getElementById('supabase-signin-btn');
  const signUpBtn = document.getElementById('supabase-signup-btn');
  const signOutBtn = document.getElementById('supabase-signout-btn');
  const syncNowBtn = document.getElementById('supabase-sync-now-btn');

  const keysDrawer = document.getElementById('supabase-keys-drawer');
  const toggleKeysBtn = document.getElementById('supabase-toggle-keys-btn');
  const toggleKeysLoggedBtn = document.getElementById('supabase-toggle-keys-logged-btn');
  const projUrlInput = document.getElementById('supabase-project-url');
  const projKeyInput = document.getElementById('supabase-project-key');
  const saveKeysBtn = document.getElementById('supabase-save-keys-btn');

  function checkAuth() {
    getCurrentUser().then(user => {
      if (user) {
        if (loggedOutView) loggedOutView.classList.add('hidden');
        if (loggedInView) loggedInView.classList.remove('hidden');
        if (userDisplay) userDisplay.textContent = user.email || 'Connected';
        if (statusBadge) {
          statusBadge.textContent = 'Connected';
          statusBadge.className = 'supabase-sync-badge connected';
        }
        if (cloudSyncPill) {
          cloudSyncPill.className = 'db-status-pill connected';
        }
        if (cloudSyncText) {
          cloudSyncText.textContent = 'Cloud Synced';
        }
        debouncedNotificationSync();
      } else {
        if (loggedOutView) loggedOutView.classList.remove('hidden');
        if (loggedInView) loggedInView.classList.add('hidden');
        if (statusBadge) {
          statusBadge.textContent = isSupabaseConfigured() ? 'Ready to Sign In' : 'Local Only';
          statusBadge.className = 'supabase-sync-badge';
        }
        if (cloudSyncPill) {
          cloudSyncPill.className = 'db-status-pill offline';
        }
        if (cloudSyncText) {
          cloudSyncText.textContent = 'On-Device Storage';
        }
      }
    });
  }

  checkAuth();

  const toggleDrawer = () => {
    if (keysDrawer) keysDrawer.classList.toggle('hidden');
  };
  if (toggleKeysBtn) toggleKeysBtn.addEventListener('click', toggleDrawer);
  if (toggleKeysLoggedBtn) toggleKeysLoggedBtn.addEventListener('click', toggleDrawer);

  if (saveKeysBtn) {
    saveKeysBtn.addEventListener('click', () => {
      const url = projUrlInput ? projUrlInput.value.trim() : '';
      const key = projKeyInput ? projKeyInput.value.trim() : '';
      saveCredentials(url, key);
      showToast('Supabase project credentials saved.', 'success');
      checkAuth();
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const pass = passInput.value;
      if (!email || !pass) {
        if (statusMsg) statusMsg.textContent = 'Enter email and password.';
        return;
      }
      try {
        if (statusMsg) statusMsg.textContent = 'Signing in...';
        await signIn(email, pass);
        if (statusMsg) statusMsg.textContent = '';
        showToast('Signed in to Supabase Cloud!', 'success');
        checkAuth();
      } catch (err) {
        if (statusMsg) statusMsg.textContent = err.message;
      }
    });
  }

  if (signUpBtn) {
    signUpBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const pass = passInput.value;
      if (!email || !pass) {
        if (statusMsg) statusMsg.textContent = 'Enter email and password.';
        return;
      }
      try {
        if (statusMsg) statusMsg.textContent = 'Creating account...';
        await signUp(email, pass);
        if (statusMsg) statusMsg.textContent = 'Account created. Check your email or sign in.';
        showToast('Account created!', 'success');
        checkAuth();
      } catch (err) {
        if (statusMsg) statusMsg.textContent = err.message;
      }
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      showToast('Signed out of Supabase Cloud.', 'info');
      checkAuth();
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', () => {
      pushDataToCloud();
      showToast('Synced data to Supabase cloud!', 'success');
    });
  }
}

/**
 * Global Keyboard Navigation (1, 2, 3, 4)
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore when typing inside input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    if (e.key === '1') switchView('commander');
    if (e.key === '2') switchView('deepwork');
    if (e.key === '3') switchView('roadmap');
    if (e.key === '4') switchView('finance');
  });
}

/**
 * Theme Toggle Handler
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle-btn');
  const sidebarToggle = document.getElementById('sidebar-theme-toggle');

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('lifeos_theme', newTheme);
  };

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleTheme);

  const savedTheme = localStorage.getItem('lifeos_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * PWA Service Worker Registration
 */
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('LifeOS ServiceWorker registered with scope:', reg.scope);
      }).catch(err => {
        console.warn('ServiceWorker registration error:', err);
      });
    });
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Navigation event listeners
  document.querySelectorAll('[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Header notifications button
  const headerNotifyBtn = document.getElementById('header-notify-btn');
  if (headerNotifyBtn) {
    headerNotifyBtn.addEventListener('click', async () => {
      try {
        const sub = await getExistingSubscription();
        if (sub) {
          showToast('Web Push is active on this device.', 'info');
        } else {
          const res = await subscribeDeviceToPush();
          if (res.syncedToCloud) {
            showToast('Web Push connected & synced to your account!', 'success');
          } else {
            showToast('Web Push connected! Open Settings to link to Supabase.', 'info');
          }
        }
      } catch (err) {
        showToast(err.message || 'Could not enable notifications', 'warning');
      }
    });
  }

  initSettingsModal();
  initKeyboardShortcuts();
  initThemeToggle();
  initPWA();

  // Render initial view
  renderCurrentView();
  debouncedNotificationSync();

  // Re-render when store updates
  subscribeStore(() => {
    renderCurrentView();
    debouncedNotificationSync();
  });
});
