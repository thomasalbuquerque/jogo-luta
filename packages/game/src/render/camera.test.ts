import { describe, expect, it } from 'vitest';
import { DEFAULT_CAMERA, frameTargets, smooth } from './camera';

const opts = { ...DEFAULT_CAMERA, offsetY: 0 };

describe('camera', () => {
  it('centraliza entre os jogadores', () => {
    const t = frameTargets(
      [
        { x: -300, y: -100, w: 50, h: 100 },
        { x: 250, y: -100, w: 50, h: 100 },
      ],
      1280,
      720,
      opts,
    );
    expect(t.x).toBe(0);
    expect(t.y).toBe(-50);
  });

  it('afasta o zoom quando os jogadores se separam, dentro dos limites', () => {
    const perto = frameTargets([{ x: 0, y: 0, w: 50, h: 100 }], 1280, 720, opts);
    const longe = frameTargets(
      [
        { x: -1000, y: 0, w: 50, h: 100 },
        { x: 1000, y: 0, w: 50, h: 100 },
      ],
      1280,
      720,
      opts,
    );
    expect(longe.zoom).toBeLessThan(perto.zoom);
    expect(perto.zoom).toBeLessThanOrEqual(opts.maxZoom);
    const muitoLonge = frameTargets(
      [
        { x: -9000, y: 0, w: 50, h: 100 },
        { x: 9000, y: 0, w: 50, h: 100 },
      ],
      1280,
      720,
      opts,
    );
    expect(muitoLonge.zoom).toBe(opts.minZoom);
  });

  it('smooth chega ao alvo com o tempo, sem passar dele', () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = smooth(v, 100, 6, 16.67);
    expect(v).toBeGreaterThan(99);
    expect(v).toBeLessThanOrEqual(100);
  });
});
