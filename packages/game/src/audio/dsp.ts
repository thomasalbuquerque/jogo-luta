/**
 * Peças de síntese de som, puras (sem Web Audio): geram amostras em
 * Float32Array para virar AudioBuffer depois. Usadas pelos efeitos sonoros, pela
 * música provisória e pela voz de KO provisória.
 */

const TAU = Math.PI * 2;

/** RNG com seed (mulberry32): o mesmo som sai igual toda vez. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash simples de texto (para variar o tom por personagem). */
export function hashText(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Filtro passa-baixa de 1 polo; `cutoff` pode mudar a cada amostra. */
export class OnePole {
  private y = 0;
  constructor(private readonly sampleRate: number) {}
  lowpass(x: number, cutoff: number): number {
    const a = 1 - Math.exp((-TAU * cutoff) / this.sampleRate);
    this.y += a * (x - this.y);
    return this.y;
  }
  /** Passa-alta: o que sobra do passa-baixa. */
  highpass(x: number, cutoff: number): number {
    return x - this.lowpass(x, cutoff);
  }
}

/** Passa-faixa ressonante (biquad RBJ): formantes da voz e ruído "assobiado". */
export class BandPass {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  constructor(private readonly sampleRate: number) {}
  process(x: number, freq: number, q: number): number {
    const w = (TAU * freq) / this.sampleRate;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0;
    const b2 = -alpha / a0;
    const a1 = (-2 * Math.cos(w)) / a0;
    const a2 = (1 - alpha) / a0;
    const y = b0 * x + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Oscilador com fase contínua (a frequência pode variar a cada amostra). */
export class Osc {
  private phase = 0;
  constructor(private readonly sampleRate: number) {}
  /** Avança e devolve a fase em 0..1. */
  next(freq: number): number {
    this.phase = (this.phase + freq / this.sampleRate) % 1;
    return this.phase;
  }
  sine(freq: number): number {
    return Math.sin(TAU * this.next(freq));
  }
  saw(freq: number): number {
    return 2 * this.next(freq) - 1;
  }
  square(freq: number, duty = 0.5): number {
    return this.next(freq) < duty ? 1 : -1;
  }
  triangle(freq: number): number {
    const p = this.next(freq);
    return 1 - 4 * Math.abs(p - 0.5);
  }
}

/** Queda exponencial: 1 em t=0, ~0,37 em t=tau. */
export function decay(t: number, tau: number): number {
  return t < 0 ? 0 : Math.exp(-t / tau);
}

/** Subida linear em `attack` segundos e queda exponencial depois. */
export function adEnv(t: number, attack: number, tau: number): number {
  if (t < 0) return 0;
  return t < attack ? t / attack : Math.exp(-(t - attack) / tau);
}

/** Varredura exponencial de frequência: de `from` para `to`, com constante `tau`. */
export function sweep(t: number, from: number, to: number, tau: number): number {
  return to + (from - to) * Math.exp(-t / tau);
}

/** Saturação suave (deixa o golpe "gordo" sem estourar). */
export function drive(x: number, amount: number): number {
  return Math.tanh(x * amount) / Math.tanh(amount);
}

/** Escala para o pico ficar em `peak` (silêncio fica como está). */
export function normalize<T extends Float32Array>(buf: T, peak = 0.9): T {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < buf.length; i++) buf[i] = ((buf[i] ?? 0) / max) * peak;
  return buf;
}

/** Frequência de uma nota MIDI (69 = Lá 440 Hz). */
export function midiFreq(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}
