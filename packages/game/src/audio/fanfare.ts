import { TICK_RATE } from '@jogo-luta/sim';
import { midiFreq, normalize, OnePole, Osc } from './dsp';

/** Uma nota da fanfarra: nota MIDI, começo e duração em segundos. */
export interface FanfareNote {
  midi: number;
  start: number;
  dur: number;
}

/**
 * Fanfarra da provocação do Tauba: um trechinho original, no clima de fanfarra
 * clássica de concerto, em Dó maior. Sol–Dó–Mi–Sol curtas, Mi curta e Sol longa.
 * Os tempos casam com a animação `tauba_taunt` (rig/characterClips.ts).
 */
export const FANFARE: readonly FanfareNote[] = [
  { midi: 67, start: 0, dur: 0.11 },
  { midi: 72, start: 0.12, dur: 0.11 },
  { midi: 76, start: 0.24, dur: 0.11 },
  { midi: 79, start: 0.36, dur: 0.3 },
  { midi: 76, start: 0.72, dur: 0.14 },
  { midi: 79, start: 0.9, dur: 0.95 },
];

/** Tick (a partir do começo da fanfarra) em que cada nota sai. */
export function fanfareTicks(notes: readonly FanfareNote[] = FANFARE): number[] {
  return notes.map((n) => Math.round(n.start * TICK_RATE));
}

/**
 * Trompete sintetizado tocando a fanfarra (enquanto não há áudio gravado do
 * Tauba): dente de serra filtrado que abre o brilho no ataque, com uma
 * escorregada curta de tom na entrada de cada nota e vibrato na nota longa.
 */
export function renderFanfare(sampleRate: number): Float32Array<ArrayBuffer> {
  const end = Math.max(...FANFARE.map((n) => n.start + n.dur)) + 0.15;
  const buf = new Float32Array(Math.ceil(end * sampleRate));
  for (const note of FANFARE) {
    const osc = new Osc(sampleRate);
    const lp1 = new OnePole(sampleRate);
    const lp2 = new OnePole(sampleRate);
    const f0 = midiFreq(note.midi);
    const from = Math.floor(note.start * sampleRate);
    const length = Math.ceil((note.dur + 0.15) * sampleRate);
    for (let i = 0; i < length && from + i < buf.length; i++) {
      const t = i / sampleRate;
      const attack = Math.min(t / 0.03, 1);
      const release = t > note.dur ? Math.exp(-(t - note.dur) / 0.04) : 1;
      // o sopro bate forte e assenta
      const env = attack * release * (0.8 + 0.2 * Math.exp(-t / 0.08));
      const vibrato = t > 0.25 ? 1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t) : 1;
      const scoop = 1 - 0.03 * Math.exp(-t / 0.02);
      const cutoff = f0 * (1.5 + 5 * env);
      const tone = lp2.lowpass(lp1.lowpass(osc.saw(f0 * vibrato * scoop), cutoff), cutoff);
      buf[from + i] = (buf[from + i] ?? 0) + Math.tanh(tone * 1.8) * env;
    }
  }
  // rampa curta no fim para não estalar
  const fade = Math.min(buf.length, Math.round(sampleRate * 0.01));
  for (let i = 0; i < fade; i++) {
    const j = buf.length - 1 - i;
    buf[j] = (buf[j] ?? 0) * (i / fade);
  }
  return normalize(buf, 0.85);
}
