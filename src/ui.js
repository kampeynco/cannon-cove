import { COLORS, STATES, MODES, SHIP } from './constants.js';

export class UIManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.buttons = [];
        this.menuButtons = [];
        this.createMenuButtons();
    }

    createMenuButtons() {
        this.menuButtons = [
            { id: 'duel', label: '⚔️  Duel', mode: MODES.DUEL, y: 0 },
            { id: 'crew', label: '🏴‍☠️  Crew Battle', mode: MODES.CREW_BATTLE, y: 0 },
            { id: 'ghost', label: '👻  Ghost Fleet', mode: MODES.GHOST_FLEET, y: 0 },
        ];
    }

    drawMenu() {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dim overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 64px "Pirata One", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('CANNON COVE', cx + 3, cy - 140 + 3);
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('CANNON COVE', cx, cy - 140);

        // Crossed cannons decoration
        ctx.font = '36px serif';
        ctx.fillText('⚓', cx, cy - 80);

        // Tagline
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = 'italic 18px Inter, sans-serif';
        ctx.fillText('Aim. Fire. Plunder!', cx, cy - 50);

        // Buttons
        const btnWidth = 260;
        const btnHeight = 52;
        const btnGap = 16;
        const startY = cy - 5;

        this.menuButtons.forEach((btn, i) => {
            const by = startY + i * (btnHeight + btnGap);
            btn.y = by;
            btn.bounds = { x: cx - btnWidth / 2, y: by, w: btnWidth, h: btnHeight };

            // Button background
            const isPrimary = i === 0;
            ctx.fillStyle = isPrimary ? COLORS.sunsetGold : COLORS.warmBrown;
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.fill();

            // Button border (rope effect)
            ctx.strokeStyle = isPrimary ? '#D4941E' : '#6B4226';
            ctx.lineWidth = 2;
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.stroke();

            // Button text
            ctx.fillStyle = isPrimary ? COLORS.deepOcean : COLORS.sailCream;
            ctx.font = `bold ${isPrimary ? 20 : 17}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, cx, by + btnHeight / 2);
        });

        // Footer
        ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Drag to aim • Release to fire', cx, canvas.height - 40);
        ctx.fillText('🔊 Sound On', cx, canvas.height - 20);
    }

    drawVictory(winner, stats) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Treasure chest
        ctx.font = '72px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆', cx, cy - 120);

        // Victory title
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 52px "Pirata One", Georgia, serif';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('VICTORY!', cx + 3, cy - 50 + 3);
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('VICTORY!', cx, cy - 50);

        // Winner name
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(`${winner.name} wins!`, cx, cy - 10);

        // Stats card
        if (stats) {
            const cardW = 280;
            const cardH = 140;
            const cardX = cx - cardW / 2;
            const cardY = cy + 20;

            // Card background
            ctx.fillStyle = 'rgba(245, 240, 232, 0.1)';
            this.drawRoundedRect(cardX, cardY, cardW, cardH, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(244, 166, 35, 0.3)';
            ctx.lineWidth = 1;
            this.drawRoundedRect(cardX, cardY, cardW, cardH, 8);
            ctx.stroke();

            ctx.fillStyle = COLORS.sailCream;
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'left';
            const lines = [
                `Rounds: ${stats.rounds}`,
                `Shots Fired: ${stats.shots}`,
                `Accuracy: ${stats.accuracy}%`,
                `Time: ${stats.time}`,
            ];
            lines.forEach((line, i) => {
                ctx.fillText(line, cardX + 20, cardY + 30 + i * 26);
            });
        }

        // Play Again button
        const btnW = 200;
        const btnH = 48;
        const btnY = cy + 180;
        this.playAgainBounds = { x: cx - btnW / 2, y: btnY, w: btnW, h: btnH };

        ctx.fillStyle = COLORS.sunsetGold;
        this.drawRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 8);
        ctx.fill();

        ctx.fillStyle = COLORS.deepOcean;
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Play Again', cx, btnY + btnH / 2);
    }

    drawSettings(settings) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.fillStyle = 'rgba(5, 13, 26, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 36px "Pirata One", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText("⚙️ Captain's Quarters", cx, cy - 100);

        ctx.fillStyle = COLORS.sailCream;
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`Sound: ${settings.sound ? 'ON' : 'OFF'}  •  Click to toggle`, cx, cy - 40);

        ctx.fillText('Press ESC or click to return', cx, cy + 40);

        this.settingsBounds = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    }

    drawFireButton(x, y) {
        const { ctx } = this;
        const w = 90;
        const h = 38;

        ctx.fillStyle = COLORS.sunsetGold;
        this.drawRoundedRect(x - w / 2, y, w, h, 6);
        ctx.fill();

        ctx.strokeStyle = '#D4941E';
        ctx.lineWidth = 2;
        this.drawRoundedRect(x - w / 2, y, w, h, 6);
        ctx.stroke();

        ctx.fillStyle = COLORS.deepOcean;
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥 FIRE!', x, y + h / 2);
    }

    getMenuClick(x, y) {
        for (const btn of this.menuButtons) {
            if (!btn.bounds) continue;
            const b = btn.bounds;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                return btn.mode;
            }
        }
        return null;
    }

    isPlayAgainClick(x, y) {
        if (!this.playAgainBounds) return false;
        const b = this.playAgainBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    drawRoundedRect(x, y, w, h, r) {
        const { ctx } = this;
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
}
