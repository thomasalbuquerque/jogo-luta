import { defineCharacter } from '../character';

/**
 * Tauba — fujão (docs/ELENCO.md). Baixinho, peso médio-leve, bom no chão e no
 * ar, golpes normais do moveset base. Especial: Silent quit, some do nada e
 * reaparece na ponta do palco mais perto dele: volta de qualquer lugar, mas na
 * beira, onde todo mundo sabe que ele vai estar.
 */
export const TAUBA = defineCharacter({
  id: 'tauba',
  name: 'Tauba',
  blurb: 'Fujão: some do nada e reaparece na beira do palco.',
  // secundária: o dourado do trompete e do lenço, que lê bem nos menus escuros
  colors: { primary: '#1e1f24', secondary: '#e0a93b' },
  stats: {
    weight: 92,
    walkSpeed: 6.8,
    airSpeed: 6,
    jumpHeight: 178,
    airJumpHeight: 135,
    airJumps: 1,
    hurtbox: { w: 46, h: 90 },
    dashSpeed: 13.5,
  },
  special: {
    name: 'Silent quit',
    // Congela e começa a sumir (startup, ainda apanha), fica 20 ticks fora da luta
    // e reaparece em pé na ponta do palco mais perto dele, a 60 px da quina, sem
    // invencibilidade no recovery: quem esperar lá pune. Sem hitbox: só fuga. No ar,
    // 1 vez: como sempre volta para o palco, a recarga é longa (5 s).
    startup: 14,
    active: 20,
    recovery: 18,
    cooldownTicks: 300,
    oncePerAir: true,
    hoverStartup: true,
    blocks: [{ type: 'teleport', target: 'edge', edgeInset: 60 }],
  },
  taunt: {
    text: '🎵🎶',
    bubble: false,
    sound: 'tauba_bordao',
    animation: 'tauba_taunt',
    durationTicks: 160,
    // o trompete aparece e chega na boca antes da fanfarra começar
    voiceAt: 30,
  },
  koSound: 'tauba_ko',
});
