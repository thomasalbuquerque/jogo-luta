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
    upperArmNear: -78,
    forearmNear: -101,
    handNear: 86,
    upperArmFar: -86,
    forearmFar: -126,
    handFar: 82,
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

/**
 * Tchula mirando a scout (peça `fx_rifle` na mão da frente, cabo no pivô): a mão da
 * frente no cabo, perto do peito (a coronha encosta no ombro), cotovelo para baixo;
 * a mão de trás fechada embaixo do cano, mais à frente (o punho visto pela palma, com
 * a arma por cima). A arma fica reta: a soma dos ângulos do tronco ao punho dá 0 nos
 * dois braços. Pernas abertas, firmes.
 */
const SCOPE: Rot = {
  ...STANCE,
  torso: 4,
  head: 10,
  upperArmNear: -34,
  forearmNear: -80,
  handNear: 20,
  upperArmFar: -49,
  forearmFar: -60,
  handFar: 15,
  thighNear: 24,
  shinNear: 18,
  footNear: -38,
  thighFar: -30,
  shinFar: 26,
  footFar: 2,
};

/** O coice do tiro: tronco para trás e a arma subindo. */
const SCOPE_KICK: Rot = {
  ...SCOPE,
  torso: -6,
  head: 2,
  upperArmNear: -40,
  handNear: 16,
  upperArmFar: -55,
  forearmFar: -58,
};

/** A arma aparecendo (e sumindo) na mão, na frente da cintura. */
const RIFLE_LOW: Rot = { ...STANCE, upperArmNear: -30, forearmNear: -100, handNear: 30 };

/** A mão da frente no bolso de trás (tirando ou guardando a chave de boca). */
const POCKET: Rot = {
  ...STANDING,
  torso: 4,
  head: 4,
  upperArmNear: 28,
  forearmNear: -24,
  handNear: 0,
  upperArmFar: 8,
  forearmFar: -40,
  handFar: 10,
};

/**
 * Girando a chave na mão como um revólver: antebraço da frente subindo na frente do
 * peito, a chave girando em volta do dedo (`propSpin`); a outra mão solta do lado.
 */
const WRENCH_SPIN: Rot = {
  ...STANDING,
  torso: 2,
  head: 6,
  upperArmNear: -22,
  forearmNear: -110,
  handNear: 20,
  upperArmFar: 4,
  forearmFar: -14,
  handFar: 10,
};

/** Apontando a chave para o adversário: braço esticado para a frente, um pouco para cima. */
const WRENCH_POINT: Rot = {
  ...STANDING,
  torso: -4,
  head: -12,
  upperArmNear: -96,
  forearmNear: -2,
  handNear: 0,
  upperArmFar: 4,
  forearmFar: -14,
  handFar: 10,
  thighNear: 22,
  shinNear: 10,
  footNear: -30,
};

/**
 * 3 voltas e 3/4: a chave para em pé no punho (boca para cima, −90° em relação à mão),
 * como se segura uma chave de verdade, e não apontando para a frente.
 */
const SPUN = 1440 - 90;

/**
 * Crocko na pose de pilates: em pé numa perna só (a de perto, reta), o joelho da
 * outra levantado na frente, braços abertos (o de trás para a frente, o da frente
 * para trás), postura impecável e a cabeça um pouco baixa, avaliando a postura do
 * adversário.
 */
const PILATES: Rot = {
  hips: 0,
  torso: -3,
  head: 6,
  upperArmNear: 100,
  forearmNear: -4,
  handNear: 4,
  upperArmFar: -100,
  forearmFar: 4,
  handFar: -4,
  thighNear: 2,
  shinNear: 0,
  footNear: -6,
  thighFar: -82,
  shinFar: 100,
  footFar: 30,
};

/** O tapa da correção: passo à frente, tronco inclinado e a mão aberta lá na frente. */
const SLAP: Rot = {
  torso: 18,
  head: -2,
  upperArmNear: -82,
  forearmNear: -4,
  handNear: -6,
  upperArmFar: 45,
  forearmFar: -40,
  handFar: 10,
  thighNear: 32,
  shinNear: 12,
  footNear: -24,
  thighFar: -48,
  shinFar: 52,
  footFar: -6,
};

/**
 * Alongamento: o braço de trás esticado para cima (mão aberta, palma para a
 * frente), a mão da frente na cintura. O braço de trás passa atrás da cabeça e não
 * tampa o rosto.
 */
const STRETCH: Rot = {
  ...STANDING,
  torso: -4,
  head: -6,
  upperArmNear: 28,
  forearmNear: -118,
  handNear: 30,
  upperArmFar: -174,
  forearmFar: -6,
  handFar: 0,
};

/**
 * "Olha essa postura...": aponta para o adversário com a mão da frente, a outra
 * na cintura, queixo para cima.
 */
const POSTURE_POINT: Rot = {
  ...STANDING,
  torso: 0,
  head: -8,
  upperArmNear: -86,
  forearmNear: -6,
  handNear: 0,
  upperArmFar: 28,
  forearmFar: -118,
  handFar: 30,
};

/*
 * Darllan e o rolo de massa (`fx_pin`): a mão da frente segura o cabo esquerdo e o
 * punho direito, que vem desenhado no rolo, cai sobre a mão de trás. Os ângulos
 * dos braços põem as duas mãos a um rolo de distância; o `propSpin` deixa o rolo
 * deitado. Mudou braço, mão ou rolo: refaça as contas.
 */

/** Pernas firmes, um pouco abertas, para levantar o rolo. */
const PLANTED: Rot = {
  thighNear: 16,
  shinNear: 12,
  footNear: -22,
  thighFar: -22,
  shinFar: 14,
  footFar: 0,
};

/** Rolo na altura do peito, saindo do bolso para subir. */
const PIN_CHEST: Rot = {
  ...STANCE,
  torso: 4,
  head: -2,
  upperArmNear: -18,
  forearmNear: -90,
  handNear: 0,
  upperArmFar: -78,
  forearmFar: -2,
  handFar: 0,
};
const PIN_CHEST_SPIN = 14;

/** Rolo erguido com as duas mãos acima da cabeça, o corpo inclinado para trás. */
const PIN_RAISED: Rot = {
  ...PLANTED,
  torso: -10,
  head: -10,
  upperArmNear: -176,
  forearmNear: -8,
  handNear: 0,
  upperArmFar: -162,
  forearmFar: 0,
  handFar: 0,
};
const PIN_RAISED_SPIN = 100;

/** A pancada: agachado fundo, tronco para a frente e o rolo deitado rente ao chão. */
const PIN_SLAM: Rot = {
  hips: 10,
  torso: 50,
  head: -32,
  upperArmNear: -64,
  forearmNear: -2,
  handNear: 0,
  upperArmFar: -78,
  forearmFar: -54,
  handFar: 0,
  thighNear: -30,
  shinNear: 115,
  footNear: -78,
  thighFar: -80,
  shinFar: 120,
  footFar: -38,
};
const PIN_SLAM_SPIN = -84;

/** Ainda agachado, o rolo no chão, levantando o tronco aos poucos. */
const PIN_REST: Rot = {
  hips: 8,
  torso: 42,
  head: -24,
  upperArmNear: -48,
  forearmNear: -10,
  handNear: 0,
  upperArmFar: -58,
  forearmFar: -62,
  handFar: 0,
  thighNear: -26,
  shinNear: 105,
  footNear: -72,
  thighFar: -74,
  shinFar: 110,
  footFar: -34,
};
const PIN_REST_SPIN = -82;

/** Mão da frente no bolso do avental, na frente da barriga. */
const APRON_POCKET: Rot = {
  ...STANDING,
  torso: 4,
  head: 4,
  upperArmNear: -14,
  forearmNear: -44,
  handNear: 20,
  upperArmFar: 6,
  forearmFar: -30,
  handFar: 10,
};

/** Mordendo o biscoito: a mão da frente leva o biscoito à boca. */
const BITE: Rot = {
  ...STANDING,
  torso: 2,
  head: -6,
  upperArmNear: -8,
  forearmNear: -161,
  handNear: 25,
  upperArmFar: 4,
  forearmFar: -30,
  handFar: 10,
};

/** "Darllan!": braços bem abertos, peito para fora, cabeça para trás. */
const ARMS_WIDE: Rot = {
  ...STANDING,
  torso: -8,
  head: -14,
  upperArmNear: 145,
  forearmNear: 0,
  handNear: -10,
  upperArmFar: -112,
  forearmFar: -10,
  handFar: -6,
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
  // Scout: a arma aparece, ele mira (startup longo: a linha de mira e o brilho da
  // luneta avisam), o tiro sai reto no 1º frame ativo, o coice joga o corpo para
  // trás, ele puxa o ferrolho (a cápsula salta) e a arma some.
  tchula_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 0.15, rot: RIFLE_LOW, prop: 'fx_rifle' },
      { t: 0.45, rot: SCOPE, ease: 'out' },
      { t: 1, rot: { ...SCOPE, head: 12 } },
      { t: 2.1, rot: SCOPE_KICK, x: -3, ease: 'out' },
      // ferrolho: a arma sobe um pouco e volta (a cápsula sai aqui)
      { t: 2.3, rot: { ...SCOPE, handNear: 6 }, x: -2, ease: 'inOut' },
      { t: 2.45, rot: SCOPE, x: -1.5, ease: 'inOut' },
      { t: 2.7, rot: RIFLE_LOW, prop: null, x: -1, ease: 'inOut' },
      { t: 3, rot: STANCE, ease: 'inOut' },
    ],
  },
  // Tira a chave de boca do bolso, gira na mão como um revólver, aponta para o
  // adversário e grita "Nooola!" (voz no `voiceAt` da ficha, 78) e guarda a chave.
  tchula_taunt: {
    timing: 'once',
    length: 120,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 10, rot: POCKET, handNear: 'open', ease: 'out' },
      { t: 16, rot: POCKET, handNear: 'fist', handFar: 'open', prop: 'fx_wrench' },
      { t: 26, rot: WRENCH_SPIN, propSpin: 0, ease: 'out' },
      { t: 58, rot: { ...WRENCH_SPIN, head: -2 }, propSpin: SPUN, ease: 'inOut' },
      { t: 64, rot: WRENCH_SPIN, propSpin: SPUN },
      { t: 72, rot: WRENCH_POINT, propSpin: SPUN, ease: 'out' },
      {
        t: 76,
        rot: { ...WRENCH_POINT, torso: -8, head: -20 },
        propSpin: SPUN,
        expression: 'taunt',
      },
      { t: 100, rot: { ...WRENCH_POINT, torso: -10, head: -22 }, propSpin: SPUN, y: -1 },
      { t: 106, rot: POCKET, propSpin: SPUN, expression: 'normal', ease: 'inOut' },
      { t: 110, rot: POCKET, prop: null, handFar: 'fist' },
      { t: 120, rot: STANCE, ease: 'inOut' },
    ],
  },
  // Correção postural: entra rápido na pose de pilates (startup curto) e espera a
  // janela inteira (active), respirando. Se ninguém bater, perde o equilíbrio no
  // recovery: balança, a perna levantada desce para se segurar e volta à guarda.
  crocko_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      {
        t: 0.4,
        rot: { ...STANCE, upperArmNear: 40, upperArmFar: -60 },
        handNear: 'open',
        handFar: 'open',
      },
      { t: 1, rot: PILATES, ease: 'out' },
      { t: 1.5, rot: { ...PILATES, torso: -5, head: 4 }, y: -0.5, ease: 'inOut' },
      { t: 2, rot: PILATES, ease: 'inOut' },
      {
        t: 2.25,
        rot: {
          ...PILATES,
          torso: -14,
          head: -6,
          upperArmNear: 145,
          upperArmFar: -125,
          thighFar: -40,
          shinFar: 50,
        },
        x: -1,
        expression: 'hurt',
        ease: 'out',
      },
      {
        t: 2.5,
        rot: {
          ...STANDING,
          torso: 12,
          upperArmNear: 70,
          forearmNear: -20,
          upperArmFar: -60,
          forearmFar: -20,
        },
        x: -1,
        ease: 'inOut',
      },
      { t: 2.75, rot: { ...STANCE, torso: 2 }, expression: 'normal', ease: 'inOut' },
      { t: 3, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // O contra-ataque pegou (o sim pula para o recovery): o tapa nas costas já sai no
  // 1º quadro (é o que aparece no congelamento do acerto), segue o movimento e ele
  // volta para a guarda, satisfeito.
  crocko_special_counter: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      {
        t: 0.4,
        rot: { ...STANCE, upperArmNear: 40, upperArmFar: -60 },
        handNear: 'open',
        handFar: 'open',
      },
      { t: 1, rot: PILATES, ease: 'out' },
      { t: 2, rot: SLAP, x: 2, expression: 'taunt' },
      {
        t: 2.3,
        rot: { ...SLAP, torso: 24, upperArmNear: -55, forearmNear: -10, handNear: 10 },
        x: 2.5,
        ease: 'out',
      },
      {
        t: 2.7,
        rot: { ...STANDING, torso: -2, head: 6, upperArmNear: -20, forearmNear: -30 },
        x: 1.5,
        expression: 'normal',
        ease: 'inOut',
      },
      { t: 3, rot: STANCE, x: 0, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // Alongamento: braços para cima, inclina o tronco para trás e volta; depois
  // aponta para o adversário ("Olha essa postura...", no `voiceAt` da ficha, 62).
  crocko_taunt: {
    timing: 'once',
    length: 100,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 10, rot: STRETCH, handFar: 'taunt', ease: 'out' },
      { t: 22, rot: { ...STRETCH, torso: -14, head: -12, upperArmFar: -178 }, ease: 'inOut' },
      { t: 34, rot: { ...STRETCH, torso: -16, head: -14, upperArmFar: -180 } },
      { t: 44, rot: STRETCH, ease: 'inOut' },
      { t: 54, rot: POSTURE_POINT, handNear: 'taunt', handFar: 'fist', ease: 'out' },
      { t: 60, rot: POSTURE_POINT, expression: 'taunt' },
      { t: 74, rot: { ...POSTURE_POINT, head: -2, torso: 2 }, ease: 'inOut' },
      { t: 88, rot: { ...POSTURE_POINT, head: -10 }, expression: 'normal', ease: 'inOut' },
      { t: 100, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
  // Rolo na bancada: o rolo aparece, sobe acima da cabeça (startup longo: é o aviso)
  // e desce com tudo no chão no 1º frame ativo. Ele fica agachado com o rolo no chão
  // (recovery longo), levanta e o rolo some.
  darllan_special: {
    timing: 'move',
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 0.2, rot: PIN_CHEST, prop: 'fx_pin', propSpin: PIN_CHEST_SPIN, ease: 'out' },
      { t: 0.6, rot: PIN_RAISED, propSpin: PIN_RAISED_SPIN, ease: 'out' },
      {
        t: 0.92,
        rot: { ...PIN_RAISED, torso: -15, head: -14, upperArmNear: -184, upperArmFar: -170 },
        propSpin: PIN_RAISED_SPIN,
        y: -1,
        expression: 'taunt',
        ease: 'inOut',
      },
      { t: 1, rot: PIN_SLAM, propSpin: PIN_SLAM_SPIN, ease: 'in' },
      { t: 2, rot: { ...PIN_SLAM, head: -32 }, propSpin: PIN_SLAM_SPIN },
      {
        t: 2.5,
        rot: PIN_REST,
        propSpin: PIN_REST_SPIN,
        expression: 'normal',
        ease: 'inOut',
      },
      { t: 2.75, rot: PIN_CHEST, propSpin: PIN_CHEST_SPIN, ease: 'inOut' },
      { t: 2.8, rot: PIN_CHEST, prop: null },
      { t: 3, rot: STANCE, ease: 'inOut' },
    ],
  },
  // Tira um biscoito do bolso do avental, morde (as migalhas saem no tick 28),
  // mastiga e abre os braços gritando "Darllan!" (voz no `voiceAt` da ficha, 52).
  darllan_taunt: {
    timing: 'once',
    length: 100,
    ground: true,
    keys: [
      { t: 0, rot: STANCE },
      { t: 8, rot: APRON_POCKET, handNear: 'open', ease: 'out' },
      { t: 14, rot: APRON_POCKET, handNear: 'taunt', handFar: 'open' },
      { t: 24, rot: BITE, ease: 'out' },
      { t: 28, rot: { ...BITE, head: 0, torso: 4 }, ease: 'in' },
      { t: 33, rot: { ...BITE, head: -9 }, ease: 'inOut' },
      { t: 37, rot: { ...BITE, head: -3 }, ease: 'inOut' },
      { t: 41, rot: { ...BITE, head: -9 }, ease: 'inOut' },
      { t: 45, rot: { ...BITE, head: -4 }, ease: 'inOut' },
      { t: 51, rot: ARMS_WIDE, expression: 'taunt', ease: 'out' },
      { t: 70, rot: { ...ARMS_WIDE, torso: -11, head: -18 }, y: -0.5, ease: 'inOut' },
      { t: 86, rot: ARMS_WIDE, expression: 'normal', ease: 'inOut' },
      { t: 100, rot: STANCE, handNear: 'fist', handFar: 'fist', ease: 'inOut' },
    ],
  },
};
