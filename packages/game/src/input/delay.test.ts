import { describe, expect, it } from 'vitest';
import { MAX_INPUT_DELAY, TICK_MS } from '@jogo-luta/sim';
import { delayLabel, delaysFromSearch } from './delay';

describe('delaysFromSearch', () => {
  it('sem o parâmetro, ninguém tem atraso', () => {
    expect(delaysFromSearch('')).toEqual([]);
    expect(delaysFromSearch('?rig')).toEqual([]);
    expect(delaysFromSearch('?atraso=')).toEqual([]);
  });

  it('um número atrasa só o jogador 1; dois, os dois', () => {
    expect(delaysFromSearch('?atraso=3')).toEqual([3]);
    expect(delaysFromSearch('?atraso=3,2')).toEqual([3, 2]);
    expect(delaysFromSearch('?x=1&atraso=0,4')).toEqual([0, 4]);
  });

  it('valor estranho vira 0 e valor grande demais é limitado', () => {
    expect(delaysFromSearch('?atraso=abc,2')).toEqual([0, 2]);
    expect(delaysFromSearch('?atraso=-5')).toEqual([0]);
    expect(delaysFromSearch('?atraso=999')).toEqual([MAX_INPUT_DELAY]);
  });
});

describe('delayLabel', () => {
  it('mostra os ticks e os milissegundos', () => {
    expect(delayLabel(3, TICK_MS)).toBe('3f (50 ms)');
    expect(delayLabel(0, TICK_MS)).toBe('0f (0 ms)');
  });
});
