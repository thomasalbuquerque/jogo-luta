import { describe, expect, it } from 'vitest';
import { hitStrength, mixColor } from './impact';

describe('impacto', () => {
  it('a força vai de 0 (golpe fraco) a 1 (golpe de KO)', () => {
    expect(hitStrength(3)).toBe(0);
    expect(hitStrength(18)).toBeGreaterThan(0.3);
    expect(hitStrength(18)).toBeLessThan(0.7);
    expect(hitStrength(80)).toBe(1);
  });

  it('mixColor mistura canal a canal', () => {
    expect(mixColor(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(mixColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(mixColor(0xff0000, 0x0000ff, 0.5)).toBe(0x800080);
    expect(mixColor(0x102030, 0x405060, 2)).toBe(0x405060);
  });
});
