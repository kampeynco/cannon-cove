import { Game } from './game.js';
import { initSupabase, ensureSession, refreshAuthCache, loadSettings } from './supabase.js';
import './styles.css';

const canvas = document.getElementById('gameCanvas');

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = w;
    canvas.height = h;

    if (window.game) {
        window.game.resize(w, h);
    }
}

// ── Mobile orientation detection ──
// Uses actual pixel dimensions instead of CSS orientation query
// which is unreliable on many Android browsers
function isMobileDevice() {
    // Require coarse pointer (finger) — excludes desktops/laptops with trackpads
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Must have both touch AND coarse pointer to be considered mobile
    return hasCoarsePointer && hasTouchScreen;
}

function checkOrientation() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;
    const isMobile = isMobileDevice() && Math.min(w, h) < 500;

    if (isMobile && isPortrait && !document.body.dataset.portraitDismissed) {
        document.body.classList.add('portrait-mode');
    } else {
        const wasPortrait = document.body.classList.contains('portrait-mode');
        document.body.classList.remove('portrait-mode');
        // Re-trigger resize when switching from portrait to landscape
        // so canvas picks up the new dimensions
        if (wasPortrait) {
            setTimeout(resize, 100);
        }
    }
}

resize();
checkOrientation();

window.addEventListener('resize', () => {
    resize();
    checkOrientation();
});

// visualViewport API — fires in more browsers than window resize
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        resize();
        checkOrientation();
    });
}

// screen.orientation API — more reliable on Android than CSS
if (screen.orientation) {
    screen.orientation.addEventListener('change', () => {
        setTimeout(() => {
            resize();
            checkOrientation();
        }, 200);
    });
}

// Fallback for older devices
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        resize();
        checkOrientation();
    }, 300);
});

// Polling fallback for in-app browsers (Facebook, Instagram, TikTok)
// These browsers often don't fire resize/orientationchange events on rotation
let lastW = window.innerWidth;
let lastH = window.innerHeight;
setInterval(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        resize();
        checkOrientation();
    }
}, 500);

// Wait for fonts to load before starting the game
// Loading screen covers the canvas until ready
document.fonts.ready.then(async () => {
    // Init Supabase with timeout — game must load even if Supabase is down
    try {
        initSupabase();
        await Promise.race([
            (async () => {
                await ensureSession();
                await refreshAuthCache();
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 5000))
        ]);
    } catch (e) {
        console.warn('Supabase init skipped:', e.message);
    }

    const game = new Game(canvas);
    window.game = game;

    // Load cloud-saved settings (non-blocking)
    try {
        const saved = await loadSettings();
        if (saved && typeof saved.sound === 'boolean') {
            game.audio.enabled = saved.sound;
        }
    } catch (e) {
        console.warn('Settings load skipped:', e.message);
    }

    game.start();
    game.setupAuthListener();
    resize();

    // Fade out loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', () => {
            loadingScreen.remove();
        });
    }
});

