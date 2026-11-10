/**
 * Input como dado: cada jogador vira uma bitmask de botões por tick.
 * Os bits seguem a tabela do GDD.
 */
export const Button = {
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  UP: 1 << 2,
  DOWN: 1 << 3,
  JUMP: 1 << 4,
  ATTACK: 1 << 5,
  SPECIAL: 1 << 6,
  DODGE: 1 << 7,
  TAUNT: 1 << 8,
} as const;

export type ButtonName = keyof typeof Button;

/** Bitmask de botões de um jogador num tick. */
export type InputMask = number;

export const NO_INPUT: InputMask = 0;

/** Botão segurado neste tick. */
export function isHeld(mask: InputMask, button: number): boolean {
  return (mask & button) !== 0;
}

/** Botão apertado neste tick (não estava apertado no tick anterior). */
export function isPressed(mask: InputMask, prev: InputMask, button: number): boolean {
  return (mask & button) !== 0 && (prev & button) === 0;
}

/** Direção horizontal do input: -1, 0 ou 1 (esquerda + direita = 0). */
export function axisX(mask: InputMask): -1 | 0 | 1 {
  const left = isHeld(mask, Button.LEFT);
  const right = isHeld(mask, Button.RIGHT);
  if (left === right) return 0;
  return left ? -1 : 1;
}

/** Direção vertical do input: -1 (cima), 0 ou 1 (baixo). */
export function axisY(mask: InputMask): -1 | 0 | 1 {
  const up = isHeld(mask, Button.UP);
  const down = isHeld(mask, Button.DOWN);
  if (up === down) return 0;
  return up ? -1 : 1;
}
