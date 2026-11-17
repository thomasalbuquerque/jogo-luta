import Phaser from 'phaser';
import {
  bombDefOf,
  toPx,
  type Bomb,
  type BombEvent,
  type Fighter,
  type GameState,
} from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { characterTextureKey, type FighterView } from './FighterView';
import { CHARACTER_FX, type CharacterFx, type FxLayer } from './fx';
import { FX_TEXTURE } from './fxTextures';
import type { Shake } from './shake';

type BombFx = NonNullable<CharacterFx['bomb']>;

/** Altura da bomba no peito, em fração da altura do corpo (hurtbox). */
const CHEST_HEIGHT = 0.26;
/** Ticks que a bomba leva pulando de um corpo para o outro na passagem. */
const PASS_TICKS = 8;
/** Último segundo (ticks): o relógio fica vermelho e o anel da área aparece no chão. */
export const LAST_SECOND_TICKS = 60;
/** Ticks em que a luz fica acesa depois de cada bipe. */
const LED_TICKS = 4;
/** Tremor da câmera na explosão. */
const BLAST_TRAUMA = 0.6;

const RED = 0xff3b30;

/**
 * Ticks entre um bipe e outro, com `ticksLeft` no relógio: começa devagar (uns 0,7 s)
 * e acelera até quase colar no fim.
 */
export function beepInterval(ticksLeft: number): number {
  return Math.max(5, Math.min(42, Math.round(ticksLeft / 6)));
}

/** Relógio em segundos com 1 casa, com vírgula ("4,9"); nunca mostra "0,0" antes do fim. */
export function clockText(ticksLeft: number): string {
  const tenths = Math.max(1, Math.ceil(ticksLeft / 6));
  return `${String(Math.floor(tenths / 10))},${String(tenths % 10)}`;
}

/** Peças e estado de desenho de uma bomba em jogo (pelo id do dono). */
interface BombLook {
  fx: BombFx;
  texture: string;
  /** Relógio na última vez que bipou. */
  lastBeep: number;
  /** Passagem: de onde a bomba saiu (px de mundo) e em que tick. */
  passFrom: { x: number; y: number } | null;
  passTick: number;
  clock: Phaser.GameObjects.Text;
  led: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  fly: Phaser.GameObjects.Image;
}

/** Onde desenhar coisas em cima da cabeça de um lutador (o marcador do jogador), em px. */
export type MarkerAt = (id: number) => { x: number; y: number } | null;

/**
 * A bomba do Thom4o na luta (o sim só sabe de `state.bombs`): presa no peito de quem
 * está com ela, com a luz piscando no ritmo do bipe, o relógio grande em cima da cabeça
 * (vermelho no último segundo, quando um anel fino no chão mostra a área), um cadeado em
 * cima de quem está travado, a bomba pulando de um corpo para o outro na passagem e a
 * explosão.
 */
export class BombView {
  private readonly looks = new Map<number, BombLook>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
    private readonly fx: FxLayer,
    private readonly shake: Shake,
  ) {}

  /** Um tick da luta: os bipes, cada vez mais rápidos. */
  step(state: GameState): void {
    for (const b of state.bombs) {
      const look = this.lookFor(state, b);
      if (!look) continue;
      if (look.lastBeep - b.ticksLeft >= beepInterval(b.ticksLeft)) {
        look.lastBeep = b.ticksLeft;
        if (look.fx.beepSound) playSfx(this.scene, look.fx.beepSound);
      }
    }
    for (const [owner, look] of this.looks) {
      if (state.bombs.some((b) => b.owner === owner)) continue;
      this.destroyLook(look);
      this.looks.delete(owner);
    }
  }

  /** Agarrão de quem planta bomba pegou: o bip-bip de armada. */
  onGrab(state: GameState, attacker: number): void {
    const f = state.fighters[attacker];
    const fx = f && bombDefOf(f) ? CHARACTER_FX[f.character]?.bomb : undefined;
    if (fx?.armSound) playSfx(this.scene, fx.armSound);
  }

  onEvent(state: GameState, e: BombEvent, views: readonly (FighterView | undefined)[]): void {
    const owner = state.fighters[e.owner];
    const fx = owner ? CHARACTER_FX[owner.character]?.bomb : undefined;
    if (!owner || !fx) return;
    switch (e.action) {
      case 'plant':
        if (fx.passSound) playSfx(this.scene, fx.passSound, { volume: 0.7 });
        break;
      case 'pass': {
        const look = this.looks.get(e.owner);
        const from = views[e.from]?.chestBadge();
        if (look && from) {
          look.passFrom = { x: from.x, y: from.y };
          look.passTick = state.tick;
        }
        if (fx.passSound) playSfx(this.scene, fx.passSound);
        break;
      }
      case 'explode':
        this.explode(state, owner, fx, e);
        break;
      case 'vanish':
        break;
    }
  }

  /**
   * Desenha as bombas em jogo. `alpha`: fração do tick (interpolação); `zoom`: zoom da
   * câmera (o texto e os ícones ficam do mesmo tamanho na tela).
   */
  draw(
    state: GameState,
    views: readonly (FighterView | undefined)[],
    markerAt: MarkerAt,
    gfx: Phaser.GameObjects.Graphics,
    alpha: number,
    zoom: number,
  ): void {
    for (const f of state.fighters) {
      const b = state.bombs.find((x) => x.carrier === f.id);
      const look = b && this.looks.get(b.owner);
      const view = views[f.id];
      if (!view) continue;
      const flying = look ? this.passProgress(state, look, alpha) < 1 : false;
      view.setChestBadge(
        look && !flying && f.state !== 'ko'
          ? { texture: look.texture, frame: look.fx.frame, height: toPx(f.h) * CHEST_HEIGHT }
          : null,
      );
    }
    for (const b of state.bombs) {
      const look = this.looks.get(b.owner);
      const carrier = state.fighters[b.carrier];
      const view = views[b.carrier];
      if (!look || !carrier || !view) continue;
      this.drawClock(b, look, markerAt(carrier.id), zoom);
      this.drawLed(state, b, look, carrier, view);
      this.drawPass(state, look, carrier, view, alpha);
      if (b.ticksLeft <= LAST_SECOND_TICKS) this.drawRing(state, b, carrier, view, gfx);
      const locked = b.locked >= 0 ? markerAt(b.locked) : null;
      if (locked && state.fighters[b.locked]?.state !== 'ko') {
        drawPadlock(gfx, locked.x, locked.y - 14 - 30 / zoom, 1 / zoom);
      }
    }
  }

  /** Tira tudo (luta nova). */
  clear(): void {
    for (const look of this.looks.values()) this.destroyLook(look);
    this.looks.clear();
  }

  private lookFor(state: GameState, b: Bomb): BombLook | null {
    const existing = this.looks.get(b.owner);
    if (existing) return existing;
    const owner = state.fighters[b.owner];
    const fx = owner ? CHARACTER_FX[owner.character]?.bomb : undefined;
    if (!owner || !fx) return null;
    const texture = characterTextureKey(owner.character);
    const look: BombLook = {
      fx,
      texture,
      lastBeep: b.ticksLeft,
      passFrom: null,
      passTick: 0,
      clock: this.scene.add
        .text(0, 0, '', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '30px',
          color: '#ffffff',
          stroke: '#0b0e16',
          strokeThickness: 7,
          // a câmera aproxima: texto em resolução maior para não borrar
          resolution: 2,
        })
        .setOrigin(0.5, 1)
        .setDepth(this.depth),
      led: this.scene.add.image(0, 0, texture, fx.led).setDepth(this.depth - 1),
      glow: this.scene.add
        .image(0, 0, FX_TEXTURE.glow)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(RED)
        .setDepth(this.depth - 1),
      fly: this.scene.add
        .image(0, 0, texture, fx.frame)
        .setDepth(this.depth - 1)
        .setVisible(false),
    };
    this.looks.set(b.owner, look);
    return look;
  }

  private destroyLook(look: BombLook): void {
    look.clock.destroy();
    look.led.destroy();
    look.glow.destroy();
    look.fly.destroy();
  }

  /** Andamento do pulo da passagem (0 a 1; 1 = já chegou, ou sem passagem). */
  private passProgress(state: GameState, look: BombLook, alpha: number): number {
    if (!look.passFrom) return 1;
    return Math.min(1, (state.tick - look.passTick + alpha) / PASS_TICKS);
  }

  private drawClock(b: Bomb, look: BombLook, at: { x: number; y: number } | null, zoom: number) {
    const clock = look.clock;
    clock.setVisible(at !== null);
    if (!at) return;
    const text = clockText(b.ticksLeft);
    if (clock.text !== text) clock.setText(text);
    const last = b.ticksLeft <= LAST_SECOND_TICKS;
    clock.setColor(last ? '#ff3b30' : '#ffffff');
    // em cima do nome do jogador; no último segundo, pulsa
    const pulse = last ? 1 + 0.12 * Math.abs(Math.sin(b.ticksLeft * 0.35)) : 1;
    clock.setScale(pulse / zoom).setPosition(at.x, at.y - 14 - 22 / zoom);
  }

  /** Luz da bomba: acende a cada bipe e fica fraca entre um e outro. */
  private drawLed(state: GameState, b: Bomb, look: BombLook, carrier: Fighter, view: FighterView) {
    const badge = view.chestBadge();
    const visible = badge !== null && this.passProgress(state, look, 0) >= 1;
    look.led.setVisible(visible);
    look.glow.setVisible(visible);
    if (!badge || !visible) return;
    const frame = this.scene.textures.getFrame(look.texture, look.fx.frame);
    const led = (frame.customData as { anchors?: { sockets?: Record<string, [number, number]> } })
      .anchors?.sockets?.led ?? [frame.width / 2, frame.height / 2];
    // o socket na peça (girada no tronco e espelhada com o lutador) → px de mundo
    const lx = led[0] - frame.width / 2;
    const ly = led[1] - frame.height / 2;
    const r = badge.rotation;
    const x = badge.x + badge.facing * (lx * Math.cos(r) - ly * Math.sin(r)) * badge.scale;
    const y = badge.y + (lx * Math.sin(r) + ly * Math.cos(r)) * badge.scale;
    const on = look.lastBeep - b.ticksLeft < LED_TICKS;
    const size = toPx(carrier.h) * CHEST_HEIGHT * 0.16;
    const ledFrame = look.led.frame;
    look.led
      .setPosition(x, y)
      .setScale(size / ledFrame.width)
      .setAlpha(on ? 1 : 0.45);
    look.glow
      .setPosition(x, y)
      .setScale((size * (on ? 3.2 : 1.6)) / 64)
      .setAlpha(on ? 0.9 : 0.25);
  }

  /** A bomba pulando de um corpo para o outro, em arco e girando. */
  private drawPass(
    state: GameState,
    look: BombLook,
    carrier: Fighter,
    view: FighterView,
    alpha: number,
  ) {
    const u = this.passProgress(state, look, alpha);
    const from = look.passFrom;
    const to = view.chestBadge() ?? {
      x: toPx(carrier.x + carrier.w / 2),
      y: toPx(carrier.y + carrier.h * 0.35),
    };
    look.fly.setVisible(from !== null && u < 1);
    if (!from || u >= 1) {
      if (u >= 1) look.passFrom = null;
      return;
    }
    const height = toPx(carrier.h) * CHEST_HEIGHT;
    look.fly
      .setPosition(
        from.x + (to.x - from.x) * u,
        from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 26,
      )
      .setScale(height / look.fly.frame.height)
      .setRotation(u * Math.PI * 2);
  }

  /** Último segundo: anel fino no chão, do tamanho da área da explosão, piscando. */
  private drawRing(
    state: GameState,
    b: Bomb,
    carrier: Fighter,
    view: FighterView,
    gfx: Phaser.GameObjects.Graphics,
  ) {
    const owner = state.fighters[b.owner];
    const def = owner && bombDefOf(owner);
    if (!def) return;
    const badge = view.chestBadge();
    const cx = badge?.x ?? toPx(carrier.x + carrier.w / 2);
    const feet = toPx(carrier.y + carrier.h);
    const w = toPx(def.areaW);
    const blink = 0.45 + 0.4 * Math.abs(Math.sin(b.ticksLeft * 0.4));
    gfx.lineStyle(3, RED, blink);
    gfx.strokeEllipse(cx, feet, w, 22);
    gfx.lineStyle(1, 0xffffff, blink * 0.6);
    gfx.strokeEllipse(cx, feet, w - 8, 16);
  }

  /** Clarão, bola de fogo, anel de onda de choque, fumaça escura, tremor e o "bum". */
  private explode(state: GameState, owner: Fighter, fx: BombFx, e: BombEvent): void {
    const def = bombDefOf(owner);
    const carrier = state.fighters[e.carrier];
    if (!def || !carrier) return;
    const texture = characterTextureKey(owner.character);
    const x = toPx(e.x);
    const y = toPx(e.y);
    const h = toPx(def.areaH);
    const w = toPx(def.areaW);
    const scaleFor = (frame: string, size: number, side: 'w' | 'h') => {
      const f = this.scene.textures.getFrame(texture, frame);
      return size / Math.max(1, side === 'w' ? f.width : f.height);
    };
    this.fx.spawn({
      texture: FX_TEXTURE.glow,
      x,
      y,
      life: 14,
      scale: 2.4,
      scaleEnd: 5,
      tint: 0xffa64a,
      additive: true,
    });
    this.fx.spawn({
      texture,
      frame: fx.blast,
      x,
      y,
      life: 18,
      scale: scaleFor(fx.blast, h * 0.75, 'h'),
      scaleEnd: scaleFor(fx.blast, h * 1.15, 'h'),
      rotation: Math.random() * 0.6 - 0.3,
    });
    this.fx.spawn({
      texture,
      frame: fx.ring,
      x,
      y: toPx(carrier.y + carrier.h),
      life: 18,
      scale: scaleFor(fx.ring, w * 0.45, 'w'),
      scaleEnd: scaleFor(fx.ring, w * 1.25, 'w'),
      alpha: 0.95,
    });
    this.fx.spawn({
      texture: FX_TEXTURE.ring,
      x,
      y,
      life: 14,
      scale: 0.6,
      scaleEnd: 3.2,
      tint: 0xffe0a0,
      alpha: 0.9,
    });
    for (let i = 0; i < 6; i++) {
      const frame = fx.smoke[i % fx.smoke.length] ?? '';
      const side = i % 2 === 0 ? -1 : 1;
      this.fx.spawn({
        texture,
        frame,
        x: x + side * (8 + Math.random() * 30),
        y: y + (Math.random() - 0.3) * 30,
        vx: side * (0.5 + Math.random() * 1.4),
        vy: -0.6 - Math.random() * 0.8,
        drag: 0.96,
        life: 40 + Math.floor(Math.random() * 16),
        scale: scaleFor(frame, h * 0.3, 'h'),
        scaleEnd: scaleFor(frame, h * 0.6, 'h'),
        alpha: 0.85,
        flipX: side === -1,
      });
    }
    this.shake.add(BLAST_TRAUMA);
    if (fx.blastSound) playSfx(this.scene, fx.blastSound);
  }
}

/** Cadeado pequeno (quem está travado não recebe a bomba de volta), centrado em (x, y). */
function drawPadlock(gfx: Phaser.GameObjects.Graphics, x: number, y: number, k: number): void {
  const w = 16 * k;
  const h = 12 * k;
  gfx.lineStyle(4 * k, 0x0b0e16, 1);
  gfx.beginPath();
  gfx.arc(x, y - h / 2, w * 0.32, Math.PI, 0);
  gfx.strokePath();
  gfx.lineStyle(2 * k, 0xffd166, 1);
  gfx.beginPath();
  gfx.arc(x, y - h / 2, w * 0.32, Math.PI, 0);
  gfx.strokePath();
  gfx.fillStyle(0x0b0e16, 1);
  gfx.fillRoundedRect(x - w / 2 - 2 * k, y - h / 2 - 2 * k, w + 4 * k, h + 4 * k, 3 * k);
  gfx.fillStyle(0xffd166, 1);
  gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 2 * k);
  gfx.fillStyle(0x0b0e16, 1);
  gfx.fillCircle(x, y - h * 0.08, 1.8 * k);
}
