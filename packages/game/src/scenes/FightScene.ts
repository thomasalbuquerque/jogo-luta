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
  type CueName,
  type Fighter,
  type FighterState,
  type GameState,
  type HitEvent,
  type InputMask,
  type KoEvent,
} from '@jogo-luta/sim';
import { playVoice } from '../audio/voice';
import { InputManager } from '../input/InputManager';
import {
  DEFAULT_CAMERA,
  frameTargets,
  smooth,
  type CameraOptions,
  type Rect,
} from '../render/camera';
import { isDecisiveHit } from '../render/decisive';
import { characterOfFighter, colorValue } from '../render/fighterLook';
import { FighterView, characterTextureKey } from '../render/FighterView';
import { CHARACTER_FX, FxLayer } from '../render/fx';
import { FX_TEXTURE } from '../render/fxTextures';
import {
  hitStrength,
  spawnDust,
  spawnHitBurst,
  spawnRespawnGlow,
  spawnTrailPuff,
  TRAIL_MIN_KNOCKBACK,
} from '../render/impact';
import { exitDirection, koEdgePoint } from '../render/koEdge';
import { hitTrauma, Shake } from '../render/shake';
import { SlowMo } from '../render/slowmo';
import { StageView } from '../render/stageView';
import { fighterPose } from '../rig/fighterPose';
import type { HudScene } from './HudScene';

/** Cor de cada jogador (marcador e HUD); a cor do corpo vem da arte. */
export const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];
const STAGE_DEBUG_COLOR = 0x80ed99;
const HITBOX_COLOR = 0xff3b30;
const HURTBOX_COLOR = 0xffd166;
const HURTBOX_INVULN_COLOR = 0x9aa0a6;
/** Pulo de posição maior que isso entre ticks (respawn) não é interpolado. */
const TELEPORT_PX = 150;
const CAMERA_RATE = 5;
/** Ticks de clarão branco em quem leva golpe (mais nos golpes fortes). */
const FLASH_TICKS = 3;
/** Tremor do KO (trauma, 0..1). */
const KO_TRAUMA = 0.8;
/** Golpe que decide a luta: câmera lenta (tempo real e escala) e zoom em quem voa. */
const DECISIVE_SLOWMO_MS = 1300;
const DECISIVE_SLOWMO_SCALE = 0.2;
const FOCUS_CAMERA_RATE = 12;
const FOCUS_CAMERA: CameraOptions = {
  ...DEFAULT_CAMERA,
  padding: 90,
  minWidth: 520,
  minHeight: 300,
  maxZoom: 1.7,
};
/** Luta que acabou sem o golpe decisivo aparecer (caiu sozinho): câmera lenta mais curta. */
const FINAL_KO_SLOWMO_MS = 700;
const FINAL_KO_SLOWMO_SCALE = 0.35;
/** Ticks depois do fim da luta antes de aceitar revanche (evita apertar sem querer). */
const REMATCH_DELAY_TICKS = 60;
/** Enquadramento da câmera quando ninguém está em cena. */
const STAGE_VIEW: Rect = { x: -450, y: -200, w: 900, h: 200 };

/** Camadas de desenho (depth do Phaser). */
const DEPTH = {
  background: -10,
  stage: 0,
  decoration: 2,
  /** Rastro de arremesso e poeira: atrás dos lutadores. */
  backFx: 5,
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

function playerColor(id: number): number {
  return PLAYER_COLORS[id % PLAYER_COLORS.length] ?? 0xffffff;
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
  private backFx!: FxLayer;
  private readonly shake = new Shake();
  private readonly slowMo = new SlowMo();
  /** Câmera sem o tremor (o tremor é somado só na hora de posicionar). */
  private camPos = { x: 0, y: 0, zoom: 1 };
  /** Tick até o qual cada lutador fica branco (clarão do impacto). */
  private flashUntil: number[] = [];
  /** Lutador em foco na câmera lenta do golpe decisivo. */
  private focus: number | null = null;
  /** O golpe decisivo (ou o KO final) já ganhou câmera lenta nesta luta. */
  private decisiveShown = false;
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
    this.backFx = new FxLayer(this, DEPTH.backFx);
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
    this.camPos = { ...target };
    cam.setZoom(target.zoom);
    cam.centerOn(target.x, target.y);

    this.scene.launch('hud');
    this.scene.launch('debug');
  }

  override update(_time: number, delta: number): void {
    const timeScale = this.slowMo.update(delta);
    if (!this.slowMo.active) this.focus = null;
    const alpha = this.loop.advance(delta * timeScale, () => {
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
    this.backFx.clear();
    this.shake.reset();
    this.slowMo.reset();
    this.flashUntil = [];
    this.focus = null;
    this.decisiveShown = false;
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
    this.handleEvents();
    this.spawnTrails();
    this.spawnFx();
    this.fx.step();
    this.backFx.step();
  }

  /** Efeitos do que aconteceu no tick (`state.events`). */
  private handleEvents(): void {
    for (const e of this.state.events) {
      switch (e.type) {
        case 'hit':
          this.onHit(e);
          break;
        case 'ko':
          this.onKo(e);
          break;
        case 'respawn':
          this.onRespawn(e.fighter);
          break;
        case 'action':
          this.onAction(e.fighter, e.action);
          break;
        case 'grab':
          break;
      }
    }
  }

  private onHit(e: HitEvent): void {
    const victim = this.state.fighters[e.victim];
    if (!victim) return;
    const kb = toPx(e.knockback);
    const strength = hitStrength(kb);
    spawnHitBurst(this.fx, {
      x: toPx(e.x),
      y: toPx(e.y),
      dirX: victim.kbx,
      dirY: victim.kby,
      strength,
      color: playerColor(e.attacker),
    });
    this.shake.add(hitTrauma(kb));
    this.flashUntil[e.victim] = this.state.tick + FLASH_TICKS + Math.round(3 * strength);
    if (!this.decisiveShown && isDecisiveHit(this.state, e.victim)) {
      this.decisiveShown = true;
      this.focus = e.victim;
      this.slowMo.trigger(DECISIVE_SLOWMO_MS, DECISIVE_SLOWMO_SCALE);
    }
  }

  /** KO: explosão na borda da tela por onde saiu (desenhada no HUD, sem zoom). */
  private onKo(e: KoEvent): void {
    const b = getStage(this.state.stageId).blastZone;
    const blast = { x: toPx(b.x), y: toPx(b.y), w: toPx(b.w), h: toPx(b.h) };
    const x = toPx(e.x);
    const y = toPx(e.y);
    const view = this.cameras.main.worldView;
    const at = koEdgePoint(
      { x: view.x, y: view.y, w: view.width, h: view.height },
      this.scale.width,
      this.scale.height,
      x,
      y,
      exitDirection(blast, x, y),
    );
    if (this.scene.isActive('hud')) {
      (this.scene.get('hud') as HudScene).koBurst(at, playerColor(e.fighter));
    }
    this.shake.add(KO_TRAUMA);
    if (this.focus === e.fighter) this.focus = null;
    if (this.state.phase === 'over' && !this.decisiveShown) {
      this.decisiveShown = true;
      this.slowMo.trigger(FINAL_KO_SLOWMO_MS, FINAL_KO_SLOWMO_SCALE);
    }
  }

  private onRespawn(id: number): void {
    const f = this.state.fighters[id];
    if (!f) return;
    spawnRespawnGlow(this.fx, toPx(f.x + f.w / 2), toPx(f.y + f.h / 2), playerColor(id));
  }

  /** Poeira e lufadas das ações de movimento. */
  private onAction(id: number, action: CueName): void {
    const f = this.state.fighters[id];
    if (!f) return;
    const feetX = toPx(f.x + f.w / 2);
    const feetY = toPx(f.y + f.h);
    switch (action) {
      case 'JUMP':
        spawnDust(this.backFx, feetX, feetY, 4);
        break;
      case 'LAND':
        spawnDust(this.backFx, feetX, feetY, 6);
        break;
      case 'DASH':
        spawnDust(this.backFx, feetX, feetY, 3, f.facing === 1 ? -1 : 1);
        break;
      case 'WALL_JUMP':
        spawnDust(
          this.backFx,
          feetX - f.facing * toPx(f.w / 2),
          toPx(f.y + f.h * 0.6),
          3,
          f.facing,
        );
        break;
      case 'AIR_JUMP':
        this.fx.spawn({
          texture: FX_TEXTURE.ring,
          x: feetX,
          y: feetY,
          life: 14,
          scale: 0.15,
          scaleEnd: 0.5,
          stretch: 1.6,
          alpha: 0.6,
        });
        break;
      case 'AIR_DODGE':
        this.fx.spawn({
          texture: FX_TEXTURE.glow,
          x: feetX,
          y: toPx(f.y + f.h / 2),
          life: 12,
          scale: 2.4,
          scaleEnd: 1.2,
          alpha: 0.5,
          additive: true,
        });
        break;
      default:
        break;
    }
  }

  /** Rastro de fumaça (ou fogo) atrás de quem voa de um golpe forte. */
  private spawnTrails(): void {
    for (const f of this.state.fighters) {
      if (f.state !== 'hitstun' || f.hitstop > 0) continue;
      const kb = toPx(Math.hypot(f.kbx, f.kby));
      if (kb < TRAIL_MIN_KNOCKBACK) continue;
      const heat = Math.min((kb - TRAIL_MIN_KNOCKBACK) / 16, 1);
      const x = toPx(f.x + f.w / 2);
      const y = toPx(f.y + f.h / 2);
      const prev = this.prev[f.id] ?? f;
      // 2 por tick: o corpo anda muito entre um tick e outro
      spawnTrailPuff(this.backFx, x, y, heat);
      spawnTrailPuff(
        this.backFx,
        (x + toPx(prev.x + f.w / 2)) / 2,
        (y + toPx(prev.y + f.h / 2)) / 2,
        heat,
      );
    }
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
      if (this.state.tick < (this.flashUntil[f.id] ?? 0)) {
        view.setFlash();
      } else {
        const hurt = f.state === 'hitstun' && Math.floor(f.stateTicks / 3) % 2 === 0;
        view.setTint(hurt ? 0xffb0b0 : 0xffffff);
      }

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
            texture: characterTextureKey(f.character),
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
            texture: characterTextureKey(f.character),
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
            texture: characterTextureKey(f.character),
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
        texture: characterTextureKey(owner.character),
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
    const focused = this.focus !== null ? this.state.fighters[this.focus] : undefined;
    if (focused && focused.state !== 'ko') {
      return frameTargets(
        [this.renderRect(focused, alpha)],
        this.scale.width,
        this.scale.height,
        FOCUS_CAMERA,
      );
    }
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
    const rate = this.focus !== null ? FOCUS_CAMERA_RATE : CAMERA_RATE;
    const c = this.camPos;
    c.zoom = smooth(c.zoom, target.zoom, rate, delta);
    c.x = smooth(c.x, target.x, rate, delta);
    c.y = smooth(c.y, target.y, rate, delta);
    // o tremor vem em px de tela: divide pelo zoom para virar px de mundo
    const offset = this.shake.update(delta);
    const x = c.x + offset.x / c.zoom;
    const y = c.y + offset.y / c.zoom;
    cam.setZoom(c.zoom);
    cam.centerOn(x, y);
    this.stageView.update({
      x,
      y,
      zoom: c.zoom,
      width: this.scale.width,
      height: this.scale.height,
    });
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
