import { defineCharacter } from '../character';

/**
 * Schummaki — rusher (docs/ELENCO.md). O mais rápido no chão, peso médio-alto,
 * alto (1,90 m), pulo mais baixo e queda rápida. Especial: Arrancada, uma investida
 * que queima pneu antes de sair, com recarga curta.
 */
export const SCHUMMAKI = defineCharacter({
  id: 'schummaki',
  name: 'Schummaki',
  blurb: 'Rusher: rápido no chão, pesado, pulo baixo. Vai pra cima.',
  colors: { primary: '#d62839', secondary: '#f6f0e4' },
  stats: {
    weight: 106,
    walkSpeed: 7.4,
    airSpeed: 5.3,
    jumpHeight: 165,
    airJumpHeight: 125,
    airJumps: 1,
    hurtbox: { w: 52, h: 112 },
    gravity: 0.72,
    maxFallSpeed: 12,
    fastFallSpeed: 19,
    dashSpeed: 14.5,
  },
  moves: {
    // Jab mais rápido para abrir caminho.
    neutralLight: { startup: 3, recovery: 6 },
    // Ombrada: um pouco mais forte.
    sideLight: { damage: 9, baseKnockback: 9.5 },
    // Aéreo lateral com o dano base, mas que mata um pouco antes.
    sideAir: { damage: 11, knockbackScale: 0.22, landingLag: 9 },
  },
  special: {
    name: 'Arrancada',
    // Queima pneu (startup longo) e dispara na horizontal. No ar fica parado
    // queimando, sai mais curto e só 1 vez: não vira recuperação infinita. A
    // recarga conta do começo: sobram 60 ticks (1 s) sem especial depois de cada uso.
    startup: 16,
    active: 14,
    recovery: 20,
    cooldownTicks: 110,
    oncePerAir: true,
    hoverStartup: true,
    blocks: [
      {
        type: 'dash',
        speed: 17,
        airSpeed: 11,
        // ~84% da altura do corpo
        box: { x: 28, y: 5, w: 66, h: 94 },
        hit: { damage: 12, angle: 32, baseKnockback: 11, knockbackScale: 0.19 },
      },
    ],
  },
  taunt: {
    text: 'Vem com o Schummy, mermão!',
    sound: 'schummaki_bordao',
    animation: 'schummaki_taunt',
    durationTicks: 80,
  },
  koSound: 'schummaki_ko',
});
