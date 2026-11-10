import { describe, expect, it } from 'vitest';
import { cosDeg, normDeg, sinDeg, TRIG_ONE } from './trig';

describe('trig', () => {
  it('acerta os ângulos notáveis', () => {
    expect(sinDeg(0)).toBe(0);
    expect(sinDeg(30)).toBe(500);
    expect(sinDeg(90)).toBe(TRIG_ONE);
    expect(sinDeg(180)).toBe(0);
    expect(sinDeg(270)).toBe(-TRIG_ONE);
    expect(cosDeg(0)).toBe(TRIG_ONE);
    expect(cosDeg(60)).toBe(500);
    expect(cosDeg(180)).toBe(-TRIG_ONE);
  });

  it('é simétrico nos quatro quadrantes', () => {
    for (let d = 0; d <= 90; d++) {
      expect(sinDeg(180 - d)).toBe(sinDeg(d));
      expect(sinDeg(180 + d)).toBe(0 - sinDeg(d));
      expect(sinDeg(360 - d)).toBe(0 - sinDeg(d));
    }
  });

  it('fica perto de Math.sin (erro de arredondamento só)', () => {
    for (let d = -360; d <= 720; d += 7) {
      expect(Math.abs(sinDeg(d) - Math.sin((d * Math.PI) / 180) * TRIG_ONE)).toBeLessThanOrEqual(1);
      expect(Math.abs(cosDeg(d) - Math.cos((d * Math.PI) / 180) * TRIG_ONE)).toBeLessThanOrEqual(1);
    }
  });

  it('normaliza ângulos negativos e acima de 360', () => {
    expect(normDeg(-90)).toBe(270);
    expect(normDeg(450)).toBe(90);
    expect(normDeg(360)).toBe(0);
  });
});
