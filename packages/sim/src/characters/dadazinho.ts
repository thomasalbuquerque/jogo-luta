import { defineCharacter } from '../character';

/**
 * Dadazinho — punisher de curta distância (docs/ELENCO.md). Baixinho e magro:
 * leve, rápido e com o corpo menor. Especial: Doze, um tiro curto e forte que
 * demora para sair e pune quem chega perto.
 */
export const DADAZINHO = defineCharacter({
  id: 'dadazinho',
  name: 'Dadazinho',
  blurb: 'Punisher: leve, rápido e baixinho. A doze pune quem chega perto.',
  colors: { primary: '#3f9a4e', secondary: '#4f5b32' },
  stats: {
    weight: 84,
    walkSpeed: 7,
    airSpeed: 6,
    jumpHeight: 180,
    airJumpHeight: 130,
    airJumps: 1,
    hurtbox: { w: 44, h: 88 },
    gravity: 0.66,
    maxFallSpeed: 11,
    fastFallSpeed: 17.5,
    dashSpeed: 14,
  },
  moves: {
    // Golpes rápidos e fracos: o dano dele vem da doze.
    neutralLight: { startup: 4, damage: 5 },
    sideLight: { damage: 7, recovery: 10 },
    neutralAir: { damage: 7 },
  },
  special: {
    name: 'Doze',
    // A arma aparece (startup longo), um tiro curto e forte e a arma some
    // (recovery longo). Alcance de ~200 px: bem menor que o frango do João.
    startup: 20,
    active: 1,
    recovery: 26,
    cooldownTicks: 100,
    blocks: [
      {
        type: 'projectile',
        speed: 18,
        lifetimeTicks: 11,
        size: { w: 56, h: 44 },
        offset: { x: 52, y: -22 },
        hit: { damage: 15, angle: 30, baseKnockback: 10, knockbackScale: 0.2 },
      },
    ],
  },
  taunt: {
    text: 'sexo',
    sound: 'dadazinho_bordao',
    animation: 'dadazinho_taunt',
    durationTicks: 110,
    // toca a air guitar, para e só então solta o bordão
    voiceAt: 86,
  },
  koSound: 'dadazinho_ko',
});
