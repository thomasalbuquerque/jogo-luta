import { describe, expect, it } from 'vitest';
import { DEFAULT_SHAKE, hitTrauma, Shake } from './shake';

describe('Shake', () => {
  it('sem trauma não mexe a câmera', () => {
    const s = new Shake();
    expect(s.update(16)).toEqual({ x: 0, y: 0 });
  });

  it('o trauma fica entre 0 e 1 e some com o tempo', () => {
    const s = new Shake();
    s.add(0.7);
    s.add(0.7);
    expect(s.trauma).toBe(1);
    for (let i = 0; i < 120; i++) s.update(16);
    expect(s.trauma).toBe(0);
    expect(s.update(16)).toEqual({ x: 0, y: 0 });
  });

  it('nunca passa do deslocamento máximo', () => {
    const s = new Shake();
    s.add(1);
    for (let i = 0; i < 30; i++) {
      const { x, y } = s.update(5);
      expect(Math.abs(x)).toBeLessThanOrEqual(DEFAULT_SHAKE.maxOffset);
      expect(Math.abs(y)).toBeLessThanOrEqual(DEFAULT_SHAKE.maxOffset);
    }
  });

  it('golpe mais forte dá mais trauma, até um teto', () => {
    expect(hitTrauma(20)).toBeGreaterThan(hitTrauma(7));
    expect(hitTrauma(500)).toBeLessThan(1);
  });
});
