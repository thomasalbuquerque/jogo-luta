import { defineCharacter } from '../character';

/**
 * Darllan — pesadão (docs/ELENCO.md). Confeiteiro de biscoitos: alto como o
 * Crocko e o mais pesado do elenco (voa menos), lento no chão e de pulo baixo, com
 * golpes um pouco mais fortes. Especial: Rolo na bancada, uma área. Ergue o rolo de
 * massa e bate no chão: arremessa quem estiver em volta, dos dois lados.
 */
export const DARLLAN = defineCharacter({
  id: 'darllan',
  name: 'Darllan',
  blurb: 'Pesadão: lento e de pulo baixo, chega perto e bate forte em volta.',
  // secundária: o rosa-glacê do bolso, que lê bem do lado do marrom
  colors: { primary: '#6b4226', secondary: '#e8789a' },
  stats: {
    weight: 124,
    walkSpeed: 5.4,
    airSpeed: 5,
    jumpHeight: 162,
    airJumpHeight: 122,
    airJumps: 1,
    hurtbox: { w: 56, h: 106 },
    gravity: 0.72,
    maxFallSpeed: 12,
    fastFallSpeed: 18.5,
    dashSpeed: 12,
  },
  moves: {
    // Mão pesada: o mesmo tempo, um pouco mais de dano e de arremesso.
    neutralLight: { damage: 6 },
    sideLight: { damage: 10 },
    downLight: { damage: 9 },
    sideAir: { damage: 13 },
    downAir: { damage: 11 },
  },
  special: {
    name: 'Rolo na bancada',
    // O rolo subindo é o aviso (startup longo); a pancada é curta e ele fica
    // agachado com o rolo no chão (recovery longo): quem esquivar pune.
    startup: 18,
    active: 5,
    recovery: 26,
    cooldownTicks: 60,
    blocks: [
      {
        type: 'area',
        // da cintura para baixo, ~80 px de cada lado do corpo: pega na frente e atrás
        box: { x: 0, y: 26, w: 216, h: 60 },
        hit: { damage: 15, angle: 50, baseKnockback: 10, knockbackScale: 0.2 },
      },
    ],
  },
  taunt: {
    text: 'Darllan!',
    sound: 'darllan_bordao',
    animation: 'darllan_taunt',
    durationTicks: 100,
    // morde o biscoito e só então abre os braços e grita
    voiceAt: 52,
  },
  koSound: 'darllan_ko',
});
