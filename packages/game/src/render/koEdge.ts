import type { Rect } from './camera';

/** Lado por onde o lutador saiu: -1, 0 ou 1 em cada eixo. */
export interface ExitDir {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

/** Por qual lado da blast zone o ponto (fora dela) saiu. */
export function exitDirection(blast: Rect, x: number, y: number): ExitDir {
  return {
    x: x < blast.x ? -1 : x > blast.x + blast.w ? 1 : 0,
    y: y < blast.y ? -1 : y > blast.y + blast.h ? 1 : 0,
  };
}

export interface EdgePoint {
  /** px de tela. */
  x: number;
  y: number;
  /** Direção da explosão, para dentro da tela (radianos). */
  angle: number;
}

/**
 * Onde a explosão do KO aparece: o ponto de saída (px de mundo) levado para a
 * borda da tela do lado por onde ele saiu, apontando para dentro.
 */
export function koEdgePoint(
  view: Rect,
  screenW: number,
  screenH: number,
  x: number,
  y: number,
  dir: ExitDir,
): EdgePoint {
  const sx = ((x - view.x) / view.w) * screenW;
  const sy = ((y - view.y) / view.h) * screenH;
  const ex = dir.x < 0 ? 0 : dir.x > 0 ? screenW : clamp(sx, 0, screenW);
  const ey = dir.y < 0 ? 0 : dir.y > 0 ? screenH : clamp(sy, 0, screenH);
  const angle =
    dir.x === 0 && dir.y === 0
      ? Math.atan2(screenH / 2 - ey, screenW / 2 - ex)
      : Math.atan2(-dir.y, -dir.x);
  return { x: ex, y: ey, angle };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
