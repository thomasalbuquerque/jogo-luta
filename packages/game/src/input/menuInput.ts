import { InputManager } from './InputManager';
import { MenuRepeat, menuFromPlayer, type MenuMask } from './menu';

/** Ações de menu apertadas neste quadro. */
export interface MenuFrame {
  /** De cada jogador (com os controles dele). */
  players: MenuMask[];
  /** Das teclas fixas: setas, Enter, Esc, Start e Select do controle. */
  system: MenuMask;
  /** Tudo junto: para menus com um cursor só. */
  any: MenuMask;
}

/** Input dos menus: os controles de cada jogador e as teclas fixas, com repetição. */
export class MenuInput {
  private readonly manager = new InputManager();
  private readonly players: MenuRepeat[] = [];
  private readonly sys = new MenuRepeat();

  poll(playerCount: number, deltaMs: number): MenuFrame {
    const masks = this.manager.sample(playerCount);
    const players = masks.map((mask, i) => {
      let repeat = this.players[i];
      if (!repeat) {
        repeat = new MenuRepeat();
        this.players[i] = repeat;
      }
      return repeat.step(menuFromPlayer(mask), deltaMs);
    });
    const system = this.sys.step(this.manager.system, deltaMs);
    return { players, system, any: players.reduce((a, b) => a | b, system) };
  }

  /** O que estiver segurado agora não conta como aperto (ex.: ao voltar de outra tela). */
  reset(): void {
    for (const r of this.players) r.reset();
    this.sys.reset();
  }

  destroy(): void {
    this.manager.destroy();
  }
}
