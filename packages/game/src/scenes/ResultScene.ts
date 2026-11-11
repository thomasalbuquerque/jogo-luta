import Phaser from 'phaser';
import { getCharacter, STAGES, type Fighter } from '@jogo-luta/sim';
import { playVoice } from '../audio/voice';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { saveReplayFile } from '../match/replayFile';
import type { PlayerStats } from '../match/stats';
import { resultText } from '../render/hud';
import { MenuList, type MenuOption } from '../ui/MenuList';
import { addPortrait } from '../ui/portrait';
import { cssColor, fadeIn, panel, playerColor, titleText, UI, uiText } from '../ui/theme';
import type { FightScene, LeaveTarget } from './FightScene';

const PLAYERS = 2;
const COLUMN_W = 400;
const COLUMN_H = 330;
const COLUMN_Y = 130;
/** Menu: centro da 1ª e da última opção (as opções se apertam para caber). */
const MENU_TOP = 516;
const MENU_BOTTOM = 692;
const MENU_PITCH = 56;

/**
 * Resultado, por cima da luta que acabou: quem venceu, os números de cada um e
 * revanche (já escolhida: Ataque, Pulo ou Enter). Especial ou Esc troca de lutador.
 * Dá para ver o replay da luta e salvar em arquivo; no fim de um replay, as
 * opções são ver de novo, salvar e jogar a mesma luta.
 */
export class ResultScene extends Phaser.Scene {
  private controls!: MenuInput;
  private menu!: MenuList;
  private note!: Phaser.GameObjects.Text;

  constructor() {
    super('result');
  }

  create(): void {
    const { width, height } = this.scale;
    const fight = this.fight;
    const state = fight.state;
    // por cima do HUD e do debug
    this.scene.bringToTop();
    this.controls = new MenuInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    fadeIn(this, 250);
    this.add.rectangle(0, 0, width, height, 0x05070b, 0.62).setOrigin(0);

    const winner = state.winner !== null ? state.fighters[state.winner] : undefined;
    const title = titleText(
      this,
      width / 2,
      70,
      resultText(state),
      68,
      winner ? cssColor(playerColor(winner.id)) : UI.text,
    );
    title.setScale(1.6);
    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.Out' });

    state.fighters.forEach((f, i) => {
      const n = state.fighters.length;
      const cx = (width * (i + 1)) / (n + 1) + (n === 2 ? (i === 0 ? -90 : 90) : 0);
      this.drawColumn(f, fight.stats.players[i], cx, f.id === state.winner);
    });
    if (winner) {
      const c = getCharacter(winner.character);
      playVoice(this, c.taunt.sound, c.taunt.text);
    }

    const options = fight.playback ? this.replayOptions() : this.matchOptions();
    const pitch = Math.min(MENU_PITCH, (MENU_BOTTOM - MENU_TOP) / Math.max(1, options.length - 1));
    const gap = 8;
    this.menu = new MenuList(this, options, {
      x: width / 2,
      y: MENU_TOP,
      width: 320,
      height: pitch - gap,
      gap,
      fontSize: pitch < 44 ? 20 : 24,
    });

    // avisos: replay salvo, replay que não reproduziu a luta gravada
    this.note = uiText(this, width / 2, COLUMN_Y - 16, '', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 5,
    }).setOrigin(0.5);
    if (fight.playback && fight.replayOk === false) {
      this.note.setText(
        'Este replay é de outra versão do jogo: a luta pode ter saído diferente da gravada.',
      );
    }
  }

  /** Fim de uma luta de verdade. */
  private matchOptions(): MenuOption[] {
    const options: MenuOption[] = [
      {
        label: 'Revanche',
        onSelect: () => {
          this.fight.rematch();
        },
      },
      {
        label: 'Ver replay',
        onSelect: () => {
          this.fight.watchReplay();
        },
      },
      {
        label: 'Salvar replay',
        onSelect: () => {
          this.saveReplay();
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

  /** Fim de um replay. */
  private replayOptions(): MenuOption[] {
    return [
      {
        label: 'Ver de novo',
        onSelect: () => {
          this.fight.watchReplay();
        },
      },
      {
        label: 'Salvar replay',
        onSelect: () => {
          this.saveReplay();
        },
      },
      {
        label: 'Jogar esta luta',
        onSelect: () => {
          this.fight.playLive();
        },
      },
      {
        label: 'Menu inicial',
        onSelect: () => {
          this.leave('title');
        },
      },
    ];
  }

  private saveReplay(): void {
    const replay = this.fight.replay;
    if (!replay) return;
    const name = saveReplayFile(replay);
    this.note.setText(`Replay salvo nos downloads: ${name}`);
  }

  override update(_time: number, delta: number): void {
    const frame = this.controls.poll(PLAYERS, delta);
    if (frame.any & Menu.BACK) {
      this.leave('select');
      return;
    }
    if (frame.any & Menu.START) {
      this.menu.select();
      return;
    }
    this.menu.handle(frame.any);
  }

  private get fight(): FightScene {
    return this.scene.get('fight') as FightScene;
  }

  private leave(target: LeaveTarget): void {
    this.fight.leave(target);
  }

  /** Coluna de um jogador: retrato (maior no vencedor), nome e números da luta. */
  private drawColumn(f: Fighter, stats: PlayerStats | undefined, cx: number, won: boolean): void {
    const color = playerColor(f.id);
    const c = getCharacter(f.character);
    const x = cx - COLUMN_W / 2;
    const g = this.add.graphics();
    panel(g, x, COLUMN_Y, COLUMN_W, COLUMN_H, UI.panel, 0.95);
    g.lineStyle(won ? 6 : 3, color, 1);
    g.strokeRoundedRect(x, COLUMN_Y, COLUMN_W, COLUMN_H, 14);
    const portrait = addPortrait(this, f.character, cx - 100, COLUMN_Y + 110, won ? 190 : 150);
    if (!won) portrait.setAlpha(0.7);
    uiText(this, x + 16, COLUMN_Y + 12, `P${String(f.id + 1)}`, {
      fontFamily: UI.titleFont,
      fontSize: '24px',
      color: cssColor(color),
    });
    if (won) {
      uiText(this, cx - 100, COLUMN_Y + 218, 'VENCEDOR', {
        fontFamily: UI.titleFont,
        fontSize: '20px',
        color: '#0b0e16',
        backgroundColor: cssColor(color),
        padding: { x: 8, y: 2 },
      }).setOrigin(0.5);
    }
    uiText(this, cx - 100, COLUMN_Y + 270, c.name, {
      fontFamily: UI.titleFont,
      fontSize: '26px',
    }).setOrigin(0.5);

    const rows: [string, string][] = [
      ['KOs', String(stats?.kos ?? 0)],
      ['Quedas', String(stats?.falls ?? 0)],
      ['Dano causado', `${String(stats?.damageDealt ?? 0)}%`],
      ['Golpes', String(stats?.hits ?? 0)],
      ['Maior golpe', `${String(stats?.bestHit ?? 0)}%`],
    ];
    rows.forEach(([label, value], i) => {
      const ry = COLUMN_Y + 60 + i * 44;
      uiText(this, cx + 10, ry, label, { fontSize: '17px', color: UI.muted });
      uiText(this, x + COLUMN_W - 20, ry - 4, value, {
        fontFamily: UI.titleFont,
        fontSize: '24px',
      }).setOrigin(1, 0);
    });
  }
}
