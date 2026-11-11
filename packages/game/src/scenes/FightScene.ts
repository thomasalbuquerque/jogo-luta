import Phaser from 'phaser';
import {
  activeHitboxes,
  Button,
  createGame,
  currentMove,
  FixedStepLoop,
  getStage,
  hurtbox,
  isActiveFrame,
  isCountering,
  isPressed,
  moveFrame,
  PLAYABLE_CHARACTERS,
  stepGame,
  SUBPX,
  toPx,
  type Box,
  type Fighter,
  type FighterState,
  type GameState,
  type InputMask,
} from '@jogo-luta/sim';
import { playVoice } from '../audio/voice';
import { InputManager } from '../input/InputManager';
import { frameTargets, smooth, type Rect } from '../render/camera';
import { characterOfFighter, colorValue } from '../render/fighterLook';
import { FighterView, characterTextureKey } from '../render/FighterView';
import { CHARACTER_FX, FxLayer } from '../render/fx';
import { StageView } from '../render/stageView';
import { fighterPose } from '../rig/fighterPose';

/** Cor de cada jogador (marcador e HUD); a cor do corpo vem da arte. */
export const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];
const STAGE_DEBUG_COLOR = 0x80ed99;
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

/** Camadas de desenho (depth do Phaser). */
const DEPTH = {
  background: -10,
  stage: 0,
  decoration: 2,
  fighters: 10,
  fx: 20,
  projectiles: 25,
  ui: 30,
  debug: 40,
};

/** Registro do Phaser: modo debug ligado (overlay de texto + caixas). */
export const DEBUG_KEY = 'debug';

export interface FightData {
  /** Id da ficha de cada jogador. Sem isso: os 2 primeiros do elenco. */
  characters?: readonly string[];
}

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
  private characters: readonly string[] = PLAYABLE_CHARACTERS;
  private controls!: InputManager;
  private prev: PrevPos[] = [];
  private lastStates: FighterState[] = [];
  private views: FighterView[] = [];
  private fx!: FxLayer;
  private projectileImages: Phaser.GameObjects.Image[] = [];
  private projectileTrails: Phaser.GameObjects.Image[] = [];
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Text[] = [];
  private stageView!: StageView;

  constructor() {
    super('fight');
  }

  init(data: FightData): void {
    this.characters = data.characters ?? PLAYABLE_CHARACTERS;
  }

  create(): void {
    if (this.registry.get(DEBUG_KEY) === undefined) this.registry.set(DEBUG_KEY, true);
    this.views = [];
    this.projectileImages = [];
    this.projectileTrails = [];
    this.fx = new FxLayer(this, DEPTH.fx);
    this.newMatch();
    this.controls = new InputManager();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.canRematch()) this.newMatch();
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.canRematch()) this.backToSelect();
    });

    this.stageView = new StageView(this, getStage(this.state.stageId), DEPTH);
    this.views = this.state.fighters.map((f) =>
      new FighterView(this, f.character, toPx(f.stats.height)).setDepth(DEPTH.fighters + f.id),
    );
    this.overlayGfx = this.add.graphics().setDepth(DEPTH.ui);
    this.debugGfx = this.add.graphics().setDepth(DEPTH.debug);
    this.bubbles = this.state.fighters.map(() =>
      this.add
        .text(0, 0, '', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#111111',
          backgroundColor: '#ffffff',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.ui)
        .setVisible(false),
    );

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
    this.drawProjectiles(alpha);
    this.updateTaunts(alpha);
    this.updateCamera(alpha, delta);
  }

  /** Começa uma luta nova (início e revanche), com os mesmos personagens. */
  newMatch(): void {
    this.state = createGame({ characters: this.characters });
    this.prev = this.state.fighters.map((f) => ({ x: f.x, y: f.y }));
    this.lastStates = this.state.fighters.map((f) => f.state);
    this.overTicks = 0;
    this.loop.reset();
    this.fx.clear();
  }

  canRematch(): boolean {
    return this.state.phase === 'over' && this.overTicks >= REMATCH_DELAY_TICKS;
  }

  /** Volta para a seleção de personagem. */
  backToSelect(): void {
    this.scene.stop('hud');
    this.scene.stop('debug');
    this.scene.start('select', { characters: this.characters });
  }

  private tick(): void {
    for (const [i, f] of this.state.fighters.entries()) this.prev[i] = { x: f.x, y: f.y };
    const prevInputs = this.lastInputs;
    this.lastInputs = this.controls.sample(this.state.fighters.length);

    if (this.state.phase === 'over') {
      this.overTicks++;
      const pressed = (button: number) =>
        this.lastInputs.some((m, i) => isPressed(m, prevInputs[i] ?? 0, button));
      if (this.canRematch() && pressed(Button.SPECIAL)) {
        this.backToSelect();
        return;
      }
      if (this.canRematch() && pressed(Button.ATTACK | Button.JUMP)) {
        this.newMatch();
        return;
      }
    }
    stepGame(this.state, this.lastInputs);
    this.spawnFx();
    this.fx.step();
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

  private drawFighters(alpha: number): void {
    const g = this.overlayGfx;
    const d = this.debugGfx;
    const debug = this.registry.get(DEBUG_KEY) === true;
    g.clear();
    d.clear();
    if (debug) {
      // caixas de colisão do mapa
      d.lineStyle(2, STAGE_DEBUG_COLOR, 0.8);
      for (const s of getStage(this.state.stageId).solids) {
        d.strokeRect(toPx(s.x), toPx(s.y), toPx(s.w), toPx(s.h));
      }
    }
    for (const f of this.state.fighters) {
      const view = this.views[f.id];
      if (!view) continue;
      view.setVisible(f.state !== 'ko');
      if (f.state === 'ko') continue;
      const r = this.renderRect(f, alpha);
      // Desloca as caixas do sim para a posição interpolada.
      const dx = r.x - toPx(f.x);
      const dy = r.y - toPx(f.y);
      // Treme no congelamento do impacto.
      const shake =
        f.hitstop > 0 && f.state === 'hitstun' ? (this.state.tick % 2 === 0 ? 3 : -3) : 0;

      view.setPose(fighterPose(f), r.x + r.w / 2 + shake, r.y + r.h, f.facing, f.grounded);
      // invencível pisca; levando golpe, pisca claro
      view.setAlpha(f.invulnTicks > 0 && Math.floor(this.state.tick / 4) % 2 === 0 ? 0.35 : 1);
      const flash = f.state === 'hitstun' && Math.floor(f.stateTicks / 3) % 2 === 0;
      view.setTint(flash ? 0xffb0b0 : 0xffffff);

      this.drawBlockOutlines(f, r);
      // marcador do jogador em cima da cabeça
      const player = PLAYER_COLORS[f.id % PLAYER_COLORS.length] ?? 0xffffff;
      const mx = r.x + r.w / 2;
      const my = r.y + r.h - view.height - 8;
      g.fillStyle(player, 1);
      g.lineStyle(2, 0x111111, 0.6);
      g.fillTriangle(mx - 9, my - 12, mx + 9, my - 12, mx, my);
      g.strokeTriangle(mx - 9, my - 12, mx + 9, my - 12, mx, my);

      if (!debug) continue;
      for (const box of activeHitboxes(f)) {
        const b = toRect(box, dx, dy);
        d.fillStyle(HITBOX_COLOR, 0.35);
        d.fillRect(b.x, b.y, b.w, b.h);
        d.lineStyle(2, HITBOX_COLOR, 1);
        d.strokeRect(b.x, b.y, b.w, b.h);
      }
      const h = toRect(hurtbox(f), dx, dy);
      d.lineStyle(2, f.invulnTicks > 0 ? HURTBOX_INVULN_COLOR : HURTBOX_COLOR, 1);
      d.strokeRect(h.x, h.y, h.w, h.h);
    }
  }

  /**
   * Blocos de especial que ainda não têm arte própria: contra-ataque (contorno
   * branco) e buff (contorno pulsando na cor secundária).
   */
  private drawBlockOutlines(f: Fighter, r: Rect): void {
    const g = this.overlayGfx;
    if (isCountering(f)) {
      g.lineStyle(4, 0xffffff, 0.9);
      g.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    }
    if (f.buffTicks > 0) {
      const secondary = colorValue(characterOfFighter(f).colors.secondary);
      g.lineStyle(5, secondary, 0.35 + 0.25 * Math.sin(this.state.tick * 0.3));
      g.strokeRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
    }
  }

  /** Efeitos do especial (fumaça, marca no chão, linhas de velocidade), a cada tick. */
  private spawnFx(): void {
    const t = this.state.tick;
    for (const f of this.state.fighters) {
      const view = this.views[f.id];
      const fx = CHARACTER_FX[f.character];
      const move = f.state === 'attack' && f.move === 'special' ? currentMove(f) : null;
      if (!view || !fx || !move) continue;
      const frame = moveFrame(f);
      const feetX = toPx(f.x + f.w / 2);
      const feetY = toPx(f.y + f.h);
      const w = toPx(f.w);
      const s = view.scale;

      if (frame <= move.startup) {
        if (frame === 1 && fx.chargeMark && f.grounded) {
          this.fx.spawn({
            character: f.character,
            frame: fx.chargeMark,
            x: feetX - f.facing * w * 0.4,
            y: feetY,
            originX: f.facing === 1 ? 1 : 0,
            originY: 0.75,
            flipX: f.facing === -1,
            life: 70,
            scale: s * 0.7,
            alpha: 0.8,
          });
        }
        const puffs = fx.chargePuffs ?? [];
        if (puffs.length > 0 && t % 3 === 0) {
          this.fx.spawn({
            character: f.character,
            frame: puffs[Math.floor(Math.random() * puffs.length)] ?? '',
            x: feetX - f.facing * (w / 2 + 6 + Math.random() * 10),
            y: feetY - 6 - Math.random() * 10,
            vx: -f.facing * (0.6 + Math.random() * 1.2),
            vy: -(0.3 + Math.random() * 0.6),
            life: 26,
            scale: s * 0.45,
            scaleEnd: s * 0.9,
            alpha: 0.95,
            flipX: f.facing === -1,
          });
        }
      } else if (isActiveFrame(move, frame)) {
        const streaks = fx.activeStreaks ?? [];
        if (streaks.length > 0 && t % 2 === 0) {
          this.fx.spawn({
            character: f.character,
            frame: streaks[Math.floor(Math.random() * streaks.length)] ?? '',
            x: feetX - f.facing * (w / 2),
            y: feetY - toPx(f.h) * (0.25 + Math.random() * 0.5),
            originX: f.facing === 1 ? 1 : 0,
            vx: f.facing * 2,
            life: 10,
            scale: s * 0.55,
            alpha: 0.85,
            flipX: f.facing === -1,
          });
        }
      }
    }

    // fumacinha soltando dos projéteis
    for (const p of this.state.projectiles) {
      const owner = this.state.fighters.find((f) => f.id === p.owner);
      const puffs = owner ? CHARACTER_FX[owner.character]?.projectile?.puffs : undefined;
      const view = owner ? this.views[owner.id] : undefined;
      if (!owner || !puffs || !view || t % 5 !== 0) continue;
      const side = p.vx < 0 ? -1 : 1;
      this.fx.spawn({
        character: owner.character,
        frame: puffs[Math.floor(Math.random() * puffs.length)] ?? '',
        x: toPx(p.x + p.w / 2) - side * toPx(p.w) * 0.6,
        y: toPx(p.y),
        vy: -0.5,
        life: 22,
        scale: view.scale * 0.35,
        scaleEnd: view.scale * 0.55,
        alpha: 0.9,
        flipX: side === -1,
      });
    }
  }

  /** Projétil com a arte de quem soltou (o frango), girando; elipse se não tiver arte. */
  private drawProjectiles(alpha: number): void {
    const g = this.overlayGfx;
    this.state.projectiles.forEach((p, i) => {
      const owner = this.state.fighters.find((f) => f.id === p.owner);
      const art = owner ? CHARACTER_FX[owner.character]?.projectile : undefined;
      const view = owner ? this.views[owner.id] : undefined;
      // interpola voltando a velocidade do último tick
      const x = toPx(p.x - p.vx * (1 - alpha));
      const y = toPx(p.y - p.vy * (1 - alpha));
      const w = toPx(p.w);
      const h = toPx(p.h);
      const side = p.vx < 0 ? -1 : p.vx > 0 ? 1 : p.facing;
      if (!owner || !art || !view) {
        drawEllipseProjectile(g, x, y, w, h);
        return;
      }
      const key = characterTextureKey(owner.character);
      const frame = art.frames[Math.floor(this.state.tick / 4) % art.frames.length] ?? '';
      let img = this.projectileImages[i];
      if (!img) {
        img = this.add.image(0, 0, key, frame).setDepth(DEPTH.projectiles);
        this.projectileImages[i] = img;
      }
      img.setTexture(key, frame).setVisible(true);
      img
        .setPosition(x + w / 2, y + h / 2)
        .setScale(view.scale * 0.85)
        .setFlipX(side === -1);
      if (art.trail) {
        let trail = this.projectileTrails[i];
        if (!trail) {
          trail = this.add.image(0, 0, key, art.trail).setDepth(DEPTH.projectiles - 1);
          this.projectileTrails[i] = trail;
        }
        trail
          .setTexture(key, art.trail)
          .setVisible(true)
          .setOrigin(side === 1 ? 1 : 0, 0.5)
          .setPosition(x + w / 2 - side * w * 0.45, y + h / 2)
          .setScale(view.scale * 0.6)
          .setFlipX(side === -1)
          .setAlpha(0.8);
      }
    });
    // esconde as imagens que sobraram (projéteis que sumiram)
    for (let i = this.state.projectiles.length; i < this.projectileImages.length; i++) {
      this.projectileImages[i]?.setVisible(false);
      this.projectileTrails[i]?.setVisible(false);
    }
  }

  /** Provocação: balão com o bordão e a voz ao começar. */
  private updateTaunts(alpha: number): void {
    for (const f of this.state.fighters) {
      const bubble = this.bubbles[f.id];
      if (!bubble) continue;
      const taunting = f.state === 'taunt';
      const c = characterOfFighter(f);
      if (taunting && this.lastStates[f.id] !== 'taunt') {
        bubble.setText(c.taunt.text);
        playVoice(this, c.taunt.sound, c.taunt.text);
      }
      this.lastStates[f.id] = f.state;
      bubble.setVisible(taunting);
      if (taunting) {
        const r = this.renderRect(f, alpha);
        const top = r.y + r.h - (this.views[f.id]?.height ?? r.h);
        bubble.setPosition(r.x + r.w / 2, top - 24);
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
    this.stageView.update({ x, y, zoom, width: this.scale.width, height: this.scale.height });
  }
}

/** Projétil sem arte: elipse na cor secundária de quem soltou. */
function drawEllipseProjectile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(x + w / 2, y + h / 2, w, h);
  g.lineStyle(2, 0x5a2d0c, 1);
  g.strokeEllipse(x + w / 2, y + h / 2, w, h);
}

/** Caixa do sim (subpx) em px de mundo, deslocada pela interpolação. */
function toRect(b: Box, dx: number, dy: number): Rect {
  return { x: toPx(b.x) + dx, y: toPx(b.y) + dy, w: toPx(b.w), h: toPx(b.h) };
}
