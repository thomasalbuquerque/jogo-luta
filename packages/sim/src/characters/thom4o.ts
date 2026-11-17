import { defineCharacter } from '../character';

/**
 * Thom4o — bate e corre (docs/ELENCO.md). Dev, alto (1,80 m, como o Crocko e o
 * Darllan) e magro: leve, rápido no chão e no ar, pulo bom, golpes base normais. O
 * preço: alto e leve, é fácil de acertar e voa longe. Especial: Tá plantada!, um
 * agarrão curto que cola uma bomba com relógio no peito do adversário. A bomba passa
 * para quem o portador acertar com um golpe de corpo e estoura em quem estiver com ela
 * quando o relógio zera.
 */
export const THOM4O = defineCharacter({
  id: 'thom4o',
  name: 'Thom4o',
  blurb: 'Bate e corre: cola a bomba no peito do adversário e foge até ela estourar.',
  // secundária: o vermelho-LED da luz da bomba
  colors: { primary: '#f7c81e', secondary: '#e5352b' },
  stats: {
    weight: 92,
    walkSpeed: 7.0,
    airSpeed: 6.0,
    jumpHeight: 182,
    airJumps: 1,
    // 1,80 m (como o Crocko e o Darllan), magro
    hurtbox: { w: 46, h: 104 },
    fastFallSpeed: 19,
    dashSpeed: 14,
  },
  special: {
    name: 'Tá plantada!',
    // Tira a bomba de trás das costas (startup) e bate no peito (active). Errar deixa
    // com a bomba na mão e a guarda aberta. No ar funciona, sem impulso.
    startup: 7,
    active: 5,
    recovery: 28,
    // errando: 120 ticks do começo (com a bomba em jogo, nem dá para usar)
    cooldownTicks: 120,
    blocks: [
      {
        type: 'grab',
        // colado: ~40 px à frente do corpo, da cintura ao ombro
        box: { x: 42, y: -8, w: 40, h: 44 },
        // o tempo de colar a bomba, com o bip-bip de armada
        holdTicks: 14,
        // o empurrão: fraco, sem força para matar, só separa os dois
        hit: { damage: 3, angle: 30, baseKnockback: 6, knockbackScale: 0.05 },
        bomb: {
          fuseTicks: 300,
          lockTicks: 60,
          floorTicks: 120,
          cooldownTicks: 600,
          carrierHit: { damage: 18, angle: 90, baseKnockback: 11, knockbackScale: 0.18 },
          area: { w: 220, h: 180 },
          areaHit: { damage: 10, angle: 45, baseKnockback: 8, knockbackScale: 0.13 },
        },
      },
    ],
  },
  taunt: {
    text: 'É o Turbas!',
    sound: 'thom4o_bordao',
    animation: 'thom4o_taunt',
    durationTicks: 84,
    // confere o relógio e só então aponta e grita
    voiceAt: 42,
  },
});
