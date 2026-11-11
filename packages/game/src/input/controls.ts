import type { ButtonName } from '@jogo-luta/sim';
import {
  BUTTON_NAMES,
  DEFAULT_PAD,
  P1_KEYS,
  P2_KEYS,
  PAD_ACTIONS,
  type KeyBindings,
  type PadAction,
  type PadBindings,
} from './bindings';

/**
 * Controles remapeáveis (Etapa 6): teclas de cada jogador e botões do controle
 * (o mesmo mapa para todos os controles). Salvos no navegador.
 */
export interface Controls {
  /** Teclado de cada jogador (P1, P2). */
  keys: readonly KeyBindings[];
  pad: PadBindings;
}

export const DEFAULT_CONTROLS: Controls = { keys: [P1_KEYS, P2_KEYS], pad: DEFAULT_PAD };

const STORAGE_KEY = 'jogo-luta:controles';

/** Teclas fixas: Enter e Esc (menus e pausa), M (mudo), ` (debug), Tab e F1–F12 (navegador). */
const RESERVED_KEYS = new Set([
  'Enter',
  'NumpadEnter',
  'Escape',
  'KeyM',
  'Backquote',
  'Tab',
  'MetaLeft',
  'MetaRight',
  'ContextMenu',
]);

export function isReservedKey(code: string): boolean {
  return RESERVED_KEYS.has(code) || /^F\d+$/.test(code);
}

/** Botões do controle que não dá para usar: Select, Start, D-pad e o botão central. */
export function isReservedPadButton(index: number): boolean {
  return index === 8 || index === 9 || index >= 12;
}

/**
 * Põe `code` como a tecla de `action` do jogador `player`. Uma tecla só serve a
 * 1 botão de 1 jogador: se já era de outro, os dois trocam (o outro fica com as
 * teclas antigas deste).
 */
export function bindKey(
  controls: Controls,
  player: number,
  action: ButtonName,
  code: string,
): Controls {
  const keys = controls.keys.map((k) => ({ ...k }));
  const target = keys[player];
  if (!target) return controls;
  const old = target[action];
  for (const [p, k] of keys.entries()) {
    for (const name of BUTTON_NAMES) {
      if ((p === player && name === action) || !k[name].includes(code)) continue;
      const rest = k[name].filter((c) => c !== code);
      k[name] = rest.length > 0 ? rest : old.filter((c) => c !== code);
    }
  }
  target[action] = [code];
  return { ...controls, keys };
}

/** Põe o botão `button` do controle em `action`; se já era de outra ação, as duas trocam. */
export function bindPadButton(controls: Controls, action: PadAction, button: number): Controls {
  const pad = { ...controls.pad };
  const old = pad[action];
  for (const name of PAD_ACTIONS) {
    if (name === action || !pad[name].includes(button)) continue;
    const rest = pad[name].filter((b) => b !== button);
    pad[name] = rest.length > 0 ? rest : old.filter((b) => b !== button);
  }
  pad[action] = [button];
  return { ...controls, pad };
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const list = value.filter((v): v is string => typeof v === 'string' && !isReservedKey(v));
  return list.length === value.length ? list : null;
}

function buttonList(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const list = value.filter(
    (v): v is number => Number.isInteger(v) && v >= 0 && !isReservedPadButton(v as number),
  );
  return list.length === value.length ? list : null;
}

/**
 * Lê os controles salvos. O que estiver faltando ou inválido volta ao padrão;
 * tecla repetida entre botões também (para nunca travar ninguém sem controle).
 */
export function parseControls(raw: unknown): Controls {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_CONTROLS;
  const data = raw as { keys?: unknown; pad?: unknown };
  const savedKeys = Array.isArray(data.keys) ? (data.keys as unknown[]) : [];
  const keys = DEFAULT_CONTROLS.keys.map((defaults, p) => {
    const saved: unknown = savedKeys[p];
    const result = { ...defaults };
    if (typeof saved !== 'object' || saved === null) return result;
    const entries = saved as Record<string, unknown>;
    for (const name of BUTTON_NAMES) result[name] = stringList(entries[name]) ?? defaults[name];
    return result;
  });
  const savedPad = (typeof data.pad === 'object' && data.pad !== null ? data.pad : {}) as Record<
    string,
    unknown
  >;
  const pad = { ...DEFAULT_PAD };
  for (const name of PAD_ACTIONS) pad[name] = buttonList(savedPad[name]) ?? DEFAULT_PAD[name];

  const parsed: Controls = { keys, pad };
  return hasDuplicates(parsed) ? DEFAULT_CONTROLS : parsed;
}

function hasDuplicates(c: Controls): boolean {
  const codes = c.keys.flatMap((k) => BUTTON_NAMES.flatMap((name) => k[name]));
  const buttons = PAD_ACTIONS.flatMap((name) => c.pad[name]);
  return new Set(codes).size !== codes.length || new Set(buttons).size !== buttons.length;
}

export function sameControls(a: Controls, b: Controls): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Controles atuais (lidos do navegador na 1ª vez)

let current: Controls | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // aba privada ou site bloqueado
  }
}

export function getControls(): Controls {
  if (!current) {
    let raw: unknown;
    try {
      raw = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      raw = null;
    }
    current = parseControls(raw);
  }
  return current;
}

/** Troca os controles e salva no navegador (sem localStorage: vale até fechar a aba). */
export function setControls(controls: Controls): void {
  current = controls;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(controls));
  } catch {
    // só não lembra na próxima vez
  }
}

// ---------------------------------------------------------------------------
// Nomes para a tela

const KEY_NAMES: Readonly<Record<string, string>> = {
  Space: 'Espaço',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ShiftLeft: 'Shift esq.',
  ShiftRight: 'Shift dir.',
  ControlLeft: 'Ctrl esq.',
  ControlRight: 'Ctrl dir.',
  AltLeft: 'Alt esq.',
  AltRight: 'Alt dir.',
  Backspace: 'Backspace',
  CapsLock: 'Caps Lock',
  Comma: ',',
  Period: '.',
  Slash: ';',
  Semicolon: 'Ç',
  Quote: '~',
  BracketLeft: '´',
  BracketRight: '[',
  Backslash: ']',
  IntlBackslash: '\\',
  IntlRo: '/',
  Minus: '-',
  Equal: '=',
  NumpadAdd: 'Num +',
  NumpadSubtract: 'Num -',
  NumpadMultiply: 'Num *',
  NumpadDivide: 'Num /',
  NumpadDecimal: 'Num ,',
  NumpadComma: 'Num .',
};

/** Nome curto de uma tecla (KeyboardEvent.code), no teclado ABNT2. */
export function keyLabel(code: string): string {
  const named = KEY_NAMES[code];
  if (named) return named;
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1] ?? code;
  const digit = /^Digit(\d)$/.exec(code);
  if (digit) return digit[1] ?? code;
  const numpad = /^Numpad(\d)$/.exec(code);
  if (numpad) return `Num ${numpad[1] ?? ''}`;
  return code;
}

const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L3', 'R3'];

/** Nome de um botão do controle (layout Xbox, o "standard" da Gamepad API). */
export function padButtonLabel(index: number): string {
  return PAD_NAMES[index] ?? `Botão ${String(index)}`;
}
