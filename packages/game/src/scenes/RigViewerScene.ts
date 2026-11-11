import Phaser from 'phaser';
import {
  getCharacter,
  hitboxesAt,
  PLAYABLE_CHARACTERS,
  toPx,
  totalFrames,
  type Character,
  type MoveDef,
} from '@jogo-luta/sim';
import { FighterView } from '../render/FighterView';
import { movePhaseTime, sampleClip, type Clip } from '../rig/animation';
import { clipFor, clipNames, moveForClip } from '../rig/library';

const SCALE = 2.6;
const FONT = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };

/**
 * Visualizador de animações (só em dev, abre com `?rig` na URL). Mostra os
 * personagens lado a lado tocando o mesmo clipe, com as hitboxes do golpe por
 * cima, para conferir se o quadro visual bate com os frames ativos.
 *
 * ←/→ troca de clipe · Espaço pausa · ↑/↓ avança/volta 1 tick · H liga/desliga hitbox
 */
export class RigViewerScene extends Phaser.Scene {
  private views: FighterView[] = [];
  private characters: Character[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private clipIndex = 0;
  private tick = 0;
  private paused = false;
  private showBoxes = true;

  constructor() {
    super('rig-viewer');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#5b6274');
    this.characters = PLAYABLE_CHARACTERS.map((id) => getCharacter(id));
    this.gfx = this.add.graphics().setDepth(10);
    this.views = this.characters.map((c) =>
      new FighterView(this, c.id, toPx(c.stats.height)).setDepth(1),
    );
    this.label = this.add.text(16, 12, '', FONT);
    const help = this.add.text(
      16,
      height - 28,
      '←/→ clipe · espaço pausa · ↑/↓ tick · H hitbox · Z zoom · C centraliza',
      FONT,
    );
    // textos numa câmera sem zoom; o resto na câmera principal, ampliada
    const ui = this.cameras.add(0, 0, width, height);
    ui.ignore([this.gfx, ...this.views.map((v) => v.container)]);
    this.cameras.main.ignore([this.label, help]);
    this.cameras.main.setZoom(SCALE);
    this.cameras.main.centerOn(0, -60);

    const kb = this.input.keyboard;
    kb?.on('keydown-RIGHT', () => {
      this.clipIndex = (this.clipIndex + 1) % clipNames().length;
      this.tick = 0;
    });
    kb?.on('keydown-LEFT', () => {
      this.clipIndex = (this.clipIndex + clipNames().length - 1) % clipNames().length;
      this.tick = 0;
    });
    kb?.on('keydown-SPACE', () => (this.paused = !this.paused));
    kb?.on('keydown-UP', () => this.tick++);
    kb?.on('keydown-DOWN', () => (this.tick = Math.max(0, this.tick - 1)));
    kb?.on('keydown-H', () => (this.showBoxes = !this.showBoxes));
    // Z: zoom; C: centraliza em cada personagem
    const zooms = [SCALE, 5, 8];
    let zoomIndex = 0;
    let focus = -1;
    const frame = () => {
      const cam = this.cameras.main;
      cam.setZoom(zooms[zoomIndex] ?? SCALE);
      cam.centerOn(focus < 0 ? 0 : this.feetX(focus), -60);
    };
    kb?.on('keydown-Z', () => {
      zoomIndex = (zoomIndex + 1) % zooms.length;
      frame();
    });
    kb?.on('keydown-C', () => {
      focus = focus + 1 >= this.characters.length ? -1 : focus + 1;
      frame();
    });
  }

  override update(): void {
    if (!this.paused) this.tick++;
    const name = clipNames()[this.clipIndex] ?? 'idle';
    const g = this.gfx;
    g.clear();
    g.lineStyle(1, 0xffffff, 0.4);
    g.lineBetween(-400, 0, 400, 0);

    let info = '';
    this.characters.forEach((c, i) => {
      const view = this.views[i];
      if (!view) return;
      const feetX = this.feetX(i);
      const clip = clipFor(c, name);
      const move = moveForClip(c, name);
      const { t, frame, total } = this.clipTime(clip, move);
      view.setPose(sampleClip(clip, t), feetX, 0, 1);

      const w = toPx(c.stats.width);
      const h = toPx(c.stats.height);
      g.lineStyle(1, 0xffd166, 0.8);
      g.strokeRect(feetX - w / 2, -h, w, h);
      if (move && this.showBoxes) {
        for (const b of hitboxesAt(move, frame)) {
          const bx = feetX + toPx(b.x) - toPx(b.w) / 2;
          const by = -h / 2 + toPx(b.y) - toPx(b.h) / 2;
          g.fillStyle(0xff3b30, 0.3);
          g.fillRect(bx, by, toPx(b.w), toPx(b.h));
          g.lineStyle(1, 0xff3b30, 1);
          g.strokeRect(bx, by, toPx(b.w), toPx(b.h));
        }
      }
      if (i === 0) {
        info = move
          ? `frame ${String(frame)}/${String(total)} (S${String(move.startup)} A${String(move.active)} R${String(move.recovery)}) t=${t.toFixed(2)}`
          : `tick ${String(this.tick)}`;
      }
    });
    this.label.setText(`${name}  ${info}${this.paused ? '  [pausado]' : ''}`);
  }

  private feetX(i: number): number {
    return (i - (this.characters.length - 1) / 2) * 140;
  }

  /** Tempo do clipe e frame do golpe (se for golpe) para o tick atual do visualizador. */
  private clipTime(clip: Clip, move: MoveDef | null): { t: number; frame: number; total: number } {
    if (clip.timing === 'move' && move) {
      const total = totalFrames(move);
      // toca o golpe e espera 20 ticks antes de repetir
      const frame = (this.tick % (total + 20)) + 1;
      const f = Math.min(frame, total);
      return { t: movePhaseTime(f, move.startup, move.active, move.recovery), frame: f, total };
    }
    const length = clip.length ?? 60;
    const t = clip.timing === 'once' ? this.tick % (length + 30) : this.tick;
    return { t, frame: 0, total: 0 };
  }
}
