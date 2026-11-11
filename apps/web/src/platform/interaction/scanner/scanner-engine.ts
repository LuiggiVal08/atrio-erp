export type ScannerCallback = (code: string) => void;

export interface ScannerConfig {
  minChars: number;
  maxIntervalMs: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: ScannerConfig = {
  minChars: 5,
  maxIntervalMs: 200,
  enabled: true,
};

export class ScannerEngine {
  private buffer: string[] = [];
  private lastTime = 0;
  private config: ScannerConfig;
  private listeners = new Set<ScannerCallback>();
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(config?: Partial<ScannerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  onScan(cb: ScannerCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  start() {
    if (this.keydownHandler) return;
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.config.enabled) return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (!isInput) return;

      const now = Date.now();

      if (e.key === 'Enter') {
        if (this.buffer.length >= this.config.minChars) {
          const code = this.buffer.join('');
          this.buffer = [];
          this.lastTime = 0;
          e.preventDefault();
          e.stopPropagation();
          this.emit(code);
          return;
        }
        this.buffer = [];
        this.lastTime = 0;
        return;
      }

      if (e.key.length === 1) {
        const elapsed = now - this.lastTime;
        if (this.lastTime === 0 || elapsed <= this.config.maxIntervalMs) {
          this.buffer.push(e.key);
        } else {
          this.buffer = [e.key];
        }
        this.lastTime = now;
      } else if (e.key === 'Backspace') {
        if (this.lastTime > 0 && (now - this.lastTime) <= this.config.maxIntervalMs) {
          this.buffer.pop();
          this.lastTime = now;
        } else {
          this.buffer = [];
          this.lastTime = 0;
        }
      } else {
        this.buffer = [];
        this.lastTime = 0;
      }
    };
    window.addEventListener('keydown', this.keydownHandler, true);
  }

  stop() {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }
    this.buffer = [];
    this.lastTime = 0;
  }

  updateConfig(config: Partial<ScannerConfig>) {
    this.config = { ...this.config, ...config };
  }

  private emit(code: string) {
    for (const cb of this.listeners) {
      try { cb(code); } catch { /* noop */ }
    }
  }
}

export const scannerEngine = new ScannerEngine();
