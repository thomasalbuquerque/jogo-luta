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
  'vanish',
  'appear',
  'rifle_shot',
  'rifle_bolt',
  'spine_crack',
  'flour_thump',
  'pixel_spawn',
  'pixel_hit',
  'pixel_despawn',
  'drag_sizzle',
  'exhale_puff',
  'aura_pass',
  'combo_hit',
  'combo_finish',
  'command_miss',
  'count',
  'go',
  'ui_move',
  'ui_confirm',
  'ui_back',
  'ui_error',
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

type Voice = (t: number) => number;

/** Roda `voice` por `seconds` e normaliza. */
function render(
  sampleRate: number,
  seconds: number,
  voice: Voice,
  peak = 0.9,
): Float32Array<ArrayBuffer> {
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
function hit(sr: number, s: number): Float32Array<ArrayBuffer> {
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
function whoosh(
  sr: number,
  seconds: number,
  from: number,
  to: number,
  seed: number,
): Float32Array<ArrayBuffer> {
  const r = rng(seed);
  const bp = new BandPass(sr);
  return render(sr, seconds, (t) => {
    const k = t / seconds;
    const bell = Math.sin(Math.PI * Math.min(k, 1)) ** 2;
    return bp.process(r() * 2 - 1, from * (to / from) ** k, 1.2) * bell;
  });
}

function jump(sr: number, from: number, to: number): Float32Array<ArrayBuffer> {
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

function land(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(7);
  const lp = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.14, (t) => {
    const thud = lp.lowpass(r() * 2 - 1, 500) * decay(t, 0.025);
    return thud + osc.sine(sweep(t, 120, 55, 0.03)) * decay(t, 0.04) * 0.8;
  });
}

function grab(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(9);
  const lp = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.12, (t) => {
    const cloth = lp.lowpass(r() * 2 - 1, 1600) * decay(t, 0.02);
    return cloth + osc.sine(sweep(t, 220, 110, 0.02)) * decay(t, 0.03) * 0.6;
  });
}

/** Contra-ataque: "tim" metálico (parciais que não são harmônicas). */
function counter(sr: number): Float32Array<ArrayBuffer> {
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
function ko(sr: number): Float32Array<ArrayBuffer> {
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
function respawn(sr: number): Float32Array<ArrayBuffer> {
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

/** Notas curtas em sequência (bipes de menu), `gap` segundos entre elas. */
function blips(
  sr: number,
  notes: readonly number[],
  gap: number,
  tau: number,
  wave: 'sine' | 'triangle' | 'square',
): Float32Array<ArrayBuffer> {
  const oscs = notes.map(() => new Osc(sr));
  const seconds = gap * (notes.length - 1) + tau * 5;
  return render(
    sr,
    seconds,
    (t) => {
      let v = 0;
      for (const [i, note] of notes.entries()) {
        const osc = oscs[i];
        if (!osc) continue;
        const f = midiFreq(note);
        const tone = wave === 'square' ? osc.square(f) * 0.5 : osc[wave](f);
        v += tone * adEnv(t - i * gap, 0.003, tau);
      }
      return v;
    },
    0.7,
  );
}

/** Bipe da contagem "3, 2, 1": tom com um pouco de brilho em cima. */
function count(sr: number): Float32Array<ArrayBuffer> {
  const low = new Osc(sr);
  const high = new Osc(sr);
  return render(sr, 0.45, (t) => {
    const env = adEnv(t, 0.004, 0.12);
    return (low.triangle(midiFreq(69)) + high.sine(midiFreq(81)) * 0.35) * env;
  });
}

/** "LUTA!": acorde aberto, com estalo de ruído e um baque grave. */
function go(sr: number): Float32Array<ArrayBuffer> {
  const notes = [69, 76, 81, 85, 88];
  const oscs = notes.map(() => new Osc(sr));
  const sub = new Osc(sr);
  const r = rng(29);
  const crash = new OnePole(sr);
  return render(sr, 1.1, (t) => {
    let v = 0;
    for (const [i, note] of notes.entries()) {
      v += (oscs[i]?.saw(midiFreq(note)) ?? 0) * adEnv(t, 0.006, 0.35) * 0.22;
    }
    const thump = sub.sine(sweep(t, 160, 50, 0.05)) * adEnv(t, 0.002, 0.12);
    const hiss = crash.highpass(r() * 2 - 1, 3500) * decay(t, 0.12) * 0.4;
    return drive(v + thump + hiss, 1.6);
  });
}

/** Erro de menu (opção que ainda não existe): zumbido grave curto, duas vezes. */
function uiError(sr: number): Float32Array<ArrayBuffer> {
  const osc = new Osc(sr);
  const lp = new OnePole(sr);
  return render(
    sr,
    0.24,
    (t) => {
      const gate = t < 0.09 || (t > 0.12 && t < 0.21) ? 1 : 0;
      return lp.lowpass(osc.square(midiFreq(43)), 1200) * gate;
    },
    0.6,
  );
}

/**
 * "Plim" de chamada: duas notas limpas, descendo (alguém saiu: o Tauba sumindo no
 * especial) ou subindo (alguém entrou: ele voltando). Genérico, sem lembrar app nenhum.
 */
function callChime(sr: number, rising: boolean): Float32Array<ArrayBuffer> {
  return blips(sr, rising ? [76, 83] : [83, 76], 0.09, 0.09, 'sine');
}

/**
 * Tiro de rifle (a scout do Tchula): estalo seco bem agudo, um estouro grave que cai
 * de tom e a cauda do eco rolando longe.
 */
function rifleShot(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(31);
  const crack = new OnePole(sr);
  const body = new OnePole(sr);
  const tail = new OnePole(sr);
  const osc = new Osc(sr);
  return render(sr, 0.9, (t) => {
    const n = r() * 2 - 1;
    const c = crack.highpass(n, 3000) * decay(t, 0.004);
    const b = body.lowpass(n, 1800) * decay(t, 0.03) * 0.9;
    const boom = osc.sine(sweep(t, 150, 38, 0.06)) * adEnv(t, 0.001, 0.12);
    const echo = tail.lowpass(n, 700) * adEnv(t - 0.05, 0.03, 0.22) * 0.45;
    return drive(c + b + boom + echo, 2.6);
  });
}

/** Ferrolho: dois estalos metálicos (puxa e empurra), com um tilintar curto. */
function rifleBolt(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(37);
  const bp = new BandPass(sr);
  const ring = new Osc(sr);
  return render(
    sr,
    0.32,
    (t) => {
      const clack = (at: number, freq: number) => {
        const env = adEnv(t - at, 0.0015, 0.012);
        return bp.process(r() * 2 - 1, freq, 2.5) * env * 2.2 + ring.sine(freq * 1.5) * env * 0.3;
      };
      return clack(0, 2600) + clack(0.15, 3400);
    },
    0.75,
  );
}

/**
 * Coluna estalando (o "créc" da Correção postural do Crocko): três estalos secos
 * e rápidos, cada vez mais fracos, por cima de um baque curto de tapa.
 */
function spineCrack(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(41);
  const bp = new BandPass(sr);
  const slap = new OnePole(sr);
  const thump = new Osc(sr);
  return render(
    sr,
    0.26,
    (t) => {
      const pop = (at: number, freq: number, gain: number) =>
        bp.process(r() * 2 - 1, freq, 3) * adEnv(t - at, 0.0008, 0.007) * gain;
      const crack = pop(0.01, 1900, 2.4) + pop(0.045, 2300, 1.8) + pop(0.072, 1700, 1.3);
      const hand = slap.lowpass(r() * 2 - 1, 2400) * decay(t, 0.018) * 0.9;
      const body = thump.sine(sweep(t, 190, 70, 0.04)) * decay(t, 0.05) * 0.5;
      return crack + hand + body;
    },
    0.8,
  );
}

/**
 * Rolo batendo na bancada (o "póf" do Rolo na bancada do Darllan): um baque grave
 * que afunda, o toc da madeira por cima e o sopro de farinha se espalhando depois.
 */
function flourThump(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(43);
  const wood = new BandPass(sr);
  const puff = new OnePole(sr);
  const boom = new Osc(sr);
  return render(
    sr,
    0.5,
    (t) => {
      const body = boom.sine(sweep(t, 120, 38, 0.07)) * decay(t, 0.13) * 1.1;
      const knock = wood.process(r() * 2 - 1, 620, 4) * adEnv(t, 0.0006, 0.018) * 2.2;
      const poof = puff.lowpass(r() * 2 - 1, 900) * adEnv(t - 0.01, 0.02, 0.12) * 0.9;
      return drive(body + knock + poof, 1.4);
    },
    0.85,
  );
}

/**
 * Golpe do bonequinho 8-bit do Gabs: onda quadrada caindo de tom bem rápido e um
 * chiado de ruído "pixelado" (o valor só muda a cada tantas amostras), como nos
 * videogames antigos.
 */
function pixelHit(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(47);
  const osc = new Osc(sr);
  const hold = Math.max(1, Math.round(sr / 6000));
  let noise = 0;
  let i = 0;
  return render(
    sr,
    0.22,
    (t) => {
      if (i++ % hold === 0) noise = r() < 0.5 ? -1 : 1;
      const zap = osc.square(sweep(t, 980, 110, 0.05)) * adEnv(t, 0.001, 0.06) * 0.6;
      return zap + noise * adEnv(t, 0.001, 0.035) * 0.5;
    },
    0.8,
  );
}

/**
 * Tragada no palheiro (Marília): chiado baixinho da palha queimando, com estalinhos
 * soltos, subindo um pouco enquanto ela puxa o ar.
 */
function dragSizzle(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(53);
  const hiss = new OnePole(sr);
  const pop = new BandPass(sr);
  const seconds = 0.6;
  return render(
    sr,
    seconds,
    (t) => {
      const k = t / seconds;
      const swell = Math.min(t / 0.08, 1) * (0.5 + 0.5 * k) * (k > 0.85 ? (1 - k) / 0.15 : 1);
      const crackle = r() < 0.004 ? (r() * 2 - 1) * 8 : 0;
      return hiss.highpass(r() * 2 - 1, 3500) * swell * 0.6 + pop.process(crackle, 2600, 3);
    },
    0.6,
  );
}

/** Baforada (Marília soltando a fumaça): um "fffhhh" de ar, descendo de tom. */
function exhalePuff(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(59);
  const bp = new BandPass(sr);
  const air = new OnePole(sr);
  const seconds = 0.75;
  return render(
    sr,
    seconds,
    (t) => {
      const k = t / seconds;
      const env = Math.min(t / 0.05, 1) * (1 - k) ** 1.6;
      const n = r() * 2 - 1;
      return (bp.process(n, 1500 - 900 * k, 1.1) + air.lowpass(n, 700) * 0.6) * env;
    },
    0.7,
  );
}

/**
 * "Plim" do golpe passando pela aura: sino agudo e limpo (duas parciais e uma
 * inarmônica bem curta), sem peso nenhum de impacto.
 */
function auraPass(sr: number): Float32Array<ArrayBuffer> {
  const a = new Osc(sr);
  const b = new Osc(sr);
  const c = new Osc(sr);
  return render(
    sr,
    0.5,
    (t) => {
      const ring = a.sine(1760) * decay(t, 0.12) + b.sine(2640) * decay(t, 0.07) * 0.5;
      return (ring + c.sine(4380) * decay(t, 0.02) * 0.4) * Math.min(t / 0.002, 1);
    },
    0.75,
  );
}

/**
 * "Pá" de cada golpe do combo do Meia: estalo seco e curto, mais agudo e mais leve
 * que o soco normal, para dar para ouvir 9 seguidos sem embolar.
 */
function comboHit(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(61);
  const snap = new OnePole(sr);
  const body = new BandPass(sr);
  const osc = new Osc(sr);
  return render(
    sr,
    0.1,
    (t) => {
      const n = r() * 2 - 1;
      const crack = snap.highpass(n, 3000) * decay(t, 0.004) * 0.9;
      const slap = body.process(n, 1400, 1.4) * decay(t, 0.014) * 1.2;
      const knock = osc.sine(sweep(t, 320, 140, 0.02)) * adEnv(t, 0.001, 0.025) * 0.6;
      return drive(crack + slap + knock, 1.8);
    },
    0.8,
  );
}

/**
 * "Póu" do chute final do combo (o arremesso): um soco pesado com um estrondo grave
 * que demora a sumir e o ar rasgando por cima.
 */
function comboFinish(sr: number): Float32Array<ArrayBuffer> {
  const r = rng(67);
  const crack = new OnePole(sr);
  const air = new BandPass(sr);
  const boom = new Osc(sr);
  return render(
    sr,
    0.55,
    (t) => {
      const n = r() * 2 - 1;
      const c = crack.highpass(n, 2200) * decay(t, 0.008) * 0.9;
      const low = boom.sine(sweep(t, 180, 42, 0.09)) * adEnv(t, 0.002, 0.2) * 1.2;
      const rush = air.process(n, 900 + 1400 * Math.max(0, 1 - t / 0.3), 1) * adEnv(t, 0.01, 0.14);
      return drive(c + low + rush * 0.6, 2.4);
    },
    0.9,
  );
}

/**
 * "Buzz" de comando errado (o Comando do Meia que não pegou): zumbido grave de onda
 * quadrada, duas notas desafinadas batendo, como o erro de input dos jogos de luta.
 */
function commandMiss(sr: number): Float32Array<ArrayBuffer> {
  const a = new Osc(sr);
  const b = new Osc(sr);
  const lp = new OnePole(sr);
  return render(
    sr,
    0.38,
    (t) => {
      const buzz = a.square(98) + b.square(104) * 0.8;
      const env = Math.min(t / 0.006, 1) * (t < 0.3 ? 1 : 1 - (t - 0.3) / 0.08);
      return lp.lowpass(buzz, 1300) * env * 0.5;
    },
    0.7,
  );
}

/** Amostras do efeito `name`, na taxa `sampleRate`. Sempre iguais para o mesmo nome. */
export function renderSfx(name: SfxName, sampleRate: number): Float32Array<ArrayBuffer> {
  switch (name) {
    case 'count':
      return count(sampleRate);
    case 'go':
      return go(sampleRate);
    case 'ui_move':
      return blips(sampleRate, [84], 0, 0.025, 'sine');
    case 'ui_confirm':
      return blips(sampleRate, [76, 83], 0.06, 0.05, 'triangle');
    case 'ui_back':
      return blips(sampleRate, [79, 72], 0.06, 0.04, 'triangle');
    case 'ui_error':
      return uiError(sampleRate);
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
    case 'vanish':
      return callChime(sampleRate, false);
    case 'appear':
      return callChime(sampleRate, true);
    case 'rifle_shot':
      return rifleShot(sampleRate);
    case 'spine_crack':
      return spineCrack(sampleRate);
    case 'flour_thump':
      return flourThump(sampleRate);
    case 'rifle_bolt':
      return rifleBolt(sampleRate);
    case 'pixel_spawn':
      return blips(sampleRate, [72, 76, 79, 84], 0.045, 0.04, 'square');
    case 'pixel_hit':
      return pixelHit(sampleRate);
    case 'pixel_despawn':
      return blips(sampleRate, [84, 79, 76, 67], 0.04, 0.035, 'square');
    case 'drag_sizzle':
      return dragSizzle(sampleRate);
    case 'exhale_puff':
      return exhalePuff(sampleRate);
    case 'aura_pass':
      return auraPass(sampleRate);
    case 'combo_hit':
      return comboHit(sampleRate);
    case 'combo_finish':
      return comboFinish(sampleRate);
    case 'command_miss':
      return commandMiss(sampleRate);
  }
}

/**
 * Grito de KO provisório (enquanto não há o áudio gravado pelo amigo): um "aaah"
 * caindo de tom, com formantes de vogal A. O tom muda com `seed` (o id do
 * personagem), para cada um ter uma voz.
 */
export function renderKoYell(seed: string, sampleRate: number): Float32Array<ArrayBuffer> {
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
