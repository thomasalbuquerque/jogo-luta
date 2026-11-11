import type { Clip, Rot } from './animation';

/** Guarda de luta: punhos na frente do peito, joelhos levemente dobrados. */
export const STANCE: Rot = {
  torso: 6,
  head: -4,
  upperArmNear: -20,
  forearmNear: -115,
  handNear: 10,
  upperArmFar: -40,
  forearmFar: -100,
  handFar: 10,
  thighNear: -14,
  shinNear: 22,
  footNear: -8,
  thighFar: 12,
  shinFar: 14,
  footFar: -26,
};

/** Clipes do esqueleto base, pelo nome da animação (`AnimationKey` do sim). */
export const BASE_CLIPS: Readonly<Record<string, Clip>> = {
  rest: { timing: 'once', keys: [{ t: 0, rot: {} }] },
  idle: {
    timing: 'loop',
    length: 60,
    keys: [
      { t: 0, rot: STANCE },
      {
        t: 30,
        rot: { ...STANCE, torso: 9, upperArmNear: -16, upperArmFar: -36 },
        y: 1,
        ease: 'inOut',
      },
    ],
  },
};
