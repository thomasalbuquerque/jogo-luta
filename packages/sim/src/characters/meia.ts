import { defineCharacter } from '../character';

/**
 * Meia — técnico (docs/ELENCO.md). Pro player de jogo de luta: magro, leve e rápido
 * no chão e no ar, golpes base um pouco mais rápidos e mais fracos. Especial:
 * Comando, um agarrão de alcance curto. Se pegar, solta um combo de 9 golpes de 1%
 * com o adversário preso e fecha com um chute que arremessa ("10 HITS"). Se errar,
 * fica parado num recovery longo.
 */
export const MEIA = defineCharacter({
  id: 'meia',
  name: 'Meia',
  blurb: 'Técnico: chega colado, faz o comando e solta o combo inteiro.',
  // secundária: o ciano-elétrico da estampa da camiseta
  colors: { primary: '#f4f4f0', secondary: '#22c1ee' },
  stats: {
    weight: 90,
    walkSpeed: 7,
    airSpeed: 6,
    jumpHeight: 180,
    airJumps: 1,
    // estatura média (a do Gabs), magro
    hurtbox: { w: 44, h: 96 },
    dashSpeed: 14,
  },
  moves: {
    // golpes base: startup 1 tick menor e 1% a menos que a média
    neutralLight: { startup: 3, damage: 4 },
    sideLight: { startup: 6, damage: 7 },
    downLight: { startup: 5, damage: 6 },
    neutralAir: { startup: 4, damage: 6 },
    sideAir: { startup: 8, damage: 10 },
    downAir: { startup: 7, damage: 8 },
  },
  special: {
    name: 'Comando',
    // ~1 tick por símbolo do comando (↓ ← B ↘ → ↑) e o X no 1º frame ativo, a
    // janela do agarrão. Errar deixa exposto no recovery longo. No ar funciona,
    // sem impulso: se pegar, os dois ficam parados no ar até o arremesso.
    startup: 6,
    active: 4,
    recovery: 32,
    cooldownTicks: 90,
    blocks: [
      {
        type: 'grab',
        // alcance curto: ~36 px à frente do corpo, da cintura ao ombro
        box: { x: 40, y: -8, w: 36, h: 44 },
        // 1 s preso: um golpe a cada 6 ticks e o chute final no tick 60
        holdTicks: 60,
        combo: { hits: 9, damage: 1 },
        // o chute que arremessa: fecha em ~16%
        hit: { damage: 7, angle: 40, baseKnockback: 9, knockbackScale: 0.2 },
      },
    ],
  },
  taunt: {
    // Sem bordão ainda (docs/ELENCO.md): o balão chama para a briga.
    text: 'Vem!',
    sound: 'meia_bordao',
    animation: 'meia_taunt',
    durationTicks: 84,
    // ajeita os óculos e só então chama com a mão
    voiceAt: 40,
  },
  koSound: 'meia_ko',
});
