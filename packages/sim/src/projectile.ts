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
  };
}

/**
 * Move os projéteis um tick. Some quando o tempo acaba, quando bate num bloco
 * sólido (plataformas atravessáveis não param projétil) ou quando sai da blast zone.
 */
export function stepProjectiles(
  projectiles: Projectile[],
  solids: readonly Solid[],
  blastZone: Box,
): void {
  let alive = 0;
  for (const p of projectiles) {
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.ticksLeft--;
    const blocked = solids.some((s) => s.kind === 'solid' && overlaps(p, s));
    if (p.ticksLeft > 0 && !blocked && overlaps(p, blastZone)) projectiles[alive++] = p;
  }
  projectiles.length = alive;
}

/** Lado do arremesso de um projétil: o da velocidade, ou o de quem soltou. */
export function projectileSide(p: Projectile): -1 | 1 {
  if (p.vx !== 0) return p.vx > 0 ? 1 : -1;
  return p.facing;
}
