import { PHYSICS } from './constants.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.angle = 45;
        this.power = 10;
        this.isDragging = false;
        this.dragStart = null;
        this.onFire = null;
        this.enabled = false;

        this.bindEvents();
    }

    bindEvents() {
        const c = this.canvas;

        // Mouse
        c.addEventListener('mousedown', (e) => this.handleStart(e.offsetX, e.offsetY));
        c.addEventListener('mousemove', (e) => this.handleMove(e.offsetX, e.offsetY));
        c.addEventListener('mouseup', () => this.handleEnd());

        // Touch
        c.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            const rect = c.getBoundingClientRect();
            this.handleStart(t.clientX - rect.left, t.clientY - rect.top);
        }, { passive: false });

        c.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            const rect = c.getBoundingClientRect();
            this.handleMove(t.clientX - rect.left, t.clientY - rect.top);
        }, { passive: false });

        c.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        }, { passive: false });
    }

    handleStart(x, y) {
        if (!this.enabled) return;
        this.isDragging = true;
        this.dragStart = { x, y };
    }

    handleMove(x, y) {
        if (!this.isDragging || !this.dragStart || !this.enabled) return;

        const dx = x - this.dragStart.x;
        const dy = this.dragStart.y - y;

        // Angle from drag direction
        this.angle = Math.max(5, Math.min(85, Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI)));

        // Power from drag distance
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.power = Math.max(PHYSICS.minPower, Math.min(PHYSICS.maxPower, dist * 0.12));
    }

    handleEnd() {
        if (!this.isDragging || !this.enabled) return;
        this.isDragging = false;
        this.dragStart = null;

        if (this.onFire) {
            this.onFire(this.angle, this.power);
        }
    }

    enable(ship) {
        this.enabled = true;
        this.shipRef = ship;
    }

    disable() {
        this.enabled = false;
        this.isDragging = false;
    }

    reset() {
        this.angle = 45;
        this.power = 10;
        this.isDragging = false;
    }
}
