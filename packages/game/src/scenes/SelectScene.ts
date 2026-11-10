import Phaser from 'phaser';
import {
  Button,
  getCharacter,
  isPressed,
  PLAYABLE_CHARACTERS,
  toPx,
  type Character,
  type InputMask,
} from '@jogo-luta/sim';
import { InputManager } from '../input/InputManager';
import { colorValue, statBars } from '../render/fighterLook';
import { PLAYER_COLORS, type FightData } from './FightScene';

const FONT = 'sans-serif';
const CARD_W = 380;
const CARD_H = 470;
const CARD_GAP = 60;
const CARD_Y = 120;
const PLAYERS = 2;
/** Frames com os 2 prontos antes de começar (dá tempo de ver a escolha). */
const START_DELAY_FRAMES = 30;

function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Seleção mínima do modo local: cada jogador escolhe com ←/→, confirma com
 * Ataque ou Pulo e desfaz com Especial. Com os 2 prontos, a luta começa.
 * A tela completa (16 retratos) vem na Etapa 6.
 */
export class SelectScene extends Phaser.Scene {
  private controls!: InputManager;
  private prevInputs: InputMask[] = [];
  private cursors: number[] = [];
  private ready: boolean[] = [];
  private readyFrames = 0;
  private cursorGfx!: Phaser.GameObjects.Graphics;
  private tags: Phaser.GameObjects.Text[] = [];
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('select');
  }

  /** Voltando da luta, os cursores começam nos personagens da última luta. */
  init(data: FightData): void {
    this.cursors = Array.from({ length: PLAYERS }, (_, i) => {
      const index = PLAYABLE_CHARACTERS.indexOf(data.characters?.[i] ?? '');
      return index >= 0 ? index : i % PLAYABLE_CHARACTERS.length;
    });
    this.ready = this.cursors.map(() => false);
    this.readyFrames = 0;
    this.prevInputs = [];
  }

  create(): void {
    this.controls = new InputManager();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    const { width, height } = this.scale;
    this.add
      .text(width / 2, 56, 'ESCOLHA O LUTADOR', {
        fontFamily: FONT,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    PLAYABLE_CHARACTERS.forEach((id, i) => {
      this.drawCard(getCharacter(id), this.cardX(i), CARD_Y);
    });
    this.cursorGfx = this.add.graphics();
    this.tags = this.cursors.map((_, p) =>
      this.add
        .text(0, 0, '', {
          fontFamily: FONT,
          fontSize: '20px',
          fontStyle: 'bold',
          color: cssColor(PLAYER_COLORS[p] ?? 0xffffff),
        })
        .setOrigin(0.5, 1),
    );
    this.status = this.add
      .text(width / 2, height - 76, '', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height - 34,
        'P1: A/D escolhe · V ou Espaço confirma · B desfaz        P2: ←/→ escolhe · K ou J confirma · L desfaz',
        { fontFamily: FONT, fontSize: '16px', color: '#adb5bd' },
      )
      .setOrigin(0.5);
    this.refresh();
  }

  override update(): void {
    const inputs = this.controls.sample(PLAYERS);
    for (const [p, mask] of inputs.entries()) {
      const prev = this.prevInputs[p] ?? 0;
      const pressed = (button: number) => isPressed(mask, prev, button);
      if (this.ready[p]) {
        if (pressed(Button.SPECIAL)) this.ready[p] = false;
        continue;
      }
      const n = PLAYABLE_CHARACTERS.length;
      const cursor = this.cursors[p] ?? 0;
      if (pressed(Button.LEFT)) this.cursors[p] = (cursor + n - 1) % n;
      if (pressed(Button.RIGHT)) this.cursors[p] = (cursor + 1) % n;
      if (pressed(Button.ATTACK | Button.JUMP)) this.ready[p] = true;
    }
    this.prevInputs = inputs;

    if (this.ready.every(Boolean)) {
      this.readyFrames++;
      if (this.readyFrames >= START_DELAY_FRAMES) {
        const characters = this.cursors.map((i) => PLAYABLE_CHARACTERS[i] ?? '');
        this.scene.start('fight', { characters } satisfies FightData);
        return;
      }
    } else {
      this.readyFrames = 0;
    }
    this.refresh();
  }

  private cardX(index: number): number {
    const n = PLAYABLE_CHARACTERS.length;
    const total = n * CARD_W + (n - 1) * CARD_GAP;
    return (this.scale.width - total) / 2 + index * (CARD_W + CARD_GAP);
  }

  /** Cartão de um personagem: retângulo de prévia, nome, estilo, especial e barras. */
  private drawCard(c: Character, x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x2b3245, 1);
    g.fillRoundedRect(x, y, CARD_W, CARD_H, 14);

    // prévia em retângulo, no tamanho relativo da ficha
    const w = toPx(c.stats.width) * 1.3;
    const h = toPx(c.stats.height) * 1.3;
    const px = x + CARD_W / 2 - w / 2;
    const py = y + 30 + (140 - h) + 10;
    g.fillStyle(colorValue(c.colors.primary), 1);
    g.fillRect(px, py, w, h);
    g.fillStyle(colorValue(c.colors.secondary), 1);
    g.fillRect(px, py + h * 0.52, w, h * 0.16);
    g.fillStyle(0x111111, 1);
    g.fillRect(px + w - 20, py + 20, 12, 12);

    const text = (dy: number, value: string, style: Phaser.Types.GameObjects.Text.TextStyle) =>
      this.add
        .text(x + CARD_W / 2, y + dy, value, { fontFamily: FONT, ...style })
        .setOrigin(0.5, 0);
    text(196, c.name, { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' });
    text(242, c.blurb, {
      fontSize: '16px',
      color: '#ced4da',
      align: 'center',
      wordWrap: { width: CARD_W - 40 },
    });
    text(296, `Especial: ${c.special?.name ?? '—'}`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: c.colors.secondary,
    });

    statBars(c).forEach((bar, i) => {
      const by = y + 340 + i * 24;
      this.add.text(x + 30, by - 3, bar.label, {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#adb5bd',
      });
      g.fillStyle(0x1d2333, 1);
      g.fillRect(x + 100, by, 240, 12);
      g.fillStyle(colorValue(c.colors.secondary), 1);
      g.fillRect(x + 100, by, 240 * Math.max(0.05, bar.value), 12);
    });
    text(440, `“${c.taunt.text}”`, { fontSize: '15px', fontStyle: 'italic', color: '#8d99ae' });
  }

  /** Molduras e etiquetas de cada jogador sobre o cartão escolhido. */
  private refresh(): void {
    const g = this.cursorGfx;
    g.clear();
    for (const [p, cursor] of this.cursors.entries()) {
      const color = PLAYER_COLORS[p] ?? 0xffffff;
      const x = this.cardX(cursor);
      const inset = p * 10;
      g.lineStyle(this.ready[p] ? 8 : 5, color, 1);
      g.strokeRoundedRect(
        x - 8 + inset,
        CARD_Y - 8 + inset,
        CARD_W + 16 - inset * 2,
        CARD_H + 16 - inset * 2,
        16,
      );
      const tag = this.tags[p];
      if (tag) {
        const label = `P${String(p + 1)}${this.ready[p] ? ' PRONTO' : ''}`;
        tag.setText(label).setPosition(x + CARD_W * (p === 0 ? 0.25 : 0.75), CARD_Y - 14);
      }
    }
    this.status.setText(this.ready.every(Boolean) ? 'LUTA!' : '');
  }
}
