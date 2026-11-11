import { describe, expect, it } from 'vitest';
import { nextRng, rngChance, rngInt, seedRng } from './rng';

describe('rng', () => {
  it('a mesma seed dá a mesma sequência', () => {
    const a = { rng: seedRng(1234) };
    const b = { rng: seedRng(1234) };
    for (let i = 0; i < 1000; i++) expect(nextRng(a)).toBe(nextRng(b));
  });

  it('sequência conhecida (não pode mudar: replays antigos dependem dela)', () => {
    const r = { rng: seedRng(1) };
    expect([nextRng(r), nextRng(r), nextRng(r)]).toEqual([2693262067, 11749833, 2265367787]);
  });

  it('seeds diferentes dão sequências diferentes', () => {
    const a = { rng: seedRng(1) };
    const b = { rng: seedRng(2) };
    expect(nextRng(a)).not.toBe(nextRng(b));
  });

  it('só produz inteiros de 32 bits sem sinal, e o estado também', () => {
    const r = { rng: seedRng(-7.9) };
    for (let i = 0; i < 1000; i++) {
      const v = nextRng(r);
      expect(Number.isInteger(v) && v >= 0 && v <= 0xffffffff).toBe(true);
      expect(Number.isInteger(r.rng) && r.rng >= 0 && r.rng <= 0xffffffff).toBe(true);
    }
  });

  it('continua de onde parou quando o estado é copiado', () => {
    const a = { rng: seedRng(99) };
    for (let i = 0; i < 10; i++) nextRng(a);
    const b = { rng: a.rng };
    expect(nextRng(b)).toBe(nextRng(a));
  });

  it('rngInt fica no intervalo e espalha bem', () => {
    const r = { rng: seedRng(5) };
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const v = rngInt(r, 4);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    expect(counts.reduce((s, c) => s + c, 0)).toBe(4000);
    for (const c of counts) expect(c).toBeGreaterThan(850);
    expect(() => rngInt(r, 0)).toThrow(RangeError);
  });

  it('rngChance: 0% nunca, 100% sempre', () => {
    const r = { rng: seedRng(8) };
    for (let i = 0; i < 200; i++) {
      expect(rngChance(r, 0)).toBe(false);
      expect(rngChance(r, 100)).toBe(true);
    }
  });
});
