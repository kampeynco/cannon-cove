import { Game } from './game.js';
import './styles.css';

const canvas = document.getElementById('gameCanvas');
const dpr = window.devicePixelRatio || 1;

function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvas.width = w;
    canvas.height = h;

    if (window.game) {
        window.game.resize(w, h);
    }
}

resize();
window.addEventListener('resize', resize);

const game = new Game(canvas);
window.game = game;
game.start();
