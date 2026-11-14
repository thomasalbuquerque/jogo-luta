import Phaser from 'phaser';
import type { Controls } from '../input/controls';
import {
  QUICK_FOOTER,
  QUICK_NOTES,
  QUICK_SHOW_MS,
  quickButtonLabel,
  quickHeaders,
  quickRows,
  type QuickDevice,
} from './quickControls';
import { cssColor, playerColor, UI, uiText } from './theme';

const ICON_X = 14;
const ICON_Y = 12;
const ICON_H = 30;
const ICON_ALPHA = 0.7;
const CARD_Y = ICON_Y + ICON_H + 8;
const CARD_W = 440;
const PAD = 16;
const LABEL_W = 156;
const ROW_H = 23;
const NOTE_LABEL_W = 62;
const FADE_IN_MS = 120;
const FADE_OUT_MS = 300;
const DARK = 0x0b0e16;
const KEYCAP = 0x2b3245;
const LIGHT = 0xadb5bd;

/**
 * Cola de comandos da luta: o ícone no canto de cima (com Tab e Select) e o
 * cartão que abre por alguns segundos com os comandos básicos, nas teclas ou nos
 * botões do aparelho que abriu. Fica embaixo do relógio, longe dos painéis.
 */
export class QuickControlsView {
  private readonly icon: Phaser.GameObjects.Container;
  private card: Phaser.GameObjects.Container | null = null;
  private bar: Phaser.GameObjects.Graphics | null = null;
  private barW = 0;
  private device: QuickDevice | null = null;
  private leftMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly controls: () => Controls,
    /** Colunas do teclado: P1 e P2 no jogo local, só o P1 online. */
    private readonly players: readonly number[],
    /** Aparelho do clique no ícone (sem tecla nem botão para saber). */
    private readonly guessDevice: () => QuickDevice,
  ) {
    this.icon = this.drawIcon();
  }

  get open(): boolean {
    return this.device !== null;
  }

  /** Abre a cola no aparelho que apertou; se já estava aberta nele, fecha. */
  toggle(device: QuickDevice): void {
    if (this.device === device) {
      this.close();
      return;
    }
    this.show(device);
  }

  close(): void {
    if (!this.card || this.device === null) return;
    const card = this.card;
    this.device = null;
    this.icon.setAlpha(ICON_ALPHA);
    this.scene.tweens.killTweensOf(card);
    this.scene.tweens.add({
      targets: card,
      alpha: 0,
      duration: FADE_OUT_MS,
      onComplete: () => {
        card.destroy();
      },
    });
    this.card = null;
    this.bar = null;
  }

  update(delta: number): void {
    if (this.device === null) return;
    this.leftMs -= delta;
    if (this.leftMs <= 0) {
      this.close();
      return;
    }
    // barrinha que encolhe: quanto falta para sumir
    const bar = this.bar;
    if (!bar) return;
    const w = this.barW * (this.leftMs / QUICK_SHOW_MS);
    bar.clear().fillStyle(UI.accent, 0.8).fillRect(0, 0, w, 3);
  }

  private show(device: QuickDevice): void {
    if (this.card) {
      this.scene.tweens.killTweensOf(this.card);
      this.card.destroy();
    }
    this.device = device;
    this.leftMs = QUICK_SHOW_MS;
    this.icon.setAlpha(1);
    this.card = this.drawCard(device).setAlpha(0);
    this.scene.tweens.add({ targets: this.card, alpha: 1, duration: FADE_IN_MS });
  }

  /** "? [Tab] / 🎮 Select  comandos", meio apagado para não chamar atenção. */
  private drawIcon(): Phaser.GameObjects.Container {
    const s = this.scene;
    const g = s.add.graphics();
    const parts: Phaser.GameObjects.GameObject[] = [g];
    const text = (x: number, value: string, color: string, size = 14, bold = true) => {
      const t = uiText(s, x, ICON_H / 2, value, {
        fontSize: `${String(size)}px`,
        fontStyle: bold ? 'bold' : 'normal',
        color,
      }).setOrigin(0, 0.5);
      parts.push(t);
      return t;
    };
    // "?" num círculo amarelo
    const r = 10;
    g.fillStyle(UI.accent, 1).fillCircle(8 + r, ICON_H / 2, r);
    text(8 + r, '?', cssColor(DARK), 15).setOrigin(0.5);
    let x = 8 + 2 * r + 10;
    // tecla do teclado
    const tab = text(x + 7, quickButtonLabel('keyboard'), UI.text, 13);
    const capW = tab.width + 14;
    g.fillStyle(0x000000, 0.5).fillRoundedRect(x, 7, capW, ICON_H - 12, 4);
    g.fillStyle(KEYCAP, 1).fillRoundedRect(x, 5, capW, ICON_H - 12, 4);
    g.lineStyle(1, LIGHT, 0.8).strokeRoundedRect(x, 5, capW, ICON_H - 12, 4);
    tab.setY(ICON_H / 2 - 1);
    x += capW + 8;
    text(x, '/', UI.dim, 14, false);
    x += 14;
    // controlezinho + "Select"
    drawPadGlyph(g, x, ICON_H / 2);
    x += 26;
    const select = text(x, quickButtonLabel('pad'), UI.text, 13);
    x += select.width + 10;
    const label = text(x, 'comandos', UI.muted, 13, false);
    const w = x + label.width + 12;
    // fundo por baixo de tudo
    const bg = s.add.graphics();
    bg.fillStyle(DARK, 0.6).fillRoundedRect(0, 0, w, ICON_H, ICON_H / 2);
    parts.unshift(bg);
    const icon = s.add.container(ICON_X, ICON_Y, parts).setAlpha(ICON_ALPHA).setDepth(20);
    // clique (mouse ou toque) também abre
    const hit = s.add
      .zone(ICON_X, ICON_Y, w, ICON_H)
      .setOrigin(0)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    hit.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.toggle(this.device ?? this.guessDevice());
    });
    hit.on(Phaser.Input.Events.POINTER_OVER, () => icon.setAlpha(1));
    hit.on(Phaser.Input.Events.POINTER_OUT, () => icon.setAlpha(this.open ? 1 : ICON_ALPHA));
    return icon;
  }

  private drawCard(device: QuickDevice): Phaser.GameObjects.Container {
    const s = this.scene;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const add = (
      x: number,
      y: number,
      value: string,
      color: string = UI.text,
      style: Phaser.Types.GameObjects.Text.TextStyle = {},
    ) => {
      const t = uiText(s, x, y, value, { fontSize: '15px', color, ...style });
      parts.push(t);
      return t;
    };
    let y = PAD - 2;
    add(PAD, y, 'COMANDOS', UI.muted, { fontStyle: 'bold' });
    add(PAD + 96, y, device === 'pad' ? '· Controle' : '· Teclado', cssColor(UI.accent), {
      fontStyle: 'bold',
    });
    add(CARD_W - PAD, y, `${quickButtonLabel(device)}: fechar`, UI.dim, {
      fontSize: '13px',
    }).setOrigin(1, 0);
    y += 28;

    const headers = quickHeaders(device, this.players);
    const colW = (CARD_W - PAD * 2 - LABEL_W) / headers.length;
    headers.forEach((h, i) => {
      const color = device === 'pad' ? UI.muted : cssColor(playerColor(this.players[i] ?? i));
      add(PAD + LABEL_W + i * colW, y, h, color, { fontStyle: 'bold', fontSize: '14px' });
    });
    y += 22;
    for (const row of quickRows(this.controls(), device, this.players)) {
      add(PAD, y, row.label, UI.muted);
      row.values.forEach((v, i) => {
        add(PAD + LABEL_W + i * colW, y, v, UI.text, { fontStyle: 'bold' });
      });
      y += ROW_H;
    }
    y += 6;
    const line = s.add.graphics();
    line.lineStyle(1, LIGHT, 0.25).lineBetween(PAD, y, CARD_W - PAD, y);
    parts.push(line);
    y += 10;
    for (const [label, text] of QUICK_NOTES) {
      add(PAD, y, label, cssColor(UI.accent), { fontStyle: 'bold', fontSize: '14px' });
      const t = add(PAD + NOTE_LABEL_W, y, text, UI.text, {
        fontSize: '14px',
        wordWrap: { width: CARD_W - PAD * 2 - NOTE_LABEL_W },
      });
      y += t.height + 6;
    }
    y += 2;
    add(PAD, y, QUICK_FOOTER, UI.dim, { fontSize: '13px', fontStyle: 'italic' });
    y += 22;

    const h = y + 6;
    const bg = s.add.graphics();
    bg.fillStyle(DARK, 0.86).fillRoundedRect(0, 0, CARD_W, h, 14);
    bg.lineStyle(2, LIGHT, 0.3).strokeRoundedRect(0, 0, CARD_W, h, 14);
    parts.unshift(bg);
    this.barW = CARD_W - 28;
    this.bar = s.add.graphics().setPosition(14, h - 6);
    parts.push(this.bar);
    return s.add.container(ICON_X, CARD_Y, parts).setDepth(20);
  }
}

/** Controle de videogame pequeno (20×12), com o centro em (x + 10, y). */
function drawPadGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(LIGHT, 1);
  g.fillRoundedRect(x, y - 6, 22, 11, 5);
  g.fillCircle(x + 4, y + 4, 4);
  g.fillCircle(x + 18, y + 4, 4);
  g.fillStyle(DARK, 1);
  // cruz do D-pad e dois botões
  g.fillRect(x + 3, y - 1, 6, 2);
  g.fillRect(x + 5, y - 3, 2, 6);
  g.fillCircle(x + 15, y - 2, 1.4);
  g.fillCircle(x + 18, y + 1, 1.4);
}
