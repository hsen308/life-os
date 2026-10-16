/**
 * LifeOS Notification Hooks
 * 
 * Schedules and synchronizes the 6 high-leverage Web Push notifications:
 * 1. Morning Kickoff (08:30 Beirut time)
 * 2. Spaced Review Recall (14:00 Beirut time)
 * 3. Evening Wrap-Up (21:30 Beirut time)
 * 4. Must Do Due Reminder (1 hour prior to deadline)
 * 5. Focus Timer Completion (delivers when phone is locked or app closed)
 * 6. Inactivity Re-engagement (after 48 hours without a focus session)
 */

import { getSupabase, getCurrentUser } from './supabase.js';
import { getLocalDateString, getNextLocalTimeUtc, addLocalDays } from './dateUtils.js';

const USER_TIMEZONE = 'Asia/Beirut';

/**
 * Low-level scheduler to insert or upsert a notification in scheduled_notifications
 */
async function scheduleNotification({ type, title, body, url = '/', sendAt, dedupeKey, actions = [] }) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const payload = {
      user_id: user.id,
      type,
      title,
      body,
      url,
      actions,
      send_at: sendAt,
      timezone: USER_TIMEZONE,
      dedupe_key: dedupeKey
    };

    const { data, error } = await supabase
      .from('scheduled_notifications')
      .upsert(payload, { onConflict: 'user_id, dedupe_key' })
      .select('id')
      .single();

    if (error) {
      console.warn(`[LifeOS] Could not schedule ${type} notification:`, error.message);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.warn('[LifeOS] scheduleNotification error:', err);
    return null;
  }
}

/**
 * Cancels a notification by dedupe key
 */
async function cancelNotificationByDedupe(dedupeKey) {
  const supabase = getSupabase();
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  try {
    await supabase
      .from('scheduled_notifications')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('dedupe_key', dedupeKey)
      .is('sent_at', null);
  } catch (err) {
    console.warn('[LifeOS] cancelNotification error:', err);
  }
}

/**
 * 1. Morning Kickoff (08:30 AM Beirut time)
 */
export async function scheduleMorningKickoff(state) {
  const sendAtUtc = getNextLocalTimeUtc(8, 30, USER_TIMEZONE);
  const targetDateStr = getLocalDateString(new Date(sendAtUtc));

  // Determine current focus directive
  const pendingMustDos = (state.mustDo || []).filter(m => !m.done && m.dueDate <= targetDateStr).length;
  const missionTitle = state.commander?.activeTrack === 'exam' 
    ? 'University Exam Preparation Sprint'
    : 'Roadmap Milestone Objective';

  await scheduleNotification({
    type: 'morning_kickoff',
    title: 'LifeOS — Morning Kickoff',
    body: `Today's Mission: ${missionTitle} · ${pendingMustDos} Must Do items on deck.`,
    url: '/?view=commander',
    sendAt: sendAtUtc,
    dedupeKey: `morning_kickoff_${targetDateStr}`
  });
}

/**
 * 2. Spaced Review (14:00 / 2:00 PM Beirut time)
 */
export async function scheduleSpacedReview(state) {
  const sendAtUtc = getNextLocalTimeUtc(14, 0, USER_TIMEZONE);
  const targetDateStr = getLocalDateString(new Date(sendAtUtc));

  // Check if any topics are due for review today with 'lost' or 'okay' rating
  const reviewQueue = state.reviewQueue || [];
  const dueItems = reviewQueue.filter(r => (r.rating === 'lost' || r.rating === 'okay') && r.dueDate <= targetDateStr);

  if (dueItems.length === 0) {
    // If nothing due, no need to alert
    return;
  }

  const primaryTopic = dueItems[0].topicTitle || 'Active Recall Topic';
  const extraCount = dueItems.length - 1;
  const extraText = extraCount > 0 ? ` (+${extraCount} more)` : '';

  await scheduleNotification({
    type: 'spaced_review',
    title: 'LifeOS — Spaced Review Due',
    body: `"${primaryTopic}"${extraText} is scheduled for recall reinforcement today.`,
    url: '/?view=roadmap',
    sendAt: sendAtUtc,
    dedupeKey: `spaced_review_${targetDateStr}`
  });
}

/**
 * 3. Evening Wrap-Up (21:30 / 9:30 PM Beirut time)
 */
export async function scheduleEveningWrapup(state) {
  const sendAtUtc = getNextLocalTimeUtc(21, 30, USER_TIMEZONE);
  const targetDateStr = getLocalDateString(new Date(sendAtUtc));

  // Calculate today's focus minutes
  const todaySessions = (state.sessions || []).filter(s => s.date === targetDateStr);
  const minutesFocused = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const targetMinutes = 100; // Standard dual-sprint daily target

  let body = '';
  if (minutesFocused >= targetMinutes) {
    body = `Target achieved: ${minutesFocused}m focused today. Rest well tonight, Hussein.`;
  } else {
    const remaining = Math.max(0, targetMinutes - minutesFocused);
    body = `${remaining}m remaining toward your daily focus target. Lock in a quick final sprint.`;
  }

  await scheduleNotification({
    type: 'evening_wrapup',
    title: 'LifeOS — Evening Wrap-Up',
    body,
    url: '/?view=commander',
    sendAt: sendAtUtc,
    dedupeKey: `evening_wrapup_${targetDateStr}`
  });
}

/**
 * 4. Must Do Due Reminder (1 hour prior to deadline)
 */
export async function scheduleMustDoReminder(item) {
  if (!item || !item.id || item.done) return;

  const itemDate = item.dueDate || getLocalDateString();
  const timeStr = item.dueTime || '18:00'; // Default 6:00 PM if no time set
  const [hour, minute] = timeStr.split(':').map(Number);

  // Calculate 1 hour prior to due time
  let reminderHour = hour - 1;
  let reminderDate = itemDate;
  if (reminderHour < 0) {
    reminderHour = 23;
    reminderDate = addLocalDays(itemDate, -1);
  }

  const [y, m, d] = reminderDate.split('-').map(Number);
  const testDate = new Date(Date.UTC(y, m - 1, d, reminderHour, minute || 0, 0));
  
  // Convert local Beirut time to UTC
  const utcDate = new Date(testDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(testDate.toLocaleString('en-US', { timeZone: USER_TIMEZONE }));
  const tzOffsetMs = tzDate.getTime() - utcDate.getTime();
  const reminderUtcMs = testDate.getTime() - tzOffsetMs;

  const reminderDateObj = new Date(reminderUtcMs);

  // Only schedule if reminder is in the future
  if (reminderDateObj.getTime() > Date.now()) {
    await scheduleNotification({
      type: 'must_do_reminder',
      title: `Must Do: ${item.text}`,
      body: `Due in 1 hour (${timeStr}). Open LifeOS to review.`,
      url: '/?view=commander',
      sendAt: reminderDateObj.toISOString(),
      dedupeKey: `mustdo_${item.id}`
    });
  }
}

export async function cancelMustDoReminder(itemId) {
  if (!itemId) return;
  await cancelNotificationByDedupe(`mustdo_${itemId}`);
}

/**
 * 5. Focus Timer Completion (Arrives when phone is locked or app is closed)
 */
export async function scheduleFocusTimerNotification(timer) {
  if (!timer || !timer.endTimestamp) return null;

  const endUtc = new Date(timer.endTimestamp).toISOString();
  const notifId = await scheduleNotification({
    type: 'focus_timer',
    title: 'Deep Work Complete',
    body: `"${timer.missionTitle || 'Focus Session'}" (${timer.durationMinutes || 50}m) block finished. Record your recall rating.`,
    url: '/?view=deepwork',
    sendAt: endUtc,
    dedupeKey: `timer_${timer.endTimestamp}`
  });

  if (notifId && typeof localStorage !== 'undefined') {
    localStorage.setItem('lifeos_active_timer_notif_id', notifId);
  }

  return notifId;
}

export async function cancelFocusTimerNotification() {
  if (typeof localStorage === 'undefined') return;

  const notifId = localStorage.getItem('lifeos_active_timer_notif_id');
  if (notifId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('scheduled_notifications')
          .update({ cancelled_at: new Date().toISOString() })
          .eq('id', notifId);
      } catch (err) {
        console.warn('Error cancelling timer notification:', err);
      }
    }
    localStorage.removeItem('lifeos_active_timer_notif_id');
  }
}

/**
 * 6. Inactivity Re-engagement (after 48 hours without a session)
 */
export async function scheduleInactivityNudge(state) {
  const sessions = state.sessions || [];
  const lastSession = sessions[0];
  const lastTimestamp = lastSession ? lastSession.timestamp : Date.now();

  // 48 hours after last session
  const nudgeTime = new Date(lastTimestamp + 48 * 3600 * 1000);

  if (nudgeTime.getTime() > Date.now()) {
    await scheduleNotification({
      type: 'inactivity_nudge',
      title: 'LifeOS — Focus Consistency',
      body: '2 days since your last focus sprint. Reconnect with your roadmap and keep your momentum alive.',
      url: '/?view=commander',
      sendAt: nudgeTime.toISOString(),
      dedupeKey: `inactivity_48h_${lastSession ? lastSession.id : 'start'}`
    });
  }
}

/**
 * Master Lifecycle Scheduler: Schedules daily briefings and nudges
 */
export async function syncAllScheduledNotifications(state) {
  try {
    await scheduleMorningKickoff(state);
    await scheduleSpacedReview(state);
    await scheduleEveningWrapup(state);
    await scheduleInactivityNudge(state);

    // Schedule active Must Do items with deadlines
    if (Array.isArray(state.mustDo)) {
      for (const item of state.mustDo) {
        if (!item.done) {
          await scheduleMustDoReminder(item);
        }
      }
    }
  } catch (err) {
    console.warn('[LifeOS] syncAllScheduledNotifications error:', err);
  }
}
