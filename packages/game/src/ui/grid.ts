import { Menu, type MenuMask } from '../input/menu';

/**
 * Casas da tela de seleção. São 16 amigos, mas por enquanto a grade mostra só
 * 7 (os que já existem e silhuetas "em breve"); o número cresce aos poucos.
 */
export const SELECT_SLOTS = 7;

/** Id de cada casa da grade; null = silhueta "em breve". */
export function selectSlots(playable: readonly string[], total = SELECT_SLOTS): (string | null)[] {
  const n = Math.max(total, playable.length);
  return Array.from({ length: n }, (_, i) => playable[i] ?? null);
}

/** Colunas da grade: tudo numa linha até 8 casas, depois linhas de 8. */
export function gridColumns(count: number): number {
  return Math.min(count, 8);
}

/**
 * Move o cursor na grade: ←/→ anda uma casa (dá a volta na grade inteira),
 * ↑/↓ troca de linha na mesma coluna (se a casa existir).
 */
export function gridMove(index: number, actions: MenuMask, cols: number, count: number): number {
  let i = index;
  if (actions & Menu.LEFT) i = (i - 1 + count) % count;
  if (actions & Menu.RIGHT) i = (i + 1) % count;
  if (actions & Menu.UP && i - cols >= 0) i -= cols;
  if (actions & Menu.DOWN && i + cols < count) i += cols;
  return i;
}
