import { describe, expect, it } from 'vitest';
import { SlowMo } from './slowmo';

describe('SlowMo', () => {
  it('desligada, o tempo corre normal', () => {
    expect(new SlowMo().update(16)).toBe(1);
  });

  it('começa na escala pedida e volta para 1 no fim', () => {
    const s = new SlowMo();
    s.trigger(900, 0.25);
    expect(s.active).toBe(true);
    expect(s.update(100)).toBe(0.25);
    const scales: number[] = [];
    for (let t = 100; t < 900; t += 100) scales.push(s.update(100));
    // nunca acelera além do normal e só sobe no fim
    for (const [i, v] of scales.entries()) {
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(scales[i - 1] ?? 0.25);
    }
    expect(s.active).toBe(false);
    expect(s.update(16)).toBe(1);
  });
});
