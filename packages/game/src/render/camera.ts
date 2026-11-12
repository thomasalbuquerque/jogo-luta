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
  /**
   * Faixa de baixo da tela coberta pelo HUD (px de tela). Os lutadores são
   * enquadrados na parte de cima, para não ficarem atrás dos painéis.
   */
  insetBottom: number;
}

export const DEFAULT_CAMERA: CameraOptions = {
  padding: 180,
  minWidth: 900,
  minHeight: 500,
  minZoom: 0.45,
  maxZoom: 1.1,
  offsetY: -40,
  insetBottom: 0,
};

/** Quanto os limites da câmera ficam para dentro da blast zone (px de mundo). */
export const CAMERA_BOUNDS_MARGIN = 150;

/**
 * Limites da câmera: a blast zone um pouco para dentro. A câmera nunca mostra
 * além deles, e quem passou deles (voando para o KO) conta como se estivesse
 * na borda: um lutador longe não afasta o zoom dos outros 3.
 */
export function cameraBounds(blastZone: Rect, margin = CAMERA_BOUNDS_MARGIN): Rect {
  return {
    x: blastZone.x + margin,
    y: blastZone.y + margin,
    w: Math.max(0, blastZone.w - margin * 2),
    h: Math.max(0, blastZone.h - margin * 2),
  };
}

/** Põe o retângulo dentro dos limites (encosta na borda; maior que eles, centraliza). */
function clampRect(r: Rect, b: Rect): Rect {
  return { ...r, x: clampSpan(r.x, r.w, b.x, b.w), y: clampSpan(r.y, r.h, b.y, b.h) };
}

/** Início de um trecho de tamanho `size` dentro de [start, start + length]. */
function clampSpan(pos: number, size: number, start: number, length: number): number {
  if (size >= length) return start + (length - size) / 2;
  return clamp(pos, start, start + length - size);
}

/**
 * Centro e zoom que enquadram todos os retângulos na tela (acima da faixa do
 * HUD). Com `bounds`, a câmera fica dentro dos limites: os retângulos são
 * trazidos para dentro deles, o zoom não afasta além do que cabe neles e o
 * centro não deixa aparecer nada de fora.
 */
export function frameTargets(
  rects: readonly Rect[],
  viewW: number,
  viewH: number,
  opts: CameraOptions = DEFAULT_CAMERA,
  bounds?: Rect,
): CameraTarget {
  if (rects.length === 0) return { x: 0, y: 0, zoom: 1 };
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const raw of rects) {
    const r = bounds ? clampRect(raw, bounds) : raw;
    left = Math.min(left, r.x);
    top = Math.min(top, r.y);
    right = Math.max(right, r.x + r.w);
    bottom = Math.max(bottom, r.y + r.h);
  }
  const inset = clamp(opts.insetBottom, 0, viewH / 2);
  const w = Math.max(right - left + opts.padding * 2, opts.minWidth);
  const h = Math.max(bottom - top + opts.padding * 2, opts.minHeight);
  let zoom = clamp(Math.min(viewW / w, (viewH - inset) / h), opts.minZoom, opts.maxZoom);
  // a tela inteira tem de caber nos limites
  if (bounds && bounds.w > 0 && bounds.h > 0) {
    zoom = Math.max(zoom, viewW / bounds.w, viewH / bounds.h);
  }
  // o meio do que está acima do HUD fica no meio dos lutadores
  let x = (left + right) / 2;
  let y = (top + bottom) / 2 + opts.offsetY + inset / 2 / zoom;
  if (bounds) {
    const halfW = viewW / 2 / zoom;
    const halfH = viewH / 2 / zoom;
    x = clampSpan(x - halfW, halfW * 2, bounds.x, bounds.w) + halfW;
    y = clampSpan(y - halfH, halfH * 2, bounds.y, bounds.h) + halfH;
  }
  return { x, y, zoom };
}

/** Suaviza um valor na direção do alvo, independente do FPS. */
export function smooth(current: number, target: number, rate: number, dtMs: number): number {
  const t = 1 - Math.exp(-rate * (dtMs / 1000));
  return current + (target - current) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
