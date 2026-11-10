import { describe, expect, it } from 'vitest';
import { approach, idiv, isqrt } from './math';

describe('math', () => {
  it('isqrt devolve o piso da raiz', () => {
    expect(isqrt(0)).toBe(0);
    expect(isqrt(1)).toBe(1);
    expect(isqrt(15)).toBe(3);
    expect(isqrt(16)).toBe(4);
    expect(isqrt(1_680_000)).toBe(1296);
    expect(() => isqrt(-1)).toThrow();
  });

  it('approach não passa do alvo', () => {
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(9, 10, 3)).toBe(10);
    expect(approach(10, 0, 4)).toBe(6);
    expect(approach(1, 0, 4)).toBe(0);
  });

  it('idiv trunca para zero', () => {
    expect(idiv(7, 2)).toBe(3);
    expect(idiv(-7, 2)).toBe(-3);
  });
});
