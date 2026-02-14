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
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function checkOrientation() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;
    const isMobile = isMobileDevice() && Math.min(w, h) < 500;

    if (isMobile && isPortrait) {
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

// Wait for fonts to load before starting the game
// Loading screen covers the canvas until ready
document.fonts.ready.then(async () => {
    // Init Supabase and create anonymous session
    initSupabase();
    await ensureSession();
    await refreshAuthCache();

    const game = new Game(canvas);
    window.game = game;

    // Load cloud-saved settings
    const saved = await loadSettings();
    if (saved && typeof saved.sound === 'boolean') {
        game.audio.enabled = saved.sound;
    }

    game.start();
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

