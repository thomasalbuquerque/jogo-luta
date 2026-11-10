/** Ticks de simulação por segundo (passo fixo). */
export const TICK_RATE = 60;

/** Duração de um tick em milissegundos. */
export const TICK_MS = 1000 / TICK_RATE;

/**
 * Ponto fixo: o sim guarda posições e velocidades em inteiros de subpixel.
 * 1 px = 100 subpx. Só soma e subtrai inteiros, então o resultado é igual em qualquer navegador.
 */
export const SUBPX = 100;

/** Converte px (pode ter fração) para subpx inteiro. Use só para definir constantes. */
export function px(value: number): number {
  return Math.round(value * SUBPX);
}

/** Converte subpx para px (para render e debug). */
export function toPx(subpx: number): number {
  return subpx / SUBPX;
}
