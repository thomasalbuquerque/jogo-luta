import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTROLS } from '../input/controls';
import { LESSONS } from './lessons';
import { buttonHint, finishedPrompt, footerPrompt, formatPrompt } from './prompts';

describe('textos do tutorial', () => {
  it('no teclado, mostra as teclas do jogador 1', () => {
    const text = formatPrompt('{ATTACK} + {DOWN}, {JUMP}', DEFAULT_CONTROLS, 'keyboard');
    expect(text).toBe('[V] + [S], [Espaço]');
  });

  it('no controle, mostra os botões e as setas do analógico', () => {
    const text = formatPrompt('{ATTACK} + {DOWN}, {DODGE}', DEFAULT_CONTROLS, 'pad');
    expect(text).toBe('[X] + [↓], [RB / RT]');
  });

  it('a legenda mostra o que é cada botão no aparelho escolhido', () => {
    expect(buttonHint(DEFAULT_CONTROLS, 'keyboard', 'ATTACK')).toBe('Ataque: V  (jogador 2: K)');
    expect(buttonHint(DEFAULT_CONTROLS, 'pad', 'ATTACK')).toBe('Ataque: X');
    expect(buttonHint(DEFAULT_CONTROLS, 'pad', 'LEFT')).toBe(
      'Esquerda: ← no analógico ou no D-pad',
    );
  });

  it('pausa e fim do tutorial falam do botão certo', () => {
    expect(footerPrompt('keyboard')).toContain('Esc');
    expect(footerPrompt('pad')).toContain('Start');
    expect(footerPrompt('pad')).not.toContain('Esc');
    expect(finishedPrompt('pad')).toContain('Start');
    expect(finishedPrompt('keyboard')).toContain('Esc');
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))(
    'no texto de "%s" todo botão vira tecla ou botão do controle',
    (_id, lesson) => {
      for (const device of ['keyboard', 'pad'] as const) {
        const text = formatPrompt(lesson.text, DEFAULT_CONTROLS, device);
        expect(text).not.toMatch(/[{}]/);
        expect(text).not.toMatch(
          /\[(Ataque|Pular|Especial|Esquiva|Baixo|Cima|Esquerda|Direita|Provocação)\]/,
        );
      }
    },
  );
});
