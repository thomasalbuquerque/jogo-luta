import { describe, expect, it } from 'vitest';
import { InputDelay, MAX_INPUT_DELAY } from './inputDelay';

describe('InputDelay', () => {
  it('sem atraso, devolve o que recebeu', () => {
    const d = new InputDelay();
    expect(d.active).toBe(false);
    expect(d.push([1, 2])).toEqual([1, 2]);
    expect(d.push([3, 4])).toEqual([3, 4]);
  });

  it('atrasa só o jogador escolhido, em N ticks', () => {
    const d = new InputDelay([3, 0]);
    expect(d.active).toBe(true);
    const out = [10, 20, 30, 40, 50].map((v) => d.push([v, v]));
    expect(out.map((o) => o[0])).toEqual([0, 0, 0, 10, 20]);
    expect(out.map((o) => o[1])).toEqual([10, 20, 30, 40, 50]);
  });

  it('cada jogador pode ter um atraso diferente', () => {
    const d = new InputDelay([1, 2]);
    const out = [1, 2, 3, 4].map((v) => d.push([v, v]));
    expect(out).toEqual([
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
  });

  it('mudar o atraso no meio vale a partir do tick seguinte', () => {
    const d = new InputDelay();
    for (const v of [1, 2, 3, 4]) d.push([v]);
    d.setDelay(0, 2);
    expect(d.push([5])).toEqual([3]);
    d.setDelay(0, 0);
    expect(d.push([6])).toEqual([6]);
  });

  it('limita o atraso entre 0 e o máximo', () => {
    const d = new InputDelay();
    d.setDelay(0, -4);
    expect(d.getDelay(0)).toBe(0);
    d.setDelay(0, 999);
    expect(d.getDelay(0)).toBe(MAX_INPUT_DELAY);
    d.setDelay(0, 2.9);
    expect(d.getDelay(0)).toBe(2);
    d.setDelay(0, Number.NaN);
    expect(d.getDelay(0)).toBe(0);
    expect(d.getDelay(7)).toBe(0);
  });

  it('funciona no atraso máximo sem perder input', () => {
    const d = new InputDelay([MAX_INPUT_DELAY]);
    const out: number[] = [];
    for (let v = 1; v <= 40; v++) out.push(d.push([v])[0] ?? -1);
    expect(out[MAX_INPUT_DELAY]).toBe(1);
    expect(out[39]).toBe(40 - MAX_INPUT_DELAY);
  });

  it('reset esvazia a fila (nada do que estava a caminho chega)', () => {
    const d = new InputDelay([2]);
    d.push([7]);
    d.push([8]);
    d.reset();
    expect(d.push([1])).toEqual([0]);
    expect(d.push([2])).toEqual([0]);
    expect(d.push([3])).toEqual([1]);
    expect(d.getDelay(0)).toBe(2);
  });
});
