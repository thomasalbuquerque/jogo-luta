import { defineCharacter } from '../character';

/**
 * Marília — destemida (docs/ELENCO.md). Baixinha, leve e rápida no chão, pulo
 * bom, golpes normais um pouco mais fracos. Especial: Tragadinha, um buff com
 * aura. Ela fuma o palheiro (startup longo, vulnerável) e a fumaça verde vira uma
 * aura: por 2 s golpes, projéteis e agarrões passam por ela.
 */
export const MARILIA = defineCharacter({
  id: 'marilia',
  name: 'Marília',
  blurb: 'Destemida: fuma o palheiro e, com a aura, não sente golpe nenhum.',
  // secundária: o verde-menta do tênis, que puxa o verde da aura
  colors: { primary: '#e2557f', secondary: '#8fd9a8' },
  stats: {
    weight: 88,
    walkSpeed: 7,
    airSpeed: 5.9,
    jumpHeight: 185,
    airJumpHeight: 145,
    airJumps: 1,
    // baixinha (a altura do Tauba) e estreita
    hurtbox: { w: 44, h: 90 },
    dashSpeed: 13.8,
  },
  moves: {
    // golpes normais um pouco mais fracos que a média
    sideLight: { damage: 7 },
    downLight: { damage: 6 },
    neutralAir: { damage: 6 },
    sideAir: { damage: 10 },
  },
  special: {
    name: 'Tragadinha',
    // ~12 ticks tirando o palheiro, ~18 na tragada e ~10 soltando a fumaça, tudo
    // vulnerável: se apanhar, o especial cai (a recarga já contou). A aura liga
    // no 1º frame ativo. No ar funciona, mas sem impulso: não é recuperação.
    startup: 40,
    active: 1,
    recovery: 12,
    // contada do começo, para a aura não ficar quase sempre ligada
    cooldownTicks: 480,
    blocks: [{ type: 'buff', durationTicks: 120, invulnerable: true }],
  },
  taunt: {
    text: 'Gentiii!',
    sound: 'marilia_bordao',
    animation: 'marilia_taunt',
    durationTicks: 90,
    // as mãos chegam no rosto antes do grito
    voiceAt: 18,
  },
  koSound: 'marilia_ko',
});
