import { describe, expect, it } from 'vitest';
import { Menu } from '../input/menu';
import { gridColumns, gridMove, selectSlots, SELECT_SLOTS } from './grid';

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
});
