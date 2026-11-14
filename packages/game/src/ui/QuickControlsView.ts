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
const CARD_Y = ICON_Y + ICON_H + 6;
/** Cartão: margem interna, espaço entre colunas, altura da 1ª linha e das outras. */
const PAD = 10;
const COL_GAP = 14;
const TITLE_H = 19;
const ROW_H = 17;
/** Largura mínima (para a dica da parede não quebrar em muitas linhas). */
const MIN_CARD_W = 262;
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

  /**
   * Cartão compacto: na 1ª linha o aparelho (e P1/P2 no teclado), depois uma
   * linha por comando, a dica da parede e o rodapé. As colunas têm a largura do
   * texto mais largo, então o cartão fica do tamanho do conteúdo.
   */
  private drawCard(device: QuickDevice): Phaser.GameObjects.Container {
    const s = this.scene;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const add = (
      value: string,
      color: string = UI.text,
      style: Phaser.Types.GameObjects.Text.TextStyle = {},
    ) => {
      const t = uiText(s, 0, 0, value, { fontSize: '12px', color, ...style });
      parts.push(t);
      return t;
    };
    const rows = quickRows(this.controls(), device, this.players);
    const title = add(device === 'pad' ? 'CONTROLE' : 'TECLADO', cssColor(UI.accent), {
      fontStyle: 'bold',
    });
    // no controle, o título já diz de quem é a coluna
    const headers =
      device === 'pad'
        ? []
        : quickHeaders(device, this.players).map((h, i) =>
            add(h, cssColor(playerColor(this.players[i] ?? i)), { fontStyle: 'bold' }),
          );
    const labels = rows.map((r) => add(r.label, UI.muted));
    const values = rows.map((r) =>
      r.values.map((v) => add(v, UI.text, { fontSize: '13px', fontStyle: 'bold' })),
    );

    // larguras das colunas: a do texto mais largo de cada uma
    const labelW = Math.max(title.width, ...labels.map((t) => t.width));
    const cols = rows[0]?.values.length ?? 0;
    const colW = Array.from({ length: cols }, (_, c) =>
      Math.max(headers[c]?.width ?? 0, ...values.map((v) => v[c]?.width ?? 0)),
    );
    const colX: number[] = [];
    let x = PAD + labelW + COL_GAP;
    for (const w of colW) {
      colX.push(x);
      x += w + COL_GAP;
    }
    const w = Math.max(MIN_CARD_W, x - COL_GAP + PAD);

    let y = PAD;
    title.setPosition(PAD, y);
    headers.forEach((t, c) => t.setPosition(colX[c] ?? 0, y));
    y += TITLE_H;
    rows.forEach((_, r) => {
      labels[r]?.setPosition(PAD, y + 1);
      values[r]?.forEach((t, c) => t.setPosition(colX[c] ?? 0, y));
      y += ROW_H;
    });
    y += 4;
    const inner = w - PAD * 2;
    for (const [label, text] of QUICK_NOTES) {
      const head = add(label, cssColor(UI.accent), { fontStyle: 'bold' }).setPosition(PAD, y);
      const indent = head.width + 5;
      const body = add(text, UI.text, { wordWrap: { width: inner - indent } });
      body.setPosition(PAD + indent, y);
      y += body.height + 2;
    }
    const footer = add(QUICK_FOOTER, UI.dim, {
      fontSize: '11px',
      fontStyle: 'italic',
      wordWrap: { width: inner },
    }).setPosition(PAD, y);
    y += footer.height;

    const h = y + PAD;
    const bg = s.add.graphics();
    bg.fillStyle(DARK, 0.8).fillRoundedRect(0, 0, w, h, 10);
    bg.lineStyle(1, LIGHT, 0.3).strokeRoundedRect(0, 0, w, h, 10);
    parts.unshift(bg);
    this.barW = w - 20;
    this.bar = s.add.graphics().setPosition(10, h - 4);
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
