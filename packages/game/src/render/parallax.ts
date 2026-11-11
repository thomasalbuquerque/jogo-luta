/**
 * Parallax: camadas do fundo que andam e dão zoom menos que o mundo.
 *
 * `depth` (k): 0 = colada na tela (infinitamente longe, como o céu), 1 = anda
 * junto com o mundo. A camada é descrita como aparece na tela com a câmera de
 * referência; a função devolve onde colocá-la no mundo para a câmera atual.
 */

export interface CameraView {
  /** Centro da câmera, em px de mundo. */
  x: number;
  y: number;
  zoom: number;
  /** Tamanho da tela (canvas) em px. */
  width: number;
  height: number;
}

export interface ParallaxLayer {
  depth: number;
  /** Onde fica a origem da camada na tela com a câmera de referência (px da tela). */
  anchorX: number;
  anchorY: number;
  /** px da tela por px da textura, com a câmera de referência e zoom 1. */
  scale: number;
}

export interface Placement {
  /** Posição no mundo e escala (px de mundo por px da textura). */
  x: number;
  y: number;
  scale: number;
}

export function placeLayer(
  layer: ParallaxLayer,
  cam: CameraView,
  ref: { x: number; y: number },
): Placement {
  const k = layer.depth;
  // zoom parcial: a camada longe quase não aproxima
  const zk = 1 + (cam.zoom - 1) * k;
  const cx = cam.width / 2;
  const cy = cam.height / 2;
  const sx = cx + (layer.anchorX - cx) * zk - (cam.x - ref.x) * k * cam.zoom;
  const sy = cy + (layer.anchorY - cy) * zk - (cam.y - ref.y) * k * cam.zoom;
  return {
    x: cam.x + (sx - cx) / cam.zoom,
    y: cam.y + (sy - cy) / cam.zoom,
    scale: (layer.scale * zk) / cam.zoom,
  };
}
