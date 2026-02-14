import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let _cachedUser = null;

export function initSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not found — running in offline mode');
        return null;
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
}

export function getSupabase() {
    return supabase;
}

/** Create anonymous session if no session exists */
export async function ensureSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        console.warn('Anonymous sign-in failed:', error.message);
        return null;
    }
    return data.session;
}

/** Check if current user is authenticated (non-anonymous) */
export async function isAuthenticated() {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return !user.app_metadata?.is_anonymous;
}

/** Synchronous auth check using cached state — safe for click handlers */
export function isAuthenticatedSync() {
    if (!_cachedUser) return false;
    return !_cachedUser.is_anonymous;
}

/** Update cached auth state — call after session changes */
export async function refreshAuthCache() {
    if (!supabase) { _cachedUser = null; return; }
    const { data: { session } } = await supabase.auth.getSession();
    _cachedUser = session?.user || null;
}

/** Get cached user's display name */
export function getCachedUsername() {
    if (!_cachedUser) return null;
    return _cachedUser.user_metadata?.full_name
        || _cachedUser.user_metadata?.name
        || _cachedUser.email?.split('@')[0]
        || null;
}

/** Get current user */
export async function getUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/** Sign in with Google OAuth */
export async function signInWithGoogle() {
    if (!supabase) return { error: 'Supabase not initialized' };
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    return { data, error };
}

/** Sign in with magic link */
export async function signInWithEmail(email) {
    if (!supabase) return { error: 'Supabase not initialized' };
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
    });
    return { data, error };
}

/** Ensure a player row exists for the current user */
export async function ensurePlayer() {
    if (!supabase) return null;
    const user = await getUser();
    if (!user) return null;

    const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('id', user.id)
        .single();

    if (existing) return existing;

    const { data, error } = await supabase
        .from('players')
        .insert({
            id: user.id,
            username: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

    if (error) {
        console.warn('Failed to create player:', error.message);
        return null;
    }
    return data;
}

/**
 * Save match result to the database.
 * Player stats are auto-updated by the database trigger.
 */
export async function saveMatch({ won, rounds, accuracy, durationSeconds, mode, opponentType }) {
    if (!supabase) return null;
    const user = await getUser();
    if (!user) return null;

    // Ensure player row exists
    await ensurePlayer();

    const { data, error } = await supabase
        .from('matches')
        .insert({
            player_id: user.id,
            opponent_type: opponentType || 'ai',
            won,
            rounds,
            accuracy,
            duration_seconds: durationSeconds,
            mode,
        })
        .select()
        .single();

    if (error) {
        console.warn('Failed to save match:', error.message);
        return null;
    }
    return data;
}

/** Fetch leaderboard (top 20 players) */
export async function getLeaderboard() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(20);

    if (error) {
        console.warn('Failed to fetch leaderboard:', error.message);
        return [];
    }
    return data;
}

/** Save player settings to cloud */
export async function saveSettings(settings) {
    if (!supabase) return;
    const user = await getUser();
    if (!user || user.is_anonymous) return;

    const { error } = await supabase
        .from('players')
        .update({ settings })
        .eq('id', user.id);

    if (error) console.warn('Failed to save settings:', error.message);
}

/** Load player settings from cloud */
export async function loadSettings() {
    if (!supabase) return null;
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('players')
        .select('settings')
        .eq('id', user.id)
        .single();

    if (error || !data) return null;
    return data.settings;
}

/** Listen for auth state changes */
export function onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
    return supabase.auth.onAuthStateChange(callback);
}
