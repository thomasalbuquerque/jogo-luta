import { TICK_RATE, type GameState } from '@jogo-luta/sim';

/** Tempo restante em m:ss (arredonda para cima: 0:01 até o último tick). */
export function formatClock(ticks: number): string {
  const seconds = Math.ceil(ticks / TICK_RATE);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}

/** Texto do resultado da luta. */
export function resultText(state: Pick<GameState, 'winner'>): string {
  if (state.winner === null) return 'EMPATE!';
  return `P${String(state.winner + 1)} VENCEU!`;
}

/** Cor do % por faixa de dano: branco → amarelo → laranja → vermelho → vinho. */
const HEAT: readonly (readonly [number, number])[] = [
  [0, 0xffffff],
  [35, 0xfff1a8],
  [70, 0xffc94a],
  [100, 0xff8c2a],
  [140, 0xf03a26],
  [190, 0xb31222],
  [250, 0x7a0a1f],
];

function mix(a: number, b: number, k: number): number {
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const ca = (a >> shift) & 0xff;
    const cb = (b >> shift) & 0xff;
    out |= Math.round(ca + (cb - ca) * k) << shift;
  }
  return out;
}

/** Cor do % de dano (0xrrggbb): esquenta conforme sobe. */
export function damageColor(damage: number): number {
  const first = HEAT[0];
  if (!first || damage <= first[0]) return first?.[1] ?? 0xffffff;
  for (let i = 1; i < HEAT.length; i++) {
    const [d1, c1] = HEAT[i] ?? first;
    const [d0, c0] = HEAT[i - 1] ?? first;
    if (damage <= d1) return mix(c0, c1, (damage - d0) / (d1 - d0));
  }
  return HEAT[HEAT.length - 1]?.[1] ?? 0xffffff;
}

/**
 * Número da contagem antes da luta (3, 2, 1) para os ticks que faltam; 0 quando
 * acabou. Cada número fica um terço da contagem.
 */
export function countdownNumber(ticksLeft: number, totalTicks: number): number {
  if (ticksLeft <= 0 || totalTicks <= 0) return 0;
  return Math.min(3, Math.ceil((ticksLeft / totalTicks) * 3));
}
