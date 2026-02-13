import { STATES, MODES, PHYSICS, SHIP, COLORS } from './constants.js';
import { WaveSystem } from './waves.js';
import { ProjectilePhysics, checkCrateCollision } from './physics.js';
import { Renderer } from './renderer.js';
import { AIPlayer } from './ai.js';
import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { PowerUpSystem } from './powerups.js';
import { SeaCreatures } from './creatures.js';
import { UIManager } from './ui.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.renderer = new Renderer(this.ctx, canvas);
        this.waves = new WaveSystem(canvas.width, canvas.height);
        this.projectile = new ProjectilePhysics();
        this.ai = new AIPlayer();
        this.audio = new AudioManager();
        this.input = new InputManager(canvas);
        this.powerups = new PowerUpSystem();
        this.creatures = new SeaCreatures();
        this.ui = new UIManager(canvas, this.ctx);

        this.state = STATES.MENU;
        this.mode = MODES.DUEL;
        this.currentPlayer = 0;
        this.round = 1;
        this.wind = 0;
        this.turnCount = 0;
        this.totalShots = [0, 0];
        this.totalHits = [0, 0];
        this.startTime = 0;

        this.vfx = [];
        this.sinkProgress = null;

        this.players = [
            this.createShip('You', COLORS.warmBrown, '#E74C3C', true, 0.15),
            this.createShip('Captain Blackbeard', '#5C3A21', '#1A1A1A', false, 0.85),
        ];

        this.input.onFire = (angle, power) => this.handleFire(angle, power);
        this.setupMenuClicks();

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
    }

    createShip(name, color, flagColor, facingRight, xRatio) {
        return {
            name,
            color,
            flagColor,
            facingRight,
            xRatio,
            x: this.canvas.width * xRatio,
            y: 0,
            hp: SHIP.maxHp,
            cannonAngle: 45,
        };
    }

    setupMenuClicks() {
        const handleTap = (x, y) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const cx = (x - rect.left) * scaleX;
            const cy = (y - rect.top) * scaleY;

            if (this.state === STATES.MENU) {
                const mode = this.ui.getMenuClick(cx, cy);
                if (mode) {
                    this.audio.init();
                    this.audio.unlock();
                    this.audio.playClick();
                    this.startGame(mode);
                }
            } else if (this.state === STATES.VICTORY) {
                if (this.ui.isPlayAgainClick(cx, cy)) {
                    this.audio.playClick();
                    this.resetGame();
                }
            } else if (this.state === STATES.SETTINGS) {
                const action = this.ui.getPauseClick(cx, cy);
                if (action === 'sound') {
                    this.audio.toggle();
                    this.audio.playClick();
                } else if (action === 'exit') {
                    this.audio.playClick();
                    this.resetGame();
                } else if (action === 'resume') {
                    this.audio.playClick();
                    this.state = this._previousState || STATES.AIM;
                }
            } else if (this.state === STATES.AIM && !this.isCurrentPlayerAI()) {
                // Fire button tap detection
                const btnW = 90, btnH = 38;
                const btnX = this.canvas.width / 2 - btnW / 2;
                const btnY = this.canvas.height - 60;
                if (cx >= btnX && cx <= btnX + btnW && cy >= btnY && cy <= btnY + btnH) {
                    this.handleFire(this.input.angle, this.input.power);
                }
            }
        };

        // Mouse click
        this.canvas.addEventListener('click', (e) => {
            handleTap(e.clientX, e.clientY);
        });

        // Touch tap — fires on touchend for taps (short touches that don't drag)
        let touchStartPos = null;
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            touchStartPos = { x: t.clientX, y: t.clientY };
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (!touchStartPos) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartPos.x;
            const dy = t.clientY - touchStartPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            touchStartPos = null;

            // Only count as tap if finger didn't move much (< 15px)
            if (dist < 15) {
                handleTap(t.clientX, t.clientY);
            }
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === STATES.AIM || this.state === STATES.FLIGHT) {
                    this._previousState = this.state;
                    this.state = STATES.SETTINGS;
                } else if (this.state === STATES.SETTINGS) {
                    this.state = this._previousState || STATES.AIM;
                }
            }
        });
    }

    startGame(mode) {
        this.mode = mode;
        this.state = STATES.AIM;
        this.currentPlayer = 0;
        this.round = 1;
        this.turnCount = 0;
        this.totalShots = [0, 0];
        this.totalHits = [0, 0];
        this.startTime = performance.now();
        this.wind = (Math.random() - 0.5) * PHYSICS.windRange * 2;
        this.vfx = [];
        this.sinkProgress = null;

        // Set player names based on mode
        if (mode === MODES.GHOST_FLEET) {
            this.players[0].name = 'Captain Bones';
            this.players[1].name = 'Captain Blackbeard';
        } else if (mode === MODES.CREW_BATTLE) {
            this.players[0].name = 'Player 1';
            this.players[1].name = 'Player 2';
        } else {
            this.players[0].name = 'You';
            this.players[1].name = 'Captain Blackbeard';
        }

        this.players.forEach((p) => {
            p.hp = SHIP.maxHp;
            p.x = this.canvas.width * p.xRatio;
        });

        this.powerups.reset();
        this.powerups.trySpawn(this.canvas.width, this.waves.waterLevel);

        if (this.mode === MODES.GHOST_FLEET) {
            this.scheduleAITurn();
        } else {
            this.input.enable(this.players[0]);
        }
    }

    resetGame() {
        this.state = STATES.MENU;
        this.input.disable();
        this.projectile.active = false;
        this.vfx = [];
        this.creatures.reset();
    }

    handleFire(angle, power) {
        if (this.state !== STATES.AIM) return;

        const shooter = this.players[this.currentPlayer];
        const facingRight = shooter.facingRight;
        const effectiveAngle = facingRight ? angle : 180 - angle;

        const launchX = shooter.x + (facingRight ? 30 : -30);
        const launchY = shooter.y - 15;

        this.projectile.launch(launchX, launchY, effectiveAngle, power, this.wind);
        this.state = STATES.FIRE;
        this.input.disable();

        shooter.cannonAngle = angle;
        this.totalShots[this.currentPlayer]++;
        this.audio.playCannon();
    }

    scheduleAITurn() {
        setTimeout(() => {
            if (this.state !== STATES.AIM) return;

            const shooter = this.players[this.currentPlayer];
            const target = this.players[1 - this.currentPlayer];
            const { angle, power } = this.ai.computeShot(
                shooter, target, this.wind, this.round,
                this.waves.waterLevel, this.canvas.width
            );

            this.handleFire(angle, power);
        }, 800);
    }

    resolveHit(result) {
        const targetIdx = 1 - this.currentPlayer;
        const target = this.players[targetIdx];

        if (result.type === 'hit') {
            const effect = this.powerups.consumeEffect(this.currentPlayer);
            let damage = 1;
            if (effect && effect.damage) damage = effect.damage;

            target.hp = Math.max(0, target.hp - damage);
            this.totalHits[this.currentPlayer]++;
            this.audio.playHit();
            this.vfx.push({ type: 'explosion', x: result.x, y: result.y, progress: 0 });

            if (target.hp <= 0) {
                this.state = STATES.VICTORY;
                this.endTime = performance.now();
                this.sinkProgress = { ship: target, progress: 0 };
                this.audio.playVictory();
                return;
            }
        } else if (result.type === 'splash') {
            this.audio.playSplash();
            this.vfx.push({ type: 'splash', x: result.x, y: result.y, progress: 0 });
        }

        this.switchTurn();
    }

    switchTurn() {
        this.state = STATES.SWITCH_TURN;

        setTimeout(() => {
            this.currentPlayer = 1 - this.currentPlayer;
            this.turnCount++;

            if (this.turnCount % 2 === 0) {
                this.round++;
                this.wind = (Math.random() - 0.5) * PHYSICS.windRange * 2;
                this.powerups.trySpawn(this.canvas.width, this.waves.waterLevel);
            }

            // Try spawning a creature
            this.creatures.onTurnSwitch();
            this.creatures.trySpawn(
                this.canvas.width, this.waves.waterLevel,
                this.players[0].x, this.players[1].x
            );

            this.state = STATES.AIM;
            this.input.reset();

            const isAI = this.isCurrentPlayerAI();
            if (isAI) {
                this.scheduleAITurn();
            } else {
                this.input.enable(this.players[this.currentPlayer]);
            }
        }, 600);
    }

    isCurrentPlayerAI() {
        if (this.mode === MODES.GHOST_FLEET) return true;
        if (this.mode === MODES.DUEL && this.currentPlayer === 1) return true;
        return false;
    }

    update(dt) {
        this.waves.update(dt);
        this.powerups.update(this.canvas.width);

        // Update ship positions on actual wave surface
        this.players.forEach((p) => {
            p.x = this.canvas.width * p.xRatio;
            p.y = this.waves.waterLevel + this.waves.getShipBob(p.x) - 10;
            p.tilt = this.waves.getShipTilt(p.x);
        });

        // Update creatures
        this.creatures.update(dt);

        // Update projectile
        if (this.state === STATES.FIRE && this.projectile.active) {
            this.projectile.update(dt);

            // Check crate collision (while projectile is still active!)
            if (checkCrateCollision(this.projectile, this.powerups.activeCrate)) {
                const cratePos = { x: this.powerups.activeCrate.x, y: this.powerups.activeCrate.y };
                const collected = this.powerups.collect(this.currentPlayer);
                if (collected) {
                    this.audio.playPowerUp();
                    this.vfx.push({ type: 'explosion', x: cratePos.x, y: cratePos.y, progress: 0 });
                    // Apply immediate effects
                    if (collected.heal) {
                        const shooter = this.players[this.currentPlayer];
                        shooter.hp = Math.min(SHIP.maxHp, shooter.hp + collected.heal);
                    }
                }
                // Cannonball continues flying through the crate!
            }

            // Check creature collision (blocks cannonball)
            const creatureHit = this.creatures.checkCollision(
                this.projectile.x, this.projectile.y, PHYSICS.projectileRadius
            );
            if (creatureHit) {
                this.projectile.active = false;
                this.audio.playBlocked();
                this.vfx.push({ type: 'splash', x: creatureHit.x, y: creatureHit.y, progress: 0 });
                this.switchTurn();
                return;
            }

            const target = this.players[1 - this.currentPlayer];
            const result = this.projectile.checkCollision(target, this.waves.waterLevel, this.canvas.width, this.canvas.height);
            if (result) {
                this.resolveHit(result);
            }
        }

        // VFX
        this.vfx = this.vfx.filter((v) => {
            v.progress += dt * 0.03;
            return v.progress < 1;
        });

        // Sink animation
        if (this.sinkProgress) {
            this.sinkProgress.progress += dt * 0.015;
            if (this.sinkProgress.progress >= 1) this.sinkProgress.progress = 1;
        }
    }

    draw() {
        const { ctx, canvas, renderer } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        renderer.drawSky(this.turnCount);
        renderer.drawIslands(this.waves.waterLevel);

        // Ships (drawn at wave surface with tilt)
        this.players.forEach((p) => {
            if (this.sinkProgress && this.sinkProgress.ship === p) {
                renderer.drawSinkingShip(p, this.sinkProgress.progress);
            } else {
                renderer.drawShip(p, p.facingRight, p.tilt || 0);
            }
        });

        // Sea creatures (drawn before waves so water overlaps their base)
        renderer.drawCreature(this.creatures.creature);

        // Water (on top of ships for partial submersion effect)
        this.waves.draw(ctx);

        // Power-up crate
        renderer.drawCrate(this.powerups.activeCrate);

        // Projectile
        renderer.drawProjectile(this.projectile);

        // VFX
        this.vfx.forEach((v) => {
            if (v.type === 'splash') renderer.drawSplash(v.x, v.y, v.progress);
            else if (v.type === 'explosion') renderer.drawExplosion(v.x, v.y, v.progress);
        });

        // State-specific UI
        if (this.state === STATES.MENU) {
            this.ui.drawMenu();
        } else if (this.state === STATES.VICTORY) {
            const winner = this.players.find((p) => p.hp > 0);
            const elapsed = ((this.endTime - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = Math.floor(elapsed % 60);
            const accuracy = this.totalShots[this.currentPlayer]
                ? Math.round((this.totalHits[this.currentPlayer] / this.totalShots[this.currentPlayer]) * 100)
                : 0;

            this.ui.drawVictory(winner, {
                rounds: this.round,
                shots: this.totalShots[0] + this.totalShots[1],
                accuracy,
                time: `${mins}:${secs.toString().padStart(2, '0')}`,
            });
        } else if (this.state === STATES.SETTINGS) {
            this.ui.drawSettings({ sound: this.audio.enabled });
        } else {
            // In-game HUD
            renderer.drawHUD({
                player1: this.players[0],
                player2: this.players[1],
                currentPlayer: this.currentPlayer,
                wind: this.wind,
                round: this.round,
            });

            // Aim UI
            if (this.state === STATES.AIM && !this.isCurrentPlayerAI()) {
                const shooter = this.players[this.currentPlayer];
                renderer.drawAimUI(shooter, this.input.angle, this.input.power, shooter.facingRight);

                // Fire button
                this.ui.drawFireButton(canvas.width / 2, canvas.height - 60);

                // Trajectory preview if spyglass active
                const effect = this.powerups.getActiveEffect(this.currentPlayer);
                if (effect && effect.showTrajectory) {
                    const facingRight = shooter.facingRight;
                    const effAngle = facingRight ? this.input.angle : 180 - this.input.angle;
                    const lx = shooter.x + (facingRight ? 30 : -30);
                    const ly = shooter.y - 15;
                    const points = this.projectile.simulateTrajectory(lx, ly, effAngle, this.input.power, this.wind);
                    renderer.drawTrajectoryPreview(points);
                }
            }

            // Power-up indicator
            const effect = this.powerups.getActiveEffect(this.currentPlayer);
            if (effect) {
                ctx.fillStyle = COLORS.sailCream;
                ctx.font = '14px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Active: ${effect.emoji} ${effect.name}`, canvas.width / 2, 95);
            }
        }
    }

    loop(now) {
        const dt = Math.min(now - this.lastTime, 32);
        this.lastTime = now;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    start() {
        requestAnimationFrame(this.loop);
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.waves.resize(w, h);
        this.players.forEach((p) => {
            p.x = w * p.xRatio;
        });
    }
}
