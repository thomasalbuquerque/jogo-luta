import { MAX_INPUT_DELAY } from '@jogo-luta/sim';

/**
 * Atraso de input pedido na URL, em ticks por jogador: `?atraso=3` atrasa só o
 * jogador 1; `?atraso=3,2` atrasa os dois. Sem o parâmetro (ou com valor
 * estranho), ninguém tem atraso.
 */
export function delaysFromSearch(search: string): number[] {
  const raw = new URLSearchParams(search).get('atraso');
  if (!raw) return [];
  return raw.split(',').map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(MAX_INPUT_DELAY, n)) : 0;
  });
}

/** "3f (50 ms)": o atraso em ticks e no tempo que isso dá. */
export function delayLabel(ticks: number, tickMs: number): string {
  return `${String(ticks)}f (${String(Math.round(ticks * tickMs))} ms)`;
}
