// Sons et musique 100 % synthétisés via WebAudio (aucun fichier externe).

const MUSIC = {
  menu: { bpm: 96, root: 45, bass: [0, 0, 7, 0, 3, 3, 10, 3], lead: [12, 15, 19, 15, 12, 19, 22, 19], drums: false },
  battle: { bpm: 124, root: 40, bass: [0, 0, 12, 0, 3, 3, 15, 5], lead: [24, 22, 19, 22, 27, 24, 22, 19], drums: true },
  boss: { bpm: 140, root: 38, bass: [0, 12, 0, 13, 0, 12, 6, 7], lead: [24, 25, 24, 19, 18, 19, 24, 31], drums: true },
};

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.track = null;
    this.step = 0;
    this.nextNoteTime = 0;
    this.timer = null;
    this.noiseBuffer = null;
  }

  // Doit être appelé suite à une interaction utilisateur (politique autoplay des navigateurs).
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.applyVolumes();

      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.track && !this.timer) this.startScheduler();
  }

  setSettings({ enabled, musicVolume, sfxVolume }) {
    this.enabled = enabled;
    this.musicVolume = musicVolume / 100;
    this.sfxVolume = sfxVolume / 100;
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.22, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.5, t, 0.02);
  }

  // --- Musique ---

  playMusic(name) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    this.stopScheduler();
    if (name && this.ctx) this.startScheduler();
  }

  stopMusic() {
    this.track = null;
    this.stopScheduler();
  }

  startScheduler() {
    if (!this.ctx || !this.track) return;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    const song = MUSIC[this.track];
    if (!song || !this.ctx) return;
    const stepDur = 60 / song.bpm / 2; // croches
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      const i = this.step % 8;
      const bar = Math.floor(this.step / 8) % 4;
      const shift = bar === 3 ? 5 : bar === 2 ? 3 : 0;
      const t = this.nextNoteTime;

      this.tone({ freq: midiToFreq(song.root + song.bass[i] + shift), type: 'sawtooth', dur: stepDur * 0.9, vol: 0.5, t, out: this.musicGain, filter: 600 });
      if (this.step % 2 === 0 || song.drums) {
        this.tone({ freq: midiToFreq(song.root + 12 + song.lead[(i + bar) % 8] + shift), type: 'square', dur: stepDur * 0.5, vol: 0.12, t, out: this.musicGain, filter: 2400 });
      }
      if (song.drums) {
        if (i % 4 === 0) this.kick(t);
        if (i % 4 === 2) this.noise({ dur: 0.12, vol: 0.25, t, out: this.musicGain, hp: 1500 });
        this.noise({ dur: 0.03, vol: 0.08, t, out: this.musicGain, hp: 7000 });
      }
      this.nextNoteTime += stepDur;
      this.step++;
    }
  }

  kick(t) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.2);
  }

  // --- Primitives ---

  tone({ freq, to, type = 'square', dur = 0.1, vol = 0.5, t, out, filter }) {
    const ctx = this.ctx;
    const start = t ?? ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    let node = o.connect(g);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      node = g.connect(f);
      f.connect(out || this.sfxGain);
    } else {
      node.connect(out || this.sfxGain);
    }
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  noise({ dur = 0.1, vol = 0.4, t, out, hp, lp }) {
    const ctx = this.ctx;
    const start = t ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    let last = src;
    if (hp) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp;
      last.connect(f);
      last = f;
    }
    if (lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      last.connect(f);
      last = f;
    }
    last.connect(g).connect(out || this.sfxGain);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.02);
  }

  // --- Effets sonores ---

  sfx(name) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'swing':
        this.noise({ dur: 0.08, vol: 0.25, hp: 2500 });
        break;
      case 'heavySwing':
        this.noise({ dur: 0.14, vol: 0.3, hp: 900, lp: 4000 });
        break;
      case 'hit':
        this.tone({ freq: 220, to: 70, type: 'square', dur: 0.1, vol: 0.35 });
        this.noise({ dur: 0.06, vol: 0.3, lp: 3000 });
        break;
      case 'heavyHit':
        this.tone({ freq: 160, to: 40, type: 'square', dur: 0.18, vol: 0.45 });
        this.noise({ dur: 0.12, vol: 0.4, lp: 1800 });
        break;
      case 'crit':
        this.tone({ freq: 1200, to: 1800, type: 'square', dur: 0.08, vol: 0.2 });
        this.tone({ freq: 180, to: 50, type: 'sawtooth', dur: 0.2, vol: 0.4 });
        break;
      case 'block':
        this.tone({ freq: 900, to: 600, type: 'triangle', dur: 0.12, vol: 0.4 });
        this.tone({ freq: 1350, type: 'sine', dur: 0.15, vol: 0.15 });
        break;
      case 'hurt':
        this.tone({ freq: 320, to: 90, type: 'sawtooth', dur: 0.22, vol: 0.35 });
        break;
      case 'jump':
        this.tone({ freq: 280, to: 620, type: 'sine', dur: 0.12, vol: 0.25 });
        break;
      case 'dash':
        this.noise({ dur: 0.18, vol: 0.25, hp: 600 });
        this.tone({ freq: 500, to: 1400, type: 'sine', dur: 0.12, vol: 0.12 });
        break;
      case 'special':
        this.tone({ freq: 180, to: 1400, type: 'sawtooth', dur: 0.3, vol: 0.3, filter: 3000 });
        this.tone({ freq: 90, to: 60, type: 'square', dur: 0.3, vol: 0.3 });
        break;
      case 'shoot':
        this.tone({ freq: 1100, to: 300, type: 'square', dur: 0.12, vol: 0.15 });
        break;
      case 'orb':
        this.tone({ freq: 300, to: 700, type: 'sine', dur: 0.25, vol: 0.25 });
        break;
      case 'coin':
        this.tone({ freq: 988, type: 'square', dur: 0.07, vol: 0.15, t });
        this.tone({ freq: 1319, type: 'square', dur: 0.12, vol: 0.15, t: t + 0.07 });
        break;
      case 'kill':
        this.tone({ freq: 400, to: 60, type: 'sawtooth', dur: 0.3, vol: 0.3 });
        this.noise({ dur: 0.25, vol: 0.3, lp: 1200 });
        break;
      case 'potion':
        [523, 659, 784, 1047].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.12, vol: 0.25, t: t + i * 0.06 }));
        break;
      case 'empty':
        this.tone({ freq: 160, type: 'square', dur: 0.08, vol: 0.2 });
        break;
      case 'bossRoar':
        this.tone({ freq: 90, to: 40, type: 'sawtooth', dur: 1.2, vol: 0.5, filter: 800 });
        this.noise({ dur: 1, vol: 0.35, lp: 500 });
        break;
      case 'slam':
        this.tone({ freq: 80, to: 30, type: 'square', dur: 0.4, vol: 0.55 });
        this.noise({ dur: 0.4, vol: 0.5, lp: 900 });
        break;
      case 'charge':
        this.tone({ freq: 200, to: 900, type: 'sawtooth', dur: 0.6, vol: 0.2, filter: 2000 });
        break;
      case 'wave':
        [440, 554, 659].forEach((f, i) => this.tone({ freq: f, type: 'square', dur: 0.15, vol: 0.18, t: t + i * 0.1 }));
        break;
      case 'win':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone({ freq: f, type: 'square', dur: 0.18, vol: 0.2, t: t + i * 0.12 }));
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) => this.tone({ freq: f, type: 'sawtooth', dur: 0.3, vol: 0.22, t: t + i * 0.2, filter: 1500 }));
        break;
      case 'buy':
        this.tone({ freq: 660, type: 'square', dur: 0.06, vol: 0.18, t });
        this.tone({ freq: 990, type: 'square', dur: 0.1, vol: 0.18, t: t + 0.06 });
        break;
      case 'ui':
        this.tone({ freq: 700, to: 900, type: 'sine', dur: 0.05, vol: 0.18 });
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioManager();

if (typeof window !== 'undefined') {
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock, { passive: true });
}
