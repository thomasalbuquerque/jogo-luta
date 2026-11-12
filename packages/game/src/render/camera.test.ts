import { describe, expect, it } from 'vitest';
import { cameraBounds, DEFAULT_CAMERA, frameTargets, smooth } from './camera';

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

  it('com o HUD embaixo, enquadra os lutadores na parte de cima da tela', () => {
    const rects = [
      { x: -300, y: -100, w: 50, h: 100 },
      { x: 250, y: -100, w: 50, h: 100 },
    ];
    const free = frameTargets(rects, 1280, 720, opts);
    const hud = frameTargets(rects, 1280, 720, { ...opts, insetBottom: 120 });
    expect(hud.zoom).toBeLessThanOrEqual(free.zoom);
    // a câmera desce: o meio dos lutadores fica 60 px de tela acima do meio da tela
    expect((hud.y - -50) * hud.zoom).toBeCloseTo(60);
    // o lutador de baixo fica acima do HUD
    const bottomOnScreen = 360 + (0 - hud.y) * hud.zoom;
    expect(bottomOnScreen).toBeLessThan(720 - 120);
  });

  it('com limites, quem voou para longe conta como se estivesse na borda', () => {
    const bounds = cameraBounds({ x: -1300, y: -1000, w: 2600, h: 1800 });
    expect(bounds).toEqual({ x: -1150, y: -850, w: 2300, h: 1500 });
    const three = [
      { x: -300, y: -100, w: 50, h: 100 },
      { x: 0, y: -100, w: 50, h: 100 },
      { x: 250, y: -100, w: 50, h: 100 },
    ];
    const flying = [...three, { x: 5000, y: -3000, w: 50, h: 100 }];
    const t = frameTargets(flying, 1280, 720, opts, bounds);
    // nunca mostra fora dos limites
    expect(t.x - 640 / t.zoom).toBeGreaterThanOrEqual(bounds.x - 1e-6);
    expect(t.x + 640 / t.zoom).toBeLessThanOrEqual(bounds.x + bounds.w + 1e-6);
    expect(t.y - 360 / t.zoom).toBeGreaterThanOrEqual(bounds.y - 1e-6);
    expect(t.y + 360 / t.zoom).toBeLessThanOrEqual(bounds.y + bounds.h + 1e-6);
    // o zoom não afasta além do que cabe nos limites
    expect(t.zoom).toBeGreaterThanOrEqual(1280 / bounds.w - 1e-9);
    expect(t.zoom).toBeGreaterThan(opts.minZoom);
  });

  it('com limites folgados, enquadra igual a sem limites', () => {
    const rects = [
      { x: -300, y: -100, w: 50, h: 100 },
      { x: 250, y: -100, w: 50, h: 100 },
    ];
    const big = { x: -5000, y: -5000, w: 10000, h: 10000 };
    expect(frameTargets(rects, 1280, 720, opts, big)).toEqual(frameTargets(rects, 1280, 720, opts));
  });

  it('smooth chega ao alvo com o tempo, sem passar dele', () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = smooth(v, 100, 6, 16.67);
    expect(v).toBeGreaterThan(99);
    expect(v).toBeLessThanOrEqual(100);
  });
});
