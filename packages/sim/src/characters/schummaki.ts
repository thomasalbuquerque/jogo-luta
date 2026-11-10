import { defineCharacter } from '../character';

/**
 * Schummaki — rusher (docs/ELENCO.md). Rápido no chão, peso médio-alto, pulo
 * mais baixo. Especial: Arrancada, uma investida que queima pneu antes de sair.
 */
export const SCHUMMAKI = defineCharacter({
  id: 'schummaki',
  name: 'Schummaki',
  blurb: 'Rusher: rápido no chão, pesado, pulo baixo. Vai pra cima.',
  colors: { primary: '#1f6f78', secondary: '#c9d1d9' },
  stats: {
    weight: 112,
    walkSpeed: 7.4,
    airSpeed: 5.3,
    jumpHeight: 165,
    airJumpHeight: 125,
    airJumps: 1,
    hurtbox: { w: 52, h: 100 },
    gravity: 0.72,
    maxFallSpeed: 12,
    fastFallSpeed: 18.5,
    dashSpeed: 14.5,
  },
  moves: {
    // Jab mais rápido para abrir caminho.
    neutralLight: { startup: 3, recovery: 6 },
    // Ombrada: um pouco mais forte.
    sideLight: { damage: 9, baseKnockback: 9.5 },
    sideAir: { damage: 12, knockbackScale: 0.22, landingLag: 9 },
    downAir: { damage: 10 },
  },
  special: {
    name: 'Arrancada',
    // Queima pneu (startup longo) e dispara na horizontal. No ar fica parado
    // queimando, sai mais curto e só 1 vez: não vira recuperação infinita.
    startup: 16,
    active: 14,
    recovery: 20,
    oncePerAir: true,
    hoverStartup: true,
    blocks: [
      {
        type: 'dash',
        speed: 17,
        airSpeed: 11,
        box: { x: 28, y: 4, w: 66, h: 84 },
        hit: { damage: 13, angle: 32, baseKnockback: 11, knockbackScale: 0.19 },
      },
    ],
  },
  taunt: {
    text: 'Vem com o Schummy, mermão!',
    sound: 'schummaki_bordao',
    animation: 'schummaki_taunt',
    durationTicks: 80,
  },
});
