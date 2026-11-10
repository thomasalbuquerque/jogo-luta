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
  type Projectile,
} from '@jogo-luta/sim';
import { playVoice } from '../audio/voice';
import { InputManager } from '../input/InputManager';
import { frameTargets, smooth, type Rect } from '../render/camera';
import { characterOfFighter, colorValue } from '../render/fighterLook';

/** Cor de cada jogador (contorno, marcador e HUD); a cor do corpo vem da ficha. */
export const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];
const SOLID_COLOR = 0x5c677d;
const PLATFORM_COLOR = 0x8d99ae;
const HITBOX_COLOR = 0xff3b30;
const HURTBOX_COLOR = 0xffd166;
const HURTBOX_INVULN_COLOR = 0x9aa0a6;
const SMOKE_COLOR = 0xb0b4b8;
/** Pulo de posição maior que isso entre ticks (respawn) não é interpolado. */
const TELEPORT_PX = 150;
const CAMERA_RATE = 5;
/** Ticks depois do fim da luta antes de aceitar revanche (evita apertar sem querer). */
const REMATCH_DELAY_TICKS = 60;
/** Enquadramento da câmera quando ninguém está em cena. */
const STAGE_VIEW: Rect = { x: -450, y: -200, w: 900, h: 200 };

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
  private fightersGfx!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('fight');
  }

  init(data: FightData): void {
    this.characters = data.characters ?? PLAYABLE_CHARACTERS;
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
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.canRematch()) this.backToSelect();
    });

    this.drawStage();
    this.fightersGfx = this.add.graphics();
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
    for (const p of this.state.projectiles) this.drawProjectile(p, alpha);
    for (const f of this.state.fighters) {
      if (f.state === 'ko') continue;
      const r = this.renderRect(f, alpha);
      // Desloca as caixas do sim para a posição interpolada.
      const dx = r.x - toPx(f.x);
      const dy = r.y - toPx(f.y);
      // Treme no congelamento do impacto.
      if (f.hitstop > 0 && f.state === 'hitstun') r.x += this.state.tick % 2 === 0 ? 3 : -3;
      // Provocação: pulinhos (a animação de verdade vem na Etapa 4).
      if (f.state === 'taunt') r.y -= Math.abs(Math.sin(f.stateTicks * 0.3)) * 12;

      this.drawSpecialFx(f, r);
      this.drawBody(f, r);

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

  /** Corpo em retângulo com as cores da ficha, contorno e marcador na cor do jogador. */
  private drawBody(f: Fighter, r: Rect): void {
    const g = this.fightersGfx;
    const c = characterOfFighter(f);
    const player = PLAYER_COLORS[f.id % PLAYER_COLORS.length] ?? 0xffffff;
    const fade = f.invulnTicks > 0 ? 0.45 : 1;

    g.fillStyle(colorValue(c.colors.primary), fade);
    g.fillRect(r.x, r.y, r.w, r.h);
    // faixa na cor secundária (avental, jaqueta...)
    g.fillStyle(colorValue(c.colors.secondary), fade);
    g.fillRect(r.x, r.y + r.h * 0.52, r.w, r.h * 0.16);
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

    g.lineStyle(3, player, fade);
    g.strokeRect(r.x, r.y, r.w, r.h);
    // marcador do jogador em cima da cabeça
    const mx = r.x + r.w / 2;
    g.fillStyle(player, 1);
    g.fillTriangle(mx - 9, r.y - 22, mx + 9, r.y - 22, mx, r.y - 10);
  }

  /** Efeitos do especial em retângulo: carga, fumaça, rastro, buff e contra-ataque. */
  private drawSpecialFx(f: Fighter, r: Rect): void {
    const g = this.fightersGfx;
    const secondary = colorValue(characterOfFighter(f).colors.secondary);
    const move = f.state === 'attack' && f.move === 'special' ? currentMove(f) : null;
    const t = this.state.tick;

    if (move) {
      const frame = moveFrame(f);
      if (frame <= move.startup) {
        // carregando: contorno piscando na cor secundária
        if (t % 4 < 2) {
          g.lineStyle(6, secondary, 0.9);
          g.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
        }
        if (move.dash) {
          // queimando pneu: fumaça atrás dos pés
          for (let i = 0; i < 3; i++) {
            const size = 10 + ((t + i * 7) % 12);
            const px = r.x + r.w / 2 - f.facing * (r.w / 2 + 8 + i * 14);
            g.fillStyle(SMOKE_COLOR, 0.5 - i * 0.12);
            g.fillCircle(px, r.y + r.h - size / 2, size);
          }
        }
      } else if (move.dash && isActiveFrame(move, frame)) {
        // arrancada: linhas de velocidade
        g.fillStyle(0xffffff, 0.45);
        for (let i = 0; i < 4; i++) {
          const len = 30 + i * 12;
          const lx = f.facing === 1 ? r.x - len - 6 : r.x + r.w + 6;
          g.fillRect(lx, r.y + 14 + i * (r.h / 4.5), len, 4);
        }
      }
    }
    if (isCountering(f)) {
      g.lineStyle(4, 0xffffff, 0.9);
      g.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    }
    if (f.buffTicks > 0) {
      g.lineStyle(5, secondary, 0.35 + 0.25 * Math.sin(t * 0.3));
      g.strokeRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
    }
  }

  /** Projétil: elipse na cor secundária de quem soltou (o frango, por enquanto). */
  private drawProjectile(p: Projectile, alpha: number): void {
    const g = this.fightersGfx;
    const owner = this.state.fighters.find((f) => f.id === p.owner);
    const color = owner ? colorValue(characterOfFighter(owner).colors.secondary) : 0xffffff;
    // interpola voltando a velocidade do último tick
    const x = toPx(p.x - p.vx * (1 - alpha));
    const y = toPx(p.y - p.vy * (1 - alpha));
    const w = toPx(p.w);
    const h = toPx(p.h);
    g.fillStyle(color, 1);
    g.fillEllipse(x + w / 2, y + h / 2, w, h);
    g.lineStyle(2, 0x5a2d0c, 1);
    g.strokeEllipse(x + w / 2, y + h / 2, w, h);
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
        bubble.setPosition(r.x + r.w / 2, r.y - 30);
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
