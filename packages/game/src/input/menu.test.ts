import { Button } from '@jogo-luta/sim';
import { describe, expect, it } from 'vitest';
import { Menu, MenuRepeat, menuFromPlayer, REPEAT_DELAY_MS, REPEAT_MS } from './menu';

describe('menu', () => {
  it('Ataque ou Pulo confirma, Especial volta, direções andam', () => {
    expect(menuFromPlayer(Button.ATTACK)).toBe(Menu.CONFIRM);
    expect(menuFromPlayer(Button.JUMP | Button.LEFT)).toBe(Menu.CONFIRM | Menu.LEFT);
    expect(menuFromPlayer(Button.SPECIAL | Button.DOWN)).toBe(Menu.BACK | Menu.DOWN);
    expect(menuFromPlayer(Button.DODGE | Button.TAUNT)).toBe(0);
  });

  it('só conta o aperto, e o que já vinha segurado no 1º quadro não conta', () => {
    const r = new MenuRepeat();
    expect(r.step(Menu.CONFIRM, 16)).toBe(0);
    expect(r.step(Menu.CONFIRM, 16)).toBe(0);
    expect(r.step(0, 16)).toBe(0);
    expect(r.step(Menu.CONFIRM, 16)).toBe(Menu.CONFIRM);
    expect(r.step(Menu.CONFIRM, 16)).toBe(0);
  });

  it('direção segurada repete depois de um tempo', () => {
    const r = new MenuRepeat();
    r.step(0, 16);
    expect(r.step(Menu.DOWN, 16)).toBe(Menu.DOWN);
    let fired = 0;
    let elapsed = 0;
    while (elapsed < REPEAT_DELAY_MS + REPEAT_MS * 3 + 1) {
      elapsed += 10;
      if (r.step(Menu.DOWN, 10) & Menu.DOWN) fired++;
    }
    expect(fired).toBe(4);
    // o botão de confirmar segurado não repete
    r.step(0, 16);
    r.step(Menu.CONFIRM, 16);
    expect(r.step(Menu.CONFIRM, 1000)).toBe(0);
  });

  it('reset: o que está segurado deixa de contar', () => {
    const r = new MenuRepeat();
    r.step(0, 16);
    r.reset();
    expect(r.step(Menu.CONFIRM, 16)).toBe(0);
  });
});
