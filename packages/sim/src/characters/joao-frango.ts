import { defineCharacter } from '../character';

/**
 * João Frango — zoner (docs/ELENCO.md). Leve, bom no ar (2 pulos aéreos), lento
 * no chão. Especial: Frango assado voador, um projétil reto de recarga curta.
 */
export const JOAO_FRANGO = defineCharacter({
  id: 'joao-frango',
  name: 'João Frango',
  blurb: 'Zoner: leve, bom no ar, lento no chão. Controla de longe.',
  colors: { primary: '#f2ead8', secondary: '#f28c28' },
  stats: {
    weight: 86,
    walkSpeed: 5.6,
    airSpeed: 6.2,
    jumpHeight: 180,
    airJumpHeight: 120,
    airJumps: 2,
    hurtbox: { w: 46, h: 92 },
    gravity: 0.56,
    maxFallSpeed: 9.5,
    fastFallSpeed: 15,
  },
  moves: {
    // Fraco no chão...
    sideLight: { damage: 7, knockbackScale: 0.15 },
    // ...e bom no ar.
    neutralAir: { damage: 8, landingLag: 3 },
    sideAir: { startup: 8, reach: 110 },
  },
  special: {
    name: 'Frango assado voador',
    // Dano e knockback baixos, recarga curta: serve para controlar distância.
    startup: 10,
    active: 1,
    recovery: 16,
    cooldownTicks: 42,
    blocks: [
      {
        type: 'projectile',
        speed: 9.5,
        lifetimeTicks: 60,
        size: { w: 34, h: 22 },
        offset: { x: 30, y: -12 },
        hit: { damage: 5, angle: 25, baseKnockback: 6, knockbackScale: 0.05 },
      },
    ],
  },
  taunt: {
    text: 'Ô Mariiiliaaa!',
    sound: 'joao_frango_bordao',
    animation: 'joao_frango_taunt',
    durationTicks: 90,
  },
  koSound: 'joao_frango_ko',
});
