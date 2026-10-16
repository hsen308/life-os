/**
 * Local Date Utilities for LifeOS
 * 
 * CRITICAL RULE: Lebanon is UTC+3. Between 12:00 AM and 3:00 AM,
 * new Date().toISOString() returns the UTC date (yesterday).
 * ALWAYS construct YYYY-MM-DD from local getFullYear, getMonth, and getDate!
 */

/**
 * Returns YYYY-MM-DD formatted from the local device time.
 * @param {Date|string|number} [dateInput] - Optional date or timestamp. Defaults to now.
 * @returns {string} 'YYYY-MM-DD'
 */
export function getLocalDateString(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    const y = fallback.getFullYear();
    const m = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Friendly local date display (e.g. "Today", "Yesterday", "Tomorrow", "Wed, Oct 15")
 * @param {string} yyyyMmDd 
 * @returns {string}
 */
export function formatDisplayDate(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const today = getLocalDateString();
  const tomorrow = addLocalDays(today, 1);
  const yesterday = addLocalDays(today, -1);

  if (yyyyMmDd === today) return 'Today';
  if (yyyyMmDd === tomorrow) return 'Tomorrow';
  if (yyyyMmDd === yesterday) return 'Yesterday';

  const parts = yyyyMmDd.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return yyyyMmDd;
}

/**
 * Checks if a date string is before today in local time
 * @param {string} yyyyMmDd 
 * @returns {boolean}
 */
export function isOverdue(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  return yyyyMmDd < getLocalDateString();
}

/**
 * Checks if a date string matches today in local time
 * @param {string} yyyyMmDd 
 * @returns {boolean}
 */
export function isToday(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  return yyyyMmDd === getLocalDateString();
}

/**
 * Checks if a date string is in the future in local time
 * @param {string} yyyyMmDd 
 * @returns {boolean}
 */
export function isFuture(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  return yyyyMmDd > getLocalDateString();
}

/**
 * Adds or subtracts days from a local YYYY-MM-DD string
 * @param {string} yyyyMmDd 
 * @param {number} days 
 * @returns {string}
 */
export function addLocalDays(yyyyMmDd, days) {
  let [y, m, d] = (yyyyMmDd || getLocalDateString()).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

/**
 * Returns array of local date strings for the last N days (including today)
 * @param {number} n 
 * @returns {string[]}
 */
export function getLastNDays(n = 7) {
  const result = [];
  const today = getLocalDateString();
  for (let i = n - 1; i >= 0; i--) {
    result.push(addLocalDays(today, -i));
  }
  return result;
}

/**
 * Calculates the exact UTC ISO string for the next occurrence of a local hour/minute
 * in a specific timezone (defaults to Asia/Beirut).
 * @param {number} targetHour 0-23
 * @param {number} targetMinute 0-59
 * @param {string} [timezone='Asia/Beirut']
 * @returns {string} UTC ISO string
 */
export function getNextLocalTimeUtc(targetHour, targetMinute, timezone = 'Asia/Beirut') {
  const now = new Date();
  const localDateStr = getLocalDateString(now);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const curHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const curMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

  const isPastToday = (curHour > targetHour) || (curHour === targetHour && curMin >= targetMinute);
  const targetDateStr = isPastToday ? addLocalDays(localDateStr, 1) : localDateStr;

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const testDate = new Date(Date.UTC(y, m - 1, d, targetHour, targetMinute, 0));
  const tzOffsetMs = getTimezoneOffsetMs(testDate, timezone);
  const targetUtcMs = testDate.getTime() - tzOffsetMs;

  return new Date(targetUtcMs).toISOString();
}

/**
 * Computes offset in milliseconds between UTC and given timezone for a date
 */
export function getTimezoneOffsetMs(date, timezone = 'Asia/Beirut') {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return tzDate.getTime() - utcDate.getTime();
}
