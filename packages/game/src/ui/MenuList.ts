import Phaser from 'phaser';
import { playSfx } from '../audio/sfx';
import { Menu, type MenuMask } from '../input/menu';
import { UI } from './theme';

export interface MenuOption {
  label: string;
  /** Opção que ainda não existe: aparece apagada, com esta etiqueta (ex.: "em breve"). */
  disabled?: string;
  onSelect?: () => void;
}

export interface MenuListOptions {
  /** Centro da 1ª opção. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  gap?: number;
  fontSize?: number;
  depth?: number;
}

/**
 * Lista vertical de opções: ↑/↓ escolhe (dá a volta), confirmar aciona. Opção
 * apagada dá para ver, mas não aciona.
 */
export class MenuList {
  index = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[];
  private readonly tags: (Phaser.GameObjects.Text | null)[];
  private readonly w: number;
  private readonly h: number;
  private readonly gap: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: readonly MenuOption[],
    private readonly layout: MenuListOptions,
  ) {
    this.w = layout.width ?? 360;
    this.h = layout.height ?? 50;
    this.gap = layout.gap ?? 12;
    const depth = layout.depth ?? 0;
    this.g = scene.add.graphics().setDepth(depth);
    const fontSize = `${String(layout.fontSize ?? 24)}px`;
    this.labels = options.map((o, i) =>
      scene.add
        .text(layout.x, this.rowY(i), o.label, {
          fontFamily: UI.font,
          fontSize,
          fontStyle: 'bold',
          color: UI.text,
        })
        .setOrigin(0.5)
        .setDepth(depth + 1),
    );
    this.tags = options.map((o, i) =>
      o.disabled
        ? scene.add
            .text(layout.x + this.w / 2 - 14, this.rowY(i), o.disabled.toUpperCase(), {
              fontFamily: UI.font,
              fontSize: '13px',
              fontStyle: 'bold',
              color: '#1d2333',
              backgroundColor: '#8d99ae',
              padding: { x: 6, y: 2 },
            })
            .setOrigin(1, 0.5)
            .setDepth(depth + 1)
        : null,
    );
    this.draw();
  }

  /** Trata as ações de menu do quadro. Devolve true se acionou alguma opção. */
  handle(actions: MenuMask): boolean {
    if (actions & Menu.UP) this.move(-1);
    if (actions & Menu.DOWN) this.move(1);
    if (actions & Menu.CONFIRM) return this.select();
    return false;
  }

  move(delta: number): void {
    const n = this.options.length;
    if (n === 0) return;
    this.setIndex((this.index + delta + n) % n);
    playSfx(this.scene, 'ui_move');
  }

  setIndex(index: number): void {
    this.index = index;
    this.draw();
    const label = this.labels[index];
    if (label) {
      this.scene.tweens.killTweensOf(label);
      label.setScale(0.9);
      this.scene.tweens.add({ targets: label, scale: 1, duration: 120, ease: 'Back.Out' });
    }
  }

  /** Aciona a opção escolhida (a apagada só faz o som de erro e treme). */
  select(): boolean {
    const option = this.options[this.index];
    if (!option) return false;
    if (option.disabled) {
      playSfx(this.scene, 'ui_error');
      const label = this.labels[this.index];
      if (label) {
        this.scene.tweens.add({
          targets: label,
          x: this.layout.x + 6,
          duration: 40,
          yoyo: true,
          repeat: 2,
          onComplete: () => label.setX(this.layout.x),
        });
      }
      return false;
    }
    playSfx(this.scene, 'ui_confirm');
    option.onSelect?.();
    return true;
  }

  setVisible(visible: boolean): void {
    this.g.setVisible(visible);
    for (const l of this.labels) l.setVisible(visible);
    for (const t of this.tags) t?.setVisible(visible);
  }

  private rowY(i: number): number {
    return this.layout.y + i * (this.h + this.gap);
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    for (const [i, o] of this.options.entries()) {
      const selected = i === this.index;
      const x = this.layout.x - this.w / 2;
      const y = this.rowY(i) - this.h / 2;
      g.fillStyle(selected ? UI.accent : UI.panel, selected ? 1 : 0.88);
      g.fillRoundedRect(x, y, this.w, this.h, 10);
      if (selected) {
        g.lineStyle(3, 0xffffff, 0.9);
        g.strokeRoundedRect(x - 3, y - 3, this.w + 6, this.h + 6, 12);
      }
      const color = selected ? '#1d2333' : o.disabled ? UI.dim : UI.text;
      this.labels[i]?.setColor(color);
    }
  }
}
