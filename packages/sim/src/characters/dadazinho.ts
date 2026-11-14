import { defineCharacter } from '../character';

/**
 * Dadazinho — punisher de curta distância (docs/ELENCO.md). Estatura média e magro:
 * leve, rápido no chão e de queda rápida, para cair em cima na hora certa.
 * Especial: Doze, um tiro curto e forte que demora para sair e pune quem chega perto.
 */
export const DADAZINHO = defineCharacter({
  id: 'dadazinho',
  name: 'Dadazinho',
  blurb: 'Punisher: leve, rápido e magro. A doze pune quem chega perto.',
  // secundária: destaque na interface (texto e barras sobre o fundo escuro)
  colors: { primary: '#3f9a4e', secondary: '#8fd16a' },
  stats: {
    weight: 84,
    walkSpeed: 7,
    airSpeed: 6,
    jumpHeight: 180,
    airJumpHeight: 130,
    airJumps: 1,
    hurtbox: { w: 44, h: 96 },
    gravity: 0.7,
    maxFallSpeed: 12,
    fastFallSpeed: 19,
    dashSpeed: 14,
  },
  moves: {
    // Soco lateral mais fraco e com menos recovery: o dano dele vem da doze.
    sideLight: { damage: 7, recovery: 10 },
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
        // sai do cano da arma
        offset: { x: 56, y: -24 },
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
