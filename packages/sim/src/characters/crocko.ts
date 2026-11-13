import { defineCharacter } from '../character';

/**
 * Crocko — paciente (docs/ELENCO.md). Professor de pilates e fisioterapeuta: o
 * mais alto do elenco, pesado e com bom alcance, meio lento no chão. Especial:
 * Correção postural, um contra-ataque. Ele para numa pose de pilates e quem bater
 * nele nessa janela leva um tapa de fisioterapeuta nas costas que arremessa.
 */
export const CROCKO = defineCharacter({
  id: 'crocko',
  name: 'Crocko',
  blurb: 'Paciente: alto, pesado e de braço comprido. Espera vir e corrige.',
  // secundária: o branco do tênis, que lê bem do lado do turquesa
  colors: { primary: '#1ba39c', secondary: '#f4f6f5' },
  stats: {
    weight: 114,
    walkSpeed: 5.9,
    airSpeed: 5.2,
    jumpHeight: 172,
    airJumpHeight: 128,
    airJumps: 1,
    hurtbox: { w: 50, h: 106 },
    gravity: 0.7,
    maxFallSpeed: 11.8,
    fastFallSpeed: 18,
    dashSpeed: 12.5,
  },
  moves: {
    // Braço e perna compridos: alcançam mais longe, com o mesmo tempo.
    neutralLight: { reach: 115 },
    sideLight: { reach: 120 },
    downLight: { reach: 115 },
    sideAir: { reach: 115 },
  },
  special: {
    name: 'Correção postural',
    // Entra rápido na pose (startup curto) e espera ~1/3 s. Se ninguém bater, perde
    // o equilíbrio e fica exposto (recovery longo). A recarga conta do começo: não
    // vira escudo infinito.
    startup: 6,
    active: 20,
    recovery: 28,
    cooldownTicks: 90,
    blocks: [
      {
        type: 'counter',
        // o tapa nas costas: arremessa para longe dele, em diagonal para cima
        hit: { damage: 14, angle: 40, baseKnockback: 11, knockbackScale: 0.2 },
      },
    ],
  },
  taunt: {
    // Sem bordão ainda (docs/ELENCO.md): o balão só comenta a postura.
    text: 'Olha essa postura...',
    sound: 'crocko_bordao',
    animation: 'crocko_taunt',
    durationTicks: 100,
    // alonga para o lado e só então aponta
    voiceAt: 62,
  },
  koSound: 'crocko_ko',
});
