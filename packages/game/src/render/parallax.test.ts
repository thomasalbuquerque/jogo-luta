import { describe, expect, it } from 'vitest';
import { placeLayer, type CameraView, type ParallaxLayer } from './parallax';

const ref = { x: 0, y: -88 };
const cam = (x: number, y: number, zoom: number): CameraView => ({
  x,
  y,
  zoom,
  width: 1280,
  height: 720,
});

/** Onde a origem da camada aparece na tela. */
function onScreen(layer: ParallaxLayer, c: CameraView): { x: number; y: number; scale: number } {
  const p = placeLayer(layer, c, ref);
  return {
    x: (p.x - c.x) * c.zoom + c.width / 2,
    y: (p.y - c.y) * c.zoom + c.height / 2,
    scale: p.scale * c.zoom,
  };
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('placeLayer', () => {
  it('com a câmera de referência, a camada fica na âncora', () => {
    const layer = { depth: 0.3, anchorX: 100, anchorY: 200, scale: 1.2 };
    const s = onScreen(layer, cam(ref.x, ref.y, 1));
    expect(close(s.x, 100) && close(s.y, 200) && close(s.scale, 1.2)).toBe(true);
  });

  it('profundidade 0 fica parada na tela, mesmo com a câmera andando e dando zoom', () => {
    const layer = { depth: 0, anchorX: 640, anchorY: 360, scale: 0.9 };
    const s = onScreen(layer, cam(500, 300, 0.5));
    expect(close(s.x, 640) && close(s.y, 360) && close(s.scale, 0.9)).toBe(true);
  });

  it('profundidade 1 anda junto com o mundo', () => {
    const layer = { depth: 1, anchorX: 700, anchorY: 300, scale: 1 };
    const a = placeLayer(layer, cam(0, -88, 1), ref);
    const b = placeLayer(layer, cam(400, 120, 0.6), ref);
    expect(close(a.x, b.x) && close(a.y, b.y) && close(a.scale, b.scale)).toBe(true);
  });

  it('camada do meio anda menos que o mundo', () => {
    const layer = { depth: 0.3, anchorX: 640, anchorY: 360, scale: 1 };
    const s = onScreen(layer, cam(ref.x + 100, ref.y, 1));
    // o mundo andaria 100 px na tela; a camada anda 30
    expect(close(s.x, 640 - 30)).toBe(true);
  });
});
