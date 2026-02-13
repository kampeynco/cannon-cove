import { Game } from './game.js';
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

resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));

const game = new Game(canvas);
window.game = game;
game.start();
