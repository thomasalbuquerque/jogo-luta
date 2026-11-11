import { adEnv, decay, midiFreq, normalize, OnePole, Osc, rng, sweep } from './dsp';

/**
 * Música provisória gerada em código: um loop curto de bateria, baixo, arpejo e
 * acordes. Um arquivo em `audio/musica/<faixa>.*` substitui a gerada.
 */
export type TrackName = 'menu' | 'luta';

export interface Song {
  bpm: number;
  /** Notas MIDI do acorde de cada compasso (o tamanho define o loop). */
  chords: readonly (readonly number[])[];
  /** Padrões de 16 passos por compasso: `x` toca, `.` não. */
  kick: string;
  snare: string;
  hat: string;
  /** `x` = fundamental, `o` = oitava acima. */
  bass: string;
  /** Caixa do último compasso (virada antes de recomeçar). */
  fill?: string;
  /** Arpejo dos acordes: em semicolcheias, colcheias ou nenhum. */
  arp: 16 | 8 | 0;
  /** Acordes sustentados por baixo. */
  pad: boolean;
}

const Am = [57, 60, 64];
const F = [53, 57, 60];
const C = [48, 52, 55];
const G = [55, 59, 62];
const E = [52, 56, 59];
const Cmaj7 = [48, 52, 55, 59];
const Am7 = [57, 60, 64, 67];
const Fmaj7 = [53, 57, 60, 64];
const G6 = [55, 59, 62, 64];

export const SONGS: Readonly<Record<TrackName, Song>> = {
  luta: {
    bpm: 138,
    chords: [Am, F, C, G, Am, F, G, E],
    kick: 'x.....x.x.....x.',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.xx',
    bass: 'x.x.x.xox.x.x.xo',
    fill: '....x.....x.xxxx',
    arp: 16,
    pad: false,
  },
  menu: {
    bpm: 96,
    chords: [Cmaj7, Cmaj7, Am7, Am7, Fmaj7, Fmaj7, G6, G6],
    kick: 'x.......x.x.....',
    snare: '....x.......x...',
    hat: '..x...x...x...x.',
    bass: 'x.......x...x...',
    arp: 8,
    pad: true,
  },
};

/** Taxa das amostras da música (mais baixa que a dos efeitos: gera mais rápido). */
export const MUSIC_SAMPLE_RATE = 32000;

/** Duração do loop em segundos. */
export function songSeconds(song: Song): number {
  return (song.chords.length * 4 * 60) / song.bpm;
}

type Voice = (t: number) => number;

/** Gera o loop: o fim de cada nota que passa do final volta para o começo (emenda sem corte). */
export function renderSong(song: Song, sampleRate = MUSIC_SAMPLE_RATE): Float32Array<ArrayBuffer> {
  const total = Math.round(songSeconds(song) * sampleRate);
  const buf = new Float32Array(total);
  const step = 60 / song.bpm / 4;
  const noise = rng(song.bpm);
  const add = (start: number, seconds: number, gain: number, voice: Voice) => {
    const s0 = Math.round(start * sampleRate);
    const n = Math.ceil(seconds * sampleRate);
    for (let i = 0; i < n; i++) {
      const j = (s0 + i) % total;
      buf[j] = (buf[j] ?? 0) + voice(i / sampleRate) * gain;
    }
  };

  for (const [bar, chord] of song.chords.entries()) {
    const root = (chord[0] ?? 48) - 12;
    const last = bar === song.chords.length - 1;
    const snare = last && song.fill ? song.fill : song.snare;
    for (let s = 0; s < 16; s++) {
      const t0 = (bar * 16 + s) * step;
      if (song.kick[s] === 'x') add(t0, 0.35, 0.9, kick(sampleRate));
      if (snare[s] === 'x') add(t0, 0.25, 0.45, snareDrum(sampleRate, noise));
      if (song.hat[s] === 'x') add(t0, 0.06, s % 4 === 2 ? 0.16 : 0.1, hat(sampleRate, noise));
      const b = song.bass[s];
      if (b === 'x' || b === 'o') {
        add(t0, step * 1.8 + 0.05, 0.42, bass(sampleRate, root + (b === 'o' ? 12 : 0), step * 1.8));
      }
      const arpEvery = song.arp === 16 ? 1 : song.arp === 8 ? 2 : 0;
      if (arpEvery > 0 && s % arpEvery === 0) {
        const i = s / arpEvery;
        const note = (chord[i % chord.length] ?? 60) + 12 * (Math.floor(i / chord.length) % 2);
        add(t0, 0.25, song.arp === 16 ? 0.11 : 0.16, pluck(sampleRate, note + 12, song.arp));
      }
    }
    if (song.pad) {
      const barSeconds = 16 * step;
      for (const note of chord)
        add(bar * barSeconds, barSeconds + 0.4, 0.07, pad(sampleRate, note, barSeconds));
    }
  }
  return normalize(buf, 0.8);
}

function kick(sr: number): Voice {
  const osc = new Osc(sr);
  return (t) => osc.sine(sweep(t, 160, 45, 0.04)) * adEnv(t, 0.001, 0.14);
}

function snareDrum(sr: number, noise: () => number): Voice {
  const hp = new OnePole(sr);
  const osc = new Osc(sr);
  return (t) =>
    hp.highpass(noise() * 2 - 1, 1200) * decay(t, 0.08) * 0.8 +
    osc.sine(190) * decay(t, 0.05) * 0.5;
}

function hat(sr: number, noise: () => number): Voice {
  const hp = new OnePole(sr);
  return (t) => hp.highpass(noise() * 2 - 1, 7000) * decay(t, 0.02);
}

function bass(sr: number, note: number, gate: number): Voice {
  const osc = new Osc(sr);
  const lp = new OnePole(sr);
  const f = midiFreq(note);
  return (t) => {
    const env = Math.min(t / 0.005, 1) * (t > gate ? Math.max(0, 1 - (t - gate) / 0.05) : 1);
    return lp.lowpass(osc.saw(f), sweep(t, 1500, 350, 0.08)) * env;
  };
}

function pluck(sr: number, note: number, kind: 16 | 8 | 0): Voice {
  const osc = new Osc(sr);
  const f = midiFreq(note);
  // luta: quadrada fina e seca; menu: triangular mais macia
  return kind === 16
    ? (t) => osc.square(f, 0.25) * adEnv(t, 0.002, 0.07)
    : (t) => osc.triangle(f) * adEnv(t, 0.003, 0.18);
}

function pad(sr: number, note: number, hold: number): Voice {
  const a = new Osc(sr);
  const b = new Osc(sr);
  const lp = new OnePole(sr);
  const f = midiFreq(note);
  return (t) => {
    const env = Math.min(t / 0.3, 1) * (t > hold ? Math.max(0, 1 - (t - hold) / 0.4) : 1);
    return lp.lowpass(a.saw(f * 0.997) + b.saw(f * 1.004), 900) * env;
  };
}
