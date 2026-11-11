export interface AudioConfig {
  enabled: boolean;
  volume: number;
}

const DEFAULT_CONFIG: AudioConfig = {
  enabled: true,
  volume: 0.5,
};

export class AudioService {
  private ctx: AudioContext | null = null;
  private config: AudioConfig;

  constructor(config?: Partial<AudioConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private ensureCtx(): AudioContext | null {
    if (!this.config.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private beep(frequency: number, durationMs: number, type: OscillatorType = 'sine') {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = this.config.volume * 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  playScan() {
    this.beep(1200, 60, 'square');
  }

  playPayment() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = this.config.volume * 0.3;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + 0.2 + i * 0.1);
    });
  }

  playError() {
    this.beep(200, 300, 'sawtooth');
  }

  playCustomerFound() {
    this.beep(660, 80, 'sine');
  }

  updateConfig(config: Partial<AudioConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export const audioService = new AudioService();
