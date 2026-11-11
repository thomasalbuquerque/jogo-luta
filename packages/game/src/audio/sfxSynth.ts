import {
  adEnv,
  BandPass,
  decay,
  drive,
  hashText,
  midiFreq,
  normalize,
  OnePole,
  Osc,
  rng,
  sweep,
} from './dsp';

/**
 * Efeitos sonoros gerados em código (Etapa 5). Cada um vira um AudioBuffer no
 * boot; um arquivo em `audio/sfx/<nome>.*` substitui o gerado.
 */
export const SFX_NAMES = [
  'hit_light',
  'hit_medium',
  'hit_heavy',
  'swing',
  'jump',
  'air_jump',
  'dash',
  'dodge',
  'land',
  'grab',
  'counter',
  'ko',
  'respawn',
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

type Voice = (t: number) => number;

/** Roda `voice` por `seconds` e normaliza. */
function render(sampleRate: number, seconds: number, voice: Voice, peak = 0.9): Float32Array {
  const buf = new Float32Array(Math.ceil(seconds * sampleRate));
  for (let i = 0; i < buf.length; i++) buf[i] = voice(i / sampleRate);
  // rampa curta no fim para não estalar
  const fade = Math.min(buf.length, Math.round(sampleRate * 0.01));
  for (let i = 0; i < fade; i++) {
    const j = buf.length - 1 - i;
    buf[j] = (buf[j] ?? 0) * (i / fade);
  }
  return normalize(buf, peak);
}

/** Soco: estalo, corpo de ruído e um baque grave que cai de tom. `s` 0..1 = força. */
function hit(sr: number, s: number): Float32Array {
  const r = rng(11 + Math.round(s * 10));
  const crack = new OnePole(sr);
  const body = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.14 + 0.4 * s, (t) => {
    const n = r() * 2 - 1;
    const c = crack.highpass(n, 2500) * decay(t, 0.005) * 0.7;
    const b = body.lowpass(n, 2600 - 1400 * s) * decay(t, 0.025 + 0.07 * s) * 0.8;
    const f = sweep(t, 230 - 90 * s, 55 - 15 * s, 0.03 + 0.03 * s);
    const thump = osc.sine(f) * adEnv(t, 0.002, 0.05 + 0.13 * s);
    return drive(c + b + thump, 1.5 + 2.5 * s);
  });
}

/** Lufada: ruído passa-faixa varrendo, com volume em sino. */
function whoosh(sr: number, seconds: number, from: number, to: number, seed: number): Float32Array {
  const r = rng(seed);
  const bp = new BandPass(sr);
  return render(sr, seconds, (t) => {
    const k = t / seconds;
    const bell = Math.sin(Math.PI * Math.min(k, 1)) ** 2;
    return bp.process(r() * 2 - 1, from * (to / from) ** k, 1.2) * bell;
  });
}

function jump(sr: number, from: number, to: number): Float32Array {
  const r = rng(5);
  const osc = new Osc(sr);
  const puff = new OnePole(sr);
  const seconds = 0.16;
  return render(
    sr,
    seconds,
    (t) => {
      const f = from * (to / from) ** (t / seconds);
      const tone = osc.triangle(f) * adEnv(t, 0.004, 0.05) * 0.8;
      const air = puff.lowpass(r() * 2 - 1, 1500) * decay(t, 0.03) * 0.5;
      return tone + air;
    },
    0.7,
  );
}

function land(sr: number): Float32Array {
  const r = rng(7);
  const lp = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.14, (t) => {
    const thud = lp.lowpass(r() * 2 - 1, 500) * decay(t, 0.025);
    return thud + osc.sine(sweep(t, 120, 55, 0.03)) * decay(t, 0.04) * 0.8;
  });
}

function grab(sr: number): Float32Array {
  const r = rng(9);
  const lp = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.12, (t) => {
    const cloth = lp.lowpass(r() * 2 - 1, 1600) * decay(t, 0.02);
    return cloth + osc.sine(sweep(t, 220, 110, 0.02)) * decay(t, 0.03) * 0.6;
  });
}

/** Contra-ataque: "tim" metálico (parciais que não são harmônicas). */
function counter(sr: number): Float32Array {
  const r = rng(13);
  const oscs = [1250, 1830, 2710, 3390].map(() => new Osc(sr));
  const parts = [1250, 1830, 2710, 3390];
  const click = new OnePole(sr);
  return render(sr, 0.55, (t) => {
    let v = click.highpass(r() * 2 - 1, 3000) * decay(t, 0.004);
    for (const [i, f] of parts.entries()) {
      v += (oscs[i]?.sine(f) ?? 0) * decay(t, 0.18 / (i + 1)) * (0.5 / (i + 1));
    }
    return v;
  });
}

/** KO: explosão grave, ruído que escurece e estalos espalhados. */
function ko(sr: number): Float32Array {
  const r = rng(17);
  const lp = new OnePole(sr);
  const crackle = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 1.5, (t) => {
    const boom = osc.sine(sweep(t, 95, 30, 0.25)) * adEnv(t, 0.003, 0.4);
    const rumble = lp.lowpass(r() * 2 - 1, sweep(t, 5000, 250, 0.15)) * decay(t, 0.3) * 0.9;
    const spark = r() < 0.004 * decay(t, 0.5) ? 1 : 0;
    const pop = crackle.highpass(spark * (r() * 2 - 1), 1500) * 0.6;
    return drive(boom + rumble + pop, 2.5);
  });
}

/** Respawn: arpejo subindo, com brilho. */
function respawn(sr: number): Float32Array {
  const notes = [72, 76, 79, 84];
  const oscs = notes.map(() => new Osc(sr));
  const shimmer = new Osc(sr);
  return render(
    sr,
    0.8,
    (t) => {
      let v = 0;
      for (const [i, note] of notes.entries()) {
        const start = i * 0.07;
        v += (oscs[i]?.triangle(midiFreq(note)) ?? 0) * adEnv(t - start, 0.005, 0.2) * 0.5;
      }
      const sparkle = shimmer.sine(midiFreq(96)) * (0.5 + 0.5 * Math.sin(t * 60)) * decay(t, 0.25);
      return v + sparkle * 0.15;
    },
    0.75,
  );
}

/** Amostras do efeito `name`, na taxa `sampleRate`. Sempre iguais para o mesmo nome. */
export function renderSfx(name: SfxName, sampleRate: number): Float32Array {
  switch (name) {
    case 'hit_light':
      return hit(sampleRate, 0);
    case 'hit_medium':
      return hit(sampleRate, 0.5);
    case 'hit_heavy':
      return hit(sampleRate, 1);
    case 'swing':
      return whoosh(sampleRate, 0.17, 700, 2600, 3);
    case 'jump':
      return jump(sampleRate, 260, 560);
    case 'air_jump':
      return jump(sampleRate, 420, 900);
    case 'dash':
      return whoosh(sampleRate, 0.2, 1400, 450, 21);
    case 'dodge':
      return whoosh(sampleRate, 0.26, 2200, 5200, 23);
    case 'land':
      return land(sampleRate);
    case 'grab':
      return grab(sampleRate);
    case 'counter':
      return counter(sampleRate);
    case 'ko':
      return ko(sampleRate);
    case 'respawn':
      return respawn(sampleRate);
  }
}

/**
 * Grito de KO provisório (enquanto não há o áudio gravado pelo amigo): um "aaah"
 * caindo de tom, com formantes de vogal A. O tom muda com `seed` (o id do
 * personagem), para cada um ter uma voz.
 */
export function renderKoYell(seed: string, sampleRate: number): Float32Array {
  const h = hashText(seed);
  const base = 260 + (h % 140);
  const seconds = 0.75;
  const osc = new Osc(sampleRate);
  const f1 = new BandPass(sampleRate);
  const f2 = new BandPass(sampleRate);
  const r = rng(h);
  const breath = new OnePole(sampleRate);
  return render(sampleRate, seconds, (t) => {
    const k = t / seconds;
    const vibrato = 1 + 0.035 * Math.sin(t * 2 * Math.PI * 6.5);
    const pitch = base * (1.15 - 0.6 * k * k) * vibrato;
    const src = osc.saw(pitch) + breath.highpass(r() * 2 - 1, 2000) * 0.15;
    const voiced = f1.process(src, 800, 5) + f2.process(src, 1200, 6) * 0.7;
    const env = Math.min(t / 0.03, 1) * (k > 0.7 ? (1 - k) / 0.3 : 1);
    return voiced * env;
  });
}
