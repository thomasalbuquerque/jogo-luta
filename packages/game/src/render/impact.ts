import type { FxLayer } from './fx';
import { FX_TEXTURE } from './fxTextures';

/**
 * Pacotes de partículas do game feel (Etapa 5): impacto do golpe, poeira de
 * pulo e pouso, rastro de quem voa e brilho do respawn. Coordenadas em px de
 * mundo; velocidades em px por tick.
 */

/** Força do golpe de 0 (fraco) a 1 (de KO), a partir do knockback em px/tick. */
export function hitStrength(knockbackPx: number): number {
  return clamp((knockbackPx - 6) / 24, 0, 1);
}

/** Knockback (px/tick) a partir do qual quem voa deixa rastro. */
export const TRAIL_MIN_KNOCKBACK = 14;

/** Mistura duas cores 0xRRGGBB (`t` = 0 → a, 1 → b). */
export function mixColor(a: number, b: number, t: number): number {
  const k = clamp(t, 0, 1);
  const ch = (shift: number) => {
    const ca = (a >> shift) & 0xff;
    const cb = (b >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * k) << shift;
  };
  return ch(16) | ch(8) | ch(0);
}

export interface HitBurst {
  x: number;
  y: number;
  /** Direção do arremesso (não precisa ser unitária). */
  dirX: number;
  dirY: number;
  /** 0..1, de `hitStrength`. */
  strength: number;
  /** Cor do anel (a do jogador que bateu). */
  color: number;
}

const SPARK_COLORS = [0xffffff, 0xffe08a, 0xffc145];

/** Estrela, clarão, anel e faíscas saindo na direção do arremesso. */
export function spawnHitBurst(fx: FxLayer, b: HitBurst): void {
  const s = b.strength;
  fx.spawn({
    texture: FX_TEXTURE.star,
    x: b.x,
    y: b.y,
    life: 6 + Math.round(5 * s),
    scale: 0.3 + 0.45 * s,
    scaleEnd: 0.55 + 0.9 * s,
    rotation: Math.random() * Math.PI,
    tint: 0xfff1b8,
    additive: true,
  });
  fx.spawn({
    texture: FX_TEXTURE.glow,
    x: b.x,
    y: b.y,
    life: 7,
    scale: 1.3 + 2 * s,
    scaleEnd: 0.5,
    additive: true,
  });
  fx.spawn({
    texture: FX_TEXTURE.ring,
    x: b.x,
    y: b.y,
    life: 10 + Math.round(8 * s),
    scale: 0.12,
    scaleEnd: 0.55 + 1.2 * s,
    alpha: 0.85,
    tint: b.color,
    additive: true,
  });
  const base = Math.atan2(b.dirY, b.dirX);
  const count = Math.round(5 + 14 * s);
  for (let i = 0; i < count; i++) {
    // a maioria vai junto com o arremesso; algumas espirram para qualquer lado
    const spread = i % 4 === 0 ? Math.PI * 2 : 1.4;
    const angle = base + (Math.random() - 0.5) * spread;
    const speed = (4 + Math.random() * 7) * (1 + 1.3 * s);
    fx.spawn({
      texture: FX_TEXTURE.spark,
      x: b.x,
      y: b.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      drag: 0.85,
      gravity: 0.2,
      life: 9 + Math.round(Math.random() * 10),
      scale: 0.45 + 0.45 * s,
      scaleEnd: 0.15,
      alignToVelocity: true,
      tint: SPARK_COLORS[i % SPARK_COLORS.length] ?? 0xffffff,
      additive: true,
    });
  }
}

const DUST_COLOR = 0xe6dccb;

/**
 * Poeira nos pés: `spread` 1 = abre para os dois lados (pouso, pulo do chão);
 * `side` ≠ 0 = só para um lado (dash).
 */
export function spawnDust(fx: FxLayer, x: number, y: number, amount: number, side = 0): void {
  const count = Math.max(1, Math.round(amount));
  for (let i = 0; i < count; i++) {
    const dir = side !== 0 ? side : i % 2 === 0 ? 1 : -1;
    fx.spawn({
      texture: FX_TEXTURE.smoke,
      x: x + dir * (4 + Math.random() * 10),
      y: y - 4 - Math.random() * 6,
      vx: dir * (1 + Math.random() * 2.2),
      vy: -(0.2 + Math.random() * 0.7),
      drag: 0.92,
      life: 18 + Math.round(Math.random() * 10),
      scale: 0.35 + Math.random() * 0.2,
      scaleEnd: 0.8,
      alpha: 0.7,
      rotation: Math.random() * Math.PI * 2,
      tint: DUST_COLOR,
    });
  }
}

/**
 * Uma nuvem do rastro de quem foi arremessado. `heat` 0..1: de fumaça branca
 * (golpe forte) a fogo (golpe de KO).
 */
export function spawnTrailPuff(fx: FxLayer, x: number, y: number, heat: number): void {
  const tint =
    heat < 0.5
      ? mixColor(0xffffff, 0xffb347, heat * 2)
      : mixColor(0xffb347, 0xff4d2e, heat * 2 - 1);
  fx.spawn({
    texture: FX_TEXTURE.smoke,
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    life: 20 + Math.round(10 * heat),
    scale: 0.55 + 0.35 * heat,
    scaleEnd: 1.1 + 0.5 * heat,
    alpha: 0.75,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.06,
    tint,
    additive: heat > 0.5,
  });
}

/** Brilho de quem reaparece, na cor do jogador. */
export function spawnRespawnGlow(fx: FxLayer, x: number, y: number, color: number): void {
  fx.spawn({
    texture: FX_TEXTURE.glow,
    x,
    y,
    life: 24,
    scale: 3,
    scaleEnd: 1,
    tint: color,
    additive: true,
  });
  fx.spawn({
    texture: FX_TEXTURE.ring,
    x,
    y,
    life: 22,
    scale: 0.2,
    scaleEnd: 1.4,
    tint: color,
    additive: true,
  });
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    fx.spawn({
      texture: FX_TEXTURE.spark,
      x,
      y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      drag: 0.88,
      life: 18,
      scale: 0.5,
      scaleEnd: 0.1,
      alignToVelocity: true,
      tint: i % 2 === 0 ? 0xffffff : color,
      additive: true,
    });
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
