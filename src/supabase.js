import { createClient } from '@supabase/supabase-js';

// Credentials can come from Vite env variables or localStorage configured in the UI
function getStoredCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('lifeos_supabase_url') || '';
  const localKey = localStorage.getItem('lifeos_supabase_anon_key') || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey
  };
}

let supabaseClient = null;
let realtimeChannel = null;
let syncTimeout = null;

export function initSupabase(customUrl, customKey) {
  const url = customUrl || getStoredCredentials().url;
  const anonKey = customKey || getStoredCredentials().anonKey;

  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }

  try {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
}

export function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getStoredCredentials();
  return Boolean(url && anonKey);
}

export function saveCredentials(url, anonKey) {
  if (url) localStorage.setItem('lifeos_supabase_url', url.trim());
  else localStorage.removeItem('lifeos_supabase_url');

  if (anonKey) localStorage.setItem('lifeos_supabase_anon_key', anonKey.trim());
  else localStorage.removeItem('lifeos_supabase_anon_key');

  return initSupabase(url, anonKey);
}

export async function getCurrentUser() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch (err) {
    return null;
  }
}

export async function signIn(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured. Please enter Project URL and Anon Key in Settings.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured. Please enter Project URL and Anon Key in Settings.');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getSupabase();
  if (!client) return;
  if (realtimeChannel) {
    client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  await client.auth.signOut();
}

/**
 * Push current state to Supabase in the background (debounced)
 */
export function pushDataToCloud(data, onSyncStatusChange) {
  const client = getSupabase();
  if (!client) return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  if (onSyncStatusChange) onSyncStatusChange('syncing');

  syncTimeout = setTimeout(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        if (onSyncStatusChange) onSyncStatusChange('offline');
        return;
      }

      const { error } = await client
        .from('lifeos_userdata')
        .upsert({
          user_id: user.id,
          data: data,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Error pushing data to Supabase:', error);
        if (onSyncStatusChange) onSyncStatusChange('error');
      } else {
        if (onSyncStatusChange) onSyncStatusChange('synced');
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
      if (onSyncStatusChange) onSyncStatusChange('error');
    }
  }, 750);
}

/**
 * Fetch latest state from cloud on login or initial launch
 */
export async function pullDataFromCloud() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await client
      .from('lifeos_userdata')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error pulling from Supabase:', error);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.warn('Failed to pull cloud data:', err);
    return null;
  }
}

/**
 * Subscribe to realtime updates from other devices (e.g. phone changes -> laptop updates)
 */
export function subscribeToRealtime(onRemoteUpdate) {
  const client = getSupabase();
  if (!client) return;

  getCurrentUser().then(user => {
    if (!user) return;

    if (realtimeChannel) {
      client.removeChannel(realtimeChannel);
    }

    realtimeChannel = client
      .channel('lifeos_userdata_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lifeos_userdata',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            onRemoteUpdate(payload.new.data);
          }
        }
      )
      .subscribe();
  });
}
