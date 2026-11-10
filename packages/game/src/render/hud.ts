import { TICK_RATE, type GameState } from '@jogo-luta/sim';

/** Tempo restante em m:ss (arredonda para cima: 0:01 até o último tick). */
export function formatClock(ticks: number): string {
  const seconds = Math.ceil(ticks / TICK_RATE);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}

/** Stocks restantes cheios e perdidos vazios: ●●○. */
export function stocksLabel(stocks: number, total: number): string {
  return '●'.repeat(Math.max(0, stocks)) + '○'.repeat(Math.max(0, total - stocks));
}

/** Texto do resultado da luta. */
export function resultText(state: Pick<GameState, 'winner'>): string {
  if (state.winner === null) return 'EMPATE!';
  return `P${String(state.winner + 1)} VENCEU!`;
}
