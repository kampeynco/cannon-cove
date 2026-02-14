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

        // Dim overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
        ctx.fillRect(0, 0, canvas.width, h);

        // Title
        const titleSize = compact ? 40 : 64;
        const titleY = compact ? h * 0.15 : h / 2 - 140;
        ctx.font = `bold ${titleSize}px "Pirata One", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('CANNON COVE', cx + 2, titleY + 2);
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('CANNON COVE', cx, titleY);

        if (!compact) {
            // Anchor decoration
            ctx.font = '36px serif';
            ctx.fillText('⚓', cx, h / 2 - 80);

            // Tagline
            ctx.fillStyle = COLORS.sailCream;
            ctx.font = 'italic 18px Inter, sans-serif';
            ctx.fillText('Aim. Fire. Plunder!', cx, h / 2 - 50);
        } else {
            // Compact tagline
            ctx.fillStyle = COLORS.sailCream;
            ctx.font = 'italic 14px Inter, sans-serif';
            ctx.fillText('Aim. Fire. Plunder!', cx, titleY + titleSize * 0.6);
        }

        // Buttons — scale to fit
        const btnWidth = compact ? 220 : 280;
        const btnHeight = compact ? 48 : 66;
        const btnGap = compact ? 8 : 12;
        const totalBtnHeight = this.menuButtons.length * btnHeight + (this.menuButtons.length - 1) * btnGap;
        const startY = compact
            ? h * 0.38
            : h / 2 - 15;

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
            ctx.font = `bold ${isPrimary ? (compact ? 16 : 20) : (compact ? 14 : 17)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelY = compact ? by + btnHeight * 0.38 : by + btnHeight * 0.38;
            ctx.fillText(btn.label, cx, labelY);

            // Subtitle
            ctx.fillStyle = isPrimary ? 'rgba(11, 29, 58, 0.6)' : 'rgba(245, 240, 232, 0.55)';
            ctx.font = `${compact ? 10 : 12}px Inter, sans-serif`;
            const subY = compact ? by + btnHeight * 0.75 : by + btnHeight * 0.72;
            ctx.fillText(btn.subtitle, cx, subY);
        });

        // How to Play button
        const htpW = compact ? 140 : 160;
        const htpH = compact ? 30 : 36;
        const htpY = startY + this.menuButtons.length * (btnHeight + btnGap) + (compact ? 8 : 16);
        this.howToPlayBounds = { x: cx - htpW / 2, y: htpY, w: htpW, h: htpH };

        ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
        this.drawRoundedRect(this.howToPlayBounds.x, htpY, htpW, htpH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.25)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(this.howToPlayBounds.x, htpY, htpW, htpH, 6);
        ctx.stroke();

        ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        ctx.font = `${compact ? 12 : 14}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖  How to Play', cx, htpY + htpH / 2);

        // Footer
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
        const margin = compact ? 20 : 40;
        const contentW = Math.min(canvas.width - margin * 2, 600);
        const leftX = cx - contentW / 2;

        ctx.fillStyle = 'rgba(5, 13, 26, 0.96)';
        ctx.fillRect(0, 0, canvas.width, h);

        const titleY = compact ? 24 : 40;
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = `bold ${compact ? 24 : 32}px "Pirata One", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖 How to Play', cx, titleY);

        ctx.strokeStyle = 'rgba(244, 166, 35, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, titleY + 20);
        ctx.lineTo(leftX + contentW, titleY + 20);
        ctx.stroke();

        const pages = this._getHelpPages();
        const currentPage = pages[Math.min(page, pages.length - 1)];
        let y = titleY + (compact ? 30 : 44);

        for (const section of currentPage) {
            ctx.fillStyle = COLORS.sunsetGold;
            ctx.font = `bold ${compact ? 13 : 16}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(section.title, leftX, y);
            y += compact ? 16 : 22;

            ctx.fillStyle = COLORS.sailCream;
            ctx.font = `${compact ? 11 : 13}px Inter, sans-serif`;
            for (const item of section.items) {
                const lines = this._wrapText(item, contentW - 16, ctx);
                for (const line of lines) {
                    ctx.fillText(line, leftX + 8, y);
                    y += compact ? 14 : 17;
                }
                y += 2;
            }
            y += compact ? 6 : 12;
        }

        // Page indicator
        if (pages.length > 1) {
            ctx.fillStyle = 'rgba(245, 240, 232, 0.4)';
            ctx.font = `${compact ? 11 : 13}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Page ${page + 1} of ${pages.length}`, cx, h - (compact ? 48 : 62));
        }

        // Nav buttons
        const navY = h - (compact ? 36 : 46);
        const btnW = compact ? 90 : 110;
        const btnH = compact ? 28 : 34;

        this.htpBackBounds = { x: cx - btnW / 2, y: navY, w: btnW, h: btnH };
        this.htpNextBounds = null;
        this.htpPrevBounds = null;

        if (pages.length > 1) {
            this.htpBackBounds.x = cx - btnW / 2;
            if (page > 0) {
                this.htpPrevBounds = { x: cx - btnW * 1.7, y: navY, w: btnW, h: btnH };
                ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
                this.drawRoundedRect(this.htpPrevBounds.x, navY, btnW, btnH, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(245, 240, 232, 0.25)';
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
                this.htpNextBounds = { x: cx + btnW * 0.7, y: navY, w: btnW, h: btnH };
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

        // Back button
        ctx.fillStyle = COLORS.warmBrown;
        this.drawRoundedRect(this.htpBackBounds.x, navY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = `bold ${compact ? 12 : 14}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← Back', this.htpBackBounds.x + btnW / 2, navY + btnH / 2);
    }

    _getHelpPages() {
        return [
            [
                {
                    title: '🎯 Controls',
                    items: [
                        '• Drag on the screen to aim your cannon — direction sets the angle, distance sets the power.',
                        '• Release to fire your cannonball at the enemy ship.',
                        '• Tap the FIRE button to launch when ready.',
                        '• Press ESC to open the pause menu at any time.',
                    ],
                },
                {
                    title: '🎮 Game Modes',
                    items: [
                        '⚔️ Duel — Challenge the AI captain in a 1v1 artillery battle.',
                        '🏴‍☠️ Crew Battle — Play with a friend on the same device.',
                        '👻 Ghost Fleet — Watch two AI captains battle it out.',
                    ],
                },
                {
                    title: '💨 Wind',
                    items: [
                        '• Wind pushes your cannonball left or right during flight.',
                        '• Check the indicator at the top — arrows show direction, number shows strength.',
                        '• Adjust your aim to compensate! Wind changes each round.',
                    ],
                },
            ],
            [
                {
                    title: '🎁 Power-Ups',
                    items: [
                        '• Floating crates appear on the water between ships.',
                        '• Hit a crate with your cannonball to collect its power-up.',
                        '🔥 Fire Shot — Deals double damage to the enemy ship.',
                        '🛡️ Shield — Blocks the next incoming hit.',
                        '🌊 Tidal Wave — Shifts the wind dramatically.',
                    ],
                },
                {
                    title: '💡 Strategy Tips',
                    items: [
                        '• Start with ~45° angle for maximum range, then adjust.',
                        '• Strong wind can carry your shot off course — compensate!',
                        '• Aim for power-up crates — they can turn the tide of battle.',
                        '• Ships tilt and catch fire as they take damage.',
                        '• Each ship has 4 HP shown as flags at the top.',
                    ],
                },
                {
                    title: '📊 HUD Guide',
                    items: [
                        '• Top corners: Player health (🏴‍☠️ = alive, ☠️ = lost).',
                        '• Top center: Round number and wind speed/direction.',
                        '• Bottom center: FIRE button (during your turn).',
                        '• Bottom right: ESC = Pause reminder.',
                    ],
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
