/**
 * multiplayer.js — Real-time online multiplayer via Supabase Realtime Channels
 *
 * Handles: matchmaking queue, channel management, turn sync,
 * 20s turn timer, reconnect logic (2 attempts → forfeit).
 */
import { getSupabase, getUser, ensurePlayer } from './supabase.js';

// ── State ──────────────────────────────────────────
let channel = null;
let queueSubscription = null;
let matchId = null;
let localPlayerId = null;
let opponentId = null;
let isPlayer1 = false; // player1 = joined first, goes first
let turnTimer = null;
let turnTimeLeft = 0;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 2;
const TURN_DURATION = 20; // seconds

// Callbacks set by game.js
let _onMatchFound = null;
let _onOpponentFire = null;
let _onOpponentForfeit = null;
let _onTurnTimeout = null;
let _onTimerTick = null;

// ── Public API ─────────────────────────────────────

/**
 * Set event callbacks from game.js
 */
export function setCallbacks({ onMatchFound, onOpponentFire, onOpponentForfeit, onTurnTimeout, onTimerTick }) {
    _onMatchFound = onMatchFound;
    _onOpponentFire = onOpponentFire;
    _onOpponentForfeit = onOpponentForfeit;
    _onTurnTimeout = onTurnTimeout;
    _onTimerTick = onTimerTick;
}

/**
 * Join the matchmaking queue. Polls for a match via the find_match() DB function,
 * and subscribes to queue row changes for instant notification when matched.
 */
export async function joinQueue() {
    const supabase = getSupabase();
    if (!supabase) return;

    const user = await getUser();
    if (!user) return;

    localPlayerId = user.id;
    await ensurePlayer();

    // Clean up any stale entries first
    await supabase.from('matchmaking_queue').delete().eq('player_id', localPlayerId);

    // Insert into queue
    const { error: insertErr } = await supabase
        .from('matchmaking_queue')
        .insert({ player_id: localPlayerId });

    if (insertErr) {
        console.warn('Failed to join queue:', insertErr.message);
        return;
    }

    // Try to find match immediately
    const foundMatch = await tryFindMatch();
    if (foundMatch) return;

    // Subscribe to our queue row for changes (when matched by another player's find_match call)
    queueSubscription = supabase
        .channel('queue-watch')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'matchmaking_queue',
            filter: `player_id=eq.${localPlayerId}`,
        }, (payload) => {
            const row = payload.new;
            if (row.status === 'matched' && row.match_id) {
                matchId = row.match_id;
                _setupMatch(row.match_id);
            }
        })
        .subscribe();

    // Also poll every 2s as fallback
    _startPolling();
}

/**
 * Leave the matchmaking queue (cancel search)
 */
export async function leaveQueue() {
    _stopPolling();
    if (queueSubscription) {
        const supabase = getSupabase();
        supabase.removeChannel(queueSubscription);
        queueSubscription = null;
    }

    const supabase = getSupabase();
    if (supabase && localPlayerId) {
        await supabase.from('matchmaking_queue').delete().eq('player_id', localPlayerId);
    }
}

/**
 * Broadcast a fire event to the opponent
 */
export function sendFire(angle, power) {
    if (!channel) return;
    channel.send({
        type: 'broadcast',
        event: 'fire',
        payload: { angle, power, playerId: localPlayerId },
    });
}

/**
 * Broadcast game over
 */
export function sendGameOver(winnerId, reason = 'normal') {
    if (!channel) return;
    channel.send({
        type: 'broadcast',
        event: 'game_over',
        payload: { winnerId, reason },
    });
}

/**
 * Broadcast forfeit (disconnect)
 */
export function sendForfeit() {
    if (!channel) return;
    channel.send({
        type: 'broadcast',
        event: 'forfeit',
        payload: { playerId: localPlayerId },
    });
}

/**
 * Start the 20-second turn timer
 */
export function startTurnTimer() {
    stopTurnTimer();
    turnTimeLeft = TURN_DURATION;
    if (_onTimerTick) _onTimerTick(turnTimeLeft);

    turnTimer = setInterval(() => {
        turnTimeLeft--;
        if (_onTimerTick) _onTimerTick(turnTimeLeft);

        if (turnTimeLeft <= 0) {
            stopTurnTimer();
            if (_onTurnTimeout) _onTurnTimeout();
        }
    }, 1000);
}

/**
 * Stop the turn timer
 */
export function stopTurnTimer() {
    if (turnTimer) {
        clearInterval(turnTimer);
        turnTimer = null;
    }
    turnTimeLeft = 0;
}

/**
 * Save the online match result to the database
 */
export async function saveOnlineMatchResult(winnerId, rounds, accuracy, durationSeconds) {
    const supabase = getSupabase();
    if (!supabase || !matchId) return;

    // Update online_matches row
    await supabase
        .from('online_matches')
        .update({
            winner_id: winnerId,
            status: winnerId ? 'completed' : 'forfeit',
            rounds,
            completed_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
        })
        .eq('id', matchId);

    // Clean up queue entries
    await supabase.from('matchmaking_queue')
        .delete()
        .or(`player_id.eq.${localPlayerId},player_id.eq.${opponentId}`);
}

/**
 * Full cleanup — disconnect channel, leave queue, reset state
 */
export function disconnect() {
    stopTurnTimer();
    _stopPolling();

    const supabase = getSupabase();
    if (supabase) {
        if (channel) {
            supabase.removeChannel(channel);
            channel = null;
        }
        if (queueSubscription) {
            supabase.removeChannel(queueSubscription);
            queueSubscription = null;
        }
    }

    matchId = null;
    opponentId = null;
    isPlayer1 = false;
    reconnectAttempts = 0;
}

/** Get current match info */
export function getMatchInfo() {
    return { matchId, localPlayerId, opponentId, isPlayer1 };
}

/** Get remaining turn time */
export function getTurnTimeLeft() {
    return turnTimeLeft;
}

// ── Private helpers ────────────────────────────────

let pollInterval = null;

function _startPolling() {
    _stopPolling();
    pollInterval = setInterval(async () => {
        await tryFindMatch();
    }, 2000);
}

function _stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

async function tryFindMatch() {
    const supabase = getSupabase();
    if (!supabase || !localPlayerId) return false;

    const { data, error } = await supabase.rpc('find_match', { p_player_id: localPlayerId });

    if (error) {
        console.warn('find_match error:', error.message);
        return false;
    }

    if (data) {
        matchId = data;
        _stopPolling();
        if (queueSubscription) {
            supabase.removeChannel(queueSubscription);
            queueSubscription = null;
        }
        await _setupMatch(data);
        return true;
    }

    return false;
}

async function _setupMatch(mId) {
    const supabase = getSupabase();
    matchId = mId;

    // Fetch match details to determine player order
    const { data: match } = await supabase
        .from('online_matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!match) {
        console.warn('Match not found:', matchId);
        return;
    }

    isPlayer1 = match.player1_id === localPlayerId;
    opponentId = isPlayer1 ? match.player2_id : match.player1_id;

    // Fetch opponent's username
    const { data: opponentProfile } = await supabase
        .from('players')
        .select('username')
        .eq('id', opponentId)
        .maybeSingle();

    const opponentName = opponentProfile?.username || 'Rival Captain';

    // Create Realtime channel for this match
    channel = supabase.channel(`match:${matchId}`, {
        config: { presence: { key: localPlayerId } },
    });

    // Listen for opponent's fire
    channel.on('broadcast', { event: 'fire' }, (msg) => {
        const { angle, power, playerId } = msg.payload;
        if (playerId !== localPlayerId && _onOpponentFire) {
            _onOpponentFire(angle, power);
        }
    });

    // Listen for forfeit
    channel.on('broadcast', { event: 'forfeit' }, (msg) => {
        const { playerId } = msg.payload;
        if (playerId !== localPlayerId && _onOpponentForfeit) {
            _onOpponentForfeit();
        }
    });

    // Listen for game over
    channel.on('broadcast', { event: 'game_over' }, (msg) => {
        // Game over is handled locally too, this is just for sync
    });

    // Track presence for disconnect detection
    channel.on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== localPlayerId) {
            _handleOpponentDisconnect();
        }
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // Track our presence
            await channel.track({ online: true });

            // Notify game that match is ready
            if (_onMatchFound) {
                _onMatchFound({
                    matchId,
                    opponentName,
                    opponentId,
                    isPlayer1, // player1 goes first
                });
            }
        }
    });
}

function _handleOpponentDisconnect() {
    // Wait a moment, they might reconnect
    setTimeout(() => {
        // Check if they're still gone by looking at presence
        if (!channel) return;
        const presenceState = channel.presenceState();
        const opponentPresent = Object.keys(presenceState).some(
            (key) => key !== localPlayerId
        );

        if (!opponentPresent) {
            reconnectAttempts++;
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                // Opponent forfeited
                if (_onOpponentForfeit) _onOpponentForfeit();
            }
            // Otherwise wait for next presence leave event
        } else {
            // They reconnected
            reconnectAttempts = 0;
        }
    }, 3000);
}
