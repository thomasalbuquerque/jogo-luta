import { defineCharacter } from '../character';

/**
 * Marília — destemida (docs/ELENCO.md). Baixinha, leve e rápida no chão, pulo
 * bom, queda rápida (vai para cima), golpes normais um pouco mais fracos.
 * Especial: Tragadinha, um buff com aura. Ela fuma o palheiro (startup longo,
 * vulnerável) e a fumaça verde vira uma aura: por 5 s ela leva os golpes normalmente
 * (knockback, agarrão), mas sente só 60% do dano.
 */
export const MARILIA = defineCharacter({
  id: 'marilia',
  name: 'Marília',
  blurb: 'Destemida: fuma o palheiro e, com a aura, sente bem menos os golpes.',
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
    gravity: 0.7,
    maxFallSpeed: 12,
    fastFallSpeed: 19,
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
    // Contada do começo: tragada 1–40, aura 41–340, sem aura 341–450, e a próxima
    // tragada leva mais 40. Entre uma aura e outra, pelo menos 150 ticks sem proteção.
    cooldownTicks: 450,
    blocks: [{ type: 'buff', durationTicks: 300, damageTakenPercent: 60 }],
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
