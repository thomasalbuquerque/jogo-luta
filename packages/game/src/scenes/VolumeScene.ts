import Phaser from 'phaser';
import { getVolume, setVolume, VOLUME_CHANGED } from '../audio/unlock';
import { DEFAULT_VOLUME, volumeAt, volumeLabel } from '../audio/volume';
import { VIEW } from '../render/view';
import { UI, uiText } from '../ui/theme';

const PILL_H = 30;
const PILL_Y = 12;
const PILL_RIGHT = VIEW.width - 14;
/** Dentro da pílula: ícone do alto-falante, barra e o "%". */
const ICON_CX = 20;
const TRACK_X = 40;
const TRACK_W = 110;
const TRACK_H = 6;
const KNOB_R = 7;
const LABEL_X = TRACK_X + TRACK_W + 12;
const PILL_W = LABEL_X + 38;
const PILL_X = PILL_RIGHT - PILL_W;
/** Parada: meio apagada, para não chamar atenção na luta. */
const IDLE_ALPHA = 0.7;
const DARK = 0x0b0e16;

/** Onde começa o que fica no canto de cima à direita, logo abaixo da barra de volume. */
export const BELOW_VOLUME_Y = PILL_Y + PILL_H + 8;

/**
 * Barra de volume no canto de cima à direita, por cima de todas as telas.
 * Clicar ou arrastar na barra muda o volume; clicar no alto-falante zera e
 * volta ao volume de antes. O volume fica salvo no navegador (ver unlock.ts).
 */
export class VolumeScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;
  private hovering = false;
  private dragging = false;
  /** Volume para voltar ao clicar no alto-falante de novo. */
  private beforeMute = DEFAULT_VOLUME;

  constructor() {
    // começa junto com o jogo e fica ligada o tempo todo
    super({ key: 'volume', active: true });
  }

  create(): void {
    const bg = this.add.graphics();
    bg.fillStyle(DARK, 0.6).fillRoundedRect(0, 0, PILL_W, PILL_H, PILL_H / 2);
    this.gfx = this.add.graphics();
    this.label = uiText(this, LABEL_X, PILL_H / 2, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: UI.text,
    }).setOrigin(0, 0.5);
    this.root = this.add.container(PILL_X, PILL_Y, [bg, this.gfx, this.label]).setAlpha(IDLE_ALPHA);

    // alto-falante: liga e desliga o som
    const icon = this.add
      .zone(PILL_X, PILL_Y, TRACK_X - 6, PILL_H)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    icon.on(Phaser.Input.Events.POINTER_DOWN, () => {
      const v = getVolume();
      if (v > 0) {
        this.beforeMute = v;
        setVolume(this.game, 0);
      } else {
        setVolume(this.game, this.beforeMute);
      }
    });

    // barra: clicar pula para o ponto, arrastar acompanha o mouse
    const track = this.add
      .zone(PILL_X + TRACK_X - 6, PILL_Y, TRACK_W + 12, PILL_H)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true, draggable: true });
    const follow = (pointer: Phaser.Input.Pointer) => {
      const p = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      setVolume(this.game, volumeAt(p.x, PILL_X + TRACK_X, TRACK_W));
    };
    track.on(Phaser.Input.Events.POINTER_DOWN, follow);
    track.on(Phaser.Input.Events.GAMEOBJECT_DRAG, follow);
    track.on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, () => {
      this.dragging = true;
      this.refreshAlpha();
    });
    track.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, () => {
      this.dragging = false;
      this.refreshAlpha();
    });

    for (const zone of [icon, track]) {
      zone.on(Phaser.Input.Events.POINTER_OVER, () => {
        this.hovering = true;
        this.refreshAlpha();
      });
      zone.on(Phaser.Input.Events.POINTER_OUT, () => {
        this.hovering = false;
        this.refreshAlpha();
      });
    }

    const redraw = () => {
      this.draw(getVolume());
    };
    redraw();
    this.game.events.on(VOLUME_CHANGED, redraw);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(VOLUME_CHANGED, redraw);
    });
  }

  override update(): void {
    // pausa e resultado sobem para o topo ao abrir: a barra volta para cima deles
    const scenes = this.scene.manager.getScenes(false);
    if (scenes[scenes.length - 1] !== this) this.scene.bringToTop();
    // o visualizador de animações (?rig) usa o canto
    const hidden = this.scene.isActive('rig-viewer');
    this.root.setVisible(!hidden);
    this.input.enabled = !hidden;
  }

  private refreshAlpha(): void {
    this.root.setAlpha(this.hovering || this.dragging ? 1 : IDLE_ALPHA);
  }

  private draw(v: number): void {
    const g = this.gfx.clear();
    const cy = PILL_H / 2;
    // alto-falante: caixinha + cone
    g.fillStyle(0xffffff, 1);
    g.fillRect(ICON_CX - 9, cy - 3.5, 5, 7);
    g.fillTriangle(ICON_CX - 5, cy - 3.5, ICON_CX + 1, cy - 8, ICON_CX + 1, cy + 8);
    g.fillTriangle(ICON_CX - 5, cy - 3.5, ICON_CX + 1, cy + 8, ICON_CX - 5, cy + 3.5);
    if (v <= 0) {
      // mudo: um X vermelho
      g.lineStyle(2, 0xe63946, 1);
      g.lineBetween(ICON_CX + 4, cy - 4, ICON_CX + 10, cy + 4);
      g.lineBetween(ICON_CX + 10, cy - 4, ICON_CX + 4, cy + 4);
    } else {
      // ondas: 1 a 3, conforme o volume
      g.lineStyle(2, 0xffffff, 1);
      const waves = v < 0.34 ? 1 : v < 0.67 ? 2 : 3;
      for (let i = 0; i < waves; i++) {
        const r = 4 + i * 3.5;
        g.beginPath();
        g.arc(ICON_CX + 1, cy, r, -0.8, 0.8);
        g.strokePath();
      }
    }

    // barra: trilho, parte cheia e o botão
    const ty = cy - TRACK_H / 2;
    const fill = TRACK_W * v;
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(TRACK_X, ty, TRACK_W, TRACK_H, TRACK_H / 2);
    if (fill > 0) {
      g.fillStyle(UI.accent, 1).fillRoundedRect(
        TRACK_X,
        ty,
        Math.max(fill, TRACK_H),
        TRACK_H,
        TRACK_H / 2,
      );
    }
    g.fillStyle(0xffffff, 1).fillCircle(TRACK_X + fill, cy, KNOB_R);
    g.lineStyle(2, DARK, 0.8).strokeCircle(TRACK_X + fill, cy, KNOB_R);

    this.label.setText(volumeLabel(v));
  }
}
