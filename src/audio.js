export class AudioManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        // Generate sounds using Web Audio API (no external files needed)
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    async unlock() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    playCannon() {
        if (!this.enabled || !this.audioCtx) return;
        this.playNoise(0.3, 0.1, 0.3, 200, 80);
    }

    playSplash() {
        if (!this.enabled || !this.audioCtx) return;
        this.playNoise(0.2, 0.05, 0.5, 800, 200);
    }

    playHit() {
        if (!this.enabled || !this.audioCtx) return;
        this.playNoise(0.4, 0.01, 0.2, 150, 50);
        setTimeout(() => this.playNoise(0.15, 0.1, 0.3, 400, 100), 100);
    }

    playVictory() {
        if (!this.enabled || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        this.playTone(523.25, now, 0.15, 0.3);
        this.playTone(659.25, now + 0.15, 0.15, 0.3);
        this.playTone(783.99, now + 0.3, 0.3, 0.3);
    }

    playClick() {
        if (!this.enabled || !this.audioCtx) return;
        this.playTone(800, this.audioCtx.currentTime, 0.05, 0.1);
    }

    playPowerUp() {
        if (!this.enabled || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        this.playTone(440, now, 0.1, 0.2);
        this.playTone(660, now + 0.1, 0.1, 0.2);
        this.playTone(880, now + 0.2, 0.2, 0.2);
    }

    playBlocked() {
        if (!this.enabled || !this.audioCtx) return;
        // Deep thud
        this.playNoise(0.35, 0.02, 0.4, 180, 60);
        // Water splash overlay
        setTimeout(() => this.playNoise(0.2, 0.05, 0.3, 600, 150), 50);
    }

    playTone(freq, startTime, duration, volume) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playNoise(volume, attack, decay, highFreq, lowFreq) {
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const duration = attack + decay;

        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(highFreq, now);
        filter.frequency.exponentialRampToValueAtTime(lowFreq, now + duration);
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(now);
        source.stop(now + duration);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
