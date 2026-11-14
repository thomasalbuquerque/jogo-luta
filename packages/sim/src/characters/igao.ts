import { defineCharacter } from '../character';

/**
 * Igão — aéreo (docs/ELENCO.md). Jogador de vôlei, alto (1,90 m, como o Schummaki):
 * peso médio, um pouco lento no chão, o pulo mais alto de todos e queda rápida para
 * descer batendo. Os aéreos alcançam mais (braço comprido) e o aéreo para baixo é
 * uma cortada. O preço: o corpo comprido é fácil de acertar. Especial: Saque, a bola
 * sai em diagonal para baixo e quica 3 vezes no chão, cada vez mais baixo, para
 * obrigar o adversário a pular.
 */
export const IGAO = defineCharacter({
  id: 'igao',
  name: 'Igão',
  blurb: 'Aéreo: o pulo mais alto do elenco. Saca a bola e briga lá em cima.',
  // secundária: o verde-limão da gola e das faixas
  colors: { primary: '#6a3fb8', secondary: '#c4e53a' },
  stats: {
    weight: 100,
    walkSpeed: 6.2,
    airSpeed: 5.7,
    jumpHeight: 200,
    airJumpHeight: 160,
    airJumps: 1,
    // alto (empata com o Schummaki): fácil de acertar
    hurtbox: { w: 50, h: 112 },
    gravity: 0.7,
    maxFallSpeed: 12,
    fastFallSpeed: 19,
  },
  moves: {
    // Braço comprido no ar...
    neutralAir: { reach: 112 },
    sideAir: { reach: 115 },
    // ...e a cortada: o aéreo para baixo bate mais forte.
    downAir: { reach: 110, damage: 11, baseKnockback: 8.5 },
  },
  special: {
    name: 'Saque',
    // A bola sobe e o braço arma (startup: o aviso), a batida (1 tick) e o braço
    // descendo (recovery). Uma bola em quadra por vez: a recarga conta do começo.
    startup: 18,
    active: 1,
    recovery: 18,
    cooldownTicks: 90,
    blocks: [
      {
        type: 'projectile',
        // nasce na mão esticada lá em cima, um pouco à frente da cabeça, e sai 40° para
        // baixo a 9,5 px/tick
        speed: 9.5,
        launchAngle: 320,
        gravity: 0.45,
        lifetimeTicks: 85,
        size: { w: 28, h: 28 },
        offset: { x: 32, y: -54 },
        // guarda 72% da velocidade vertical: 1º quique uns 66 px, 2º uns 32, 3º uns 14;
        // anda uns 600 px no total
        bounces: 3,
        bounceKeep: 72,
        hit: { damage: 8, angle: 50, baseKnockback: 7, knockbackScale: 0.1 },
      },
    ],
  },
  taunt: {
    text: 'Cê tá miolo né nê?',
    sound: 'igao_bordao',
    animation: 'igao_taunt',
    durationTicks: 110,
    // quica a bola duas vezes, segura e aponta: só então o bordão
    voiceAt: 62,
  },
  koSound: 'igao_ko',
});
