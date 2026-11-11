import { describe, expect, it } from 'vitest';
import { rematchLabel, waitingLabel } from './route';

describe('waitingLabel', () => {
  it('no 1x1, é o outro jogador', () => {
    expect(waitingLabel(2, [1])).toBe('Esperando o outro jogador…');
  });

  it('com mais gente, diz quem está faltando', () => {
    expect(waitingLabel(4, [2])).toBe('Esperando o P3…');
    expect(waitingLabel(4, [1, 3])).toBe('Esperando o P2 e o P4…');
    expect(waitingLabel(4, [0, 1, 3])).toBe('Esperando o P1, o P2 e o P4…');
  });
});

describe('rematchLabel', () => {
  it('no 1x1, fala do outro jogador', () => {
    expect(rematchLabel({ local: false, votes: 0, total: 2 })).toBe('');
    expect(rematchLabel({ local: true, votes: 1, total: 2 })).toBe(
      'Esperando o outro jogador aceitar a revanche…',
    );
    expect(rematchLabel({ local: false, votes: 1, total: 2 })).toBe(
      'O outro jogador quer revanche!',
    );
  });

  it('com mais gente, conta os votos', () => {
    expect(rematchLabel({ local: false, votes: 0, total: 4 })).toBe('');
    expect(rematchLabel({ local: true, votes: 2, total: 4 })).toBe(
      'Esperando os outros aceitarem a revanche… (2 de 4 votos)',
    );
    expect(rematchLabel({ local: false, votes: 1, total: 3 })).toBe(
      'Pediram revanche: 1 de 3 votos.',
    );
  });
});
