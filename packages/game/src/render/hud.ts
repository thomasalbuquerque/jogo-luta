import {
  canUseSpecial,
  getCharacter,
  TICK_RATE,
  type Fighter,
  type GameState,
} from '@jogo-luta/sim';
import { hasTeams, teamName } from '../match/teams';
import { playerTag } from '../profile/playerName';

/** Tempo restante em m:ss (arredonda para cima: 0:01 até o último tick). */
export function formatClock(ticks: number): string {
  const seconds = Math.ceil(ticks / TICK_RATE);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}

/**
 * Texto do resultado da luta ("THOMAS VENCEU!", "P2 VENCEU!" para quem não tem
 * nome, ou "TIME AZUL VENCEU!" com times). `names`: o de quem joga com cada lutador.
 */
export function resultText(
  state: Pick<GameState, 'winner' | 'winnerTeam' | 'fighters'>,
  names: readonly (string | null)[] = [],
): string {
  if (state.winner === null) return 'EMPATE!';
  if (hasTeams(state.fighters) && state.winnerTeam !== null) {
    return `${teamName(state.winnerTeam)} VENCEU!`;
  }
  return `${playerTag(state.winner, names[state.winner]).toUpperCase()} VENCEU!`;
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

/** Mistura duas cores 0xrrggbb (k = 0: só a, k = 1: só b). */
export function mix(a: number, b: number, k: number): number {
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

/** Situação da barra do especial no HUD. */
export type SpecialStatus = 'charging' | 'ready' | 'spent';

export interface SpecialBar {
  /** Quanto já recarregou, de 0 a 1. */
  fill: number;
  /** Recarregando, pronto, ou recarregado mas gasto neste ar (1 vez por ar). */
  status: SpecialStatus;
}

/**
 * Barra do especial de um lutador: quanto da recarga já passou e se dá para
 * usar agora. Recarregado mas gasto no ar (`oncePerAir`) fica "spent" até
 * voltar ao chão. Sem especial na ficha, null (sem barra).
 */
export function specialBar(f: Fighter): SpecialBar | null {
  const special = getCharacter(f.character).special;
  if (!special) return null;
  if (canUseSpecial(f)) return { fill: 1, status: 'ready' };
  // a recarga em andamento pode ser maior que a da ficha (a da bomba do Thom4o)
  const total = f.specialCooldownTotal > 0 ? f.specialCooldownTotal : special.cooldownTicks;
  const fill = total > 0 ? Math.min(1, Math.max(0, 1 - f.specialCooldown / total)) : 1;
  return { fill, status: fill >= 1 ? 'spent' : 'charging' };
}
