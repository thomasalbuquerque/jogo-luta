import { defineCharacter } from '../character';

/**
 * Boneco de teste: os números padrão, sem especial. Usado nos testes e quando
 * nenhum personagem é escolhido. Não aparece na tela de seleção.
 */
export const BASE = defineCharacter({
  id: 'base',
  name: 'Boneco',
  blurb: 'Números padrão, sem especial.',
  colors: { primary: '#adb5bd', secondary: '#495057' },
  stats: {
    weight: 100,
    walkSpeed: 6.5,
    airSpeed: 5.5,
    jumpHeight: 175,
    airJumps: 1,
    hurtbox: { w: 48, h: 96 },
  },
  taunt: { text: '...', sound: 'base_taunt', animation: 'base_taunt' },
});
