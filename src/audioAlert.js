/**
 * Reliable Multi-Layer Alert System for LifeOS
 * - Web Notification (with ServiceWorker fallback)
 * - Hardware Vibration pattern for mobile phones
 * - Zero-asset Web Audio API Synthesizer chime (no mp3 load failures)
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Unlock audio on first touch/click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

/**
 * Synthesizes a gentle harmonic chime chord (C5 - G5 - C6)
 */
export function playChimeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.5);
    });
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

/**
 * Triggers hardware vibration on mobile devices
 */
export function triggerVibration() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Distinct double buzz pattern: 300ms on, 150ms off, 300ms on, 150ms off, 450ms on
      navigator.vibrate([300, 150, 300, 150, 450]);
    }
  } catch (err) {
    console.warn('Vibration not supported or failed:', err);
  }
}

/**
 * Dispatches system notification
 */
export async function sendTimerNotification(title = 'Deep Work Session Complete', body = 'Focus session finished. Take a short recovery break and record your progress.') {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Prefer service worker showNotification for mobile background reliability
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NOTIFY',
          title,
          body
        });
      } else {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'lifeos-timer-alert'
        });
      }
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

/**
 * Complete alert combining vibration, audio chime, and push notification
 */
export function fireSessionCompleteAlert(missionTitle) {
  triggerVibration();
  playChimeSound();
  sendTimerNotification(
    'Deep Work Session Complete',
    `You completed: ${missionTitle || '50-minute focused session'}. Record your progress now.`
  );
}
