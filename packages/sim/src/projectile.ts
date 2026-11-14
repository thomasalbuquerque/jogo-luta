import type { GameEvent } from './events';
import type { Fighter } from './fighter';
import { idiv } from './math';
import type { HitProps, ProjectileDef } from './moves';
import { overlaps, type Box, type Solid } from './physics';
import { cosDeg, sinDeg, TRIG_ONE } from './trig';

/** Projétil em voo (bloco `projectile`). Só dados: faz parte do estado da luta. */
export interface Projectile extends Box {
  /** Id de quem soltou (não acerta o dono). */
  owner: number;
  vx: number;
  vy: number;
  gravity: number;
  ticksLeft: number;
  /** Lado para onde arremessa quando não tem velocidade horizontal. */
  facing: -1 | 1;
  hit: HitProps;
  /** Bitmask dos ids com aura que ele já atravessou (o brilho sai 1 vez). */
  passed: number;
  /** Quiques que ainda sobram (a bola do Igão). */
  bounces: number;
  /** Quanto da velocidade vertical sobra a cada quique, em %. */
  bounceKeep: number;
}

/** Cria o projétil na frente do lutador, saindo no ângulo da ficha. */
export function spawnProjectile(f: Fighter, def: ProjectileDef): Projectile {
  const cx = f.x + idiv(f.w, 2) + f.facing * def.offsetX;
  const cy = f.y + idiv(f.h, 2) + def.offsetY;
  return {
    owner: f.id,
    x: cx - idiv(def.w, 2),
    y: cy - idiv(def.h, 2),
    w: def.w,
    h: def.h,
    vx: f.facing * idiv(def.speed * cosDeg(def.launchAngle), TRIG_ONE),
    vy: 0 - idiv(def.speed * sinDeg(def.launchAngle), TRIG_ONE),
    gravity: def.gravity,
    ticksLeft: def.lifetimeTicks,
    facing: f.facing,
    hit: { ...def.hit },
    passed: 0,
    bounces: def.bounces,
    bounceKeep: def.bounceKeep,
  };
}

/**
 * Move os projéteis um tick. Some quando o tempo acaba, quando bate num bloco
 * sólido (plataformas atravessáveis não param projétil) ou quando sai da blast zone.
 * Com quiques sobrando, a bola que cai e cruza o topo de um chão ou plataforma
 * neste tick fica em cima dele e volta a subir (evento `bounce`).
 */
export function stepProjectiles(
  projectiles: Projectile[],
  solids: readonly Solid[],
  blastZone: Box,
  events?: GameEvent[],
): void {
  let alive = 0;
  for (const p of projectiles) {
    const bottom = p.y + p.h;
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.ticksLeft--;
    if (p.bounces > 0 && p.vy > 0) bounce(p, bottom, solids, events);
    const blocked = solids.some((s) => s.kind === 'solid' && overlaps(p, s));
    if (p.ticksLeft > 0 && !blocked && overlaps(p, blastZone)) projectiles[alive++] = p;
  }
  projectiles.length = alive;
}

/**
 * Quique: a base da bola estava em cima do topo de uma superfície (`bottom`, antes de
 * mover) e passou dele neste tick. Fica no topo mais alto que cruzou, com a velocidade
 * vertical virada para cima e reduzida a `bounceKeep`%.
 */
function bounce(
  p: Projectile,
  bottom: number,
  solids: readonly Solid[],
  events: GameEvent[] | undefined,
): void {
  let top: number | null = null;
  for (const s of solids) {
    if (p.x >= s.x + s.w || p.x + p.w <= s.x) continue;
    if (bottom > s.y || p.y + p.h <= s.y) continue;
    if (top === null || s.y < top) top = s.y;
  }
  if (top === null) return;
  p.y = top - p.h;
  p.vy = 0 - idiv(p.vy * p.bounceKeep, 100);
  p.bounces--;
  events?.push({
    type: 'bounce',
    owner: p.owner,
    x: p.x + idiv(p.w, 2),
    y: top,
    bouncesLeft: p.bounces,
  });
}

/** Lado do arremesso de um projétil: o da velocidade, ou o de quem soltou. */
export function projectileSide(p: Projectile): -1 | 1 {
  if (p.vx !== 0) return p.vx > 0 ? 1 : -1;
  return p.facing;
}
