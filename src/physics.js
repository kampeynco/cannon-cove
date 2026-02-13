import { PHYSICS, SHIP } from './constants.js';

export class ProjectilePhysics {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
    }

    launch(x, y, angle, power, wind) {
        this.active = true;
        this.x = x;
        this.y = y;
        const rad = angle * (Math.PI / 180);
        this.vx = Math.cos(rad) * power;
        this.vy = -Math.sin(rad) * power;
        this.wind = wind;
        this.trail = [];
    }

    update(dt) {
        if (!this.active) return;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > PHYSICS.trailLength) this.trail.shift();

        this.vx += this.wind * 0.003;
        this.vy += PHYSICS.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }

    checkCollision(targetShip, waterLevel, canvasWidth, canvasHeight) {
        if (!this.active) return null;

        // Out of bounds
        if (this.x < -50 || this.x > canvasWidth + 50 || this.y > canvasHeight + 50) {
            this.active = false;
            return { type: 'miss', x: this.x, y: this.y };
        }

        // Water hit
        if (this.y >= waterLevel) {
            this.active = false;
            return { type: 'splash', x: this.x, y: waterLevel };
        }

        // Ship hit
        const ship = targetShip;
        const dx = this.x - ship.x;
        const dy = this.y - ship.y;
        const halfW = (SHIP.width / 2) + SHIP.hitboxPadding;
        const halfH = (SHIP.height / 2) + SHIP.hitboxPadding;

        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
            this.active = false;
            return { type: 'hit', x: this.x, y: this.y };
        }

        return null;
    }

    simulateTrajectory(startX, startY, angle, power, wind, steps = 200) {
        const points = [];
        const rad = angle * (Math.PI / 180);
        let x = startX;
        let y = startY;
        let vx = Math.cos(rad) * power;
        let vy = -Math.sin(rad) * power;

        for (let i = 0; i < steps; i++) {
            points.push({ x, y });
            vx += wind * 0.003;
            vy += PHYSICS.gravity;
            x += vx;
            y += vy;
            if (y > 2000) break;
        }
        return points;
    }
}

export function checkCrateCollision(projectile, crate) {
    if (!projectile.active || !crate || !crate.active) return false;
    const dx = projectile.x - crate.x;
    const dy = projectile.y - crate.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 35;
}
