import { InputManager } from './InputManager';
import { MenuRepeat, menuFromPlayer, type MenuMask } from './menu';

/** Ações de menu apertadas neste quadro. */
export interface MenuFrame {
  /** De cada jogador (com os controles dele). */
  players: MenuMask[];
  /** Das teclas fixas: setas, Enter, Esc, Start e Select do controle. */
  system: MenuMask;
  /** De cada controle conectado, na ordem (de quem for: serve para entrar na luta). */
  pads: MenuMask[];
  /** Tudo junto (inclusive qualquer controle): para menus com um cursor só. */
  any: MenuMask;
}

/** Input dos menus: os controles de cada jogador e as teclas fixas, com repetição. */
export class MenuInput {
  private readonly manager = new InputManager();
  private readonly players: MenuRepeat[] = [];
  private readonly padRepeats: MenuRepeat[] = [];
  private readonly sys = new MenuRepeat();

  /** `padOf[i]`: o controle do jogador i (ver `InputManager.sample`). */
  poll(playerCount: number, deltaMs: number, padOf?: readonly number[]): MenuFrame {
    const masks = this.manager.sample(playerCount, padOf);
    const players = masks.map((mask, i) => step(this.players, i, mask, deltaMs));
    const pads = this.manager.pads.map((mask, i) => step(this.padRepeats, i, mask, deltaMs));
    const system = this.sys.step(this.manager.system, deltaMs);
    const any = [...players, ...pads].reduce((a, b) => a | b, system);
    return { players, pads, system, any };
  }

  /** O que estiver segurado agora não conta como aperto (ex.: ao voltar de outra tela). */
  reset(): void {
    for (const r of this.players) r.reset();
    for (const r of this.padRepeats) r.reset();
    this.sys.reset();
  }

  destroy(): void {
    this.manager.destroy();
  }
}

/** Aperto de menu (com repetição) da entrada `i`, criando quem repete quando precisa. */
function step(repeats: MenuRepeat[], i: number, mask: number, deltaMs: number): MenuMask {
  let repeat = repeats[i];
  if (!repeat) {
    repeat = new MenuRepeat();
    repeats[i] = repeat;
  }
  return repeat.step(menuFromPlayer(mask), deltaMs);
}
