/**
 * Tela lógica e escolha da escala de renderização (sem Phaser, para testar em
 * Node). O resto fica em `resolution.ts`.
 */

/** Tamanho lógico da tela (px de layout). Use no lugar do tamanho do canvas. */
export const VIEW = { width: 1280, height: 720 } as const;

/** Maior escala de renderização (4K): mais que isso só gasta placa de vídeo. */
export const MAX_RENDER_SCALE = 3;

/**
 * Escala para a tela (em px de CSS) e o devicePixelRatio: o bastante para o jogo
 * em tela cheia não ser esticado, em passos de 0,25, entre 1 e o máximo.
 * `override` (da URL) força um valor.
 */
export function pickRenderScale(
  screenW: number,
  screenH: number,
  dpr: number,
  override?: number,
): number {
  if (override !== undefined && Number.isFinite(override) && override > 0) {
    return Math.min(override, MAX_RENDER_SCALE);
  }
  const fit = Math.min((screenW * dpr) / VIEW.width, (screenH * dpr) / VIEW.height);
  const stepped = Math.ceil(fit * 4 - 1e-6) / 4;
  return Math.max(1, Math.min(stepped, MAX_RENDER_SCALE));
}
