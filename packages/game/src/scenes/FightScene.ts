import Phaser from 'phaser';
import {
  createGame,
  FixedStepLoop,
  getStage,
  stepGame,
  SUBPX,
  toPx,
  type Fighter,
  type GameState,
  type InputMask,
} from '@jogo-luta/sim';
import { InputManager } from '../input/InputManager';
import { frameTargets, smooth, type Rect } from '../render/camera';

const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];
const SOLID_COLOR = 0x5c677d;
const PLATFORM_COLOR = 0x8d99ae;
/** Pulo de posição maior que isso entre ticks (respawn) não é interpolado. */
const TELEPORT_PX = 150;
const CAMERA_RATE = 5;

interface PrevPos {
  x: number;
  y: number;
}

/** Luta: roda o sim em passo fixo e desenha o estado interpolado. */
export class FightScene extends Phaser.Scene {
  state!: GameState;
  /** Último input enviado ao sim, por jogador (para o overlay de debug). */
  lastInputs: InputMask[] = [];

  private readonly loop = new FixedStepLoop();
  private controls!: InputManager;
  private prev: PrevPos[] = [];
  private fightersGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('fight');
  }

  create(): void {
    this.state = createGame(2);
    this.prev = this.state.fighters.map((f) => ({ x: f.x, y: f.y }));
    this.controls = new InputManager();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });

    this.drawStage();
    this.fightersGfx = this.add.graphics();

    const cam = this.cameras.main;
    const target = this.cameraTarget(0);
    cam.setZoom(target.zoom);
    cam.centerOn(target.x, target.y);

    this.scene.launch('debug');
  }

  override update(_time: number, delta: number): void {
    const alpha = this.loop.advance(delta, () => {
      this.tick();
    });
    this.drawFighters(alpha);
    this.updateCamera(alpha, delta);
  }

  private tick(): void {
    for (const [i, f] of this.state.fighters.entries()) this.prev[i] = { x: f.x, y: f.y };
    this.lastInputs = this.controls.sample(this.state.fighters.length);
    stepGame(this.state, this.lastInputs);
  }

  /** Posição do lutador em px, interpolada entre o tick anterior e o atual. */
  private renderRect(f: Fighter, alpha: number): Rect {
    const prev = this.prev[f.id] ?? f;
    let x = f.x;
    let y = f.y;
    if (Math.abs(f.x - prev.x) + Math.abs(f.y - prev.y) < TELEPORT_PX * SUBPX) {
      x = prev.x + (f.x - prev.x) * alpha;
      y = prev.y + (f.y - prev.y) * alpha;
    }
    return { x: toPx(x), y: toPx(y), w: toPx(f.w), h: toPx(f.h) };
  }

  private drawStage(): void {
    const g = this.add.graphics();
    for (const s of getStage(this.state.stageId).solids) {
      const color = s.kind === 'solid' ? SOLID_COLOR : PLATFORM_COLOR;
      g.fillStyle(color, 1);
      g.fillRect(toPx(s.x), toPx(s.y), toPx(s.w), toPx(s.h));
      if (s.kind === 'solid') {
        g.fillStyle(0xadb5bd, 1);
        g.fillRect(toPx(s.x), toPx(s.y), toPx(s.w), 6);
      }
    }
  }

  private drawFighters(alpha: number): void {
    const g = this.fightersGfx;
    g.clear();
    for (const f of this.state.fighters) {
      const r = this.renderRect(f, alpha);
      const color = PLAYER_COLORS[f.id % PLAYER_COLORS.length] ?? 0xffffff;
      const fade = f.invulnTicks > 0 ? 0.45 : 1;
      g.fillStyle(color, fade);
      g.fillRect(r.x, r.y, r.w, r.h);
      if (f.state === 'dash') {
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(r.x - f.facing * 18, r.y + 10, r.w, r.h - 20);
      }
      // "olho" mostrando para onde está virado
      g.fillStyle(0x111111, fade);
      const eyeX = f.facing === 1 ? r.x + r.w - 16 : r.x + 6;
      g.fillRect(eyeX, r.y + 16, 10, 10);
    }
  }

  private cameraTarget(alpha: number): { x: number; y: number; zoom: number } {
    const rects = this.state.fighters.map((f) => this.renderRect(f, alpha));
    return frameTargets(rects, this.scale.width, this.scale.height);
  }

  private updateCamera(alpha: number, delta: number): void {
    const cam = this.cameras.main;
    const target = this.cameraTarget(alpha);
    const zoom = smooth(cam.zoom, target.zoom, CAMERA_RATE, delta);
    const x = smooth(cam.midPoint.x, target.x, CAMERA_RATE, delta);
    const y = smooth(cam.midPoint.y, target.y, CAMERA_RATE, delta);
    cam.setZoom(zoom);
    cam.centerOn(x, y);
  }
}
