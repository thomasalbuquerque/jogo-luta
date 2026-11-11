import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from '@jogo-luta/sim';
import { newSeed, replayFileName, replayTitle } from './replayFile';

describe('replayFileName', () => {
  it('tem quem lutou e quando, com zeros à esquerda', () => {
    const when = new Date(2026, 0, 5, 9, 7);
    expect(replayFileName({ characters: ['schummaki', 'joao-frango'] }, when)).toBe(
      'replay-schummaki-x-joao-frango-2026-01-05-0907.json',
    );
  });
});

describe('replayTitle', () => {
  it('usa o nome dos personagens', () => {
    const title = replayTitle({ characters: [...PLAYABLE_CHARACTERS] });
    expect(title).toContain(' x ');
    expect(title).not.toContain('undefined');
  });
});

describe('newSeed', () => {
  it('é um inteiro de 32 bits sem sinal', () => {
    for (let i = 0; i < 100; i++) {
      const seed = newSeed();
      expect(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff).toBe(true);
    }
  });
});
