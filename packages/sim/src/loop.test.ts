import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from './loop';

describe('FixedStepLoop', () => {
  it('roda 60 ticks em 1 segundo, qualquer que seja o tamanho do frame', () => {
    for (const frameMs of [7, 16.6667, 33.3333, 50]) {
      const loop = new FixedStepLoop(1000 / 60, 100);
      let ticks = 0;
      let elapsed = 0;
      while (elapsed < 1000 - 1e-6) {
        const dt = Math.min(frameMs, 1000 - elapsed);
        loop.advance(dt, () => ticks++);
        elapsed += dt;
      }
      // tolerância de 1 tick por arredondamento no último frame
      expect(Math.abs(ticks - 60)).toBeLessThanOrEqual(1);
    }
  });

  it('devolve alpha com a fração do próximo tick', () => {
    const loop = new FixedStepLoop(10);
    let ticks = 0;
    const alpha = loop.advance(25, () => ticks++);
    expect(ticks).toBe(2);
    expect(alpha).toBeCloseTo(0.5);
  });

  it('não roda tick se o tempo não fechou um passo', () => {
    const loop = new FixedStepLoop(10);
    let ticks = 0;
    loop.advance(9, () => ticks++);
    expect(ticks).toBe(0);
    loop.advance(1, () => ticks++);
    expect(ticks).toBe(1);
  });

  it('limita os ticks por avanço e descarta o atraso', () => {
    const loop = new FixedStepLoop(10, 5);
    let ticks = 0;
    const alpha = loop.advance(1000, () => ticks++);
    expect(ticks).toBe(5);
    expect(alpha).toBe(0);
  });
});
