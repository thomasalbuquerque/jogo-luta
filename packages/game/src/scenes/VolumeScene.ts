import Phaser from 'phaser';
import { getVolume, setVolume, VOLUME_CHANGED } from '../audio/unlock';
import { DEFAULT_VOLUME, volumeAt, volumeLabel } from '../audio/volume';
import { VIEW } from '../render/view';
import { UI, uiText } from '../ui/theme';

const PILL_H = 30;
const PILL_Y = 12;
const PILL_RIGHT = VIEW.width - 14;
/** Aberta, da esquerda para a direita: o "%", a barra e o alto-falante (na ponta). */
const LABEL_X = 12;
const TRACK_X = 52;
const TRACK_W = 110;
const TRACK_H = 6;
const KNOB_R = 7;
const ICON_W = 38;
const PILL_W = TRACK_X + TRACK_W + 6 + ICON_W;
const PILL_X = PILL_RIGHT - PILL_W;
/** O alto-falante fica no mesmo lugar, fechada ou aberta. */
const ICON_CX = PILL_W - ICON_W / 2;
/** Folga em volta da pílula aberta antes de o mouse "sair" dela. */
const HOVER_MARGIN = 8;
/** Parada: meio apagada, para não chamar atenção na luta. */
const IDLE_ALPHA = 0.7;
const DARK = 0x0b0e16;

/** Onde começa o que fica no canto de cima à direita, logo abaixo da barra de volume. */
export const BELOW_VOLUME_Y = PILL_Y + PILL_H + 8;

/**
 * Volume no canto de cima à direita, por cima de todas as telas. Fica só o
 * alto-falante; clicando nele abre a barra (clicar ou arrastar muda o volume),
 * que fecha de novo quando o mouse sai de cima. Com a barra aberta, clicar no
 * alto-falante zera e volta ao volume de antes. O volume fica salvo no
 * navegador (ver unlock.ts).
 */
export class VolumeScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics;
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;
  private track!: Phaser.GameObjects.Zone;
  private expanded = false;
  private hoveringIcon = false;
  private dragging = false;
  /** Volume para voltar ao clicar no alto-falante de novo. */
  private beforeMute = DEFAULT_VOLUME;

  constructor() {
    // começa junto com o jogo e fica ligada o tempo todo
    super({ key: 'volume', active: true });
  }

  create(): void {
    this.bg = this.add.graphics();
    this.gfx = this.add.graphics();
    this.label = uiText(this, LABEL_X, PILL_H / 2, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: UI.text,
    }).setOrigin(0, 0.5);
    this.root = this.add.container(PILL_X, PILL_Y, [this.bg, this.gfx, this.label]);

    // alto-falante: fechada, abre a barra; aberta, liga e desliga o som
    const icon = this.add
      .zone(PILL_X + PILL_W - ICON_W, PILL_Y, ICON_W, PILL_H)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    icon.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (!this.expanded) {
        this.setExpanded(true);
        return;
      }
      const v = getVolume();
      if (v > 0) {
        this.beforeMute = v;
        setVolume(this.game, 0);
      } else {
        setVolume(this.game, this.beforeMute);
      }
    });
    icon.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.hoveringIcon = true;
      this.refresh();
    });
    icon.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.hoveringIcon = false;
      this.refresh();
    });

    // barra: clicar pula para o ponto, arrastar acompanha o mouse
    this.track = this.add
      .zone(PILL_X + TRACK_X - 8, PILL_Y, TRACK_W + 14, PILL_H)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true, draggable: true });
    const follow = (pointer: Phaser.Input.Pointer) => {
      setVolume(this.game, volumeAt(this.worldX(pointer), PILL_X + TRACK_X, TRACK_W));
    };
    this.track.on(Phaser.Input.Events.POINTER_DOWN, follow);
    this.track.on(Phaser.Input.Events.GAMEOBJECT_DRAG, follow);
    this.track.on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, () => {
      this.dragging = true;
    });
    this.track.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, (pointer: Phaser.Input.Pointer) => {
      this.dragging = false;
      // soltou longe da barra: fecha
      if (!this.isOver(pointer)) this.setExpanded(false);
    });

    // mouse saiu de cima (ou toque fora dela): fecha
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.expanded && !this.dragging && !this.isOver(pointer)) this.setExpanded(false);
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.expanded && !this.isOver(pointer)) this.setExpanded(false);
    });
    this.input.on(Phaser.Input.Events.GAME_OUT, () => {
      if (!this.dragging) this.setExpanded(false);
    });

    const redraw = () => {
      this.draw(getVolume());
    };
    this.game.events.on(VOLUME_CHANGED, redraw);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(VOLUME_CHANGED, redraw);
    });
    this.setExpanded(false);
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

  private setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    if (this.track.input) this.track.input.enabled = expanded;
    if (!expanded) this.dragging = false;
    this.refresh();
  }

  private refresh(): void {
    this.root.setAlpha(this.expanded || this.hoveringIcon ? 1 : IDLE_ALPHA);
    this.label.setVisible(this.expanded);
    this.draw(getVolume());
  }

  private worldX(pointer: Phaser.Input.Pointer): number {
    return (pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2).x;
  }

  /** O ponteiro está em cima da pílula aberta (com uma folga)? */
  private isOver(pointer: Phaser.Input.Pointer): boolean {
    const p = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    return (
      p.x >= PILL_X - HOVER_MARGIN &&
      p.x <= PILL_RIGHT + HOVER_MARGIN &&
      p.y >= PILL_Y - HOVER_MARGIN &&
      p.y <= PILL_Y + PILL_H + HOVER_MARGIN
    );
  }

  private draw(v: number): void {
    // fundo: só o círculo do alto-falante, ou a pílula inteira
    const left = this.expanded ? 0 : PILL_W - ICON_W;
    this.bg
      .clear()
      .fillStyle(DARK, 0.6)
      .fillRoundedRect(left, 0, PILL_W - left, PILL_H, PILL_H / 2);

    const g = this.gfx.clear();
    const cy = PILL_H / 2;
    const ix = ICON_CX - 4;
    // alto-falante: caixinha + cone
    g.fillStyle(0xffffff, 1);
    g.fillRect(ix - 9, cy - 3.5, 5, 7);
    g.fillTriangle(ix - 5, cy - 3.5, ix + 1, cy - 8, ix + 1, cy + 8);
    g.fillTriangle(ix - 5, cy - 3.5, ix + 1, cy + 8, ix - 5, cy + 3.5);
    if (v <= 0) {
      // mudo: um X vermelho
      g.lineStyle(2, 0xe63946, 1);
      g.lineBetween(ix + 4, cy - 4, ix + 10, cy + 4);
      g.lineBetween(ix + 10, cy - 4, ix + 4, cy + 4);
    } else {
      // ondas: 1 a 3, conforme o volume
      g.lineStyle(2, 0xffffff, 1);
      const waves = v < 0.34 ? 1 : v < 0.67 ? 2 : 3;
      for (let i = 0; i < waves; i++) {
        const r = 4 + i * 3.5;
        g.beginPath();
        g.arc(ix + 1, cy, r, -0.8, 0.8);
        g.strokePath();
      }
    }
    this.label.setText(volumeLabel(v));
    if (!this.expanded) return;

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
  }
}
