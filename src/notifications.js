import { getSupabase, getCurrentUser } from './supabase.js';

export const VAPID_PUBLIC_KEY = 'BMkEwBK4LXQSoHcp1UB0eHb64a0ScthcJEHGrUxT3R7qESVhfqQN2jl4gALYXkPmy6fx7cmgH8XCMs8x6OXT-Io';
export const EDGE_FUNCTION_URL = 'https://jgamvvxzodaknleimtuk.supabase.co/functions/v1/send-push-notifications';

/**
 * Convert base64url string to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check browser and device Web Push support
 */
export function checkPushSupport() {
  const hasSW = 'serviceWorker' in navigator;
  const hasPush = 'PushManager' in window;
  const hasNotification = 'Notification' in window;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);

  if (isIOS && !isStandalone) {
    return {
      supported: false,
      isIOS: true,
      isStandalone: false,
      permission: hasNotification ? Notification.permission : 'default',
      reason: 'On iPhone / iPad, open Safari Share menu and tap "Add to Home Screen" to enable Web Push.'
    };
  }

  const supported = hasSW && hasPush && hasNotification;

  return {
    supported,
    isIOS,
    isStandalone,
    permission: hasNotification ? Notification.permission : 'denied',
    reason: supported ? '' : 'This browser does not support the Web Push API.'
  };
}

/**
 * Get active PushSubscription from Service Worker
 */
export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (e) {
    console.warn('Failed to get push subscription:', e);
    return null;
  }
}

/**
 * Subscribe current device to Web Push and save to Supabase
 */
export async function subscribeDeviceToPush() {
  const support = checkPushSupport();
  if (!support.supported) {
    throw new Error(support.reason || 'Web Push notifications are not supported on this device.');
  }

  // Request browser permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted. Please enable notifications in your browser settings.');
  }

  const reg = await navigator.serviceWorker.ready;
  if (!reg) {
    throw new Error('Service worker is not ready. Please refresh the page and try again.');
  }

  // Check existing or subscribe new
  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey
    });
  }

  // Extract keys
  const rawP256dh = subscription.getKey('p256dh');
  const rawAuth = subscription.getKey('auth');
  const p256dh = rawP256dh ? btoa(String.fromCharCode(...new Uint8Array(rawP256dh))) : '';
  const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : '';

  localStorage.setItem('lifeos_push_active', 'true');

  // Sync subscription to Supabase if authenticated
  const supabase = getSupabase();
  const user = await getCurrentUser();

  if (supabase && user) {
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        created_at: new Date().toISOString()
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.warn('Could not sync subscription to Supabase:', error);
      throw new Error(`Device subscribed, but could not link to your cloud account: ${error.message}`);
    }
  }

  return {
    subscription,
    syncedToCloud: Boolean(user)
  };
}

/**
 * Unsubscribe device from Web Push
 */
export async function unsubscribeDeviceFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
    }

    localStorage.removeItem('lifeos_push_active');
    return true;
  } catch (err) {
    console.warn('Error unsubscribing from push:', err);
    throw err;
  }
}

/**
 * Trigger an immediate test push notification through Supabase Edge Function
 */
export async function sendImmediateTestPush() {
  const user = await getCurrentUser();
  const supabase = getSupabase();

  if (!supabase || !user) {
    throw new Error('Please sign in to your Supabase account in Settings to test cloud push notifications.');
  }

  const existingSub = await getExistingSubscription();
  if (!existingSub) {
    throw new Error('This device is not yet subscribed to push. Click "Enable Web Push" first.');
  }

  // 1. Insert test alert into scheduled_notifications queue for right now
  const { data, error } = await supabase.from('scheduled_notifications').insert({
    user_id: user.id,
    type: 'test_alert',
    title: 'LifeOS — Cognitive Commander',
    body: 'Lockscreen Web Push test succeeded! Notifications arrive when app is closed.',
    url: '/',
    send_at: new Date().toISOString(),
    timezone: 'Asia/Beirut'
  }).select().single();

  if (error) {
    throw new Error(`Could not schedule test alert: ${error.message}`);
  }

  // 2. Trigger the edge function immediately to process the queue without waiting for cron
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trigger: 'test_dispatch', notification_id: data.id })
    });

    if (!res.ok) {
      console.warn('Edge function returned status', res.status);
    }
  } catch (e) {
    console.warn('Edge function trigger error:', e);
  }

  return true;
}
