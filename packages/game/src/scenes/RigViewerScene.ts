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

const FONT = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };
const LIVE_ZOOM = 2.6;
/** Quadros do modo filme (poucos e grandes: dá para ver os detalhes). */
const STRIP = 4;
const STRIP_GAP = 100;

interface Sample {
  t: number;
  /** Frame do golpe (0 se não for golpe). */
  frame: number;
}

/**
 * Visualizador de animações (só em dev, abre com `?rig` na URL). Toca o mesmo
 * clipe nos personagens lado a lado, com a hurtbox e as hitboxes do golpe por
 * cima, para conferir se o quadro visual bate com os frames ativos.
 *
 * ←/→ clipe · Espaço pausa · ↑/↓ 1 tick · H hitbox · Z zoom
 * F modo filme (4 quadros do clipe de um personagem) · C troca o personagem do filme
 */
export class RigViewerScene extends Phaser.Scene {
  clipIndex = 0;
  tick = 0;
  paused = false;
  strip = false;
  stripCharacter = 0;
  private live: FighterView[] = [];
  private filmstrip: FighterView[][] = [];
  private characters: Character[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private stripLabels: Phaser.GameObjects.Text[] = [];
  private showBoxes = true;
  zoom = LIVE_ZOOM;
  /** Centro da câmera no modo ao vivo (para olhar um detalhe de perto, pelo console). */
  focus = { x: 0, y: -60 };

  constructor() {
    super('rig-viewer');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#5b6274');
    this.characters = PLAYABLE_CHARACTERS.map((id) => getCharacter(id));
    this.gfx = this.add.graphics().setDepth(10);
    this.live = this.characters.map((c) => new FighterView(this, c.id, toPx(c.stats.height)));
    this.filmstrip = this.characters.map((c) =>
      Array.from({ length: STRIP }, () => new FighterView(this, c.id, toPx(c.stats.height))),
    );
    this.stripLabels = Array.from({ length: STRIP }, (_, i) =>
      this.add
        .text(this.stripX(i), 14, '', { ...FONT, fontSize: '5px' })
        .setOrigin(0.5, 0)
        .setDepth(20),
    );
    this.label = this.add.text(16, 12, '', FONT);
    const help = this.add.text(
      16,
      height - 28,
      '←/→ clipe · espaço pausa · ↑/↓ tick · H hitbox · Z zoom · F filme · C personagem',
      FONT,
    );
    // textos numa câmera sem zoom; o resto na câmera principal, ampliada
    const ui = this.cameras.add(0, 0, width, height);
    ui.ignore([
      this.gfx,
      ...this.stripLabels,
      ...this.live.map((v) => v.container),
      ...this.filmstrip.flat().map((v) => v.container),
    ]);
    this.cameras.main.ignore([this.label, help]);

    const kb = this.input.keyboard;
    const names = clipNames();
    kb?.on('keydown-RIGHT', () => {
      this.clipIndex = (this.clipIndex + 1) % names.length;
      this.tick = 0;
    });
    kb?.on('keydown-LEFT', () => {
      this.clipIndex = (this.clipIndex + names.length - 1) % names.length;
      this.tick = 0;
    });
    kb?.on('keydown-SPACE', () => (this.paused = !this.paused));
    kb?.on('keydown-UP', () => this.tick++);
    kb?.on('keydown-DOWN', () => (this.tick = Math.max(0, this.tick - 1)));
    kb?.on('keydown-H', () => (this.showBoxes = !this.showBoxes));
    kb?.on('keydown-Z', () => (this.zoom = this.zoom >= 6 ? LIVE_ZOOM : this.zoom * 1.6));
    kb?.on('keydown-F', () => (this.strip = !this.strip));
    kb?.on('keydown-C', () => {
      this.stripCharacter = (this.stripCharacter + 1) % this.characters.length;
    });
  }

  /** Mostra um clipe pelo nome (para usar pelo console). */
  show(name: string, strip = this.strip, character = this.stripCharacter): void {
    const i = clipNames().indexOf(name);
    if (i >= 0) this.clipIndex = i;
    this.strip = strip;
    this.stripCharacter = character;
    this.tick = 0;
  }

  override update(): void {
    if (!this.paused) this.tick++;
    const name = clipNames()[this.clipIndex] ?? 'idle';
    const g = this.gfx;
    g.clear();
    const cam = this.cameras.main;
    if (this.strip) {
      cam.setZoom(1280 / (STRIP * STRIP_GAP + 40));
      cam.centerOn(0, -55);
    } else {
      cam.setZoom(this.zoom);
      cam.centerOn(this.focus.x, this.focus.y);
    }
    g.lineStyle(1, 0xffffff, 0.4);
    g.lineBetween(-STRIP * STRIP_GAP, 0, STRIP * STRIP_GAP, 0);

    for (const v of this.live) v.setVisible(!this.strip);
    this.filmstrip.forEach((views, ci) => {
      for (const v of views) v.setVisible(this.strip && ci === this.stripCharacter);
    });
    for (const t of this.stripLabels) t.setVisible(this.strip);

    let info = '';
    if (this.strip) {
      const c = this.characters[this.stripCharacter];
      const views = this.filmstrip[this.stripCharacter];
      if (c && views) {
        const clip = clipFor(c, name);
        const move = moveForClip(c, name);
        stripSamples(clip, move).forEach((s, i) => {
          const x = this.stripX(i);
          views[i]?.setPose(sampleClip(clip, s.t), x, 0, 1, clip.ground === true);
          this.drawBoxes(c, move, s.frame, x);
          this.stripLabels[i]?.setText(
            move ? `f${String(s.frame)} t=${s.t.toFixed(2)}` : `t=${s.t.toFixed(0)}`,
          );
        });
        info = `${c.name}${move ? `  S${String(move.startup)} A${String(move.active)} R${String(move.recovery)}` : ''}`;
      }
    } else {
      this.characters.forEach((c, i) => {
        const view = this.live[i];
        if (!view) return;
        const x = (i - (this.characters.length - 1) / 2) * 140;
        const clip = clipFor(c, name);
        const move = moveForClip(c, name);
        const s = liveSample(clip, move, this.tick);
        view.setPose(sampleClip(clip, s.t), x, 0, 1, clip.ground === true);
        this.drawBoxes(c, move, s.frame, x);
        if (i === 0) {
          info = move
            ? `frame ${String(s.frame)}/${String(totalFrames(move))} t=${s.t.toFixed(2)}`
            : `tick ${String(this.tick)}`;
        }
      });
    }
    this.label.setText(`${name}  ${info}${this.paused ? '  [pausado]' : ''}`);
  }

  private stripX(i: number): number {
    return (i - (STRIP - 1) / 2) * STRIP_GAP;
  }

  /** Hurtbox (amarela) e hitboxes do frame (vermelhas), com os pés em (x, 0). */
  private drawBoxes(c: Character, move: MoveDef | null, frame: number, x: number): void {
    const g = this.gfx;
    const w = toPx(c.stats.width);
    const h = toPx(c.stats.height);
    g.lineStyle(1, 0xffd166, 0.8);
    g.strokeRect(x - w / 2, -h, w, h);
    if (!move || !this.showBoxes) return;
    for (const b of hitboxesAt(move, frame)) {
      const bx = x + toPx(b.x) - toPx(b.w) / 2;
      const by = -h / 2 + toPx(b.y) - toPx(b.h) / 2;
      g.fillStyle(0xff3b30, 0.3);
      g.fillRect(bx, by, toPx(b.w), toPx(b.h));
      g.lineStyle(1, 0xff3b30, 1);
      g.strokeRect(bx, by, toPx(b.w), toPx(b.h));
    }
  }
}

/** Tempo do clipe no tick do visualizador (golpe: toca e espera 20 ticks). */
function liveSample(clip: Clip, move: MoveDef | null, tick: number): Sample {
  if (clip.timing === 'move' && move) {
    const total = totalFrames(move);
    const frame = Math.min((tick % (total + 20)) + 1, total);
    return { t: movePhaseTime(frame, move.startup, move.active, move.recovery), frame };
  }
  const length = clip.length ?? 60;
  return { t: clip.timing === 'once' ? tick % (length + 30) : tick, frame: 0 };
}

/** 4 quadros do clipe: no golpe, preparação, impacto, fim do active e meio do recovery. */
function stripSamples(clip: Clip, move: MoveDef | null): Sample[] {
  if (clip.timing === 'move' && move) {
    const { startup: s, active: a, recovery: r } = move;
    const frames = [s, s + 1, s + a, s + a + Math.ceil(r / 2)];
    return frames.map((f) => {
      const frame = Math.max(1, f);
      return { t: movePhaseTime(frame, s, a, r), frame };
    });
  }
  const length = clip.length ?? 60;
  return Array.from({ length: STRIP }, (_, i) => ({ t: (i * length) / STRIP, frame: 0 }));
}
