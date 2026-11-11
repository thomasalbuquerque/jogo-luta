import { Button, type ButtonName, type InputMask } from '@jogo-luta/sim';

/** Teclas (KeyboardEvent.code) de cada botão. Tabela de controles do GDD. */
export type KeyBindings = Record<ButtonName, readonly string[]>;

export const P1_KEYS: KeyBindings = {
  LEFT: ['KeyA'],
  RIGHT: ['KeyD'],
  UP: ['KeyW'],
  DOWN: ['KeyS'],
  JUMP: ['Space'],
  ATTACK: ['KeyV'],
  SPECIAL: ['KeyB'],
  DODGE: ['ShiftLeft'],
  TAUNT: ['KeyR'],
};

export const P2_KEYS: KeyBindings = {
  LEFT: ['ArrowLeft'],
  RIGHT: ['ArrowRight'],
  UP: ['ArrowUp'],
  DOWN: ['ArrowDown'],
  JUMP: ['KeyJ'],
  ATTACK: ['KeyK'],
  SPECIAL: ['KeyL'],
  DODGE: ['KeyI'],
  TAUNT: ['KeyU'],
};

/** Botões do sim, na ordem da tabela de controles. */
export const BUTTON_NAMES = Object.keys(Button) as ButtonName[];

/** Converte o conjunto de teclas apertadas na bitmask de um jogador. */
export function maskFromKeys(down: ReadonlySet<string>, bindings: KeyBindings): InputMask {
  let mask = 0;
  for (const name of BUTTON_NAMES) {
    if (bindings[name].some((code) => down.has(code))) mask |= Button[name];
  }
  return mask;
}

/** Todas as teclas usadas pelos jogadores (para bloquear rolagem da página etc.). */
export function allCodes(list: readonly KeyBindings[]): Set<string> {
  const codes = new Set<string>();
  for (const b of list) for (const name of BUTTON_NAMES) for (const c of b[name]) codes.add(c);
  return codes;
}

/** Leitura crua de um gamepad (formato da Gamepad API, só o que importa). */
export interface PadSnapshot {
  buttons: readonly boolean[];
  axes: readonly number[];
}

export const STICK_DEADZONE = 0.5;

/** Ações que o controle deixa remapear (as direções ficam no analógico e no D-pad). */
export const PAD_ACTIONS = ['JUMP', 'ATTACK', 'SPECIAL', 'DODGE', 'TAUNT'] as const;
export type PadAction = (typeof PAD_ACTIONS)[number];

/** Índices de botão do gamepad (mapeamento "standard") de cada ação. */
export type PadBindings = Record<PadAction, readonly number[]>;

/**
 * Mapeamento "standard" da Gamepad API:
 * 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 12–15 D-pad.
 */
export const DEFAULT_PAD: PadBindings = {
  JUMP: [0],
  ATTACK: [2],
  SPECIAL: [1],
  DODGE: [5, 7],
  TAUNT: [3],
};

/** D-pad: cima, baixo, esquerda, direita. */
const PAD_DIRECTIONS: readonly (readonly [number, number])[] = [
  [12, Button.UP],
  [13, Button.DOWN],
  [14, Button.LEFT],
  [15, Button.RIGHT],
];

export const PAD_SELECT = 8;
export const PAD_START = 9;

export function maskFromPad(pad: PadSnapshot, bindings: PadBindings = DEFAULT_PAD): InputMask {
  let mask = 0;
  for (const action of PAD_ACTIONS) {
    if (bindings[action].some((index) => pad.buttons[index])) mask |= Button[action];
  }
  for (const [index, button] of PAD_DIRECTIONS) {
    if (pad.buttons[index]) mask |= button;
  }
  const x = pad.axes[0] ?? 0;
  const y = pad.axes[1] ?? 0;
  if (x <= -STICK_DEADZONE) mask |= Button.LEFT;
  if (x >= STICK_DEADZONE) mask |= Button.RIGHT;
  if (y <= -STICK_DEADZONE) mask |= Button.UP;
  if (y >= STICK_DEADZONE) mask |= Button.DOWN;
  return mask;
}
