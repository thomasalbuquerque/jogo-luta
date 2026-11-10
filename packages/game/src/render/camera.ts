/** Retângulo em px de mundo. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CameraTarget {
  x: number;
  y: number;
  zoom: number;
}

export interface CameraOptions {
  /** Margem em volta dos jogadores (px de mundo). */
  padding: number;
  /** Menor área enquadrada, para não dar zoom demais quando estão juntos. */
  minWidth: number;
  minHeight: number;
  minZoom: number;
  maxZoom: number;
  /** Desloca o centro para cima, mostrando mais do que está acima dos lutadores. */
  offsetY: number;
}

export const DEFAULT_CAMERA: CameraOptions = {
  padding: 180,
  minWidth: 900,
  minHeight: 500,
  minZoom: 0.45,
  maxZoom: 1.1,
  offsetY: -40,
};

/** Centro e zoom que enquadram todos os retângulos na tela. */
export function frameTargets(
  rects: readonly Rect[],
  viewW: number,
  viewH: number,
  opts: CameraOptions = DEFAULT_CAMERA,
): CameraTarget {
  if (rects.length === 0) return { x: 0, y: 0, zoom: 1 };
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.x);
    top = Math.min(top, r.y);
    right = Math.max(right, r.x + r.w);
    bottom = Math.max(bottom, r.y + r.h);
  }
  const w = Math.max(right - left + opts.padding * 2, opts.minWidth);
  const h = Math.max(bottom - top + opts.padding * 2, opts.minHeight);
  const zoom = clamp(Math.min(viewW / w, viewH / h), opts.minZoom, opts.maxZoom);
  return { x: (left + right) / 2, y: (top + bottom) / 2 + opts.offsetY, zoom };
}

/** Suaviza um valor na direção do alvo, independente do FPS. */
export function smooth(current: number, target: number, rate: number, dtMs: number): number {
  const t = 1 - Math.exp(-rate * (dtMs / 1000));
  return current + (target - current) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
