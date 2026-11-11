/**
 * RNG com seed (mulberry32): só inteiros de 32 bits, então dá a mesma sequência
 * em qualquer navegador. O estado do gerador é 1 número e mora no estado da luta
 * (`GameState.rng`): snapshot e replay levam o gerador junto.
 *
 * Toda regra do jogo que precisar de sorte usa isto, nunca `Math.random`.
 */
export interface RngHolder {
  rng: number;
}

/** Converte qualquer seed para o estado inicial do gerador (inteiro de 32 bits sem sinal). */
export function seedRng(seed: number): number {
  return Math.trunc(seed) >>> 0;
}

/** Avança o gerador e devolve um inteiro de 0 a 2³² − 1. */
export function nextRng(holder: RngHolder): number {
  const a = (holder.rng + 0x6d2b79f5) >>> 0;
  holder.rng = a;
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
  return (t ^ (t >>> 14)) >>> 0;
}

/** Inteiro de 0 a `n` − 1 (n de 1 a 2³²). */
export function rngInt(holder: RngHolder, n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('rngInt: n precisa ser inteiro >= 1');
  return nextRng(holder) % n;
}

/** Verdadeiro em `percent`% das vezes (0 a 100). */
export function rngChance(holder: RngHolder, percent: number): boolean {
  return rngInt(holder, 100) < percent;
}
