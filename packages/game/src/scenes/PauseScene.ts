import Phaser from 'phaser';
import { STAGES } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { getControls } from '../input/controls';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { drawControlsCard } from '../ui/controlsCard';
import { MenuList, type MenuOption } from '../ui/MenuList';
import { titleText, UI, uiText } from '../ui/theme';
import type { FightScene, LeaveTarget } from './FightScene';

const PLAYERS = 2;

/**
 * Pausa, por cima da luta parada: continuar, recomeçar ou sair, com os
 * controles de cada um para consulta. Esc, Start ou Especial continua.
 *
 * Online a luta não para: o menu abre por cima (continuar ou sair da sala) e o
 * lutador fica parado enquanto ele está aberto.
 */
export class PauseScene extends Phaser.Scene {
  private controls!: MenuInput;
  private menu!: MenuList;

  constructor() {
    super('pause');
  }

  create(): void {
    const { width, height } = this.scale;
    // por cima do HUD e do debug
    this.scene.bringToTop();
    this.controls = new MenuInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    this.add.rectangle(0, 0, width, height, 0x05070b, 0.6).setOrigin(0);
    const online = this.fight.net !== null;
    titleText(this, width / 2, 80, online ? 'MENU' : 'PAUSA', 64);
    if (online) {
      uiText(this, width / 2, 134, 'A luta online não para!', {
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
      }).setOrigin(0.5);
    }

    const options: MenuOption[] = online ? this.onlineOptions() : this.localOptions();
    this.menu = new MenuList(this, options, { x: 300, y: 220, width: 340 });
    drawControlsCard(this, getControls(), 520, 175);
    uiText(this, width / 2, height - 28, 'Esc, Start ou Especial: continuar', {
      fontSize: '16px',
      color: UI.muted,
    }).setOrigin(0.5);
  }

  private onlineOptions(): MenuOption[] {
    return [
      {
        label: 'Continuar',
        onSelect: () => {
          this.resume();
        },
      },
      {
        label: 'Sair da sala',
        onSelect: () => {
          this.leave('title');
        },
      },
    ];
  }

  private localOptions(): MenuOption[] {
    const options: MenuOption[] = [
      {
        label: 'Continuar',
        onSelect: () => {
          this.resume();
        },
      },
      {
        label: 'Recomeçar luta',
        onSelect: () => {
          this.restart();
        },
      },
      {
        label: 'Trocar lutador',
        onSelect: () => {
          this.leave('select');
        },
      },
    ];
    if (STAGES.length > 1) {
      options.push({
        label: 'Trocar mapa',
        onSelect: () => {
          this.leave('stage');
        },
      });
    }
    options.push({
      label: 'Menu inicial',
      onSelect: () => {
        this.leave('title');
      },
    });
    return options;
  }

  override update(_time: number, delta: number): void {
    const frame = this.controls.poll(PLAYERS, delta);
    if (frame.any & (Menu.BACK | Menu.START)) {
      this.resume();
      return;
    }
    this.menu.handle(frame.any);
  }

  private get fight(): FightScene {
    return this.scene.get('fight') as FightScene;
  }

  private resume(): void {
    playSfx(this, 'ui_back');
    this.scene.resume('fight');
    this.scene.stop();
  }

  private restart(): void {
    this.scene.resume('fight');
    this.fight.rematch();
    this.scene.stop();
  }

  private leave(target: LeaveTarget): void {
    this.fight.leave(target);
  }
}
