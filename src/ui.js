import { COLORS, STATES, MODES, SHIP } from './constants.js';
import { isAuthenticatedSync, getCachedUsername } from './supabase.js';

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
            { id: 'high_seas', label: '🌊  High Seas', subtitle: 'Online Battle', mode: MODES.HIGH_SEAS, y: 0 },
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


        // Buttons
        const startY = tagY + taglineH / 2 + taglineGap;

        this.menuButtons.forEach((btn, i) => {
            const by = startY + i * (btnHeight + btnGap);
            btn.y = by;
            btn.bounds = { x: cx - btnWidth / 2, y: by, w: btnWidth, h: btnHeight };

            const isPrimary = i === 0;
            const isOnline = btn.id === 'high_seas';
            const isGhost = btn.id === 'ghost';

            if (isOnline) {
                ctx.fillStyle = '#1A6FB5';
            } else if (isGhost) {
                ctx.fillStyle = '#1A4D5C';
            } else {
                ctx.fillStyle = isPrimary ? COLORS.sunsetGold : '#2A2A2A';
            }
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.fill();

            ctx.strokeStyle = isOnline ? '#135A8E' : isGhost ? '#134048' : (isPrimary ? '#D4941E' : '#444444');
            ctx.lineWidth = 2;
            this.drawRoundedRect(cx - btnWidth / 2, by, btnWidth, btnHeight, 8);
            ctx.stroke();

            // Button label
            ctx.fillStyle = (isPrimary || isOnline) ? '#FFFFFF' : COLORS.sailCream;
            ctx.font = `bold ${isPrimary ? (tiny ? 13 : compact ? 16 : 20) : (tiny ? 12 : compact ? 14 : 17)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelY = tiny ? by + btnHeight * 0.35 : by + btnHeight * 0.38;
            ctx.fillText(btn.label, cx, labelY);

            // Subtitle
            ctx.fillStyle = (isPrimary || isOnline) ? 'rgba(255, 255, 255, 0.6)' : 'rgba(245, 240, 232, 0.7)';
            ctx.font = `${tiny ? 9 : compact ? 10 : 12}px Inter, sans-serif`;
            const subY = tiny ? by + btnHeight * 0.72 : compact ? by + btnHeight * 0.75 : by + btnHeight * 0.72;
            ctx.fillText(btn.subtitle, cx, subY);
        });
        // Desktop: top-right nav bar for secondary links
        // Only show on wide non-touch screens (excludes phones and tablets)
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        const isDesktop = canvas.width >= 1024 && !isTouchDevice;

        if (isDesktop) {
            // Top-right navigation bar
            const navY = 30;
            const navFontSize = 14;
            ctx.font = `${navFontSize}px Inter, sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';

            const navItems = [];
            const navPadding = 28;
            let cursorX = canvas.width - 30;

            // Sign-in / Username + Sign-out (rightmost)
            if (isAuthenticatedSync()) {
                // Sign Out link
                const soText = 'Sign Out';
                const soW = ctx.measureText(soText).width + 16;
                this._menuSignOutBounds = { x: cursorX - soW, y: navY - 12, w: soW, h: 24 };
                ctx.fillStyle = '#F5F0E8';
                ctx.fillText(soText, cursorX, navY);
                cursorX -= soW + navPadding;

                // Username
                const name = getCachedUsername() || 'Captain';
                const nameText = `⚓ ${name}`;
                const nameW = ctx.measureText(nameText).width + 16;
                this._menuUsernameBounds = { x: cursorX - nameW, y: navY - 12, w: nameW, h: 24 };
                ctx.fillStyle = '#F5F0E8';
                ctx.fillText(nameText, cursorX, navY);
                cursorX -= nameW + navPadding;

                this._menuSignInBounds = null;
            } else {
                const signText = 'Sign In / Sign Up';
                const signW = ctx.measureText(signText).width + 16;
                this._menuSignInBounds = { x: cursorX - signW, y: navY - 12, w: signW, h: 24 };
                ctx.fillStyle = COLORS.sunsetGold;
                ctx.fillText(signText, cursorX, navY);
                cursorX -= signW + navPadding;

                this._menuSignOutBounds = null;
                this._menuUsernameBounds = null;
            }

            // Separator dot
            ctx.fillStyle = 'rgba(245, 240, 232, 0.25)';
            ctx.fillText('·', cursorX + navPadding / 2 - 2, navY);

            // Leaderboard
            const lbText = 'Leaderboard';
            const lbW = ctx.measureText(lbText).width + 16;
            this._leaderboardBounds = { x: cursorX - lbW, y: navY - 12, w: lbW, h: 24 };
            ctx.fillStyle = '#F5F0E8';
            ctx.fillText(lbText, cursorX, navY);
            cursorX -= lbW + navPadding;

            // Separator dot
            ctx.fillStyle = 'rgba(245, 240, 232, 0.25)';
            ctx.fillText('·', cursorX + navPadding / 2 - 2, navY);

            // How to Play
            const htpText = 'How to Play';
            const htpW = ctx.measureText(htpText).width + 16;
            this.howToPlayBounds = { x: cursorX - htpW, y: navY - 12, w: htpW, h: 24 };
            ctx.fillStyle = '#F5F0E8';
            ctx.fillText(htpText, cursorX, navY);
        } else {
            // Mobile: centered buttons below game modes
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

            // Leaderboard button
            const lbY = htpY + htpH + (tiny ? 6 : 8);
            this._leaderboardBounds = { x: cx - htpW / 2, y: lbY, w: htpW, h: htpH };

            ctx.fillStyle = 'rgba(245, 240, 232, 0.08)';
            this.drawRoundedRect(this._leaderboardBounds.x, lbY, htpW, htpH, 6);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 240, 232, 0.25)';
            ctx.lineWidth = 1;
            this.drawRoundedRect(this._leaderboardBounds.x, lbY, htpW, htpH, 6);
            ctx.stroke();

            ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
            ctx.font = `${tiny ? 10 : compact ? 12 : 14}px Inter, sans-serif`;
            ctx.fillText('🏆  Leaderboard', cx, lbY + htpH / 2);

            // Sign-in link (guests) or username display (authenticated)
            const signInY = lbY + htpH + (tiny ? 14 : 22);
            ctx.font = `${tiny ? 10 : compact ? 12 : 13}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isAuthenticatedSync()) {
                const name = getCachedUsername() || 'Captain';
                ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
                ctx.fillText(`⚓  ${name}`, cx, signInY);
                const nameW = Math.max(ctx.measureText(`⚓  ${name}`).width + 16, 100);
                this._menuUsernameBounds = { x: cx - nameW / 2, y: signInY - 10, w: nameW, h: 20 };
                this._menuSignInBounds = null;

                // Sign out link
                const signOutY = signInY + (tiny ? 16 : 20);
                ctx.fillStyle = 'rgba(245, 240, 232, 0.55)';
                ctx.font = `${tiny ? 9 : 11}px Inter, sans-serif`;
                ctx.fillText('Sign Out', cx, signOutY);
                const soW = tiny ? 60 : 70;
                this._menuSignOutBounds = { x: cx - soW / 2, y: signOutY - 10, w: soW, h: 20 };
            } else {
                ctx.fillStyle = COLORS.sunsetGold;
                ctx.fillText('⚓  Sign In / Sign Up', cx, signInY);
                const signInW = tiny ? 120 : 150;
                this._menuSignInBounds = { x: cx - signInW / 2, y: signInY - 10, w: signInW, h: 20 };
                this._menuSignOutBounds = null;
                this._menuUsernameBounds = null;
            }
        }

        // Footer (only on tall screens)
        if (!compact) {
            ctx.fillStyle = 'rgba(245, 240, 232, 0.55)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Drag to aim • Release to fire', cx, h - 20);
        }
    }

    isHowToPlayClick(x, y) {
        if (!this.howToPlayBounds) return false;
        const b = this.howToPlayBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    isMenuSignInClick(x, y) {
        if (!this._menuSignInBounds) return false;
        const b = this._menuSignInBounds;
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
            const isSound = btn.id === 'sound';
            ctx.fillStyle = isResume ? COLORS.sunsetGold : isExit ? '#1A1A1A' : isHtp ? '#1A3A5C' : isSound ? '#1A4D5C' : '#2A2A2A';
            this.drawRoundedRect(bounds.x, bounds.y, btnWidth, btnHeight, 8);
            ctx.fill();

            // Button border
            ctx.strokeStyle = isResume ? '#D4941E' : isExit ? '#333333' : isHtp ? '#0F2840' : isSound ? '#134048' : '#444444';
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
        ctx.fillStyle = '#2A2A2A';
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

    drawSignInPrompt() {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Modal dimensions
        const mw = Math.min(380, canvas.width - 40);
        const mh = 280;
        const mx = cx - mw / 2;
        const my = cy - mh / 2;

        // Modal background (parchment feel)
        this.drawRoundedRect(mx, my, mw, mh, 16);
        ctx.fillStyle = '#1A2A3A';
        ctx.fill();
        ctx.strokeStyle = COLORS.sunsetGold;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow border
        this.drawRoundedRect(mx + 3, my + 3, mw - 6, mh - 6, 13);
        ctx.strokeStyle = 'rgba(244, 166, 35, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Header emoji
        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚓', cx, my + 48);

        // Title
        ctx.font = 'bold 24px "Pirata One", Georgia, serif';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('Save Your Progress!', cx, my + 80);

        // Subtitle
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        ctx.fillText('Sign in to save your stats and', cx, my + 108);
        ctx.fillText('climb the leaderboard!', cx, my + 126);

        // Google button
        const btnW = mw - 60;
        const btnH = 40;
        const googleY = my + 148;
        this.drawRoundedRect(cx - btnW / 2, googleY, btnW, btnH, 8);
        ctx.fillStyle = '#4285F4';
        ctx.fill();
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('🔵  Sign in with Google', cx, googleY + 26);

        // Email button
        const emailY = googleY + btnH + 12;
        this.drawRoundedRect(cx - btnW / 2, emailY, btnW, btnH, 8);
        ctx.fillStyle = '#2A4A2A';
        ctx.fill();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('✉️  Sign in with Email', cx, emailY + 26);

        // Skip link
        const skipY = emailY + btnH + 24;
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
        ctx.fillText('Maybe Later', cx, skipY);

        // Store bounds for click detection
        this._signInBounds = {
            google: { x: cx - btnW / 2, y: googleY, w: btnW, h: btnH },
            email: { x: cx - btnW / 2, y: emailY, w: btnW, h: btnH },
            skip: { x: cx - 60, y: skipY - 14, w: 120, h: 20 },
        };
    }

    getSignInClick(x, y) {
        if (!this._signInBounds) return null;
        const { google, email, skip } = this._signInBounds;
        if (x >= google.x && x <= google.x + google.w && y >= google.y && y <= google.y + google.h) return 'google';
        if (x >= email.x && x <= email.x + email.w && y >= email.y && y <= email.y + email.h) return 'email';
        if (x >= skip.x && x <= skip.x + skip.w && y >= skip.y && y <= skip.y + skip.h) return 'skip';
        return null;
    }

    isLeaderboardClick(x, y) {
        if (!this._leaderboardBounds) return false;
        const b = this._leaderboardBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    drawLeaderboard(entries) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const w = canvas.width;
        const h = canvas.height;
        const compact = h < 600;
        const safeEntries = entries || [];

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
        ctx.fillRect(0, 0, w, h);

        // Modal
        const modalW = Math.min(460, w - 40);
        const modalH = Math.min(500, h - 60);
        const modalX = cx - modalW / 2;
        const modalY = (h - modalH) / 2;

        ctx.fillStyle = 'rgba(15, 40, 71, 0.95)';
        this.drawRoundedRect(modalX, modalY, modalW, modalH, 16);
        ctx.fill();
        ctx.strokeStyle = COLORS.sunsetGold;
        ctx.lineWidth = 2;
        this.drawRoundedRect(modalX, modalY, modalW, modalH, 16);
        ctx.stroke();

        // Title
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = `bold ${compact ? 20 : 26}px 'Pirata One', cursive`;
        ctx.fillText('🏆 Leaderboard', cx, modalY + (compact ? 28 : 36));

        // Column headers
        const headerY = modalY + (compact ? 56 : 72);
        ctx.font = `bold ${compact ? 11 : 12}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(245, 240, 232, 0.65)';
        ctx.textAlign = 'left';
        ctx.fillText('RANK', modalX + 20, headerY);
        ctx.fillText('PLAYER', modalX + 70, headerY);
        ctx.textAlign = 'center';
        ctx.fillText('Wins', modalX + modalW - 140, headerY);
        ctx.fillText('WIN%', modalX + modalW - 85, headerY);
        ctx.fillText('ACC%', modalX + modalW - 30, headerY);

        // Divider
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(modalX + 16, headerY + 12);
        ctx.lineTo(modalX + modalW - 16, headerY + 12);
        ctx.stroke();

        // Entries
        const rowH = compact ? 28 : 32;
        const startRowY = headerY + 24;
        const maxRows = Math.min(safeEntries.length, Math.floor((modalY + modalH - startRowY - 50) / rowH));

        const medals = ['🥇', '🥈', '🥉'];

        for (let i = 0; i < maxRows; i++) {
            const e = safeEntries[i];
            const rowY = startRowY + i * rowH;

            // Alternate row bg
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(245, 240, 232, 0.04)';
                ctx.fillRect(modalX + 12, rowY - rowH / 2 + 4, modalW - 24, rowH);
            }

            ctx.font = `${compact ? 12 : 14}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillStyle = i < 3 ? COLORS.sunsetGold : COLORS.sailCream;
            ctx.fillText(medals[i] || `#${e.rank}`, modalX + 20, rowY);

            const name = e.username || 'Anonymous';
            ctx.fillStyle = COLORS.sailCream;
            ctx.fillText(name.length > 16 ? name.slice(0, 15) + '…' : name, modalX + 70, rowY);

            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(245, 240, 232, 0.8)';
            ctx.fillText(e.total_wins, modalX + modalW - 140, rowY);
            ctx.fillText(`${e.win_rate}%`, modalX + modalW - 85, rowY);
            ctx.fillText(`${Math.round(e.accuracy_pct)}%`, modalX + modalW - 30, rowY);
        }

        if (entries === null) {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('Loading...', cx, startRowY + 50);
        } else if (safeEntries.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(245, 240, 232, 0.4)';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('No ranked captains yet.', cx, startRowY + 40);
            ctx.fillText('Play 5+ games to appear!', cx, startRowY + 62);
        }

        // Back button
        const backY = modalY + modalH - (compact ? 30 : 38);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('←  Back to Menu', cx, backY);
        this._leaderboardBackBounds = { x: cx - 80, y: backY - 12, w: 160, h: 24 };
    }

    getLeaderboardClick(x, y) {
        if (!this._leaderboardBackBounds) return null;
        const b = this._leaderboardBackBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'back';
        return null;
    }

    isMenuSignOutClick(x, y) {
        if (!this._menuSignOutBounds) return false;
        const b = this._menuSignOutBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    isMenuUsernameClick(x, y) {
        if (!this._menuUsernameBounds) return false;
        const b = this._menuUsernameBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    drawProfileSetup(captainName = '', avatarPreviewUrl = null) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Modal
        const mw = Math.min(400, canvas.width - 40);
        const mh = 380;
        const mx = cx - mw / 2;
        const my = cy - mh / 2;

        this.drawRoundedRect(mx, my, mw, mh, 16);
        ctx.fillStyle = '#1A2A3A';
        ctx.fill();
        ctx.strokeStyle = COLORS.sunsetGold;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow
        this.drawRoundedRect(mx + 3, my + 3, mw - 6, mh - 6, 13);
        ctx.strokeStyle = 'rgba(244, 166, 35, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Header
        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏴‍☠️', cx, my + 40);

        ctx.font = 'bold 22px "Pirata One", Georgia, serif';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('Name Yer Ship, Captain!', cx, my + 72);

        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        ctx.fillText('Choose a captain name for the leaderboard', cx, my + 94);

        // Avatar area (clickable for upload)
        const avatarY = my + 112;
        const avatarSize = 56;
        const avatarCenterY = avatarY + avatarSize / 2;
        const avatarX = cx - avatarSize / 2;

        if (avatarPreviewUrl) {
            // Create/update cached Image when URL changes
            if (!this._avatarImg || this._avatarImg._src !== avatarPreviewUrl) {
                this._avatarImg = new Image();
                this._avatarImg._src = avatarPreviewUrl;
                this._avatarImg._loaded = false;
                this._avatarImg.onload = () => { this._avatarImg._loaded = true; };
                this._avatarImg.src = avatarPreviewUrl;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();

            if (this._avatarImg._loaded) {
                // Cover-fit: crop from center to fill circle
                const img = this._avatarImg;
                const iw = img.naturalWidth;
                const ih = img.naturalHeight;
                const scale = Math.max(avatarSize / iw, avatarSize / ih);
                const sw = avatarSize / scale;
                const sh = avatarSize / scale;
                const sx = (iw - sw) / 2;
                const sy = (ih - sh) / 2;
                ctx.drawImage(img, sx, sy, sw, sh, avatarX, avatarY, avatarSize, avatarSize);
            } else {
                ctx.fillStyle = '#2A4A6A';
                ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
            }
            ctx.restore();

            ctx.beginPath();
            ctx.arc(cx, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.sunsetGold;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(cx, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#2A4A6A';
            ctx.fill();
            ctx.strokeStyle = 'rgba(244, 166, 35, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = '24px serif';
            ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
            ctx.fillText('📷', cx, avatarCenterY + 2);
        }

        // Avatar click bounds
        this._profileAvatarBounds = { x: avatarX, y: avatarY, w: avatarSize, h: avatarSize };

        // "Tap to upload" hint
        const uploadY = avatarY + avatarSize + 14;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = 'rgba(244, 166, 35, 0.6)';
        ctx.fillText('Tap to upload photo', cx, uploadY);
        const uploadW = 130;
        this._profileUploadBounds = { x: cx - uploadW / 2, y: uploadY - 10, w: uploadW, h: 20 };

        // Captain name input area
        const inputY = uploadY + 24;
        const inputW = mw - 80;
        const inputH = 36;
        const inputX = cx - inputW / 2;
        this.drawRoundedRect(inputX, inputY, inputW, inputH, 8);
        ctx.fillStyle = 'rgba(15, 40, 71, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Name text or placeholder
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        if (captainName) {
            ctx.fillStyle = COLORS.sailCream;
            ctx.fillText(captainName, cx, inputY + inputH / 2 + 1);
        } else {
            ctx.fillStyle = 'rgba(245, 240, 232, 0.35)';
            ctx.fillText('Enter captain name...', cx, inputY + inputH / 2 + 1);
        }
        this._profileNameBounds = { x: inputX, y: inputY, w: inputW, h: inputH };

        // "Set Sail!" button
        const btnW = mw - 80;
        const btnH = 40;
        const btnY = inputY + inputH + 16;
        this.drawRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 8);
        const canConfirm = captainName.length >= 2;
        ctx.fillStyle = canConfirm ? COLORS.sunsetGold : 'rgba(244, 166, 35, 0.3)';
        ctx.fill();

        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = canConfirm ? '#0B1D3A' : 'rgba(11, 29, 58, 0.5)';
        ctx.fillText('⚓  Set Sail!', cx, btnY + btnH / 2 + 1);
        this._profileConfirmBounds = { x: cx - btnW / 2, y: btnY, w: btnW, h: btnH };

        // "Skip" link (inside card)
        const skipY = btnY + btnH + 18;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
        ctx.fillText('Skip for now', cx, skipY);
        this._profileSkipBounds = { x: cx - 60, y: skipY - 10, w: 120, h: 20 };
    }

    getProfileSetupClick(x, y) {
        if (!this._profileConfirmBounds) return null;
        const { _profileConfirmBounds: confirm, _profileSkipBounds: skip,
            _profileNameBounds: name, _profileUploadBounds: upload,
            _profileAvatarBounds: avatar } = this;

        if (confirm && x >= confirm.x && x <= confirm.x + confirm.w && y >= confirm.y && y <= confirm.y + confirm.h) return 'confirm';
        if (skip && x >= skip.x && x <= skip.x + skip.w && y >= skip.y && y <= skip.y + skip.h) return 'skip';
        if (name && x >= name.x && x <= name.x + name.w && y >= name.y && y <= name.y + name.h) return 'name';
        if (avatar && x >= avatar.x && x <= avatar.x + avatar.w && y >= avatar.y && y <= avatar.y + avatar.h) return 'upload';
        if (upload && x >= upload.x && x <= upload.x + upload.w && y >= upload.y && y <= upload.y + upload.h) return 'upload';
        return null;
    }

    drawMagicLinkSent(email = '') {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Modal
        const mw = Math.min(380, canvas.width - 40);
        const mh = 260;
        const mx = cx - mw / 2;
        const my = cy - mh / 2;

        this.drawRoundedRect(mx, my, mw, mh, 16);
        ctx.fillStyle = '#1A2A3A';
        ctx.fill();
        ctx.strokeStyle = COLORS.sunsetGold;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow
        this.drawRoundedRect(mx + 3, my + 3, mw - 6, mh - 6, 13);
        ctx.strokeStyle = 'rgba(244, 166, 35, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Header emoji
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✉️', cx, my + 48);

        // Title
        ctx.font = 'bold 22px "Pirata One", Georgia, serif';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText('Check Yer Inbox!', cx, my + 84);

        // Description
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.75)';
        ctx.fillText("We've sent a magic link to:", cx, my + 114);

        // Email
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = COLORS.sailCream;
        const displayEmail = email.length > 28 ? email.slice(0, 26) + '…' : email;
        ctx.fillText(displayEmail, cx, my + 138);

        // Hint
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
        ctx.fillText('Click the link in the email to sign in.', cx, my + 168);

        // Back button
        const backY = my + mh - 42;
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.55)';
        ctx.fillText('← Back to Menu', cx, backY);
        this._magicLinkBackBounds = { x: cx - 80, y: backY - 12, w: 160, h: 24 };
    }

    getMagicLinkSentClick(x, y) {
        if (!this._magicLinkBackBounds) return null;
        const b = this._magicLinkBackBounds;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'back';
        return null;
    }

    // ─── Matchmaking Screen ──────────────────────────
    drawMatchmaking() {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Dim overlay
        ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.font = 'bold 32px "Pirata One", Georgia, serif';
        ctx.fillText('HIGH SEAS', cx, cy - 80);

        // Animated dots
        const dots = '.'.repeat(1 + Math.floor(Date.now() / 500) % 3);
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = '18px Inter, sans-serif';
        ctx.fillText(`Searching for opponent${dots}`, cx, cy - 30);

        // Animated sonar ring
        const pulse = (Date.now() % 2000) / 2000;
        ctx.strokeStyle = `rgba(26, 111, 181, ${1 - pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 30, 20 + pulse * 40, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = '#1A6FB5';
        ctx.beginPath();
        ctx.arc(cx, cy + 30, 6, 0, Math.PI * 2);
        ctx.fill();

        // Cancel button
        const btnW = 140;
        const btnH = 40;
        const btnX = cx - btnW / 2;
        const btnY = cy + 100;
        this._matchmakingCancelBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.fillStyle = 'rgba(245, 240, 232, 0.1)';
        this.drawRoundedRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.3)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(btnX, btnY, btnW, btnH, 8);
        ctx.stroke();

        ctx.fillStyle = COLORS.sailCream;
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Cancel', cx, btnY + btnH / 2);
    }

    isMatchmakingCancelClick(x, y) {
        if (!this._matchmakingCancelBounds) return false;
        const b = this._matchmakingCancelBounds;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    }

    // ─── Turn Timer (HUD overlay for online play) ────
    drawTurnTimer(secondsLeft, isLocalTurn) {
        const { ctx, canvas } = this;
        const x = canvas.width / 2;
        const y = 50;
        const radius = 18;
        const TURN_DURATION = 20;

        // Background circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(5, 13, 26, 0.7)';
        ctx.fill();

        // Progress arc
        const progress = secondsLeft / TURN_DURATION;
        const color = secondsLeft <= 5 ? '#E74C3C' : (isLocalTurn ? COLORS.sunsetGold : '#1A6FB5');
        ctx.beginPath();
        ctx.arc(x, y, radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Time text
        ctx.fillStyle = secondsLeft <= 5 ? '#E74C3C' : '#FFFFFF';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(secondsLeft, x, y);

        // Turn indicator text below
        ctx.fillStyle = COLORS.sailCream;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(isLocalTurn ? 'Your turn' : 'Opponent\'s turn', x, y + radius + 14);
    }
}

