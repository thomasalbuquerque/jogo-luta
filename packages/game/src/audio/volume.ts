/**
 * Volume geral do jogo (0..1), sem Phaser, para testar em Node. A barra fica em
 * `scenes/VolumeScene.ts`; quem aplica no som é `unlock.ts`.
 */

export const VOLUME_STORAGE_KEY = 'jogo-luta:volume';
/** Mudo da tecla M (versões antigas): quem deixou ligado começa com volume 0. */
export const OLD_MUTE_STORAGE_KEY = 'jogo-luta:mudo';
/** Começa no máximo: o mesmo som de antes da barra existir. */
export const DEFAULT_VOLUME = 1;
/** A barra anda em passos de 5%. */
const STEPS = 20;

export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, v));
}

/** Volume salvo no navegador (`saved`), ou o do mudo antigo, ou o padrão. */
export function parseVolume(saved: string | null, oldMute: string | null): number {
  if (saved !== null && saved.trim() !== '') {
    const v = Number(saved);
    if (Number.isFinite(v)) return clampVolume(v);
  }
  return oldMute === '1' ? 0 : DEFAULT_VOLUME;
}

/** Volume no ponto `x` de uma barra que começa em `left` e tem `width` de largura. */
export function volumeAt(x: number, left: number, width: number): number {
  if (width <= 0) return 0;
  return clampVolume(Math.round(((x - left) / width) * STEPS) / STEPS);
}

/**
 * Ganho que vai para o áudio: o ouvido escuta o volume mais ou menos ao
 * quadrado, então a metade da barra soa como metade do som.
 */
export function volumeGain(v: number): number {
  const c = clampVolume(v);
  return c * c;
}

/** Texto da barra: "80%". */
export function volumeLabel(v: number): string {
  return `${String(Math.round(clampVolume(v) * 100))}%`;
}
