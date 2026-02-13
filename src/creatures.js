// ─── Sea Creatures ─────────────────────────────────
// Whale and Kraken that periodically surface and block cannonballs

const CREATURE_TYPES = {
    WHALE: 'WHALE',
    KRAKEN: 'KRAKEN',
};

// Lifecycle phases
const PHASE = {
    SUBMERGED: 0,
    RISING: 1,
    SURFACED: 2,
    SINKING: 3,
};

export class SeaCreatures {
    constructor() {
        this.creature = null;
        this.spawnCooldown = 0;
    }

    trySpawn(canvasWidth, waterLevel, shipLeftX, shipRightX) {
        if (this.creature || this.spawnCooldown > 0) return;

        // 35% chance each turn
        if (Math.random() > 0.35) return;

        const type = Math.random() < 0.5 ? CREATURE_TYPES.WHALE : CREATURE_TYPES.KRAKEN;

        // Spawn between the two ships (with padding)
        const minX = shipLeftX + 80;
        const maxX = shipRightX - 80;
        const x = minX + Math.random() * (maxX - minX);

        this.creature = {
            type,
            x,
            waterLevel,
            phase: PHASE.RISING,
            progress: 0,         // 0→1 for each phase
            surfacedTimer: 0,    // how long it's been surfaced
            surfaceDuration: 3000 + Math.random() * 2000, // 3-5 sec
        };

        this.spawnCooldown = 2; // skip 2 turns before next spawn attempt
    }

    update(dt) {
        if (this.spawnCooldown > 0 && !this.creature) {
            // Cooldown ticks only when no creature is present
        }

        if (!this.creature) return;

        const c = this.creature;
        const speed = dt * 0.0015;

        switch (c.phase) {
            case PHASE.RISING:
                c.progress = Math.min(c.progress + speed, 1);
                if (c.progress >= 1) {
                    c.phase = PHASE.SURFACED;
                    c.progress = 1;
                    c.surfacedTimer = 0;
                }
                break;

            case PHASE.SURFACED:
                c.surfacedTimer += dt;
                if (c.surfacedTimer >= c.surfaceDuration) {
                    c.phase = PHASE.SINKING;
                    c.progress = 1;
                }
                break;

            case PHASE.SINKING:
                c.progress = Math.max(c.progress - speed, 0);
                if (c.progress <= 0) {
                    this.creature = null;
                }
                break;
        }
    }

    onTurnSwitch() {
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
        }
    }

    // Returns collision rect(s) for the currently surfaced creature
    getHitboxes() {
        const c = this.creature;
        if (!c || c.phase === PHASE.SUBMERGED) return [];

        const rise = c.progress; // 0→1

        if (c.type === CREATURE_TYPES.WHALE) {
            // Whale body + massive water spout column
            const bodyH = rise * 35;
            const bodyTop = c.waterLevel - bodyH;
            const spoutH = rise * 200;
            const spoutTop = bodyTop - spoutH;
            return [
                // Body hitbox (wider whale)
                { x: c.x - 45, y: bodyTop, w: 90, h: bodyH },
                // Water spout column (tall, narrower)
                { x: c.x - 12, y: spoutTop, w: 24, h: spoutH, isSpout: true },
            ];
        } else {
            // Kraken — 5 tall tentacles
            const tentacles = [];
            const configs = [
                { ox: -40, h: 160 },
                { ox: -18, h: 200 },
                { ox: 0, h: 220 },
                { ox: 18, h: 190 },
                { ox: 40, h: 150 },
            ];
            configs.forEach((tc, i) => {
                const tentacleH = rise * tc.h;
                const tentacleTop = c.waterLevel - tentacleH;
                tentacles.push({
                    x: c.x + tc.ox - 10,
                    y: tentacleTop,
                    w: 20,
                    h: tentacleH,
                    isTentacle: true,
                    index: i,
                });
            });
            return tentacles;
        }
    }

    // Check if a projectile hits any creature hitbox
    checkCollision(projectileX, projectileY, projectileRadius) {
        const hitboxes = this.getHitboxes();
        for (const hb of hitboxes) {
            if (
                projectileX + projectileRadius > hb.x &&
                projectileX - projectileRadius < hb.x + hb.w &&
                projectileY + projectileRadius > hb.y &&
                projectileY - projectileRadius < hb.y + hb.h
            ) {
                return { blocked: true, x: projectileX, y: projectileY, type: this.creature.type };
            }
        }
        return null;
    }

    reset() {
        this.creature = null;
        this.spawnCooldown = 0;
    }
}
