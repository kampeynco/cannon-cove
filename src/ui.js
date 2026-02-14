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
        const h = canvas.height;
        const compact = h < 450;

        // Full overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.97)';
        ctx.fillRect(0, 0, canvas.width, h);

        // Title
        const titleY = compact ? 22 : 38;
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = `bold ${compact ? 26 : 36}px "Pirata One", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('How to Play', cx, titleY);

        // Cards data
        const pages = this._getHelpCards();
        const cards = pages[Math.min(page, pages.length - 1)];

        // Card layout
        const cols = compact ? 2 : (canvas.width > 700 ? 3 : 2);
        const cardGap = compact ? 8 : 14;
        const maxCardW = compact ? 200 : 240;
        const totalW = cols * maxCardW + (cols - 1) * cardGap;
        const gridLeft = cx - totalW / 2;
        const cardStartY = titleY + (compact ? 28 : 50);
        const cardH = compact ? 100 : 130;

        this.htpNextBounds = null;
        this.htpPrevBounds = null;

        cards.forEach((card, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cardX = gridLeft + col * (maxCardW + cardGap);
            const cardY = cardStartY + row * (cardH + cardGap);

            // Card background
            ctx.fillStyle = 'rgba(245, 240, 232, 0.05)';
            this.drawRoundedRect(cardX, cardY, maxCardW, cardH, 10);
            ctx.fill();

            // Accent bar on left
            ctx.fillStyle = card.accent;
            this.drawRoundedRect(cardX, cardY, 4, cardH, 2);
            ctx.fill();

            // Large emoji icon
            ctx.font = `${compact ? 24 : 32}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.icon, cardX + (compact ? 22 : 28), cardY + (compact ? 24 : 30));

            // Card title
            ctx.fillStyle = COLORS.sunsetGold;
            ctx.font = `bold ${compact ? 13 : 16}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.title, cardX + (compact ? 42 : 54), cardY + (compact ? 10 : 14));

            // Card description (wrapped)
            ctx.fillStyle = 'rgba(245, 240, 232, 0.8)';
            ctx.font = `${compact ? 10.5 : 13}px Inter, sans-serif`;
            const descX = cardX + (compact ? 12 : 16);
            const descW = maxCardW - (compact ? 24 : 32);
            let descY = cardY + (compact ? 42 : 50);
            const lines = this._wrapText(card.desc, descW, ctx);
            for (const line of lines) {
                ctx.fillText(line, descX, descY);
                descY += compact ? 13 : 16;
            }
        });

        // Page indicator
        if (pages.length > 1) {
            ctx.fillStyle = 'rgba(245, 240, 232, 0.4)';
            ctx.font = `${compact ? 12 : 14}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${page + 1} / ${pages.length}`, cx, h - (compact ? 48 : 58));

            // Next / Prev buttons
            const navY = h - (compact ? 36 : 46);
            const btnW = compact ? 80 : 100;
            const btnH = compact ? 28 : 34;

            if (page > 0) {
                this.htpPrevBounds = { x: cx - btnW - 60, y: navY, w: btnW, h: btnH };
                ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
                this.drawRoundedRect(this.htpPrevBounds.x, navY, btnW, btnH, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(245, 240, 232, 0.2)';
                ctx.lineWidth = 1;
                this.drawRoundedRect(this.htpPrevBounds.x, navY, btnW, btnH, 6);
                ctx.stroke();
                ctx.fillStyle = COLORS.sailCream;
                ctx.font = `bold ${compact ? 12 : 14}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('← Prev', this.htpPrevBounds.x + btnW / 2, navY + btnH / 2);
            }

            if (page < pages.length - 1) {
                this.htpNextBounds = { x: cx + 60, y: navY, w: btnW, h: btnH };
                ctx.fillStyle = COLORS.sunsetGold;
                this.drawRoundedRect(this.htpNextBounds.x, navY, btnW, btnH, 6);
                ctx.fill();
                ctx.fillStyle = COLORS.deepOcean;
                ctx.font = `bold ${compact ? 12 : 14}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Next →', this.htpNextBounds.x + btnW / 2, navY + btnH / 2);
            }
        }

        // Back button (always)
        const backY = h - (compact ? 36 : 46);
        const backW = compact ? 80 : 100;
        const backH = compact ? 28 : 34;
        this.htpBackBounds = { x: cx - backW / 2, y: backY, w: backW, h: backH };

        ctx.fillStyle = COLORS.warmBrown;
        this.drawRoundedRect(this.htpBackBounds.x, backY, backW, backH, 6);
        ctx.fill();
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = `bold ${compact ? 12 : 14}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← Back', this.htpBackBounds.x + backW / 2, backY + backH / 2);
    }

    _getHelpCards() {
        return [
            [
                {
                    icon: '🎯', title: 'Aim & Fire',
                    desc: 'Drag anywhere on screen to aim your cannon. The direction sets your angle and the drag distance sets power. Release or tap FIRE to launch!',
                    accent: '#F4A623',
                },
                {
                    icon: '💨', title: 'Wind',
                    desc: 'Wind pushes your cannonball mid-flight. Check the arrow and number at the top of the screen, then adjust your aim to compensate.',
                    accent: '#5BA4E6',
                },
                {
                    icon: '⚔️', title: 'Duel Mode',
                    desc: 'Challenge an AI captain in a 1-on-1 artillery battle. Outsmart and outshoot your opponent to sink their ship!',
                    accent: '#E74C3C',
                },
                {
                    icon: '🏴‍☠️', title: 'Crew Battle',
                    desc: 'Grab a friend! Two players take turns on the same device. Perfect for quick head-to-head pirate duels.',
                    accent: '#2ECC71',
                },
                {
                    icon: '👻', title: 'Ghost Fleet',
                    desc: 'Sit back and watch two AI captains battle it out. Great for learning strategy by observing.',
                    accent: '#9B59B6',
                },
                {
                    icon: '⏸️', title: 'Pause',
                    desc: 'Press ESC anytime during gameplay to pause. From there you can toggle sound, exit to menu, or view this guide.',
                    accent: '#95A5A6',
                },
            ],
            [
                {
                    icon: '🔥', title: 'Fire Shot',
                    desc: 'Hit a floating crate to grab this power-up. Your next cannonball deals double damage — devastating!',
                    accent: '#E67E22',
                },
                {
                    icon: '🛡️', title: 'Shield',
                    desc: 'Activates a protective barrier around your ship. The next incoming hit is completely blocked.',
                    accent: '#3498DB',
                },
                {
                    icon: '🌊', title: 'Tidal Wave',
                    desc: 'Dramatically shifts the wind direction and strength. Can throw off your opponent\'s careful aim!',
                    accent: '#1ABC9C',
                },
                {
                    icon: '🏴‍☠️', title: 'Health Flags',
                    desc: 'Each ship has 4 HP shown as flags at the top corners. Pirate flags mean health remaining, skulls mean damage taken.',
                    accent: '#E74C3C',
                },
                {
                    icon: '🔥', title: 'Damage Effects',
                    desc: 'As ships take hits, they show holes, start tilting, emit smoke at 2 HP, and catch fire at 1 HP. Watch for the flames!',
                    accent: '#F39C12',
                },
                {
                    icon: '💡', title: 'Pro Tip',
                    desc: 'Start at ~45° for max range. Aim for floating crates when they appear — power-ups can completely turn the tide of battle!',
                    accent: '#F1C40F',
                },
            ],
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
