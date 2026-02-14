// ─── Colors ────────────────────────────────────────
export const COLORS = {
    deepOcean: '#0B1D3A',
    oceanMid: '#0F2847',
    oceanLight: '#163A5C',
    sunsetGold: '#F4A623',
    warmBrown: '#8B5E3C',
    sailCream: '#F5F0E8',
    fire: '#FF6B35',
    fireGlow: '#FF4500',
    smoke: 'rgba(80, 80, 80, 0.6)',
    waterSplash: 'rgba(100, 200, 255, 0.7)',
    damage: '#E74C3C',
    health: '#2ECC71',
    white: '#FFFFFF',
    black: '#000000',
    skyTop: '#0B1D3A',
    skyHorizon: '#1A3A5C',
    sunsetTop: '#2B1055',
    sunsetMid: '#D4145A',
    sunsetBottom: '#F4A623',
    nightSky: '#050D1A',
    starColor: '#FFE4B5',
    moonGlow: '#FFE4B5',
};

// ─── Game States (FSM) ─────────────────────────────
export const STATES = {
    MENU: 'MENU',
    AIM: 'AIM',
    FIRE: 'FIRE',
    RESOLVE: 'RESOLVE',
    SWITCH_TURN: 'SWITCH_TURN',
    VICTORY: 'VICTORY',
    SETTINGS: 'SETTINGS',
    HOWTOPLAY: 'HOWTOPLAY',
    SIGNIN: 'SIGNIN',
    LEADERBOARD: 'LEADERBOARD',
};

// ─── Game Modes ────────────────────────────────────
export const MODES = {
    DUEL: 'DUEL',
    CREW_BATTLE: 'CREW_BATTLE',
    GHOST_FLEET: 'GHOST_FLEET',
};

// ─── Physics ───────────────────────────────────────
export const PHYSICS = {
    gravity: 0.15,
    maxPower: 18,
    minPower: 3,
    windRange: 8,
    projectileRadius: 5,
    trailLength: 20,
};

// ─── Ships ─────────────────────────────────────────
export const SHIP = {
    width: 120,
    height: 60,
    hullHeight: 30,
    mastHeight: 70,
    sailWidth: 40,
    maxHp: 5,
    hitboxPadding: 10,
};

// ─── Waves ─────────────────────────────────────────
export const WAVES = {
    amplitude: 8,
    frequency: 0.02,
    speed: 0.015,
    bobAmplitude: 4,
    bobFrequency: 0.8,
    layers: 3,
};

// ─── Power-ups ─────────────────────────────────────
export const POWERUP = {
    crateSize: 30,
    spawnChance: 0.25,
    floatSpeed: 0.5,
    types: {
        CHAIN_SHOT: { name: 'Chain Shot', emoji: '🔴', damage: 2 },
        REPAIR_KIT: { name: 'Repair Kit', emoji: '🟢', heal: 1 },
        SPYGLASS: { name: 'Spyglass', emoji: '🔵', showTrajectory: true },
    },
};

// ─── AI ────────────────────────────────────────────
export const AI = {
    baseSimulations: 2,
    simsPerRound: 3,
    accuracyVariance: 0.15,
};

// ─── Sky Cycle ─────────────────────────────────────
export const SKY = {
    sunsetDuration: 10,
    totalCycleTurns: 20,
};

// ─── UI ────────────────────────────────────────────
export const UI = {
    menuFontSize: 48,
    hudFontSize: 16,
    buttonPadding: 16,
    hpBarWidth: 150,
    hpBarHeight: 12,
    powerGaugeWidth: 20,
    powerGaugeHeight: 150,
};
