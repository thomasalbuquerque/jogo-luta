import Phaser from 'phaser';
import {
  activeHitboxes,
  Button,
  createGame,
  FixedStepLoop,
  getStage,
  hurtbox,
  isPressed,
  stepGame,
  SUBPX,
  toPx,
  type Box,
  type Fighter,
  type GameState,
  type InputMask,
} from '@jogo-luta/sim';
import { InputManager } from '../input/InputManager';
import { frameTargets, smooth, type Rect } from '../render/camera';

export const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];
const SOLID_COLOR = 0x5c677d;
const PLATFORM_COLOR = 0x8d99ae;
const HITBOX_COLOR = 0xff3b30;
const HURTBOX_COLOR = 0xffd166;
const HURTBOX_INVULN_COLOR = 0x9aa0a6;
/** Pulo de posição maior que isso entre ticks (respawn) não é interpolado. */
const TELEPORT_PX = 150;
const CAMERA_RATE = 5;
/** Ticks depois do fim da luta antes de aceitar revanche (evita apertar sem querer). */
const REMATCH_DELAY_TICKS = 60;
/** Enquadramento da câmera quando ninguém está em cena. */
const STAGE_VIEW: Rect = { x: -450, y: -200, w: 900, h: 200 };

/** Registro do Phaser: modo debug ligado (overlay de texto + caixas). */
export const DEBUG_KEY = 'debug';

interface PrevPos {
  x: number;
  y: number;
}

/** Luta: roda o sim em passo fixo e desenha o estado interpolado. */
export class FightScene extends Phaser.Scene {
  state!: GameState;
  /** Último input enviado ao sim, por jogador (para o overlay de debug). */
  lastInputs: InputMask[] = [];
  /** Ticks desde que a luta acabou. */
  overTicks = 0;

  private readonly loop = new FixedStepLoop();
  private controls!: InputManager;
  private prev: PrevPos[] = [];
  private fightersGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('fight');
  }

  create(): void {
    if (this.registry.get(DEBUG_KEY) === undefined) this.registry.set(DEBUG_KEY, true);
    this.newMatch();
    this.controls = new InputManager();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.canRematch()) this.newMatch();
    });

    this.drawStage();
    this.fightersGfx = this.add.graphics();

    const cam = this.cameras.main;
    const target = this.cameraTarget(0);
    cam.setZoom(target.zoom);
    cam.centerOn(target.x, target.y);

    this.scene.launch('hud');
    this.scene.launch('debug');
  }

  override update(_time: number, delta: number): void {
    const alpha = this.loop.advance(delta, () => {
      this.tick();
    });
    this.drawFighters(alpha);
    this.updateCamera(alpha, delta);
  }

  /** Começa uma luta nova (início e revanche). */
  newMatch(): void {
    this.state = createGame(2);
    this.prev = this.state.fighters.map((f) => ({ x: f.x, y: f.y }));
    this.overTicks = 0;
    this.loop.reset();
  }

  canRematch(): boolean {
    return this.state.phase === 'over' && this.overTicks >= REMATCH_DELAY_TICKS;
  }

  private tick(): void {
    for (const [i, f] of this.state.fighters.entries()) this.prev[i] = { x: f.x, y: f.y };
    const prevInputs = this.lastInputs;
    this.lastInputs = this.controls.sample(this.state.fighters.length);

    if (this.state.phase === 'over') {
      this.overTicks++;
      const pressed = this.lastInputs.some((m, i) =>
        isPressed(m, prevInputs[i] ?? 0, Button.ATTACK | Button.JUMP),
      );
      if (pressed && this.canRematch()) {
        this.newMatch();
        return;
      }
    }
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
    const debug = this.registry.get(DEBUG_KEY) === true;
    g.clear();
    for (const f of this.state.fighters) {
      if (f.state === 'ko') continue;
      const r = this.renderRect(f, alpha);
      // Desloca as caixas do sim para a posição interpolada.
      const dx = r.x - toPx(f.x);
      const dy = r.y - toPx(f.y);
      // Treme no congelamento do impacto.
      if (f.hitstop > 0 && f.state === 'hitstun') r.x += this.state.tick % 2 === 0 ? 3 : -3;

      const color = PLAYER_COLORS[f.id % PLAYER_COLORS.length] ?? 0xffffff;
      const fade = f.invulnTicks > 0 ? 0.45 : 1;
      g.fillStyle(color, fade);
      g.fillRect(r.x, r.y, r.w, r.h);
      if (f.state === 'hitstun' && Math.floor(f.stateTicks / 3) % 2 === 0) {
        g.fillStyle(0xffffff, 0.55);
        g.fillRect(r.x, r.y, r.w, r.h);
      }
      if (f.state === 'dash') {
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(r.x - f.facing * 18, r.y + 10, r.w, r.h - 20);
      }
      // "olho" mostrando para onde está virado
      g.fillStyle(0x111111, fade);
      const eyeX = f.facing === 1 ? r.x + r.w - 16 : r.x + 6;
      g.fillRect(eyeX, r.y + 16, 10, 10);

      // Golpe: sem debug, a área ativa aparece como um "rastro" claro.
      for (const box of activeHitboxes(f)) {
        const b = toRect(box, dx, dy);
        if (debug) {
          g.fillStyle(HITBOX_COLOR, 0.35);
          g.fillRect(b.x, b.y, b.w, b.h);
          g.lineStyle(2, HITBOX_COLOR, 1);
          g.strokeRect(b.x, b.y, b.w, b.h);
        } else {
          g.fillStyle(0xffffff, 0.5);
          g.fillRect(b.x, b.y, b.w, b.h);
        }
      }
      if (debug) {
        const h = toRect(hurtbox(f), dx, dy);
        g.lineStyle(2, f.invulnTicks > 0 ? HURTBOX_INVULN_COLOR : HURTBOX_COLOR, 1);
        g.strokeRect(h.x, h.y, h.w, h.h);
      }
    }
  }

  private cameraTarget(alpha: number): { x: number; y: number; zoom: number } {
    const rects = this.state.fighters
      .filter((f) => f.state !== 'ko')
      .map((f) => this.renderRect(f, alpha));
    return frameTargets(
      rects.length > 0 ? rects : [STAGE_VIEW],
      this.scale.width,
      this.scale.height,
    );
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

/** Caixa do sim (subpx) em px de mundo, deslocada pela interpolação. */
function toRect(b: Box, dx: number, dy: number): Rect {
  return { x: toPx(b.x) + dx, y: toPx(b.y) + dy, w: toPx(b.w), h: toPx(b.h) };
}
