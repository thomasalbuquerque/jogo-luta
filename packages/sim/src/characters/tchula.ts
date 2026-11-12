import { defineCharacter } from '../character';

/**
 * Tchula — sniper (docs/ELENCO.md). Mecânico: peso médio-alto, meio lento no chão
 * e no ar, golpes normais fortes e um pouco lentos. Especial: Scout, um tiro muito
 * rápido e fino que atravessa o palco, bem telegrafado (mira longa) e com recarga
 * longa: errar custa caro.
 */
export const TCHULA = defineCharacter({
  id: 'tchula',
  name: 'Tchula',
  blurb: 'Sniper: pesado e lento, bate forte. A scout pune de longe.',
  // secundária: o amarelo das faixas do macacão, que lê bem nos menus escuros
  colors: { primary: '#6e737b', secondary: '#f2c230' },
  stats: {
    weight: 108,
    walkSpeed: 5.8,
    airSpeed: 5.1,
    jumpHeight: 170,
    airJumpHeight: 125,
    airJumps: 1,
    hurtbox: { w: 50, h: 98 },
    gravity: 0.7,
    maxFallSpeed: 11.5,
    fastFallSpeed: 17.5,
    dashSpeed: 12.5,
  },
  moves: {
    // Braço de mecânico: um pouco mais lentos, mais fortes.
    neutralLight: { startup: 5, damage: 6 },
    sideLight: { startup: 9, damage: 10, baseKnockback: 9.5 },
    downLight: { startup: 7, damage: 8 },
    sideAir: { startup: 11, damage: 13, knockbackScale: 0.21 },
    downAir: { damage: 10 },
  },
  special: {
    name: 'Scout',
    // A arma aparece e ele mira (startup longo, o aviso), um tiro reto que
    // atravessa o palco (36 px/tick × 30 ticks ≈ 1080 px) e ele puxa o ferrolho
    // enquanto a arma some (recovery longo). Caixa baixa e comprida: dá para
    // desviar pulando ou abaixando, e não atravessa a hurtbox sem acertar.
    startup: 28,
    active: 1,
    recovery: 30,
    cooldownTicks: 150,
    blocks: [
      {
        type: 'projectile',
        speed: 36,
        lifetimeTicks: 30,
        size: { w: 64, h: 14 },
        offset: { x: 56, y: -20 },
        hit: { damage: 18, angle: 20, baseKnockback: 9, knockbackScale: 0.21 },
      },
    ],
  },
  taunt: {
    text: 'Nooola!',
    sound: 'tchula_bordao',
    animation: 'tchula_taunt',
    durationTicks: 120,
    // gira a chave de boca, aponta e só então grita
    voiceAt: 78,
  },
  koSound: 'tchula_ko',
});
