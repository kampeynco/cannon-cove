import { COLORS, SHIP, PHYSICS, SKY, UI } from './constants.js';

export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.stars = this.generateStars(120);
        this.particles = [];
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random() * 0.5,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 1,
            });
        }
        return stars;
    }

    // ─── Sky ────────────────────────────────────
    drawSky(turnCount) {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;
        const progress = Math.min(turnCount / SKY.totalCycleTurns, 1);

        const grad = ctx.createLinearGradient(0, 0, 0, h * 0.7);

        if (progress < 0.3) {
            // Sunset
            const t = progress / 0.3;
            grad.addColorStop(0, lerpColor(COLORS.skyHorizon, COLORS.sunsetTop, t));
            grad.addColorStop(0.4, lerpColor(COLORS.sunsetGold, COLORS.sunsetMid, t));
            grad.addColorStop(1, COLORS.sunsetBottom);
        } else if (progress < 0.6) {
            // Dusk
            const t = (progress - 0.3) / 0.3;
            grad.addColorStop(0, lerpColor(COLORS.sunsetTop, COLORS.nightSky, t));
            grad.addColorStop(0.5, lerpColor(COLORS.sunsetMid, COLORS.deepOcean, t));
            grad.addColorStop(1, lerpColor(COLORS.sunsetBottom, COLORS.oceanMid, t));
        } else {
            // Night
            grad.addColorStop(0, COLORS.nightSky);
            grad.addColorStop(0.5, '#0A1628');
            grad.addColorStop(1, COLORS.deepOcean);
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars (fade in during dusk/night)
        if (progress > 0.25) {
            const starAlpha = Math.min((progress - 0.25) / 0.3, 1);
            this.drawStars(starAlpha, performance.now() / 1000);
        }

        // Moon
        if (progress > 0.5) {
            const moonAlpha = Math.min((progress - 0.5) / 0.2, 1);
            this.drawMoon(w * 0.8, h * 0.12, 30, moonAlpha);
        }
    }

    drawStars(alpha, time) {
        const { ctx, canvas } = this;
        this.stars.forEach((star) => {
            const twinkle = Math.sin(time * star.speed + star.twinkle) * 0.3 + 0.7;
            ctx.globalAlpha = alpha * twinkle;
            ctx.fillStyle = COLORS.starColor;
            ctx.beginPath();
            ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    drawMoon(x, y, r, alpha) {
        const { ctx } = this;
        ctx.globalAlpha = alpha * 0.15;
        ctx.fillStyle = COLORS.moonGlow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#F5F0E8';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.nightSky;
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y - r * 0.1, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ─── Tropical Islands ────────────────────────
    drawIslands(waterLevel) {
        const { ctx, canvas } = this;
        const time = Date.now() / 1000;

        const islands = [
            { x: canvas.width * 0.1, w: 200, h: 80, palms: [{ ox: 10, h: 70, lean: 0.3 }] },
            { x: canvas.width * 0.5, w: 260, h: 100, palms: [{ ox: -30, h: 80, lean: -0.2 }, { ox: 30, h: 65, lean: 0.4 }] },
            { x: canvas.width * 0.9, w: 180, h: 75, palms: [{ ox: -5, h: 72, lean: -0.3 }] },
        ];

        islands.forEach(({ x, w, h, palms }, idx) => {
            const baseY = waterLevel + 5;

            // ── Sandy beach base (drawn first, largest shape) ──
            ctx.fillStyle = '#E8CFA0';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.55, baseY);
            ctx.quadraticCurveTo(x - w * 0.3, baseY - h * 0.35, x, baseY - h * 0.3);
            ctx.quadraticCurveTo(x + w * 0.3, baseY - h * 0.35, x + w * 0.55, baseY);
            ctx.lineTo(x + w * 0.55, baseY + 8);
            ctx.lineTo(x - w * 0.55, baseY + 8);
            ctx.closePath();
            ctx.fill();

            // Wet sand edge
            ctx.fillStyle = '#C4A76C';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.55, baseY);
            ctx.quadraticCurveTo(x - w * 0.2, baseY - 6, x, baseY - 5);
            ctx.quadraticCurveTo(x + w * 0.2, baseY - 6, x + w * 0.55, baseY);
            ctx.lineTo(x + w * 0.55, baseY + 8);
            ctx.lineTo(x - w * 0.55, baseY + 8);
            ctx.closePath();
            ctx.fill();

            // ── Green hill / vegetation (on top of sand) ──
            ctx.fillStyle = '#4A8C2A';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.45, baseY - h * 0.2);
            ctx.quadraticCurveTo(x - w * 0.3, baseY - h * 0.7, x - w * 0.1, baseY - h);
            ctx.quadraticCurveTo(x, baseY - h * 1.05, x + w * 0.1, baseY - h * 0.9);
            ctx.quadraticCurveTo(x + w * 0.3, baseY - h * 0.6, x + w * 0.45, baseY - h * 0.2);
            ctx.closePath();
            ctx.fill();

            // Darker vegetation layer (shadow/depth)
            ctx.fillStyle = '#357020';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.35, baseY - h * 0.15);
            ctx.quadraticCurveTo(x - w * 0.2, baseY - h * 0.65, x, baseY - h * 0.85);
            ctx.quadraticCurveTo(x + w * 0.15, baseY - h * 0.7, x + w * 0.35, baseY - h * 0.15);
            ctx.closePath();
            ctx.fill();

            // Light vegetation highlights
            ctx.fillStyle = '#5AA835';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.15, baseY - h * 0.5);
            ctx.quadraticCurveTo(x - w * 0.05, baseY - h * 0.95, x + w * 0.05, baseY - h * 0.88);
            ctx.quadraticCurveTo(x + w * 0.15, baseY - h * 0.55, x + w * 0.05, baseY - h * 0.4);
            ctx.closePath();
            ctx.fill();

            // ── Palm trees ──
            palms.forEach(({ ox, h: palmH, lean }) => {
                const px = x + ox;
                const palmBase = baseY - h * 0.35;
                const sway = Math.sin(time * 0.6 + ox) * 4;
                const topLean = lean * palmH * 0.4 + sway;

                // Trunk — thick, slightly curved, with segments
                const topX = px + topLean;
                const topY = palmBase - palmH;
                const midX = px + topLean * 0.4;
                const midY = palmBase - palmH * 0.5;

                // Trunk fill (thick)
                ctx.strokeStyle = '#8B5E3C';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(px, palmBase);
                ctx.quadraticCurveTo(midX, midY, topX, topY);
                ctx.stroke();

                // Trunk highlight
                ctx.strokeStyle = '#A67B4F';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px + 1, palmBase);
                ctx.quadraticCurveTo(midX + 1, midY, topX + 1, topY);
                ctx.stroke();

                // Trunk ring segments
                ctx.strokeStyle = '#6B4226';
                ctx.lineWidth = 1;
                for (let s = 0.15; s < 0.9; s += 0.12) {
                    const sx = px + (topX - px) * s * s;
                    const sy = palmBase + (topY - palmBase) * s;
                    ctx.beginPath();
                    ctx.moveTo(sx - 3, sy);
                    ctx.lineTo(sx + 3, sy);
                    ctx.stroke();
                }

                // ── Leaf canopy — filled leaf shapes ──
                const frondCount = 7;
                for (let f = 0; f < frondCount; f++) {
                    const baseAngle = -Math.PI + (f / (frondCount - 1)) * Math.PI * 2;
                    const swayAngle = Math.sin(time * 1.0 + f * 1.3 + ox) * 0.08;
                    const angle = baseAngle + swayAngle;
                    const frondLen = 22 + Math.sin(f * 3.7) * 6;

                    // Each frond is a filled leaf shape (not a line!)
                    const tipX = topX + Math.cos(angle) * frondLen;
                    const tipY = topY + Math.sin(angle) * frondLen * 0.55 + frondLen * 0.15;

                    // Control points for the two edges of the leaf
                    const perpX = -Math.sin(angle) * 4;
                    const perpY = Math.cos(angle) * 4;
                    const midFrondX = topX + Math.cos(angle) * frondLen * 0.5;
                    const midFrondY = topY + Math.sin(angle) * frondLen * 0.3 - 3;

                    // Leaf fill
                    ctx.fillStyle = f % 2 === 0 ? '#2D8C1A' : '#3BA025';
                    ctx.beginPath();
                    ctx.moveTo(topX, topY);
                    ctx.quadraticCurveTo(midFrondX + perpX, midFrondY + perpY, tipX, tipY);
                    ctx.quadraticCurveTo(midFrondX - perpX, midFrondY - perpY, topX, topY);
                    ctx.closePath();
                    ctx.fill();

                    // Leaf midrib
                    ctx.strokeStyle = '#1E6610';
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(topX, topY);
                    ctx.quadraticCurveTo(midFrondX, midFrondY, tipX, tipY);
                    ctx.stroke();
                }

                // Coconut cluster at trunk top
                const coconutColor = '#6B4E2A';
                for (let c = 0; c < 3; c++) {
                    const cx = topX + Math.cos(c * 2.1 + 1) * 4;
                    const cy = topY + 3 + Math.sin(c * 2.1 + 1) * 3;
                    ctx.fillStyle = coconutColor;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // ── Treasure Chest (middle island only) ──
            if (idx === 1) {
                const chestX = x + 2;
                const chestBaseY = baseY - h * 0.32;
                const cw = 22;   // chest width (half)
                const ch = 16;   // chest body height
                const lidH = 10; // lid height

                // Shadow under chest
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.ellipse(chestX, chestBaseY + 2, cw + 4, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Chest body (dark wood)
                ctx.fillStyle = '#6B3A1F';
                ctx.fillRect(chestX - cw, chestBaseY - ch, cw * 2, ch);
                // Wood highlight
                ctx.fillStyle = '#8B4E2A';
                ctx.fillRect(chestX - cw + 2, chestBaseY - ch + 2, cw * 2 - 4, ch * 0.4);
                // Wood dark bottom
                ctx.fillStyle = '#4A2510';
                ctx.fillRect(chestX - cw, chestBaseY - 4, cw * 2, 4);

                // Metal bands
                ctx.fillStyle = '#C4A032';
                ctx.fillRect(chestX - cw - 1, chestBaseY - ch, cw * 2 + 2, 3);
                ctx.fillRect(chestX - cw - 1, chestBaseY - ch * 0.45, cw * 2 + 2, 2);
                // Metal band rivets
                ctx.fillStyle = '#FFD84A';
                for (const rx of [-cw + 3, 0, cw - 3]) {
                    ctx.beginPath();
                    ctx.arc(chestX + rx, chestBaseY - ch + 1.5, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Open lid (trapezoid, tilted back)
                ctx.fillStyle = '#7B4425';
                ctx.beginPath();
                ctx.moveTo(chestX - cw, chestBaseY - ch);
                ctx.lineTo(chestX - cw + 3, chestBaseY - ch - lidH);
                ctx.lineTo(chestX + cw - 3, chestBaseY - ch - lidH);
                ctx.lineTo(chestX + cw, chestBaseY - ch);
                ctx.closePath();
                ctx.fill();
                // Lid highlight
                ctx.fillStyle = '#9B6035';
                ctx.beginPath();
                ctx.moveTo(chestX - cw + 2, chestBaseY - ch);
                ctx.lineTo(chestX - cw + 5, chestBaseY - ch - lidH + 2);
                ctx.lineTo(chestX + cw - 5, chestBaseY - ch - lidH + 2);
                ctx.lineTo(chestX + cw - 2, chestBaseY - ch);
                ctx.closePath();
                ctx.fill();
                // Lid metal band
                ctx.fillStyle = '#C4A032';
                ctx.fillRect(chestX - cw + 3, chestBaseY - ch - lidH, cw * 2 - 6, 2);

                // Gold coins spilling out
                ctx.fillStyle = '#FFD700';
                const coins = [
                    { cx: -8, cy: -ch - 2, r: 4 },
                    { cx: 3, cy: -ch - 4, r: 3.5 },
                    { cx: -3, cy: -ch - 1, r: 3 },
                    { cx: 10, cy: -ch, r: 3.5 },
                    { cx: -12, cy: -ch + 1, r: 3 },
                    { cx: 6, cy: -ch - 6, r: 2.5 },
                    { cx: -5, cy: -ch - 5, r: 2.5 },
                    // Coins spilling out the front
                    { cx: -cw - 3, cy: -3, r: 3 },
                    { cx: -cw + 1, cy: -1, r: 2.5 },
                    { cx: cw + 2, cy: -2, r: 2.5 },
                ];
                coins.forEach(coin => {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(chestX + coin.cx, chestBaseY + coin.cy, coin.r, 0, Math.PI * 2);
                    ctx.fill();
                    // Coin shine
                    ctx.fillStyle = '#FFF3A0';
                    ctx.beginPath();
                    ctx.arc(chestX + coin.cx - 1, chestBaseY + coin.cy - 1, coin.r * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Ruby (red gem)
                ctx.fillStyle = '#E01030';
                ctx.beginPath();
                ctx.moveTo(chestX + 1, chestBaseY - ch - 7);
                ctx.lineTo(chestX + 5, chestBaseY - ch - 4);
                ctx.lineTo(chestX + 1, chestBaseY - ch - 1);
                ctx.lineTo(chestX - 3, chestBaseY - ch - 4);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#FF6080';
                ctx.beginPath();
                ctx.moveTo(chestX + 1, chestBaseY - ch - 6);
                ctx.lineTo(chestX + 3, chestBaseY - ch - 4);
                ctx.lineTo(chestX + 1, chestBaseY - ch - 3);
                ctx.closePath();
                ctx.fill();

                // Emerald (green gem)
                ctx.fillStyle = '#10B858';
                ctx.fillRect(chestX - 10, chestBaseY - ch - 5, 5, 5);
                ctx.fillStyle = '#50E890';
                ctx.fillRect(chestX - 9, chestBaseY - ch - 4, 2, 2);

                // Diamond (white gem)
                ctx.fillStyle = '#D0E8FF';
                ctx.beginPath();
                ctx.moveTo(chestX + 10, chestBaseY - ch - 6);
                ctx.lineTo(chestX + 13, chestBaseY - ch - 3);
                ctx.lineTo(chestX + 10, chestBaseY - ch);
                ctx.lineTo(chestX + 7, chestBaseY - ch - 3);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#F0F8FF';
                ctx.beginPath();
                ctx.moveTo(chestX + 10, chestBaseY - ch - 5);
                ctx.lineTo(chestX + 12, chestBaseY - ch - 3);
                ctx.lineTo(chestX + 10, chestBaseY - ch - 1.5);
                ctx.closePath();
                ctx.fill();

                // Gold shimmer sparkle
                const sparkle = Math.sin(time * 3) * 0.4 + 0.6;
                ctx.fillStyle = `rgba(255, 255, 200, ${sparkle * 0.8})`;
                ctx.beginPath();
                ctx.arc(chestX - 6, chestBaseY - ch - 3, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(255, 255, 200, ${(1 - sparkle) * 0.7})`;
                ctx.beginPath();
                ctx.arc(chestX + 8, chestBaseY - ch - 1, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // ─── Ship Drawing ───────────────────────────
    drawShip(ship, facingRight = true, waveTilt = 0) {
        const { ctx } = this;
        const { x, y, hp } = ship;
        const dir = facingRight ? 1 : -1;

        ctx.save();
        ctx.translate(x, y);

        // Combine wave-driven tilt with damage tilt
        const damageTilt = (SHIP.maxHp - hp) * 0.05 * dir;
        ctx.rotate(waveTilt + damageTilt);

        // Hull
        const hullColor = ship.color || COLORS.warmBrown;
        ctx.fillStyle = hullColor;
        ctx.beginPath();
        ctx.moveTo(-SHIP.width / 2, 0);
        ctx.lineTo(-SHIP.width / 2 + 15, SHIP.hullHeight);
        ctx.lineTo(SHIP.width / 2 - 15, SHIP.hullHeight);
        ctx.lineTo(SHIP.width / 2, 0);
        ctx.quadraticCurveTo(SHIP.width / 2 + 10, -5, SHIP.width / 2 - 5, -10);
        ctx.lineTo(-SHIP.width / 2 + 5, -10);
        ctx.quadraticCurveTo(-SHIP.width / 2 - 10, -5, -SHIP.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Hull stripe
        ctx.strokeStyle = darkenColor(hullColor, 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-SHIP.width / 2 + 10, SHIP.hullHeight * 0.5);
        ctx.lineTo(SHIP.width / 2 - 10, SHIP.hullHeight * 0.5);
        ctx.stroke();

        // Damage holes
        if (hp < SHIP.maxHp) {
            this.drawDamage(hp);
        }

        // Mast
        if (hp > 0) {
            const mastH = hp === 1 ? SHIP.mastHeight * 0.5 : SHIP.mastHeight;
            ctx.strokeStyle = '#5C3A21';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(0, -10 - mastH);
            ctx.stroke();

            // Sail
            if (hp >= 2) {
                const sailAlpha = hp === 2 ? 0.7 : 1;
                ctx.globalAlpha = sailAlpha;
                ctx.fillStyle = COLORS.sailCream;
                ctx.beginPath();
                ctx.moveTo(0, -10 - mastH);
                ctx.quadraticCurveTo(dir * SHIP.sailWidth, -10 - mastH * 0.6, 0, -10 - mastH * 0.2);
                ctx.closePath();
                ctx.fill();

                // Sail stripe
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -10 - mastH * 0.8);
                ctx.quadraticCurveTo(dir * SHIP.sailWidth * 0.5, -10 - mastH * 0.55, 0, -10 - mastH * 0.4);
                ctx.stroke();

                ctx.globalAlpha = 1;

                // Torn sail effect at 2HP
                if (hp === 2) {
                    ctx.strokeStyle = COLORS.sailCream;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 3; i++) {
                        const tx = dir * (5 + Math.random() * 15);
                        const ty = -10 - mastH * (0.3 + Math.random() * 0.4);
                        ctx.beginPath();
                        ctx.moveTo(tx, ty);
                        ctx.lineTo(tx + dir * 5, ty + 5);
                        ctx.stroke();
                    }
                }
            }

            // Flag
            this.drawFlag(0, -10 - mastH, dir, ship.flagColor || COLORS.damage);
        }

        // Cannon
        ctx.fillStyle = '#2C2C2C';
        ctx.save();
        ctx.translate(dir * 20, -5);
        ctx.rotate(ship.cannonAngle ? -ship.cannonAngle * (Math.PI / 180) * dir : -0.5);
        ctx.fillRect(0, -3, dir * 25, 6);
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Fire at 1HP
        if (hp === 1) {
            this.drawFireEffect(10 * dir, -15, performance.now() / 1000);
        }

        // Smoke at 2HP
        if (hp <= 2) {
            this.drawSmokeWisp(-5 * dir, -20, performance.now() / 1000);
        }

        ctx.restore();
    }

    drawDamage(hp) {
        const { ctx } = this;
        // Holes
        const holes = SHIP.maxHp - hp;
        for (let i = 0; i < holes; i++) {
            ctx.fillStyle = '#1A0F0A';
            ctx.beginPath();
            ctx.ellipse(
                -20 + i * 25,
                SHIP.hullHeight * 0.3,
                8 + i * 3,
                6 + i * 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    drawFlag(x, y, dir, color) {
        const { ctx } = this;
        const time = performance.now() / 1000;
        const wave = Math.sin(time * 3) * 3;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + dir * 12, y + wave - 5, x + dir * 22, y + wave);
        ctx.lineTo(x + dir * 22, y + wave + 12);
        ctx.quadraticCurveTo(x + dir * 12, y + wave + 7, x, y + 12);
        ctx.closePath();
        ctx.fill();
    }

    drawFireEffect(x, y, time) {
        const { ctx } = this;

        // Flame glow (base light)
        const glowGrad = ctx.createRadialGradient(x, y - 5, 2, x, y - 5, 18);
        glowGrad.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
        glowGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y - 5, 18, 0, Math.PI * 2);
        ctx.fill();

        // Multiple flame tongues
        const tongues = 5;
        for (let i = 0; i < tongues; i++) {
            const phase = time * 12 + i * 1.3;
            const sway = Math.sin(phase) * (3 + i);
            const height = 12 + Math.sin(time * 8 + i * 2.5) * 6;
            const width = 3 + Math.sin(time * 10 + i) * 1.5;
            const offsetX = (i - tongues / 2) * 4 + sway * 0.5;

            // Outer flame (orange-red)
            ctx.globalAlpha = 0.65 - i * 0.06;
            ctx.fillStyle = `hsl(${20 + i * 8}, 100%, ${50 + Math.sin(phase) * 10}%)`;
            ctx.beginPath();
            ctx.moveTo(x + offsetX - width, y);
            ctx.quadraticCurveTo(x + offsetX - width * 0.5 + sway, y - height * 0.6, x + offsetX + sway * 0.8, y - height);
            ctx.quadraticCurveTo(x + offsetX + width * 0.5 + sway, y - height * 0.6, x + offsetX + width, y);
            ctx.closePath();
            ctx.fill();

            // Inner flame (bright yellow core)
            ctx.globalAlpha = 0.5 - i * 0.08;
            ctx.fillStyle = `hsl(${45 + i * 5}, 100%, ${65 + Math.sin(phase * 1.3) * 10}%)`;
            ctx.beginPath();
            const innerW = width * 0.5;
            const innerH = height * 0.65;
            ctx.moveTo(x + offsetX - innerW, y);
            ctx.quadraticCurveTo(x + offsetX + sway * 0.5, y - innerH, x + offsetX + innerW, y);
            ctx.closePath();
            ctx.fill();
        }

        // Hot sparks / embers
        for (let i = 0; i < 4; i++) {
            const sparkPhase = time * 6 + i * 1.7;
            const sparkX = x + Math.sin(sparkPhase * 2) * 8;
            const sparkY = y - 8 - ((sparkPhase * 15) % 25);
            const sparkAlpha = 1 - ((sparkPhase * 15) % 25) / 25;
            ctx.globalAlpha = sparkAlpha * 0.7;
            ctx.fillStyle = '#FFDD44';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    drawSmokeWisp(x, y, time) {
        const { ctx } = this;
        for (let i = 0; i < 5; i++) {
            const rise = -((time * 18 + i * 7) % 35);
            const drift = Math.sin(time * 1.2 + i * 2) * (6 + i * 2);
            const age = -rise / 35;
            const size = 4 + age * 10;
            ctx.fillStyle = `rgba(60, 55, 50, ${0.25 - age * 0.2})`;
            ctx.beginPath();
            ctx.arc(x + drift, y + rise, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ─── Projectile ─────────────────────────────
    drawProjectile(projectile) {
        const { ctx } = this;
        if (!projectile.active) return;

        // Trail
        projectile.trail.forEach((p, i) => {
            const alpha = i / projectile.trail.length;
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Cannonball
        const { x, y } = projectile;
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(x, y, PHYSICS.projectileRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(60,60,60,0.8)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, PHYSICS.projectileRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Fuse spark
        const time = performance.now() / 1000;
        const sparkX = x - projectile.vx * 0.3;
        const sparkY = y - projectile.vy * 0.3;
        ctx.fillStyle = `rgba(255, 200, 50, ${0.5 + Math.sin(time * 20) * 0.3})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ─── VFX ────────────────────────────────────
    drawSplash(x, y, progress) {
        const { ctx } = this;
        const alpha = 1 - progress;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = progress * 40;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist * 0.5 - progress * 20;
            const size = (1 - progress) * 4;

            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Water column
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 15 + progress * 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawExplosion(x, y, progress) {
        const { ctx } = this;
        const alpha = 1 - progress;
        const radius = progress * 35;

        // Flash
        if (progress < 0.2) {
            ctx.fillStyle = `rgba(255, 255, 200, ${(1 - progress / 0.2) * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fire ring
        ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Debris
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + progress * 2;
            const dist = progress * 50;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist - progress * 15;

            ctx.fillStyle = `rgba(139, 94, 60, ${alpha * 0.8})`;
            ctx.fillRect(px - 2, py - 2, 4, 4);
        }
    }

    // ─── Trajectory Preview ─────────────────────
    drawTrajectoryPreview(points, maxPoints = 60) {
        const { ctx } = this;
        const count = Math.min(points.length, maxPoints);

        for (let i = 0; i < count; i++) {
            const alpha = 0.4 * (1 - i / count);
            ctx.fillStyle = `rgba(244, 166, 35, ${alpha})`;
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ─── Floating Treasure Chest ──────────────────
    drawCrate(crate) {
        if (!crate || !crate.active) return;
        const { ctx } = this;
        const { x, y, type } = crate;
        const time = performance.now() / 1000;
        const bob = Math.sin(time * 2) * 4;
        const tilt = Math.sin(time * 1.3) * 0.06;

        ctx.save();
        ctx.translate(x, y + bob);
        ctx.rotate(tilt);

        // ── Chest body (barrel shape) ──
        const cw = 22, ch = 16;

        // Main body
        ctx.fillStyle = '#6B3A1F';
        roundRect(ctx, -cw, -ch + 2, cw * 2, ch + 4, 3);
        ctx.fill();

        // Wood planks
        ctx.strokeStyle = '#4A2510';
        ctx.lineWidth = 0.5;
        for (let i = -ch + 6; i < 6; i += 4) {
            ctx.beginPath();
            ctx.moveTo(-cw, i);
            ctx.lineTo(cw, i);
            ctx.stroke();
        }

        // Metal bands
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-cw, -ch + 5);
        ctx.lineTo(cw, -ch + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-cw, 3);
        ctx.lineTo(cw, 3);
        ctx.stroke();

        // ── Domed lid ──
        ctx.fillStyle = '#7B4425';
        ctx.beginPath();
        ctx.moveTo(-cw, -ch + 2);
        ctx.quadraticCurveTo(0, -ch - 10, cw, -ch + 2);
        ctx.fill();

        // Lid edge
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-cw, -ch + 2);
        ctx.quadraticCurveTo(0, -ch - 10, cw, -ch + 2);
        ctx.stroke();

        // Golden latch
        ctx.fillStyle = '#D4A017';
        roundRect(ctx, -5, -ch - 1, 10, 7, 2);
        ctx.fill();
        ctx.strokeStyle = '#AA8010';
        ctx.lineWidth = 1;
        roundRect(ctx, -5, -ch - 1, 10, 7, 2);
        ctx.stroke();

        // ── Label inside latch ──
        const labels = { '🔴': '2×', '🟢': '+1', '🔵': '👁' };
        ctx.fillStyle = '#3A1A00';
        ctx.font = 'bold 7px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[type.emoji] || '?', 0, -ch + 2.5);

        // ── Glowing pickup ring ──
        const pulse = 0.4 + Math.sin(time * 4) * 0.3;
        ctx.strokeStyle = `rgba(212, 160, 23, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -2, 30, 0, Math.PI * 2);
        ctx.stroke();

        // "SHOOT" text prompt
        const textPulse = 0.5 + Math.sin(time * 3) * 0.4;
        ctx.fillStyle = `rgba(212, 160, 23, ${textPulse})`;
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SHOOT', 0, 16);

        ctx.restore();
    }

    // ─── HUD ────────────────────────────────────
    drawHUD(state) {
        const { ctx, canvas } = this;
        const { player1, player2, currentPlayer, wind, round } = state;

        // Player 1 HP (top-left)
        this.drawPlayerHUD(20, 20, player1, true);

        // Player 2 HP (top-right)
        this.drawPlayerHUD(canvas.width - 20, 20, player2, false);

        // Wind + Round (top-center)
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${round}`, canvas.width / 2, 25);

        // Wind arrow
        const windDir = wind > 0 ? '→' : '←';
        const windStr = Math.abs(wind).toFixed(1);
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(`Wind: ${windStr} ${windDir}`, canvas.width / 2, 45);

        // Turn indicator
        const turnName = currentPlayer === 0 ? player1.name : player2.name;
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 16px Inter, sans-serif';
        const turnLabel = turnName === 'You' ? 'Your Turn' : `${turnName}'s Turn`;
        ctx.fillText(turnLabel, canvas.width / 2, 70);

        // ESC hint (bottom-right)
        ctx.fillStyle = 'rgba(245, 240, 232, 0.3)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('ESC = Pause', canvas.width - 16, canvas.height - 12);
    }

    drawPlayerHUD(x, y, player, alignLeft) {
        const { ctx } = this;
        ctx.textAlign = alignLeft ? 'left' : 'right';

        // Name
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText(player.name, x, y);

        // HP pirates
        const hpStart = alignLeft ? x : x - SHIP.maxHp * 22;
        for (let i = 0; i < SHIP.maxHp; i++) {
            ctx.font = '18px serif';
            ctx.textAlign = 'left';
            ctx.fillText(i < player.hp ? '🏴‍☠️' : '☠️', hpStart + i * 22, y + 22);
        }
    }

    // ─── Aim Controls (Gorillas-style dotted line) ─────
    drawAimUI(ship, angle, power, facingRight) {
        const { ctx } = this;
        const dir = facingRight ? 1 : -1;
        const ox = ship.x + dir * 25;
        const oy = ship.y - 12;

        // Convert aim angle to radians (0° = up, 90° = horizontal)
        const aimRad = facingRight
            ? -angle * (Math.PI / 180)
            : -(Math.PI - angle * (Math.PI / 180));



        // ── Dotted aim line from cannon ──
        const lineLength = 60 + (power / PHYSICS.maxPower) * 60;
        const dotSpacing = 7;
        const dots = Math.floor(lineLength / dotSpacing);

        for (let i = 0; i < dots; i++) {
            const t = (i / dots);
            const dist = 10 + t * lineLength;
            const dx = ox + Math.cos(aimRad) * dist;
            const dy = oy + Math.sin(aimRad) * dist;
            const alpha = 0.9 * (1 - t * 0.5);
            const radius = 2.2 - t * 0.8;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(dx, dy, Math.max(radius, 0.8), 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Angle label at end of dotted line ──
        const labelDist = 10 + lineLength + 14;
        const lx = ox + Math.cos(aimRad) * labelDist;
        const ly = oy + Math.sin(aimRad) * labelDist;

        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(angle)}°`, lx, ly);

    }

    // ─── Sea Creatures ──────────────────────────
    drawCreature(creature) {
        if (!creature) return;
        if (creature.type === 'WHALE') {
            this.drawWhale(creature);
        } else {
            this.drawKraken(creature);
        }
    }

    drawWhale(c) {
        const { ctx } = this;
        const rise = c.progress;
        if (rise <= 0) return;

        const x = c.x;
        const wl = c.waterLevel;
        const time = performance.now() / 1000;

        ctx.save();

        // ── Whale body — proper whale silhouette ──
        const bodyLen = 70;
        const bodyH = rise * 35;
        const headX = x + bodyLen * 0.4;
        const tailX = x - bodyLen * 0.6;

        // Main body path
        ctx.fillStyle = '#1A2A3A';
        ctx.beginPath();
        // Start at tail (left), go to head (right)
        ctx.moveTo(tailX, wl);
        // Tail flukes
        ctx.lineTo(tailX - 15, wl - bodyH * 0.7);
        ctx.lineTo(tailX - 5, wl - bodyH * 0.3);
        ctx.lineTo(tailX + 5, wl - bodyH * 0.15);
        // Back curve up to dorsel fin
        ctx.quadraticCurveTo(x - 20, wl - bodyH * 1.1, x, wl - bodyH);
        // Dorsal fin
        ctx.lineTo(x + 2, wl - bodyH - rise * 12);
        ctx.lineTo(x + 10, wl - bodyH);
        // Continue to head
        ctx.quadraticCurveTo(x + 25, wl - bodyH * 0.9, headX, wl - bodyH * 0.6);
        // Rounded head (blunt snout)
        ctx.quadraticCurveTo(headX + 12, wl - bodyH * 0.3, headX + 8, wl);
        // Belly back to tail
        ctx.quadraticCurveTo(x, wl + rise * 5, tailX, wl);
        ctx.closePath();
        ctx.fill();

        // Lighter underbelly
        ctx.fillStyle = '#2A4060';
        ctx.beginPath();
        ctx.moveTo(tailX + 10, wl);
        ctx.quadraticCurveTo(x, wl - bodyH * 0.15, headX + 5, wl);
        ctx.quadraticCurveTo(x, wl + rise * 4, tailX + 10, wl);
        ctx.closePath();
        ctx.fill();

        // Eye
        if (rise > 0.4) {
            const eyeAlpha = Math.min((rise - 0.4) / 0.3, 1);
            const eyeX = headX - 2;
            const eyeY = wl - bodyH * 0.55;
            // White
            ctx.fillStyle = `rgba(200, 220, 240, ${eyeAlpha * 0.9})`;
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pupil
            ctx.fillStyle = `rgba(10, 15, 25, ${eyeAlpha})`;
            ctx.beginPath();
            ctx.arc(eyeX + 1, eyeY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Blowhole water spout (realistic particle spray) ──
        if (rise > 0.3) {
            const spoutStrength = Math.min((rise - 0.3) / 0.4, 1);
            const spoutH = spoutStrength * 200;
            const blowholeX = x + 8;
            const blowholeY = wl - bodyH;

            // Dense particle spray — rises and fans outward
            const particleCount = Math.floor(spoutStrength * 40);
            for (let i = 0; i < particleCount; i++) {
                // Each particle has its own lifecycle phase
                const seed = i * 137.5; // golden angle spread
                const phase = (time * 1.2 + i * 0.15) % 1;
                const riseT = phase; // 0 = base, 1 = top

                // Fan outward as particles rise (V-shape)
                const fanSpread = riseT * riseT * 25 * spoutStrength;
                const sideOffset = Math.sin(seed) * fanSpread;
                // Add turbulent wobble
                const wobbleX = Math.sin(time * 3 + seed * 0.1) * (3 + riseT * 6);
                const wobbleY = Math.cos(time * 2.5 + seed * 0.15) * 3;

                const px = blowholeX + sideOffset + wobbleX;
                // Gravity curve: fast rise, then slows and falls
                const gravityPull = riseT > 0.7 ? (riseT - 0.7) * (riseT - 0.7) * 80 : 0;
                const py = blowholeY - spoutH * riseT + gravityPull + wobbleY;

                // Fade in at bottom, fade out at top
                const fadeIn = Math.min(riseT * 5, 1);
                const fadeOut = 1 - riseT * riseT;
                const alpha = fadeIn * fadeOut * spoutStrength * 0.55;

                // Larger particles near base, smaller at top
                const size = (1 - riseT * 0.6) * 4 + Math.sin(seed * 3) * 1.5;

                ctx.fillStyle = `rgba(170, 220, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, Math.max(size, 1), 0, Math.PI * 2);
                ctx.fill();
            }

            // Mist clouds at eruption point and top
            const mistLayers = 5;
            for (let i = 0; i < mistLayers; i++) {
                const t = i / mistLayers;
                const mistY = blowholeY - spoutH * t;
                const mistSpread = t * t * 30 * spoutStrength;
                const mistX = blowholeX + Math.sin(time * 0.8 + i * 1.7) * mistSpread;
                const mistSize = 6 + (1 - t) * 12 + Math.sin(time + i) * 3;
                const mistAlpha = spoutStrength * 0.12 * (1 - t * 0.6);

                ctx.fillStyle = `rgba(200, 235, 255, ${mistAlpha})`;
                ctx.beginPath();
                ctx.arc(mistX, mistY, mistSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Top dispersal cloud
            for (let i = 0; i < 4; i++) {
                const cloudX = blowholeX + Math.sin(time * 0.6 + i * 1.5) * (20 + i * 5);
                const cloudY = blowholeY - spoutH + Math.cos(time * 0.5 + i) * 8 + i * 3;
                const cloudSize = 10 + i * 4 + Math.sin(time + i * 2) * 3;
                const cloudAlpha = spoutStrength * 0.08 * (1 - i * 0.2);

                ctx.fillStyle = `rgba(210, 240, 255, ${cloudAlpha})`;
                ctx.beginPath();
                ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawKraken(c) {
        const { ctx } = this;
        const rise = c.progress;
        if (rise <= 0) return;

        const x = c.x;
        const wl = c.waterLevel;
        const time = performance.now() / 1000;

        ctx.save();

        // ── Tentacles — tall, dramatic, swaying ──
        const tentacleConfigs = [
            { ox: -40, h: 160, phase: 0, width: 12, curl: 1.2 },
            { ox: -18, h: 200, phase: 1.2, width: 14, curl: -0.8 },
            { ox: 0, h: 220, phase: 2.5, width: 16, curl: 0.5 },
            { ox: 18, h: 190, phase: 3.8, width: 14, curl: -1.0 },
            { ox: 40, h: 150, phase: 5.0, width: 12, curl: 1.3 },
        ];

        tentacleConfigs.forEach((tc) => {
            const tentH = rise * tc.h;
            if (tentH < 8) return;

            const baseX = x + tc.ox;
            const segments = 12;

            // Draw tentacle as thick tapered shape
            ctx.beginPath();
            ctx.moveTo(baseX - tc.width / 2, wl);

            // Left edge going up
            for (let s = 0; s <= segments; s++) {
                const t = s / segments;
                const sway = Math.sin(time * 1.8 + tc.phase + t * 4) * (18 * t * t);
                const curl = Math.sin(time * 1.2 + tc.phase + t * 2) * tc.curl * t * t * 15;
                const taper = tc.width / 2 * (1 - t * 0.7);
                const sx = baseX + sway + curl - taper;
                const sy = wl - tentH * t;
                ctx.lineTo(sx, sy);
            }

            // Pointed tip
            const tipSway = Math.sin(time * 1.8 + tc.phase + 4) * 18;
            const tipCurl = Math.sin(time * 1.2 + tc.phase + 2) * tc.curl * 15;
            const tipX = baseX + tipSway + tipCurl;
            const tipY = wl - tentH;
            ctx.quadraticCurveTo(tipX, tipY - 8, tipX + 3, tipY - 3);

            // Right edge going back down
            for (let s = segments; s >= 0; s--) {
                const t = s / segments;
                const sway = Math.sin(time * 1.8 + tc.phase + t * 4) * (18 * t * t);
                const curl = Math.sin(time * 1.2 + tc.phase + t * 2) * tc.curl * t * t * 15;
                const taper = tc.width / 2 * (1 - t * 0.7);
                const sx = baseX + sway + curl + taper;
                const sy = wl - tentH * t;
                ctx.lineTo(sx, sy);
            }

            ctx.closePath();

            // Gradient: dark reddish-brown
            const grad = ctx.createLinearGradient(baseX, wl, baseX, wl - tentH);
            grad.addColorStop(0, `rgba(65, 18, 28, ${rise * 0.95})`);
            grad.addColorStop(0.4, `rgba(90, 28, 38, ${rise * 0.9})`);
            grad.addColorStop(0.8, `rgba(130, 50, 60, ${rise * 0.8})`);
            grad.addColorStop(1, `rgba(160, 65, 70, ${rise * 0.65})`);
            ctx.fillStyle = grad;
            ctx.fill();

            // Suction cups along the inner face
            if (rise > 0.3) {
                const cupAlpha = Math.min((rise - 0.3) / 0.4, 1) * 0.6;
                for (let s = 1; s < segments; s++) {
                    const t = s / segments;
                    const sway = Math.sin(time * 1.8 + tc.phase + t * 4) * (18 * t * t);
                    const curl = Math.sin(time * 1.2 + tc.phase + t * 2) * tc.curl * t * t * 15;
                    const cx = baseX + sway + curl;
                    const cy = wl - tentH * t;
                    const cupSize = (1 - t * 0.5) * 3.5;

                    // Cup outline
                    ctx.fillStyle = `rgba(200, 100, 110, ${cupAlpha})`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cupSize, 0, Math.PI * 2);
                    ctx.fill();
                    // Cup inner
                    ctx.fillStyle = `rgba(250, 160, 170, ${cupAlpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cupSize * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // ── Head — bulging above water ──
        if (rise > 0.4) {
            const headRise = Math.min((rise - 0.4) / 0.4, 1);
            const headH = headRise * 25;

            // Head dome
            ctx.fillStyle = `rgba(55, 15, 25, ${headRise * 0.9})`;
            ctx.beginPath();
            ctx.ellipse(x, wl - headH * 0.5, 25, headH, 0, Math.PI, 0);
            ctx.fill();

            // Textured head
            ctx.fillStyle = `rgba(80, 25, 35, ${headRise * 0.4})`;
            ctx.beginPath();
            ctx.ellipse(x, wl - headH * 0.3, 18, headH * 0.6, 0, Math.PI, 0);
            ctx.fill();

            // Eyes (two glowing yellow eyes)
            if (headRise > 0.5) {
                const eyeA = (headRise - 0.5) * 2;
                for (let side = -1; side <= 1; side += 2) {
                    // Glow
                    ctx.fillStyle = `rgba(255, 180, 30, ${eyeA * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(x + side * 10, wl - headH * 0.65, 6, 0, Math.PI * 2);
                    ctx.fill();
                    // Eye
                    ctx.fillStyle = `rgba(255, 200, 50, ${eyeA * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(x + side * 10, wl - headH * 0.65, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                    // Slit pupil
                    ctx.fillStyle = `rgba(0, 0, 0, ${eyeA})`;
                    ctx.beginPath();
                    ctx.ellipse(x + side * 10, wl - headH * 0.65, 1, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    // ─── Sinking Animation ──────────────────────
    drawSinkingShip(ship, progress) {
        const { ctx } = this;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(0, progress * 60);
        ctx.rotate(progress * 0.3);
        this.drawShip(ship, ship.facingRight);
        ctx.restore();
    }
}

// ─── Helpers ──────────────────────────────────
function lerpColor(a, b, t) {
    const ra = parseInt(a.slice(1, 3), 16);
    const ga = parseInt(a.slice(3, 5), 16);
    const ba = parseInt(a.slice(5, 7), 16);
    const rb = parseInt(b.slice(1, 3), 16);
    const gb = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);
    const r = Math.round(ra + (rb - ra) * t);
    const g = Math.round(ga + (gb - ga) * t);
    const blue = Math.round(ba + (bb - ba) * t);
    return `rgb(${r},${g},${blue})`;
}

function darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
