import { describe, expect, it } from 'vitest';
import { Menu } from '../input/menu';
import { gridColumns, gridMove, selectLayout, selectSlots, SELECT_SLOTS } from './grid';

describe('grade de seleção', () => {
  it('7 casas: os que existem primeiro, o resto "em breve"', () => {
    const slots = selectSlots(['a', 'b']);
    expect(slots).toHaveLength(SELECT_SLOTS);
    expect(slots.slice(0, 3)).toEqual(['a', 'b', null]);
    expect(slots.filter((s) => s === null)).toHaveLength(SELECT_SLOTS - 2);
  });

  it('com mais personagens que casas, a grade cresce', () => {
    const ids = Array.from({ length: 9 }, (_, i) => String(i));
    expect(selectSlots(ids)).toEqual(ids);
  });

  it('←/→ anda e dá a volta', () => {
    expect(gridMove(0, Menu.RIGHT, 7, 7)).toBe(1);
    expect(gridMove(6, Menu.RIGHT, 7, 7)).toBe(0);
    expect(gridMove(0, Menu.LEFT, 7, 7)).toBe(6);
  });

  it('↑/↓ troca de linha só se a casa existir', () => {
    expect(gridColumns(16)).toBe(8);
    expect(gridMove(2, Menu.DOWN, 8, 16)).toBe(10);
    expect(gridMove(10, Menu.UP, 8, 16)).toBe(2);
    expect(gridMove(2, Menu.UP, 8, 16)).toBe(2);
    expect(gridMove(5, Menu.DOWN, 8, 12)).toBe(5);
    expect(gridMove(3, Menu.DOWN, 7, 7)).toBe(3);
  });

  it('até 8 casas, uma linha; com mais, duas linhas que não encostam nos painéis', () => {
    expect(selectLayout(8).rows).toBe(1);
    for (const n of [9, 12, 16]) {
      const l = selectLayout(n);
      expect(l.rows).toBe(2);
      const gridBottom = l.gridY + l.rows * l.tileH + (l.rows - 1) * l.gap;
      expect(gridBottom).toBeLessThan(l.panelY);
      expect(l.cols * l.tileW + (l.cols - 1) * l.gap).toBeLessThanOrEqual(1280);
    }
  });

  it('o pé dos painéis fica no mesmo lugar com uma ou duas linhas', () => {
    const one = selectLayout(8);
    const two = selectLayout(16);
    expect(two.panelY + two.panelH).toBe(one.panelY + one.panelH);
    expect(two.textY.quote).toBeLessThan(two.panelH - 30);
  });
});
