import { describe, expect, it } from 'vitest';
import { axisX, axisY, Button, isHeld, isPressed } from './input';

describe('input', () => {
  it('usa os bits do GDD', () => {
    expect(Button.LEFT).toBe(1);
    expect(Button.JUMP).toBe(16);
    expect(Button.TAUNT).toBe(256);
  });

  it('distingue segurar de apertar', () => {
    const now = Button.JUMP | Button.LEFT;
    expect(isHeld(now, Button.JUMP)).toBe(true);
    expect(isPressed(now, 0, Button.JUMP)).toBe(true);
    expect(isPressed(now, Button.JUMP, Button.JUMP)).toBe(false);
    expect(isHeld(now, Button.DODGE)).toBe(false);
  });

  it('calcula eixos e anula direções opostas', () => {
    expect(axisX(Button.LEFT)).toBe(-1);
    expect(axisX(Button.RIGHT)).toBe(1);
    expect(axisX(Button.LEFT | Button.RIGHT)).toBe(0);
    expect(axisY(Button.UP)).toBe(-1);
    expect(axisY(Button.DOWN)).toBe(1);
    expect(axisY(0)).toBe(0);
  });
});
