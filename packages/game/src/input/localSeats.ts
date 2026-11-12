/**
 * Lugares do jogo local (todos no mesmo PC). P1 e P2 estão sempre lá: o
 * teclado de cada um e os controles 1 e 2. P3 e P4 são de quem entrar com
 * outro controle (o 3º, o 4º…), na ordem em que entraram.
 */

/** Jogadores no mesmo PC, no máximo. */
export const MAX_LOCAL_PLAYERS = 4;
/** Lugares que estão sempre lá (P1 e P2). */
export const FIXED_SEATS = 2;

/** Controle de cada jogador: P1 o 1º, P2 o 2º, e depois os que entraram. */
export function seatPads(extras: readonly number[]): number[] {
  return [...Array.from({ length: FIXED_SEATS }, (_, i) => i), ...extras];
}

/**
 * Controles que podem entrar agora: os conectados que não são do P1 nem do
 * P2 e ainda não entraram, se tiver lugar.
 */
export function joinablePads(padCount: number, extras: readonly number[]): number[] {
  if (FIXED_SEATS + extras.length >= MAX_LOCAL_PLAYERS) return [];
  const out: number[] = [];
  for (let pad = FIXED_SEATS; pad < padCount; pad++) if (!extras.includes(pad)) out.push(pad);
  return out;
}

/**
 * Quem entrou e continua com o controle conectado (controle que saiu, sai
 * junto), sem repetir e sem passar do limite.
 */
export function keepExtras(extras: readonly number[], padCount: number): number[] {
  const out: number[] = [];
  for (const pad of extras) {
    if (pad < FIXED_SEATS || pad >= padCount || out.includes(pad)) continue;
    if (FIXED_SEATS + out.length >= MAX_LOCAL_PLAYERS) break;
    out.push(pad);
  }
  return out;
}

/** Os que entraram, a partir do controle de cada jogador (o que a luta guarda). */
export function extrasFromPads(pads: readonly number[] | undefined): number[] {
  return pads ? pads.slice(FIXED_SEATS) : [];
}
