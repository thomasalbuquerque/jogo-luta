import { Button, isHeld, type InputMask } from '@jogo-luta/sim';

/** Ações de menu (bitmask), só do jogo: o sim não conhece. */
export const Menu = {
  UP: 1 << 0,
  DOWN: 1 << 1,
  LEFT: 1 << 2,
  RIGHT: 1 << 3,
  /** Ataque ou Pulo do jogador; Enter. */
  CONFIRM: 1 << 4,
  /** Especial do jogador; Esc; Select do controle. */
  BACK: 1 << 5,
  /** Start do controle. */
  START: 1 << 6,
} as const;

export type MenuMask = number;

const DIRECTIONS = Menu.UP | Menu.DOWN | Menu.LEFT | Menu.RIGHT;

/** Segurar uma direção repete o movimento: espera isto e depois repete a cada `REPEAT_MS`. */
export const REPEAT_DELAY_MS = 380;
export const REPEAT_MS = 110;

/** Botões de um jogador viram ações de menu: direções, Ataque/Pulo confirma, Especial volta. */
export function menuFromPlayer(mask: InputMask): MenuMask {
  let menu = 0;
  if (isHeld(mask, Button.UP)) menu |= Menu.UP;
  if (isHeld(mask, Button.DOWN)) menu |= Menu.DOWN;
  if (isHeld(mask, Button.LEFT)) menu |= Menu.LEFT;
  if (isHeld(mask, Button.RIGHT)) menu |= Menu.RIGHT;
  if (isHeld(mask, Button.ATTACK | Button.JUMP)) menu |= Menu.CONFIRM;
  if (isHeld(mask, Button.SPECIAL)) menu |= Menu.BACK;
  return menu;
}

/**
 * Transforma o que está segurado no que foi apertado neste quadro, repetindo a
 * direção segurada. O que já estava segurado no 1º quadro não conta (ex.: o
 * botão que confirmou a tela anterior).
 */
export class MenuRepeat {
  private prev: MenuMask | null = null;
  private holdMs = 0;
  private nextRepeatMs = REPEAT_DELAY_MS;

  step(held: MenuMask, deltaMs: number): MenuMask {
    if (this.prev === null) {
      this.prev = held;
      return 0;
    }
    const prev = this.prev;
    this.prev = held;
    const pressed = held & ~prev;
    const dirs = held & DIRECTIONS;
    if (dirs === 0 || (pressed & DIRECTIONS) !== 0) {
      this.holdMs = 0;
      this.nextRepeatMs = REPEAT_DELAY_MS;
      return pressed;
    }
    this.holdMs += deltaMs;
    if (this.holdMs < this.nextRepeatMs) return pressed;
    this.nextRepeatMs += REPEAT_MS;
    return pressed | dirs;
  }

  /** O que estiver segurado agora não conta mais como aperto. */
  reset(): void {
    this.prev = null;
  }
}
