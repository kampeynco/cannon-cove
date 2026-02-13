import { POWERUP } from './constants.js';

export class PowerUpSystem {
    constructor() {
        this.activeCrate = null;
        this.playerEffects = [null, null];
    }

    trySpawn(canvasWidth, waterLevel) {
        if (this.activeCrate) return;
        if (Math.random() > POWERUP.spawnChance) return;

        const types = Object.values(POWERUP.types);
        const type = types[Math.floor(Math.random() * types.length)];

        this.activeCrate = {
            active: true,
            x: canvasWidth * (0.3 + Math.random() * 0.4),
            y: waterLevel - 20,
            type,
            vx: (Math.random() - 0.5) * POWERUP.floatSpeed,
        };
    }

    update(canvasWidth) {
        if (!this.activeCrate || !this.activeCrate.active) return;

        this.activeCrate.x += this.activeCrate.vx;

        if (this.activeCrate.x < -30 || this.activeCrate.x > canvasWidth + 30) {
            this.activeCrate = null;
        }
    }

    collect(playerIndex) {
        if (!this.activeCrate || !this.activeCrate.active) return null;

        const type = this.activeCrate.type;
        this.activeCrate = null;

        this.playerEffects[playerIndex] = type;
        return type;
    }

    consumeEffect(playerIndex) {
        const effect = this.playerEffects[playerIndex];
        this.playerEffects[playerIndex] = null;
        return effect;
    }

    getActiveEffect(playerIndex) {
        return this.playerEffects[playerIndex];
    }

    reset() {
        this.activeCrate = null;
        this.playerEffects = [null, null];
    }
}
