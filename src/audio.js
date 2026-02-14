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
        const now = this.audioCtx.currentTime;
        // Sharp cannon impact crack
        this.playNoise(0.5, 0.005, 0.08, 3000, 800);
        // Resonant boom
        const boom = this.audioCtx.createOscillator();
        const boomGain = this.audioCtx.createGain();
        boom.connect(boomGain);
        boomGain.connect(this.audioCtx.destination);
        boom.type = 'sine';
        boom.frequency.setValueAtTime(80, now);
        boom.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        boomGain.gain.setValueAtTime(0.35, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        boom.start(now);
        boom.stop(now + 0.4);
        // Splintering wood debris
        setTimeout(() => this.playNoise(0.2, 0.02, 0.25, 2500, 400), 40);
        // Low rumble tail
        setTimeout(() => this.playNoise(0.12, 0.05, 0.35, 200, 50), 80);
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

    playWhaleCall() {
        if (!this.enabled || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        // Eerie descending whale song — two overlapping sine sweeps
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(380, now);
        osc1.frequency.exponentialRampToValueAtTime(180, now + 0.8);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc1.start(now);
        osc1.stop(now + 0.9);

        // Second harmonic — slightly delayed, higher pitch
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(520, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(240, now + 0.85);
        gain2.gain.setValueAtTime(0, now + 0.15);
        gain2.gain.linearRampToValueAtTime(0.12, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.85);
    }

    playKrakenRise() {
        if (!this.enabled || !this.audioCtx) return;
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Layer 1: Deep bass drone (menacing sub-bass)
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(35, now);
        bass.frequency.linearRampToValueAtTime(55, now + 1.0);
        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.22, now + 0.2);
        bassGain.gain.setValueAtTime(0.22, now + 0.7);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        bass.start(now);
        bass.stop(now + 1.2);

        // Layer 2: Distorted mid growl with waveshaper
        const growl = ctx.createOscillator();
        const growlGain = ctx.createGain();
        const distortion = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
        }
        distortion.curve = curve;
        growl.connect(distortion);
        distortion.connect(growlGain);
        growlGain.connect(ctx.destination);
        growl.type = 'square';
        growl.frequency.setValueAtTime(45, now + 0.1);
        growl.frequency.linearRampToValueAtTime(90, now + 0.5);
        growl.frequency.linearRampToValueAtTime(65, now + 0.9);
        growlGain.gain.setValueAtTime(0, now + 0.1);
        growlGain.gain.linearRampToValueAtTime(0.15, now + 0.35);
        growlGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        growl.start(now + 0.1);
        growl.stop(now + 1.0);

        // Layer 3: Bubbling water noise
        this.playNoise(0.18, 0.15, 0.8, 300, 60);
        // Layer 4: High-freq tension screech
        setTimeout(() => {
            const screech = ctx.createOscillator();
            const sGain = ctx.createGain();
            screech.connect(sGain);
            sGain.connect(ctx.destination);
            screech.type = 'sawtooth';
            screech.frequency.setValueAtTime(150, ctx.currentTime);
            screech.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
            sGain.gain.setValueAtTime(0, ctx.currentTime);
            sGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
            sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            screech.start(ctx.currentTime);
            screech.stop(ctx.currentTime + 0.35);
        }, 200);
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
