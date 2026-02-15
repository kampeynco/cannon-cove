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
import { saveMatch, isAuthenticatedSync, signInWithGoogle, signInWithEmail, refreshAuthCache, getLeaderboard, saveSettings, loadSettings, signOut, ensureSession, updateProfile, needsProfileSetup, ensurePlayer, onAuthStateChange, getCachedUsername, getPlayerProfile } from './supabase.js';
import * as MP from './multiplayer.js';

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
        this.htpPage = 0;
        this.htpReturnState = STATES.MENU;
        this.matchSaved = false;

        this.vfx = [];
        this.sinkProgress = null;

        // Multiplayer state
        this.onlineOpponentName = null;
        this.turnTimeLeft = 0;
        this.isOnline = false;
        this.isLocalPlayerTurn = false;

        // Toast notification
        this._toast = null; // { text, expiresAt }

        this.players = [
            this.createShip('You', COLORS.warmBrown, '#E74C3C', true, 0.15),
            this.createShip('Captain Blackbeard', '#5C3A21', '#1A1A1A', false, 0.85),
        ];

        this.input.onFire = (angle, power) => this.handleFire(angle, power);
        this.setupMenuClicks();
        this._setupMultiplayerCallbacks();

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

                    // High Seas requires authentication
                    if (mode === MODES.HIGH_SEAS) {
                        if (!isAuthenticatedSync()) {
                            alert('Sign in to battle online!');
                            this.state = STATES.SIGNIN;
                            return;
                        }
                        // Enter matchmaking
                        this.state = STATES.MATCHMAKING;
                        MP.joinQueue();
                        return;
                    }

                    this.startGame(mode);
                } else if (this.ui.isHowToPlayClick(cx, cy)) {
                    this.audio.playClick();
                    this.htpPage = 0;
                    this.htpReturnState = STATES.MENU;
                    this.state = STATES.HOWTOPLAY;
                } else if (this.ui.isLeaderboardClick && this.ui.isLeaderboardClick(cx, cy)) {
                    this.audio.playClick();
                    this.leaderboardData = null;
                    this.state = STATES.LEADERBOARD;
                    getLeaderboard().then(data => { this.leaderboardData = data || []; });
                }
                // Sign-in link on main menu (only for guests)
                if (this.ui.isMenuSignInClick && this.ui.isMenuSignInClick(cx, cy)) {
                    this.audio.playClick();
                    this.state = STATES.SIGNIN;
                }
                // Username click → open profile editor (authenticated users)
                if (this.ui.isMenuUsernameClick && this.ui.isMenuUsernameClick(cx, cy)) {
                    this.audio.playClick();
                    this._profileAvatarFile = null;
                    this._profileAvatarPreview = null;
                    this._profileCaptainName = getCachedUsername() || '';
                    this.state = STATES.PROFILE_SETUP;

                    // Load existing avatar from db
                    getPlayerProfile().then(profile => {
                        if (profile?.avatar_url) {
                            this._profileAvatarPreview = profile.avatar_url;
                        }
                    });
                }
                // Sign-out link (only for authenticated users)
                if (this.ui.isMenuSignOutClick && this.ui.isMenuSignOutClick(cx, cy)) {
                    this.audio.playClick();
                    signOut().then(async () => {
                        await ensureSession();
                        await refreshAuthCache();
                    });
                }
            } else if (this.state === STATES.VICTORY) {
                if (this.ui.isPlayAgainClick(cx, cy)) {
                    this.audio.playClick();
                    if (!isAuthenticatedSync()) {
                        this.state = STATES.SIGNIN;
                    } else {
                        this.resetGame();
                    }
                }
            } else if (this.state === STATES.SIGNIN) {
                const action = this.ui.getSignInClick(cx, cy);
                if (action === 'google') {
                    this.audio.playClick();
                    signInWithGoogle().then(({ data, error }) => {
                        if (error) {
                            console.error('[Auth] Google sign-in error:', error);
                            alert('Google sign-in failed: ' + error.message);
                        } else {
                            console.log('[Auth] Google sign-in redirect initiated', data);
                        }
                    }).catch(err => {
                        console.error('[Auth] Google sign-in exception:', err);
                        alert('Google sign-in failed. Check the console for details.');
                    });
                } else if (action === 'email') {
                    this.audio.playClick();
                    const email = prompt('Enter your email for a magic link:');
                    if (email) {
                        this._magicLinkEmail = email;
                        signInWithEmail(email).then(() => {
                            this.state = STATES.MAGIC_LINK_SENT;
                        });
                    }
                } else if (action === 'skip') {
                    this.audio.playClick();
                    this.resetGame();
                }
            } else if (this.state === STATES.PROFILE_SETUP) {
                const action = this.ui.getProfileSetupClick(cx, cy);
                if (action === 'name') {
                    this.audio.playClick();
                    const name = prompt('Enter your captain name:', this._profileCaptainName || '');
                    if (name && name.trim().length >= 2) {
                        this._profileCaptainName = name.trim().slice(0, 20);
                    }
                } else if (action === 'upload') {
                    this.audio.playClick();
                    this._openAvatarPicker();
                } else if (action === 'confirm' && this._profileCaptainName && this._profileCaptainName.length >= 2) {
                    this.audio.playClick();
                    updateProfile({
                        username: this._profileCaptainName,
                        avatarFile: this._profileAvatarFile || null,
                    }).then(async () => {
                        await ensurePlayer();
                        await refreshAuthCache();
                        this._profileCaptainName = '';
                        this._profileAvatarFile = null;
                        this._profileAvatarPreview = null;
                        this.state = STATES.MENU;
                    });
                } else if (action === 'skip') {
                    this.audio.playClick();
                    ensurePlayer().then(() => {
                        this._profileCaptainName = '';
                        this._profileAvatarFile = null;
                        this._profileAvatarPreview = null;
                        this.state = STATES.MENU;
                    });
                }
            } else if (this.state === STATES.SETTINGS) {
                const action = this.ui.getPauseClick(cx, cy);
                if (action === 'sound') {
                    this.audio.toggle();
                    this.audio.playClick();
                    saveSettings({ sound: this.audio.enabled });
                } else if (action === 'exit') {
                    this.audio.playClick();
                    this.resetGame();
                } else if (action === 'resume') {
                    this.audio.playClick();
                    this.state = this._previousState || STATES.AIM;
                } else if (action === 'howtoplay') {
                    this.audio.playClick();
                    this.htpPage = 0;
                    this.htpReturnState = STATES.SETTINGS;
                    this.state = STATES.HOWTOPLAY;
                }
            } else if (this.state === STATES.HOWTOPLAY) {
                const action = this.ui.getHowToPlayClick(cx, cy);
                if (action === 'back') {
                    this.audio.playClick();
                    this.state = this.htpReturnState;
                } else if (action === 'next') {
                    this.audio.playClick();
                    this.htpPage++;
                } else if (action === 'prev') {
                    this.audio.playClick();
                    this.htpPage = Math.max(0, this.htpPage - 1);
                }
            } else if (this.state === STATES.LEADERBOARD) {
                const action = this.ui.getLeaderboardClick(cx, cy);
                if (action === 'back') {
                    this.audio.playClick();
                    this.state = STATES.MENU;
                }
            } else if (this.state === STATES.MAGIC_LINK_SENT) {
                const action = this.ui.getMagicLinkSentClick(cx, cy);
                if (action === 'back') {
                    this.audio.playClick();
                    this.state = STATES.MENU;
                }
            } else if (this.state === STATES.MATCHMAKING) {
                // Cancel matchmaking
                if (this.ui.isMatchmakingCancelClick && this.ui.isMatchmakingCancelClick(cx, cy)) {
                    this.audio.playClick();
                    MP.leaveQueue();
                    this.state = STATES.MENU;
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

        // Pointer cursor on hover over clickable items
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            let hovering = false;

            if (this.state === STATES.MENU) {
                hovering = !!(
                    this.ui.getMenuClick(mx, my) ||
                    this.ui.isHowToPlayClick(mx, my) ||
                    (this.ui.isLeaderboardClick && this.ui.isLeaderboardClick(mx, my)) ||
                    (this.ui.isMenuSignInClick && this.ui.isMenuSignInClick(mx, my)) ||
                    (this.ui.isMenuSignOutClick && this.ui.isMenuSignOutClick(mx, my)) ||
                    (this.ui.isMenuUsernameClick && this.ui.isMenuUsernameClick(mx, my))
                );
            } else if (this.state === STATES.VICTORY) {
                hovering = !!(this.ui.isPlayAgainClick(mx, my));
            } else if (this.state === STATES.SIGNIN) {
                hovering = !!(this.ui.getSignInClick && this.ui.getSignInClick(mx, my));
            } else if (this.state === STATES.PROFILE_SETUP) {
                hovering = !!(this.ui.getProfileSetupClick && this.ui.getProfileSetupClick(mx, my));
            } else if (this.state === STATES.SETTINGS) {
                hovering = !!(this.ui.getPauseClick && this.ui.getPauseClick(mx, my));
            } else if (this.state === STATES.HOWTOPLAY) {
                hovering = !!(this.ui.getHowToPlayClick && this.ui.getHowToPlayClick(mx, my));
            } else if (this.state === STATES.LEADERBOARD) {
                hovering = !!(this.ui.getLeaderboardClick && this.ui.getLeaderboardClick(mx, my));
            } else if (this.state === STATES.MAGIC_LINK_SENT) {
                hovering = !!(this.ui.getMagicLinkSentClick && this.ui.getMagicLinkSentClick(mx, my));
            } else if (this.state === STATES.MATCHMAKING) {
                hovering = !!(this.ui.isMatchmakingCancelClick && this.ui.isMatchmakingCancelClick(mx, my));
            }

            this.canvas.style.cursor = hovering ? 'pointer' : 'default';
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
                } else if (this.state === STATES.HOWTOPLAY) {
                    this.state = this.htpReturnState;
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
        this.isOnline = mode === MODES.HIGH_SEAS;
        this.matchSaved = false;

        // Set player names based on mode
        if (mode === MODES.GHOST_FLEET) {
            this.players[0].name = 'Captain Bones';
            this.players[1].name = 'Captain Blackbeard';
        } else if (mode === MODES.CREW_BATTLE) {
            this.players[0].name = 'Player 1';
            this.players[1].name = 'Player 2';
        } else if (mode === MODES.HIGH_SEAS) {
            // Names set by _onMatchFound callback
            this.players[0].name = 'You';
            this.players[1].name = this.onlineOpponentName || 'Rival Captain';
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
        } else if (this.mode === MODES.HIGH_SEAS) {
            const info = MP.getMatchInfo();
            if (info.isPlayer1) {
                // Player 1 goes first (local player's turn)
                this.isLocalPlayerTurn = true;
                this.input.enable(this.players[0]);
                MP.startTurnTimer();
            } else {
                // Player 2 waits for opponent's first shot
                this.isLocalPlayerTurn = false;
                this.input.disable();
                MP.startTurnTimer();
            }
        } else {
            this.input.enable(this.players[0]);
        }
    }

    resetGame() {
        if (this.isOnline) {
            MP.disconnect();
        }
        this.state = STATES.MENU;
        this.input.disable();
        this.projectile.active = false;
        this.vfx = [];
        this.creatures.reset();
        this.matchSaved = false;
        this.isOnline = false;
        this.isLocalPlayerTurn = false;
        this.onlineOpponentName = null;
        this.turnTimeLeft = 0;
    }

    _setupMultiplayerCallbacks() {
        MP.setCallbacks({
            onMatchFound: ({ matchId, opponentName, opponentId, isPlayer1 }) => {
                this.onlineOpponentName = opponentName;
                this.startGame(MODES.HIGH_SEAS);
            },
            onOpponentFire: (angle, power) => {
                // Opponent fired — animate on our canvas
                if (this.state !== STATES.AIM) return;
                MP.stopTurnTimer();
                this.handleRemoteFire(angle, power);
            },
            onOpponentForfeit: () => {
                MP.stopTurnTimer();
                // Auto-win for local player
                const opponent = this.players[1];
                opponent.hp = 0;
                this.state = STATES.VICTORY;
                this.endTime = performance.now();
                this.sinkProgress = { ship: opponent, progress: 0 };
                this.audio.playVictory();
                this._saveMatchResult();
            },
            onTurnTimeout: () => {
                if (this.isLocalPlayerTurn && this.state === STATES.AIM) {
                    // Auto-fire with random angle/power on timeout
                    const randomAngle = 15 + Math.random() * 60;
                    const randomPower = 3 + Math.random() * 8;
                    this.handleFire(randomAngle, randomPower);
                }
            },
            onTimerTick: (secondsLeft) => {
                this.turnTimeLeft = secondsLeft;
            },
            onMatchTimeout: () => {
                // No opponent found within 40s — return to menu
                this.isOnline = false;
                this.state = STATES.MENU;
                this.showToast('No opponent found — try again later!');
            },
        });
    }

    _openAvatarPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.style.display = 'none';
        document.body.appendChild(input);

        const cleanup = () => {
            if (input.parentNode) document.body.removeChild(input);
        };

        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file && file.size <= 2 * 1024 * 1024) {
                this._profileAvatarFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    this._profileAvatarPreview = e.target.result;
                };
                reader.readAsDataURL(file);
            } else if (file) {
                alert('Image must be under 2MB');
            }
            cleanup();
        });

        // Handle cancel: when focus returns without a file change
        window.addEventListener('focus', () => {
            setTimeout(cleanup, 300);
        }, { once: true });

        input.click();
    }

    setupAuthListener() {
        onAuthStateChange(async (event, _session) => {
            if (event === 'SIGNED_IN') {
                await refreshAuthCache();
                const needs = await needsProfileSetup();
                if (needs && this.state === STATES.MENU) {
                    this._profileCaptainName = '';
                    this._profileAvatarFile = null;
                    this._profileAvatarPreview = null;
                    this.state = STATES.PROFILE_SETUP;
                }
            }
        });
    }

    async _saveMatchResult() {
        if (this.matchSaved) return;
        this.matchSaved = true;

        const winner = this.players.find(p => p.hp > 0);
        const playerWon = winner === this.players[0];
        const elapsed = Math.floor((this.endTime - this.startTime) / 1000);
        const accuracy = this.totalShots[0]
            ? Math.round((this.totalHits[0] / this.totalShots[0]) * 100)
            : 0;

        if (this.isOnline) {
            // Save to both online_matches and regular matches table
            const info = MP.getMatchInfo();
            const winnerId = playerWon ? info.localPlayerId : info.opponentId;
            await MP.saveOnlineMatchResult(winnerId, this.round, accuracy, elapsed);
            MP.sendGameOver(winnerId);
        }

        await saveMatch({
            won: playerWon,
            rounds: this.round,
            accuracy,
            durationSeconds: elapsed,
            mode: this.isOnline ? 'high_seas' : { DUEL: 'duel', CREW_BATTLE: 'crew', GHOST_FLEET: 'ghost' }[this.mode] || 'duel',
            opponentType: (this.mode === MODES.CREW_BATTLE || this.isOnline) ? 'human' : 'ai',
        });
        await refreshAuthCache();
    }

    handleFire(angle, power) {
        if (this.state !== STATES.AIM) return;

        // In online mode, only allow firing on local player's turn
        if (this.isOnline && !this.isLocalPlayerTurn) return;

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

        // Broadcast fire to opponent in online mode
        if (this.isOnline) {
            MP.stopTurnTimer();
            MP.sendFire(angle, power);
        }
    }

    /**
     * Handle a fire event received from the remote opponent.
     * Uses the opponent's ship (index 1) and mirrors the angle.
     */
    handleRemoteFire(angle, power) {
        if (this.state !== STATES.AIM) return;

        const shooter = this.players[1]; // Opponent is always player index 1
        const facingRight = shooter.facingRight;
        const effectiveAngle = facingRight ? angle : 180 - angle;

        const launchX = shooter.x + (facingRight ? 30 : -30);
        const launchY = shooter.y - 15;

        // Make sure currentPlayer matches the opponent
        this.currentPlayer = 1;

        this.projectile.launch(launchX, launchY, effectiveAngle, power, this.wind);
        this.state = STATES.FIRE;
        this.input.disable();

        shooter.cannonAngle = angle;
        this.totalShots[1]++;
        this.audio.playCannon();
    }

    showToast(text, durationMs = 3000) {
        this._toast = { text, expiresAt: Date.now() + durationMs };
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
                this._saveMatchResult();
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
            // Play creature sound when one surfaces
            if (this.creatures.creature && this.creatures.creature.phase === 1) {
                if (this.creatures.creature.type === 'WHALE') {
                    this.audio.playWhaleCall();
                } else {
                    this.audio.playKrakenRise();
                }
            }

            this.state = STATES.AIM;
            this.input.reset();

            if (this.isOnline) {
                // Online: determine if it's local player's turn
                // In online mode, player 0 is always the local representation
                // currentPlayer 0 = local player's turn, 1 = opponent's turn
                const info = MP.getMatchInfo();
                this.isLocalPlayerTurn = (this.currentPlayer === 0);

                if (this.isLocalPlayerTurn) {
                    this.input.enable(this.players[0]);
                } else {
                    this.input.disable();
                }
                MP.startTurnTimer();
            } else {
                const isAI = this.isCurrentPlayerAI();
                if (isAI) {
                    this.scheduleAITurn();
                } else {
                    this.input.enable(this.players[this.currentPlayer]);
                }
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
                this.vfx.push({ type: 'explosion', x: creatureHit.x, y: creatureHit.y, progress: 0 });
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
        } else if (this.state === STATES.SIGNIN) {
            this.ui.drawSignInPrompt();
        } else if (this.state === STATES.MAGIC_LINK_SENT) {
            this.ui.drawMagicLinkSent(this._magicLinkEmail || '');
        } else if (this.state === STATES.PROFILE_SETUP) {
            this.ui.drawProfileSetup(this._profileCaptainName || '', this._profileAvatarPreview || null);
        } else if (this.state === STATES.LEADERBOARD) {
            this.ui.drawLeaderboard(this.leaderboardData || []);
        } else if (this.state === STATES.SETTINGS) {
            this.ui.drawSettings({ sound: this.audio.enabled });
        } else if (this.state === STATES.HOWTOPLAY) {
            this.ui.drawHowToPlay(this.htpPage);
        } else if (this.state === STATES.MATCHMAKING) {
            this.ui.drawMatchmaking();
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

                // Fire button (only show if it's local player's turn in online mode)
                if (!this.isOnline || this.isLocalPlayerTurn) {
                    this.ui.drawFireButton(canvas.width / 2, canvas.height - 60);
                }

                // Turn timer for online play
                if (this.isOnline && this.turnTimeLeft > 0) {
                    this.ui.drawTurnTimer(this.turnTimeLeft, this.isLocalPlayerTurn);
                }

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

        // Toast card overlay (renders on top of everything)
        if (this._toast) {
            if (Date.now() >= this._toast.expiresAt) {
                this._toast = null;
            } else {
                const remaining = this._toast.expiresAt - Date.now();
                const alpha = Math.min(1, remaining / 600);
                ctx.save();
                ctx.globalAlpha = alpha;

                // Dim backdrop
                ctx.fillStyle = 'rgba(5, 13, 26, 0.6)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Card
                const cardW = 320;
                const cardH = 130;
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const cardX = cx - cardW / 2;
                const cardY = cy - cardH / 2;

                ctx.fillStyle = 'rgba(20, 30, 48, 0.95)';
                this.ui.drawRoundedRect(cardX, cardY, cardW, cardH, 12);
                ctx.fill();
                ctx.strokeStyle = COLORS.sunsetGold;
                ctx.lineWidth = 2;
                this.ui.drawRoundedRect(cardX, cardY, cardW, cardH, 12);
                ctx.stroke();

                // Icon
                ctx.font = '32px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚓', cx, cardY + 36);

                // Title
                ctx.fillStyle = COLORS.sunsetGold;
                ctx.font = 'bold 17px "Pirata One", Georgia, serif';
                ctx.fillText(this._toast.text, cx, cardY + 72);

                // Subtitle
                ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
                ctx.font = '12px Inter, sans-serif';
                ctx.fillText('Returning to port...', cx, cardY + 100);

                ctx.restore();
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
