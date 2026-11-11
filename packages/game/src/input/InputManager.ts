import type { InputMask } from '@jogo-luta/sim';
import { allCodes, maskFromKeys, maskFromPad, PAD_SELECT, PAD_START } from './bindings';
import { getControls, type Controls } from './controls';
import { Menu, type MenuMask } from './menu';

/** Teclas fixas dos menus (valem mesmo com os controles remapeados). */
const SYSTEM_KEYS: readonly (readonly [string, MenuMask])[] = [
  ['ArrowUp', Menu.UP],
  ['ArrowDown', Menu.DOWN],
  ['ArrowLeft', Menu.LEFT],
  ['ArrowRight', Menu.RIGHT],
  ['Enter', Menu.CONFIRM],
  ['NumpadEnter', Menu.CONFIRM],
  ['Escape', Menu.BACK],
];
const SYSTEM_CODES = new Set(SYSTEM_KEYS.map(([code]) => code));

/**
 * Junta teclado e gamepads e entrega uma bitmask por jogador a cada tick, com
 * os controles atuais (remapeáveis). Também lê as teclas fixas de menu.
 *
 * Teclas apertadas e soltas entre dois ticks não se perdem: ficam "travadas"
 * até a próxima amostra. Tecla que já estava apertada quando o InputManager foi
 * criado só conta depois de soltar e apertar de novo.
 */
export class InputManager {
  private readonly held = new Set<string>();
  private readonly latched = new Set<string>();
  /** Bits ignorados até soltar (ver `suppressHeld`), por jogador. */
  private suppressed: InputMask[] = [];
  private lastRaw: InputMask[] = [];
  private systemMask: MenuMask = 0;

  constructor(
    private readonly controls: () => Controls = getControls,
    private readonly target: Window = window,
  ) {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  /** Bitmask de cada jogador para o tick atual (teclado | gamepad de mesmo índice). */
  sample(playerCount: number): InputMask[] {
    const down = new Set([...this.held, ...this.latched]);
    this.latched.clear();
    const { keys, pad: padBindings } = this.controls();
    const pads = readPads();
    const masks: InputMask[] = [];
    for (let i = 0; i < playerCount; i++) {
      const k = keys[i];
      const pad = pads[i];
      const raw = (k ? maskFromKeys(down, k) : 0) | (pad ? maskFromPad(pad, padBindings) : 0);
      const suppressed = (this.suppressed[i] ?? 0) & raw;
      this.suppressed[i] = suppressed;
      this.lastRaw[i] = raw;
      masks.push(raw & ~suppressed);
    }

    let system = 0;
    for (const [code, bit] of SYSTEM_KEYS) if (down.has(code)) system |= bit;
    for (const pad of pads) {
      if (pad.buttons[PAD_START]) system |= Menu.START;
      if (pad.buttons[PAD_SELECT]) system |= Menu.BACK;
    }
    this.systemMask = system;
    return masks;
  }

  /** Teclas fixas de menu (setas, Enter, Esc, Start e Select do controle) na última amostra. */
  get system(): MenuMask {
    return this.systemMask;
  }

  /**
   * O que está apertado agora só volta a contar depois de soltar (ex.: voltar da
   * pausa com Ataque apertado não solta um golpe).
   */
  suppressHeld(): void {
    this.latched.clear();
    this.suppressed = [...this.lastRaw];
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const known = SYSTEM_CODES.has(e.code) || allCodes(this.controls().keys).has(e.code);
    if (!known) return;
    e.preventDefault(); // setas não rolam a página
    // repetição do teclado: ou já está em `held`, ou vem de antes deste InputManager
    if (e.repeat) return;
    this.held.add(e.code);
    this.latched.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
  };

  /** Trocar de aba com tecla apertada não deixa o jogador andando sozinho. */
  private readonly onBlur = (): void => {
    this.held.clear();
    this.latched.clear();
  };
}

/** Gamepads conectados, na ordem: o 1º vai para o jogador 1, o 2º para o jogador 2. */
export function readPads(): { buttons: boolean[]; axes: readonly number[] }[] {
  if (typeof navigator.getGamepads !== 'function') return [];
  const result: { buttons: boolean[]; axes: readonly number[] }[] = [];
  for (const pad of navigator.getGamepads()) {
    if (!pad?.connected) continue;
    result.push({ buttons: pad.buttons.map((b) => b.pressed), axes: pad.axes });
  }
  return result;
}
