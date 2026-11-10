import type { InputMask } from '@jogo-luta/sim';
import {
  allCodes,
  maskFromKeys,
  maskFromPad,
  P1_KEYS,
  P2_KEYS,
  type KeyBindings,
} from './bindings';

/**
 * Junta teclado e gamepads e entrega uma bitmask por jogador a cada tick.
 *
 * Teclas apertadas e soltas entre dois ticks não se perdem: ficam "travadas"
 * até a próxima amostra.
 */
export class InputManager {
  private readonly held = new Set<string>();
  private readonly latched = new Set<string>();
  private readonly gameCodes: Set<string>;

  constructor(
    private readonly keyboards: readonly KeyBindings[] = [P1_KEYS, P2_KEYS],
    private readonly target: Window = window,
  ) {
    this.gameCodes = allCodes(keyboards);
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  /** Bitmask de cada jogador para o tick atual (teclado | gamepad de mesmo índice). */
  sample(playerCount: number): InputMask[] {
    const down = new Set([...this.held, ...this.latched]);
    this.latched.clear();
    const pads = readPads();
    const masks: InputMask[] = [];
    for (let i = 0; i < playerCount; i++) {
      const keys = this.keyboards[i];
      const pad = pads[i];
      masks.push((keys ? maskFromKeys(down, keys) : 0) | (pad ? maskFromPad(pad) : 0));
    }
    return masks;
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!this.gameCodes.has(e.code)) return;
    e.preventDefault(); // setas não rolam a página
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
function readPads(): { buttons: boolean[]; axes: readonly number[] }[] {
  if (typeof navigator.getGamepads !== 'function') return [];
  const result: { buttons: boolean[]; axes: readonly number[] }[] = [];
  for (const pad of navigator.getGamepads()) {
    if (!pad?.connected) continue;
    result.push({ buttons: pad.buttons.map((b) => b.pressed), axes: pad.axes });
  }
  return result;
}
