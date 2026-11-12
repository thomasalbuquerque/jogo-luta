import type { Clip, Key, Rot } from './animation';
import { STANCE } from './clips';

/*
 * Clipes próprios de cada personagem (especial e provocação), pelo id de
 * animação da ficha: `<id>_special` (padrão) e `taunt.animation`.
 * Convenção de ângulos e de tempo: ver `clips.ts`.
 */

/**
 * Schummaki ao volante: as duas mãos lado a lado no volante imaginário, na frente
 * do peito, cotovelos para baixo. A mão de trás fica um pouco mais à frente e mais
 * alta, para as duas aparecerem.
 */
const WHEEL: Rot = {
  ...STANCE,
  torso: 10,
  upperArmNear: 4,
  forearmNear: -120,
  handNear: -74,
  upperArmFar: -6,
  forearmFar: -124,
  handFar: -60,
};

/** Volante girado: `turn` > 0 vira para um lado, < 0 para o outro. */
function wheel(turn: number, extra: Rot = {}): Rot {
  return {
    ...WHEEL,
    upperArmNear: 4 - turn,
    upperArmFar: -6 + turn,
    torso: 10 + turn * 0.15,
    head: -4 - turn * 0.2,
    ...extra,
  };
}

/** Pernas "queimando pneu": joelhos dobrados alternando rápido. */
function burnout(phase: 0 | 1): Rot {
  return phase === 0
    ? { thighNear: -50, shinNear: 70, footNear: -20, thighFar: 20, shinFar: 60, footFar: -40 }
    : { thighNear: -20, shinNear: 60, footNear: -40, thighFar: -10, shinFar: 70, footFar: -20 };
}

/**
 * João com as mãos em concha na boca: cotovelos na frente do peito, antebraços
 * subindo e as mãos em pé dos dois lados da boca, dedos para cima e para a frente
 * (megafone). O rosto continua à mostra entre as mãos.
 */
const CUPPED: Rot = {
  ...STANCE,
  torso: -4,
  head: -18,
  upperArmNear: -55,
  forearmNear: -146,
  handNear: 50,
  upperArmFar: -27,
  forearmFar: -160,
  handFar: 36,
};

/**
 * Dadazinho mirando a doze: braço da frente esticado na altura do ombro (a arma
 * aponta para onde a mão aponta) e a mão de trás embaixo do cano, na bomba.
 * Pernas abertas, firmes para o coice.
 */
const AIM: Rot = {
  ...STANCE,
  torso: 2,
  head: 4,
  upperArmNear: -84,
  forearmNear: -8,
  handNear: 0,
  upperArmFar: -62,
  forearmFar: -38,
  handFar: 10,
  thighNear: 24,
  shinNear: 18,
  footNear: -38,
  thighFar: -30,
  shinFar: 26,
  footFar: 2,
};

/**
 * Air guitar: a mão de trás no braço da guitarra, lá na frente e alta; a da
 * frente palhetando na altura da cintura. `strum` sobe (−) e desce (+) a palheta.
 */
function guitar(strum: number, nod: number): Rot {
  return {
    ...STANCE,
    torso: 10 + nod * 0.4,
    head: 6 + nod,
    upperArmNear: 18,
    forearmNear: -105 + strum,
    handNear: 25 + strum * 0.5,
    upperArmFar: -78,
    forearmFar: -28,
    handFar: -10,
  };
}

/** Palhetadas rápidas entre `from` e `to` (ticks), batendo a cabeça junto. */
function strums(from: number, to: number): Key[] {
  const keys: Key[] = [];
  for (let t = from, i = 0; t <= to; t += 4, i++) {
    const down = i % 2 === 0;
    keys.push({ t, rot: guitar(down ? 14 : -10, down ? 6 : -2), ease: 'inOut' });
  }
  return keys;
}

/** Pernas juntas, em pé e à vontade (sem a guarda). */
const STANDING: Rot = {
  thighNear: 6,
  shinNear: 4,
  footNear: -10,
  thighFar: -8,
  shinFar: 6,
  footFar: 0,
};

/**
 * Tauba saindo de fininho: em pé, ajeitando a gravata borboleta com a mão da
 * frente e a outra solta do lado (a cabeça já olha de canto).
 */
const SNEAK: Rot = {
  ...STANDING,
  torso: 2,
  head: 6,
  upperArmNear: -25,
  forearmNear: -150,
  handNear: -10,
  upperArmFar: 8,
  forearmFar: -25,
  handFar: 10,
};

/** Tauba de volta, como se nada tivesse acontecido: as duas mãos ajeitando o paletó. */
const LAPELS: Rot = {
  ...STANDING,
  torso: 2,
  head: -2,
  upperArmNear: 5,
  forearmNear: -140,
  handNear: 20,
  upperArmFar: 12,
  forearmFar: -150,
  handFar: 20,
};

/**
 * Tauba tocando o trompete (mãos `taunt`): o cotovelo da frente para a frente e o
 * antebraço subindo, com o bocal na boca e o trompete reto; a mão de trás com os
 * dedos nos pistões. `lean` inclina o corpo para trás (a fanfarra subindo).
 */
function trumpet(lean: number): Rot {
  return {
    ...STANCE,
    torso: -4 - lean,
    head: -6 - lean * 0.4,
    upperArmNear: -86,
    forearmNear: -95,
    handNear: 86,
    upperArmFar: -92,
    forearmFar: -122,
    handFar: 80,
  };
}

/** O trompete subindo até a boca (e descendo no fim). */
const TRUMPET_UP: Rot = {
  ...STANCE,
  torso: 0,
  upperArmNear: -50,
  forearmNear: -110,
  handNear: 60,
  upperArmFar: -60,
  forearmFar: -120,
  handFar: 70,
};

export const CHARACTER_CLIPS: Readonly<Record<string, Clip>> = {
  // Arrancada: queima pneu agarrado ao volante e sai disparado, inclinado.
  schummaki_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: { ...wheel(0), ...burnout(0) }, handNear: 'taunt', handFar: 'taunt' },
      { t: 0.25, rot: { ...wheel(8), ...burnout(1), torso: 18 } },
      { t: 0.5, rot: { ...wheel(-8), ...burnout(0), torso: 20 } },
      { t: 0.75, rot: { ...wheel(8), ...burnout(1), torso: 22 } },
      { t: 0.95, rot: { ...wheel(0), ...burnout(0), torso: 24 }, x: -3 },
      {
        t: 1,
        rot: {
          ...wheel(0),
          hips: 6,
          torso: 34,
          head: -24,
          thighFar: -60,
          shinFar: 40,
          footFar: -10,
          thighNear: 50,
          shinNear: 40,
          footNear: -20,
        },
        x: 4,
      },
      {
        t: 2,
        rot: {
          ...wheel(0),
          hips: 6,
          torso: 34,
          head: -24,
          thighFar: -60,
          shinFar: 40,
          footFar: -10,
          thighNear: 50,
          shinNear: 40,
          footNear: -20,
        },
        x: 4,
      },
      {
        t: 2.3,
        rot: { ...wheel(0), torso: -12, head: 6, thighFar: -45, shinFar: 20, footFar: -30 },
        x: -2,
      },
      { t: 3, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // Gira o volante imaginário ("vrum vrum") e grita o bordão no fim.
  schummaki_taunt: {
    timing: 'once',
    length: 80,
    ground: true,
    keys: [
      { t: 0, rot: wheel(0), handNear: 'taunt', handFar: 'taunt' },
      { t: 10, rot: wheel(25), ease: 'inOut' },
      { t: 20, rot: wheel(-25), ease: 'inOut' },
      { t: 30, rot: wheel(25), ease: 'inOut' },
      { t: 40, rot: wheel(-25), ease: 'inOut' },
      { t: 48, rot: wheel(0), ease: 'inOut' },
      {
        t: 52,
        rot: { ...STANCE, torso: -8, head: -16, upperArmFar: -170, forearmFar: -25 },
        expression: 'taunt',
        handNear: 'fist',
        handFar: 'fist',
      },
      { t: 66, rot: { ...STANCE, torso: -6, head: -14, upperArmFar: -160, forearmFar: -45 } },
      { t: 80, rot: STANCE, expression: 'normal', ease: 'inOut' },
    ],
  },
  // Frango assado voador: puxa o braço para trás e arremessa reto.
  joao_frango_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      {
        t: 0.9,
        rot: {
          ...STANCE,
          torso: -14,
          head: 6,
          upperArmNear: 70,
          forearmNear: -60,
          handNear: 0,
          upperArmFar: -70,
          forearmFar: -40,
          thighFar: -35,
          shinFar: 35,
        },
        handNear: 'open',
        x: -2,
      },
      {
        t: 1,
        rot: {
          ...STANCE,
          torso: 22,
          head: -14,
          upperArmNear: -95,
          forearmNear: -5,
          handNear: -10,
          upperArmFar: 40,
          forearmFar: -60,
          thighFar: -50,
          shinFar: 40,
          footFar: 0,
          thighNear: 35,
          shinNear: 15,
          footNear: -40,
        },
        x: 4,
      },
      {
        t: 2.4,
        rot: {
          ...STANCE,
          torso: 18,
          head: -10,
          upperArmNear: -80,
          forearmNear: -15,
          handNear: -10,
          upperArmFar: 30,
          forearmFar: -70,
          thighFar: -45,
          shinFar: 40,
          footFar: 0,
          thighNear: 30,
          shinNear: 15,
          footNear: -40,
        },
        x: 3,
      },
      { t: 3, rot: STANCE, handNear: 'fist', ease: 'inOut' },
    ],
  },
  // Mãos em concha na boca: "Ô Mariiiliaaa!".
  joao_frango_taunt: {
    timing: 'once',
    length: 90,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 10, rot: CUPPED, handNear: 'taunt', handFar: 'taunt', ease: 'out' },
      {
        t: 14,
        rot: { ...CUPPED, torso: -8, head: -22 },
        expression: 'taunt',
      },
      { t: 70, rot: { ...CUPPED, torso: -12, head: -26 }, y: -1 },
      { t: 80, rot: CUPPED, expression: 'normal' },
      { t: 90, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // Doze: a arma aparece na mão, ele mira, o tiro dá um coice para trás e a arma some.
  dadazinho_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      {
        t: 0.2,
        rot: { ...STANCE, upperArmNear: -30, forearmNear: -100, handNear: 10 },
        prop: 'fx_gun',
      },
      { t: 0.7, rot: AIM, ease: 'out' },
      // o tiro sai com a arma reta; o coice vem logo depois
      { t: 1, rot: AIM },
      {
        t: 2.12,
        rot: {
          ...AIM,
          torso: -9,
          head: -2,
          upperArmNear: -96,
          forearmNear: -12,
          handNear: -10,
          upperArmFar: -72,
        },
        x: -2.5,
        ease: 'out',
      },
      { t: 2.4, rot: { ...AIM, torso: -4, upperArmNear: -90 }, x: -2.5, ease: 'inOut' },
      {
        t: 2.65,
        rot: { ...STANCE, upperArmNear: -40, forearmNear: -95 },
        prop: null,
        x: -1.5,
        ease: 'inOut',
      },
      { t: 3, rot: STANCE, ease: 'inOut' },
    ],
  },
  // Air guitar, para do nada e solta o bordão na seca (voz no `voiceAt` da ficha).
  dadazinho_taunt: {
    timing: 'once',
    length: 110,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 8, rot: guitar(0, 0), handNear: 'taunt', handFar: 'taunt', ease: 'out' },
      ...strums(12, 64),
      { t: 70, rot: guitar(0, 0), ease: 'out' },
      {
        t: 80,
        rot: {
          torso: 0,
          head: -2,
          upperArmNear: 4,
          forearmNear: -12,
          handNear: 10,
          upperArmFar: -6,
          forearmFar: -14,
          handFar: 10,
          thighNear: 6,
          shinNear: 4,
          footNear: -10,
          thighFar: -8,
          shinFar: 6,
          footFar: 0,
        },
        handNear: 'open',
        handFar: 'open',
        ease: 'inOut',
      },
      {
        t: 100,
        rot: {
          torso: -2,
          head: -6,
          upperArmNear: 4,
          forearmNear: -12,
          handNear: 10,
          upperArmFar: -6,
          forearmFar: -14,
          handFar: 10,
          thighNear: 6,
          shinNear: 4,
          footNear: -10,
          thighFar: -8,
          shinFar: 6,
          footFar: 0,
        },
      },
      { t: 110, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // Silent quit: ajeita a gravata e some (no active ele está invisível); volta
  // ajeitando o paletó, como se nada tivesse acontecido.
  tauba_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 0.5, rot: SNEAK, handFar: 'open', ease: 'out' },
      { t: 1, rot: { ...SNEAK, head: 10 }, ease: 'inOut' },
      { t: 2, rot: LAPELS, handFar: 'fist' },
      { t: 2.5, rot: { ...LAPELS, head: -6, upperArmNear: -2, upperArmFar: -12 }, ease: 'inOut' },
      { t: 3, rot: STANCE, ease: 'inOut' },
    ],
  },
  // O trompete aparece, ele toca a fanfarra e o trompete some. As notas saem do
  // tick 30 (o `voiceAt` da ficha), nos tempos de `FANFARE` (audio/fanfare.ts):
  // Sol–Dó–Mi–Sol curtas (30, 37, 44, 52), Mi (73) e o Sol longo (84 a 141).
  tauba_taunt: {
    timing: 'once',
    length: 160,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 8, rot: TRUMPET_UP, handNear: 'taunt', handFar: 'taunt', ease: 'out' },
      { t: 24, rot: trumpet(0), ease: 'out' },
      { t: 30, rot: trumpet(3), ease: 'out' },
      { t: 37, rot: trumpet(1), ease: 'inOut' },
      { t: 44, rot: trumpet(4), ease: 'inOut' },
      { t: 52, rot: trumpet(6), ease: 'out' },
      { t: 70, rot: trumpet(3), ease: 'inOut' },
      { t: 73, rot: trumpet(5), ease: 'out' },
      { t: 84, rot: trumpet(8), ease: 'out' },
      { t: 100, rot: trumpet(14), ease: 'out' },
      { t: 141, rot: trumpet(15) },
      { t: 150, rot: TRUMPET_UP, ease: 'inOut' },
      { t: 152, rot: TRUMPET_UP, handNear: 'fist', handFar: 'fist', expression: 'taunt' },
      { t: 160, rot: STANCE, ease: 'inOut' },
    ],
  },
};
