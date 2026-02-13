import { WAVES } from './constants.js';

export class WaveSystem {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.time = 0;
        this.waterLevel = canvasHeight * 0.65;
    }

    update(dt) {
        this.time += dt * 0.001;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.waterLevel = h * 0.65;
    }

    // Slow, rolling primary swell + smaller secondary chop
    getWaveY(x, timeOffset = 0, scaleOverride = 1) {
        const t = this.time + timeOffset;
        const amp = WAVES.amplitude * scaleOverride;
        return (
            Math.sin(x * 0.008 + t * 0.6) * amp * 1.0 +        // big slow swell
            Math.sin(x * 0.018 + t * 1.1 + 1.3) * amp * 0.45 +  // medium wave
            Math.sin(x * 0.035 + t * 1.7 + 2.7) * amp * 0.2 +   // small ripple
            Math.cos(x * 0.012 + t * 0.4 + 0.8) * amp * 0.35     // cross-swell
        );
    }

    getShipBob(shipX) {
        // Sample the actual front-layer wave surface at the ship's x position
        return this.getWaveY(shipX, 0, 1.0);
    }

    getShipTilt(shipX) {
        // Compute slope of wave at ship position for gentle rotation
        const sampleDist = 30;
        const yLeft = this.getWaveY(shipX - sampleDist, 0, 1.0);
        const yRight = this.getWaveY(shipX + sampleDist, 0, 1.0);
        return Math.atan2(yRight - yLeft, sampleDist * 2);
    }

    draw(ctx) {
        const layers = [
            {
                depth: 0, yOffset: -6, speed: 0, opacity: 0.92, scale: 1.0,
                topR: 25, topG: 85, topB: 140,
                bottomR: 8, bottomG: 30, bottomB: 55
            },
            {
                depth: 1, yOffset: 6, speed: 0.7, opacity: 0.7, scale: 0.7,
                topR: 18, topG: 65, topB: 110,
                bottomR: 6, bottomG: 22, bottomB: 45
            },
            {
                depth: 2, yOffset: 18, speed: 1.5, opacity: 0.5, scale: 0.5,
                topR: 12, topG: 50, topB: 85,
                bottomR: 5, bottomG: 18, bottomB: 38
            },
            {
                depth: 3, yOffset: 30, speed: 2.3, opacity: 0.35, scale: 0.35,
                topR: 8, topG: 35, topB: 65,
                bottomR: 4, bottomG: 14, bottomB: 30
            },
        ];

        // Draw back-to-front
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            this.drawWaveLayer(ctx, layer);
        }
    }

    drawWaveLayer(ctx, layer) {
        const baseline = this.waterLevel + layer.yOffset;
        const step = 3;

        ctx.beginPath();
        ctx.moveTo(-2, this.height + 2);

        for (let x = -2; x <= this.width + 2; x += step) {
            const waveY = baseline + this.getWaveY(x, layer.speed, layer.scale);
            if (x <= 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
        }

        ctx.lineTo(this.width + 2, this.height + 2);
        ctx.lineTo(-2, this.height + 2);
        ctx.closePath();

        // Depth gradient for this layer
        const grad = ctx.createLinearGradient(0, baseline - 15, 0, this.height);
        const { topR, topG, topB, bottomR, bottomG, bottomB, opacity } = layer;
        grad.addColorStop(0, `rgba(${topR}, ${topG}, ${topB}, ${opacity})`);
        grad.addColorStop(0.4, `rgba(${Math.round((topR + bottomR) / 2)}, ${Math.round((topG + bottomG) / 2)}, ${Math.round((topB + bottomB) / 2)}, ${opacity + 0.05})`);
        grad.addColorStop(1, `rgba(${bottomR}, ${bottomG}, ${bottomB}, ${opacity + 0.08})`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Foam/whitecap highlights on the front layer only
        if (layer.depth === 0) {
            this.drawFoam(ctx, baseline, layer.scale, layer.speed);
        }
    }

    drawFoam(ctx, baseline, scale, speed) {
        const step = 6;
        ctx.save();
        for (let x = 0; x <= this.width; x += step) {
            const waveY = baseline + this.getWaveY(x, speed, scale);
            const nextWaveY = baseline + this.getWaveY(x + step, speed, scale);

            // Foam appears on the leading edge of crests (where wave rises)
            const slope = (nextWaveY - waveY) / step;
            if (slope < -0.06) {
                const foamAlpha = Math.min(Math.abs(slope) * 3, 0.35);
                ctx.fillStyle = `rgba(200, 230, 255, ${foamAlpha})`;
                ctx.fillRect(x, waveY - 1, step + 1, 2.5);
            }
        }
        ctx.restore();
    }
}
