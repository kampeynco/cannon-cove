import { AI, PHYSICS } from './constants.js';
import { ProjectilePhysics } from './physics.js';

export class AIPlayer {
    constructor() {
        this.lastAngle = 45;
        this.lastPower = 10;
    }

    computeShot(shooterShip, targetShip, wind, round, waterLevel, canvasWidth) {
        const simCount = AI.baseSimulations + round * AI.simsPerRound;
        let bestAngle = 45;
        let bestPower = 10;
        let bestDist = Infinity;

        const facingRight = shooterShip.x < targetShip.x;

        for (let i = 0; i < simCount; i++) {
            const angle = 15 + Math.random() * 70;
            const power = PHYSICS.minPower + Math.random() * (PHYSICS.maxPower - PHYSICS.minPower);

            const sim = new ProjectilePhysics();
            const launchX = shooterShip.x + (facingRight ? 30 : -30);
            const launchY = shooterShip.y - 15;

            const effectiveAngle = facingRight ? angle : 180 - angle;
            sim.launch(launchX, launchY, effectiveAngle, power, wind);

            for (let step = 0; step < 500; step++) {
                sim.update(1);

                if (sim.y > waterLevel || sim.x < -50 || sim.x > canvasWidth + 50) break;

                const dx = sim.x - targetShip.x;
                const dy = sim.y - targetShip.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestAngle = angle;
                    bestPower = power;
                }
            }
        }

        // Add slight inaccuracy that decreases with rounds
        const variance = AI.accuracyVariance / (1 + round * 0.2);
        bestAngle += (Math.random() - 0.5) * bestAngle * variance;
        bestPower += (Math.random() - 0.5) * bestPower * variance;

        bestPower = Math.max(PHYSICS.minPower, Math.min(PHYSICS.maxPower, bestPower));
        bestAngle = Math.max(10, Math.min(85, bestAngle));

        this.lastAngle = bestAngle;
        this.lastPower = bestPower;

        return { angle: bestAngle, power: bestPower };
    }
}
