"use client";

class CitizenAudioEngine {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aura_sound_enabled");
      this.soundEnabled = stored !== null ? stored === "true" : true;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("aura_sound_enabled", String(enabled));
    }
    if (!enabled) {
      this.stopAlarm();
    }
  }

  public toggleSound(): boolean {
    const next = !this.soundEnabled;
    this.setSoundEnabled(next);
    if (next) {
      this.playUiTap();
    }
    return next;
  }

  /**
   * Warm, soothing harmonic chord for Safe zones (AirBnB / Apple style reassurance)
   */
  public playSafeChime(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C-major triad frequencies (C5: 523.25Hz, E5: 659.25Hz, G5: 783.99Hz, C6: 1046.5Hz)
    const freqs = [523.25, 659.25, 783.99, 1046.5];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      // Smooth envelope (Apple glass-like chime)
      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + idx * 0.04 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 1.0);
    });
  }

  /**
   * Gentle two-tone caution advisory chime for moderate / caution zones
   */
  public playCautionChime(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Soft marimba-style two-note advisory (A4: 440Hz -> F4: 349.23Hz)
    const tones = [
      { freq: 440, delay: 0, dur: 0.4 },
      { freq: 392, delay: 0.18, dur: 0.5 },
    ];

    tones.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  }

  /**
   * High-contrast citizen SOS panic alarm to deter threats and attract immediate attention
   */
  public startPanicAlarm(): void {
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopAlarm(); // clear any running

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(750, now);

    gain.gain.setValueAtTime(0.2, now);

    // Modulation for emergency siren sweep
    let high = true;
    this.alarmInterval = setInterval(() => {
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;
      if (high) {
        osc.frequency.linearRampToValueAtTime(1100, t + 0.25);
      } else {
        osc.frequency.linearRampToValueAtTime(700, t + 0.25);
      }
      high = !high;
    }, 280);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);

    this.alarmOscillator = osc;
    this.alarmGain = gain;
  }

  public stopAlarm(): void {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch {
        // ignore already stopped
      }
      this.alarmOscillator = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch {
        // ignore
      }
      this.alarmGain = null;
    }
  }

  /**
   * Subtle UI micro-interaction click
   */
  public playUiTap(): void {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const citizenAudio = new CitizenAudioEngine();
