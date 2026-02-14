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
            { id: 'duel', label: '⚔️  Duel', subtitle: 'Single Player vs AI', mode: MODES.DUEL, y: 0 },
            { id: 'crew', label: '🏴‍☠️  Crew Battle', subtitle: 'Head to Head', mode: MODES.CREW_BATTLE, y: 0 },
            { id: 'ghost', label: '👻  Ghost Fleet', subtitle: 'Watch AI Battle', mode: MODES.GHOST_FLEET, y: 0 },
        ];
    }

    drawMenu() {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const h = canvas.height;
        const compact = h < 450;
        const tiny = h < 340; // Very short landscape mobile

        // Dim overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
        ctx.fillRect(0, 0, canvas.width, h);

        // Adaptive sizing
        const titleSize = tiny ? 28 : compact ? 40 : 64;
        const btnWidth = tiny ? 200 : compact ? 220 : 280;
        const btnHeight = tiny ? 36 : compact ? 48 : 66;
        const btnGap = tiny ? 5 : compact ? 8 : 12;
        const htpH = tiny ? 24 : compact ? 30 : 36;
        const htpGap = tiny ? 4 : compact ? 8 : 16;
        const taglineH = tiny ? 16 : compact ? 20 : 40;
        const taglineGap = tiny ? 6 : compact ? 10 : 16;

        // Calculate total content height to center vertically
        const totalButtons = this.menuButtons.length * btnHeight + (this.menuButtons.length - 1) * btnGap;
        const totalContent = titleSize + taglineH + taglineGap + totalButtons + htpGap + htpH;
        const topMargin = Math.max(10, (h - totalContent) / 2);

        // Title
        const titleY = topMargin + titleSize / 2;
        ctx.font = `bold ${titleSize}px "Pirata One", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('CANNON COVE', cx + 2, titleY + 2);
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('CANNON COVE', cx, titleY);

        // Tagline
        const tagY = titleY + titleSize / 2 + taglineH / 2 + (tiny ? 2 : 4);
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = `italic ${tiny ? 11 : compact ? 14 : 18}px Inter, sans-serif`;
        ctx.fillText('Aim. Fire. Plunder!', cx, tagY);

        // Anchor (only on tall screens)
        if (!compact) {
            ctx.font = '36px serif';
            ctx.fillStyle = COLORS.sunsetGold;
            ctx.fillText('⚓', cx, titleY + titleSize / 2 + 14);
        }

        // Buttons
        const startY = tagY + taglineH / 2 + taglineGap;

        this.menuButtons.forEach((btn, i) => {
            const by = startY + i * (btnHeight + btnGap);
            btn.y = by;
            btn.bounds = { x: cx - btnWidth / 2, y: by, w: btnWidth, h: btnHeight };

            const isPrimary = i === 0;
            ctx.fillStyle = isPrimary ? COLORS.sunsetGold : COLORS.warmBrown;
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.fill();

            ctx.strokeStyle = isPrimary ? '#D4941E' : '#6B4226';
            ctx.lineWidth = 2;
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.stroke();

            // Button label
            ctx.fillStyle = isPrimary ? COLORS.deepOcean : COLORS.sailCream;
            ctx.font = `bold ${isPrimary ? (tiny ? 13 : compact ? 16 : 20) : (tiny ? 12 : compact ? 14 : 17)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelY = tiny ? by + btnHeight * 0.35 : by + btnHeight * 0.38;
            ctx.fillText(btn.label, cx, labelY);

            // Subtitle
            ctx.fillStyle = isPrimary ? 'rgba(11, 29, 58, 0.6)' : 'rgba(245, 240, 232, 0.55)';
            ctx.font = `${tiny ? 9 : compact ? 10 : 12}px Inter, sans-serif`;
            const subY = tiny ? by + btnHeight * 0.72 : compact ? by + btnHeight * 0.75 : by + btnHeight * 0.72;
            ctx.fillText(btn.subtitle, cx, subY);
        });

        // How to Play button
        const htpW = tiny ? 120 : compact ? 140 : 160;
        const htpY = startY + this.menuButtons.length * (btnHeight + btnGap) + htpGap;
        this.howToPlayBounds = { x: cx - htpW / 2, y: htpY, w: htpW, h: htpH };

        ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
        this.drawRoundedRect(this.howToPlayBounds.x, htpY, htpW, htpH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.25)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(this.howToPlayBounds.x, htpY, htpW, htpH, 6);
        ctx.stroke();

        ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        ctx.font = `${tiny ? 10 : compact ? 12 : 14}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖  How to Play', cx, htpY + htpH / 2);

        // Footer (only on tall screens)
        if (!compact) {
            ctx.fillStyle = 'rgba(245, 240, 232, 0.35)';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText('Drag to aim • Release to fire', cx, h - 20);
        }
    }

    isHowToPlayClick(x, y) {
        if (!this.howToPlayBounds) return false;
        const b = this.howToPlayBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    drawVictory(winner, stats) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const h = canvas.height;
        const compact = h < 450;

        // Overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.8)';
        ctx.fillRect(0, 0, canvas.width, h);

        if (compact) {
            // ── Compact victory layout ──
            // Trophy + title on same row area
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆', cx, h * 0.18);

            ctx.font = 'bold 32px "Pirata One", Georgia, serif';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText('VICTORY!', cx + 2, h * 0.35 + 2);
            ctx.fillStyle = COLORS.sunsetGold;
            ctx.fillText('VICTORY!', cx, h * 0.35);

            ctx.fillStyle = COLORS.sailCream;
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(`${winner.name} wins!`, cx, h * 0.48);

            // Inline stats
            if (stats) {
                ctx.fillStyle = COLORS.sailCream;
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'center';
                const statLine = `Rounds: ${stats.rounds}  •  Shots: ${stats.shots}  •  Accuracy: ${stats.accuracy}%  •  ${stats.time}`;
                ctx.fillText(statLine, cx, h * 0.6);
            }

            // Play Again button
            const btnW = 160;
            const btnH = 38;
            const btnY = h * 0.72;
            this.playAgainBounds = { x: cx - btnW / 2, y: btnY, w: btnW, h: btnH };

            ctx.fillStyle = COLORS.sunsetGold;
            this.drawRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 8);
            ctx.fill();

            ctx.fillStyle = COLORS.deepOcean;
            ctx.font = 'bold 15px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Play Again', cx, btnY + btnH / 2);
        } else {
            // ── Full-size victory layout ──
            const cy = h / 2;

            ctx.font = '72px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆', cx, cy - 120);

            ctx.font = 'bold 52px "Pirata One", Georgia, serif';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText('VICTORY!', cx + 3, cy - 50 + 3);
            ctx.fillStyle = COLORS.sunsetGold;
            ctx.fillText('VICTORY!', cx, cy - 50);

            ctx.fillStyle = COLORS.sailCream;
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.fillText(`${winner.name} wins!`, cx, cy - 10);

            if (stats) {
                const cardW = 280;
                const cardH = 140;
                const cardX = cx - cardW / 2;
                const cardY = cy + 20;

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
    }

    drawSettings(settings) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dim overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 32px "Pirata One", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("⚙️ Paused", cx, cy - 100);

        // Buttons
        const btnWidth = 220;
        const btnHeight = 48;
        const btnGap = 14;
        const startY = cy - 30;

        this.pauseButtons = [];

        const buttons = [
            { id: 'sound', label: `🔊 Sound: ${settings.sound ? 'ON' : 'OFF'}` },
            { id: 'howtoplay', label: '📖  How to Play' },
            { id: 'exit', label: '🚪 Exit to Menu' },
            { id: 'resume', label: '▶️  Resume Game' },
        ];

        buttons.forEach((btn, i) => {
            const by = startY + i * (btnHeight + btnGap);
            const bounds = { x: cx - btnWidth / 2, y: by, w: btnWidth, h: btnHeight };

            // Button background
            const isResume = btn.id === 'resume';
            const isExit = btn.id === 'exit';
            const isHtp = btn.id === 'howtoplay';
            ctx.fillStyle = isResume ? COLORS.sunsetGold : isExit ? '#8B2020' : isHtp ? '#1A3A5C' : COLORS.warmBrown;
            this.drawRoundedRect(bounds.x, bounds.y, btnWidth, btnHeight, 8);
            ctx.fill();

            // Button border
            ctx.strokeStyle = isResume ? '#D4941E' : isExit ? '#5C1010' : isHtp ? '#0F2840' : '#6B4226';
            ctx.lineWidth = 2;
            this.drawRoundedRect(bounds.x, bounds.y, btnWidth, btnHeight, 8);
            ctx.stroke();

            // Button label
            ctx.fillStyle = isResume ? COLORS.deepOcean : COLORS.sailCream;
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, cx, by + btnHeight / 2);

            this.pauseButtons.push({ ...btn, bounds });
        });

        // Hint
        ctx.fillStyle = 'rgba(245, 240, 232, 0.4)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Press ESC to resume', cx, startY + buttons.length * (btnHeight + btnGap) + 20);
    }

    getPauseClick(x, y) {
        if (!this.pauseButtons) return null;
        for (const btn of this.pauseButtons) {
            const b = btn.bounds;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                return btn.id;
            }
        }
        return null;
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

    drawHowToPlay(page = 0) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const w = canvas.width;
        const h = canvas.height;
        const compact = h < 450;
        const tiny = h < 340;

        // Full overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.97)';
        ctx.fillRect(0, 0, w, h);

        // Title
        const titleSize = tiny ? 20 : compact ? 26 : 36;
        const titleY = tiny ? 16 : compact ? 22 : 38;
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = `bold ${titleSize}px "Pirata One", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('How to Play', cx, titleY);

        // Layout: 1 column on mobile, 2 on desktop/tablet
        const cols = compact ? 1 : 2;
        const cardGap = tiny ? 5 : compact ? 7 : 12;
        const cardH = tiny ? 64 : compact ? 76 : 120;
        const navAreaH = tiny ? 36 : compact ? 42 : 52;
        const cardStartY = titleY + (tiny ? 16 : compact ? 24 : 44);
        const availH = h - cardStartY - navAreaH - 6;
        const rowsPerPage = Math.max(1, Math.floor((availH + cardGap) / (cardH + cardGap)));
        const cardsPerPage = rowsPerPage * cols;

        const margin = tiny ? 14 : compact ? 20 : 40;
        const maxGridW = Math.min(w - margin * 2, compact ? 400 : 640);
        const cardW = cols === 1 ? maxGridW : (maxGridW - cardGap) / 2;
        const gridLeft = cx - maxGridW / 2;

        // Paginate from flat card list
        const allCards = this._getAllCards();
        const totalPages = Math.ceil(allCards.length / cardsPerPage);
        const safePage = Math.min(page, totalPages - 1);
        const pageCards = allCards.slice(safePage * cardsPerPage, safePage * cardsPerPage + cardsPerPage);

        this.htpNextBounds = null;
        this.htpPrevBounds = null;
        this._htpTotalPages = totalPages;

        pageCards.forEach((card, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cardX = gridLeft + col * (cardW + cardGap);
            const cardY = cardStartY + row * (cardH + cardGap);

            ctx.fillStyle = 'rgba(245, 240, 232, 0.05)';
            this.drawRoundedRect(cardX, cardY, cardW, cardH, 10);
            ctx.fill();

            ctx.fillStyle = card.accent;
            this.drawRoundedRect(cardX, cardY, 4, cardH, 2);
            ctx.fill();

            const iconSize = tiny ? 16 : compact ? 20 : 28;
            const iconX = cardX + (tiny ? 14 : compact ? 18 : 24);
            const iconY = cardY + (tiny ? 14 : compact ? 18 : 24);
            ctx.font = `${iconSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.icon, iconX, iconY);

            ctx.fillStyle = COLORS.sunsetGold;
            ctx.font = `bold ${tiny ? 11 : compact ? 13 : 15}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.title, iconX + iconSize / 2 + 6, iconY);

            ctx.fillStyle = 'rgba(245, 240, 232, 0.78)';
            const descFont = tiny ? 9.5 : compact ? 11 : 13;
            ctx.font = `${descFont}px Inter, sans-serif`;
            ctx.textBaseline = 'top';
            const descX = cardX + (tiny ? 10 : compact ? 12 : 16);
            const descW = cardW - (tiny ? 20 : compact ? 24 : 32);
            let descY = iconY + iconSize / 2 + (tiny ? 3 : compact ? 5 : 8);
            const lines = this._wrapText(card.desc, descW, ctx);
            for (const line of lines) {
                if (descY + descFont > cardY + cardH - 3) break;
                ctx.fillText(line, descX, descY);
                descY += tiny ? 11 : compact ? 13 : 16;
            }
        });

        // Navigation bar
        const navY = h - navAreaH;
        const btnW = tiny ? 60 : compact ? 72 : 100;
        const btnH = tiny ? 24 : compact ? 28 : 34;
        const btnFont = tiny ? 10 : compact ? 12 : 14;

        // Page indicator
        ctx.fillStyle = 'rgba(245, 240, 232, 0.35)';
        ctx.font = `${tiny ? 9 : compact ? 10 : 12}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${safePage + 1} / ${totalPages}`, cx, navY + btnH / 2);

        if (safePage > 0) {
            this.htpPrevBounds = { x: cx - btnW - 40, y: navY, w: btnW, h: btnH };
            ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
            this.drawRoundedRect(this.htpPrevBounds.x, navY, btnW, btnH, 6);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 240, 232, 0.2)';
            ctx.lineWidth = 1;
            this.drawRoundedRect(this.htpPrevBounds.x, navY, btnW, btnH, 6);
            ctx.stroke();
            ctx.fillStyle = COLORS.sailCream;
            ctx.font = `bold ${btnFont}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('← Prev', this.htpPrevBounds.x + btnW / 2, navY + btnH / 2);
        }

        if (safePage < totalPages - 1) {
            this.htpNextBounds = { x: cx + 40, y: navY, w: btnW, h: btnH };
            ctx.fillStyle = COLORS.sunsetGold;
            this.drawRoundedRect(this.htpNextBounds.x, navY, btnW, btnH, 6);
            ctx.fill();
            ctx.fillStyle = COLORS.deepOcean;
            ctx.font = `bold ${btnFont}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Next →', this.htpNextBounds.x + btnW / 2, navY + btnH / 2);
        }

        // Back button (bottom-left)
        const backW = tiny ? 56 : compact ? 66 : 86;
        this.htpBackBounds = { x: 14, y: navY, w: backW, h: btnH };
        ctx.fillStyle = COLORS.warmBrown;
        this.drawRoundedRect(this.htpBackBounds.x, navY, backW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = `bold ${btnFont}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← Back', this.htpBackBounds.x + backW / 2, navY + btnH / 2);
    }

    _getAllCards() {
        return [
            { icon: '🎯', title: 'Aim & Fire', desc: 'Drag on screen to aim your cannon. Direction sets angle, drag distance sets power. Release or tap FIRE to launch!', accent: '#F4A623' },
            { icon: '💨', title: 'Wind', desc: 'Wind pushes your cannonball mid-flight. Check the arrow at the top of the screen, then adjust your aim.', accent: '#5BA4E6' },
            { icon: '⚔️', title: 'Duel Mode', desc: 'Challenge an AI captain in a 1-on-1 artillery battle. Outsmart your opponent to sink their ship!', accent: '#E74C3C' },
            { icon: '🏴‍☠️', title: 'Crew Battle', desc: 'Grab a friend! Two players take turns on the same device for head-to-head pirate duels.', accent: '#2ECC71' },
            { icon: '👻', title: 'Ghost Fleet', desc: 'Sit back and watch two AI captains battle it out. Great for learning strategy.', accent: '#9B59B6' },
            { icon: '⏸️', title: 'Pause', desc: 'Press ESC anytime to pause. Toggle sound, exit to menu, or view this guide.', accent: '#95A5A6' },
            { icon: '🔥', title: 'Fire Shot', desc: 'Hit a floating crate to grab this power-up. Your next cannonball deals double damage!', accent: '#E67E22' },
            { icon: '🛡️', title: 'Shield', desc: 'Activates a barrier around your ship. The next incoming hit is completely blocked.', accent: '#3498DB' },
            { icon: '🌊', title: 'Tidal Wave', desc: 'Dramatically shifts the wind direction and strength. Throws off your opponent\'s aim!', accent: '#1ABC9C' },
            { icon: '🏴‍☠️', title: 'Health Flags', desc: 'Each ship has 4 HP shown as flags at the top corners. Pirate flags = health, skulls = damage.', accent: '#E74C3C' },
            { icon: '💥', title: 'Damage Effects', desc: 'Ships show holes, tilt, emit smoke at 2 HP, and catch fire at 1 HP. Watch for the flames!', accent: '#F39C12' },
            { icon: '💡', title: 'Pro Tip', desc: 'Start at ~45° for max range. Grab floating crates — power-ups can turn the tide of battle!', accent: '#F1C40F' },
        ];
    }

    _wrapText(text, maxWidth, ctx) {
        const words = text.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    getHowToPlayClick(x, y) {
        if (this.htpBackBounds) {
            const b = this.htpBackBounds;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'back';
        }
        if (this.htpNextBounds) {
            const b = this.htpNextBounds;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'next';
        }
        if (this.htpPrevBounds) {
            const b = this.htpPrevBounds;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'prev';
        }
        return null;
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
