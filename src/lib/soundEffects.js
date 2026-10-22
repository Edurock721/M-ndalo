// Web Audio API procedural sound synthesizer
// Zero external files, zero latency, works offline in any browser

class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play pleasant chime on button tap
  playTap() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio tap error:', e);
    }
  }

  // Play incoming order bell / alert for merchants and riders
  playOrderAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } catch (e) {
      console.warn('Audio order alert error:', e);
    }
  }

  // Message received pop sound
  playMessagePop() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio message pop error:', e);
    }
  }

  // Delivery celebration fanfare
  playSuccessFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [
        { f: 523.25, t: 0.12 }, // C5
        { f: 659.25, t: 0.12 }, // E5
        { f: 783.99, t: 0.12 }, // G5
        { f: 1046.50, t: 0.35 } // C6
      ];
      let offset = 0;
      const now = this.ctx.currentTime;
      notes.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + offset);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.t);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + note.t);
        offset += note.t * 0.8;
      });
    } catch (e) {
      console.warn('Audio fanfare error:', e);
    }
  }
}

export const soundManager = new SoundManager();
