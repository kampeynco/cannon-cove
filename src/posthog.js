/**
 * PostHog analytics client for Cannon Cove
 * Uses posthog-node SDK, initialized from environment variables.
 *
 * In a Vite browser build, we use the PostHog HTTP Capture API directly
 * (fetch-based) to keep things lightweight and avoid Node.js-only internals.
 * The distinctId is derived from the Supabase session, falling back to a
 * locally-generated anonymous ID stored in sessionStorage.
 */

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

/**
 * Get or create a persistent anonymous distinct ID for unauthed users.
 */
function getAnonymousId() {
    const STORAGE_KEY = 'posthog_anon_id';
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}

/** Currently-identified user distinct ID (set after sign-in) */
let _distinctId = null;

/**
 * Set the authenticated user's distinct ID and send a PostHog identify call.
 * @param {string} userId - The Supabase user UUID
 * @param {Object} [properties] - Optional person properties
 */
export function identifyUser(userId, properties = {}) {
    if (!POSTHOG_KEY || !userId) return;
    _distinctId = userId;

    _send('$identify', {
        $anon_distinct_id: getAnonymousId(),
        ...(Object.keys(properties).length ? { $set: properties } : {}),
    }, userId);
}

/**
 * Return the current effective distinct ID.
 */
export function getDistinctId() {
    return _distinctId || getAnonymousId();
}

/**
 * Capture a PostHog event.
 * @param {string} event - Event name
 * @param {Object} [properties] - Event properties
 */
export function capture(event, properties = {}) {
    if (!POSTHOG_KEY) return;
    _send(event, properties, getDistinctId());
}

/**
 * Capture an exception / error event.
 * @param {Error|unknown} error
 * @param {Object} [additionalProperties]
 */
export function captureException(error, additionalProperties = {}) {
    if (!POSTHOG_KEY) return;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    _send('$exception', {
        $exception_message: message,
        $exception_stack_trace_raw: stack,
        ...additionalProperties,
    }, getDistinctId());
}

/**
 * Low-level send helper – POSTs a single event to the PostHog /capture endpoint.
 * @param {string} event
 * @param {Object} properties
 * @param {string} distinctId
 */
function _send(event, properties, distinctId) {
    if (!POSTHOG_KEY) return;

    const payload = {
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: {
            $lib: 'posthog-node',
            $lib_version: '1.0.0',
            ...properties,
        },
        timestamp: new Date().toISOString(),
    };

    fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => {
        // Silently ignore network errors — analytics must never break the game
    });
}
