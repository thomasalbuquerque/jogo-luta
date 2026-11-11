import type { Clip, Rot } from './animation';
import { STANCE } from './clips';

/*
 * Clipes próprios de cada personagem (especial e provocação), pelo id de
 * animação da ficha: `<id>_special` (padrão) e `taunt.animation`.
 * Convenção de ângulos e de tempo: ver `clips.ts`.
 */

/** Schummaki ao volante: mãos no volante imaginário na frente do peito. */
const WHEEL: Rot = {
  ...STANCE,
  torso: 10,
  upperArmNear: -62,
  forearmNear: -62,
  handNear: -70,
  upperArmFar: -72,
  forearmFar: -48,
  handFar: -70,
};

/** Volante girado: `turn` > 0 vira para um lado, < 0 para o outro. */
function wheel(turn: number, extra: Rot = {}): Rot {
  return {
    ...WHEEL,
    upperArmNear: -62 - turn,
    upperArmFar: -72 + turn,
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
 * João com as mãos em concha na boca: braço para a frente e para cima, cotovelo
 * dobrado e a mão deitada ao lado da boca, dedos para a frente (megafone).
 */
const CUPPED: Rot = {
  ...STANCE,
  torso: -8,
  head: -20,
  upperArmNear: -62,
  forearmNear: -100,
  handNear: 62,
  upperArmFar: -80,
  forearmFar: -88,
  handFar: 55,
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
        rot: { ...CUPPED, torso: -12, head: -24 },
        expression: 'taunt',
      },
      { t: 70, rot: { ...CUPPED, torso: -16, head: -28 }, y: -1 },
      { t: 80, rot: CUPPED, expression: 'normal' },
      { t: 90, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
};
