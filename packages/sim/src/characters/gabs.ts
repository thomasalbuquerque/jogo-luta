import { defineCharacter } from '../character';

/**
 * Gabs — espaçador (docs/ELENCO.md). Servidor público e gamer: altura média, um pouco
 * pesado e lento no chão. Especial: Controle na mão, uma área à distância. Ele pega o
 * controle e um bonequinho 8-bit aparece à frente dele e bate: acerta a média
 * distância, mas não quem estiver colado nele (o ponto cego).
 */
export const GABS = defineCharacter({
  id: 'gabs',
  name: 'Gabs',
  blurb: 'Espaçador: acerta de média distância com o bonequinho, mas sofre colado.',
  // secundária: o roxo do fone gamer, que separa do azul da polo
  colors: { primary: '#2f5da8', secondary: '#9b5de5' },
  stats: {
    weight: 110,
    walkSpeed: 5.8,
    airSpeed: 5.3,
    jumpHeight: 168,
    airJumps: 1,
    // altura média (a da base), um pouco mais largo pela barriga
    hurtbox: { w: 54, h: 96 },
    gravity: 0.68,
    maxFallSpeed: 11.5,
    fastFallSpeed: 17.5,
    dashSpeed: 12.5,
  },
  special: {
    name: 'Controle na mão',
    // O bonequinho surgindo é o aviso (startup médio); se o Gabs apanhar, o golpe cai
    // e o bonequinho some junto.
    startup: 14,
    active: 6,
    recovery: 22,
    cooldownTicks: 60,
    blocks: [
      {
        type: 'area',
        // o bonequinho: de ~105 a ~195 px à frente do centro, no chão; o vão até o
        // corpo é o ponto cego (quem está colado não leva)
        box: { x: 150, y: 14, w: 90, h: 70 },
        hit: { damage: 11, angle: 35, baseKnockback: 8, knockbackScale: 0.16 },
      },
    ],
  },
  taunt: {
    // Sem bordão ainda (docs/ELENCO.md): o balão comemora como gamer.
    text: 'GG!',
    sound: 'gabs_bordao',
    animation: 'gabs_taunt',
    durationTicks: 90,
    // aperta os botões e só então levanta os braços
    voiceAt: 50,
  },
  koSound: 'gabs_ko',
});
