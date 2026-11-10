import { SUBPX } from './constants';
import {
  currentMove,
  dealtDamage,
  effectiveWeight,
  enterHitstun,
  KNOCKBACK_DECAY,
  moveDef,
  moveFrame,
  type Fighter,
} from './fighter';
import { idiv } from './math';
import { hitboxesAt, isActiveFrame, type HitProps, type MoveId } from './moves';
import { overlaps, type Box } from './physics';
import { projectileSide, type Projectile } from './projectile';
import { cosDeg, sinDeg, TRIG_ONE } from './trig';

/** Dano máximo mostrado/guardado, em %. */
export const MAX_DAMAGE = 999;

/** Caixa que recebe golpes: o corpo, com o tamanho da ficha (`stats.hurtbox`). */
export function hurtbox(f: Fighter): Box {
  return { x: f.x, y: f.y, w: f.w, h: f.h };
}

/** Pode ser acertado agora (fora de KO e sem invencibilidade). */
export function canBeHit(f: Fighter): boolean {
  return f.state !== 'ko' && f.invulnTicks === 0;
}

/** Hitboxes ligadas neste tick, em coordenadas do mundo (subpx). */
export function activeHitboxes(f: Fighter): Box[] {
  const move = f.state === 'attack' ? currentMove(f) : null;
  if (!move) return [];
  const cx = f.x + idiv(f.w, 2);
  const cy = f.y + idiv(f.h, 2);
  return hitboxesAt(move, moveFrame(f)).map((b) => ({
    x: cx + f.facing * b.x - idiv(b.w, 2),
    y: cy + b.y - idiv(b.h, 2),
    w: b.w,
    h: b.h,
  }));
}

export interface Hit {
  attacker: number;
  victim: number;
  move: MoveId;
  /**
   * `hit`: acerto normal. `counter`: o alvo estava no contra-ataque, então quem
   * leva é quem bateu (`attacker` é quem contra-ataca).
   */
  kind: 'hit' | 'counter';
}

/** Está na janela do contra-ataque (bloco `counter`, frames ativos do especial). */
export function isCountering(f: Fighter): boolean {
  if (f.state !== 'attack') return false;
  const move = currentMove(f);
  return move?.counter !== undefined && isActiveFrame(move, moveFrame(f));
}

/**
 * Todos os acertos deste tick. Calcula antes de aplicar, então dois golpes que
 * se acertam no mesmo tick trocam (os dois levam).
 */
export function findHits(fighters: readonly Fighter[]): Hit[] {
  const hits: Hit[] = [];
  for (const a of fighters) {
    const boxes = activeHitboxes(a);
    if (boxes.length === 0 || !a.move) continue;
    for (const v of fighters) {
      if (v === a || !canBeHit(v) || (a.moveHits & (1 << v.id)) !== 0) continue;
      const hurt = hurtbox(v);
      if (!boxes.some((b) => overlaps(b, hurt))) continue;
      if (isCountering(v)) {
        hits.push({ attacker: v.id, victim: a.id, move: 'special', kind: 'counter' });
      } else {
        hits.push({ attacker: a.id, victim: v.id, move: a.move, kind: 'hit' });
      }
    }
  }
  return hits;
}

/**
 * Força do arremesso, em subpx/tick (GDD):
 * `(força base + dano acumulado × escala) ÷ peso`, com peso 100 = médio.
 * `damage` é o dano do alvo já somado o deste golpe.
 */
export function knockback(move: HitProps, damage: number, weight: number): number {
  return idiv((move.baseKnockback + damage * move.knockbackScale) * 100, weight);
}

/** Hitstun mínimo, em ticks. */
export const HITSTUN_BASE_TICKS = 6;
/** Hitstun extra por px/tick de knockback, em décimos de tick. */
export const HITSTUN_TENTHS_PER_KB = 12;
/** Hitstop: base em ticks, mais 1 a cada 3% do golpe, até o máximo. */
export const HITSTOP_BASE_TICKS = 3;
export const HITSTOP_MAX_TICKS = 12;

/** Ticks sem agir depois de um arremesso: proporcional ao knockback. */
export function hitstunTicks(kb: number): number {
  return HITSTUN_BASE_TICKS + idiv(kb * HITSTUN_TENTHS_PER_KB, SUBPX * 10);
}

/** Ticks em que os dois lutadores congelam no impacto: golpe forte congela mais. */
export function hitstopTicks(damage: number): number {
  return Math.min(HITSTOP_BASE_TICKS + idiv(damage, 3), HITSTOP_MAX_TICKS);
}

/** Lado do arremesso: -1 ou 1. */
function knockbackSide(attacker: Fighter, victim: Fighter, move: HitProps): -1 | 1 {
  if (move.knockbackDir === 'away') {
    const diff = victim.x + idiv(victim.w, 2) - (attacker.x + idiv(attacker.w, 2));
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return attacker.facing;
}

/**
 * Soma `damage` ao alvo e arremessa para o lado `side` com o ângulo e a força do
 * acerto. Devolve os ticks de hitstop do impacto.
 */
export function launch(victim: Fighter, hit: HitProps, side: -1 | 1, damage: number): number {
  victim.damage = Math.min(victim.damage + damage, MAX_DAMAGE);

  const kb = knockback(hit, victim.damage, effectiveWeight(victim));
  const cos = cosDeg(hit.angle);
  const sin = sinDeg(hit.angle);
  victim.kbx = side * idiv(kb * cos, TRIG_ONE);
  victim.kby = 0 - idiv(kb * sin, TRIG_ONE);
  // Spike em quem está no chão quica para cima, mais fraco.
  if (victim.grounded && victim.kby > 0) victim.kby = 0 - idiv(victim.kby, 2);
  victim.kbDecayX = Math.max(1, idiv(KNOCKBACK_DECAY * Math.abs(cos), TRIG_ONE));
  victim.kbDecayY = Math.max(1, idiv(KNOCKBACK_DECAY * Math.abs(sin), TRIG_ONE));
  victim.vx = 0;
  victim.vy = 0;
  victim.facing = side === 1 ? -1 : 1;
  enterHitstun(victim, hitstunTicks(kb));
  return hitstopTicks(damage);
}

/** Aplica um acerto: soma o dano, arremessa o alvo e marca como já acertado por este golpe. */
export function applyHit(attacker: Fighter, victim: Fighter, moveId: MoveId): void {
  const move = moveDef(attacker, moveId);
  attacker.moveHits |= 1 << victim.id;
  const damage = dealtDamage(attacker, move.damage);
  const stop = launch(victim, move, knockbackSide(attacker, victim, move), damage);
  attacker.hitstop = Math.max(attacker.hitstop, stop);
  victim.hitstop = Math.max(victim.hitstop, stop);
}

/**
 * Contra-ataque: quem bateu (`striker`) leva o acerto do bloco `counter`, e quem
 * contra-atacou pula para o recovery do especial.
 */
export function applyCounter(counterer: Fighter, striker: Fighter): void {
  const counter = moveDef(counterer, 'special').counter;
  if (!counter) return;
  striker.moveHits |= 1 << counterer.id;
  const damage = dealtDamage(counterer, counter.damage);
  const stop = launch(striker, counter, knockbackSide(counterer, striker, counter), damage);
  counterer.hitstop = Math.max(counterer.hitstop, stop);
  striker.hitstop = Math.max(striker.hitstop, stop);
  endCounterWindow(counterer);
}

/** Fecha a janela do contra-ataque: o próximo frame já é o recovery. */
function endCounterWindow(f: Fighter): void {
  const move = f.state === 'attack' ? currentMove(f) : null;
  if (move?.counter) f.stateTicks = Math.max(f.stateTicks, move.startup + move.active - 1);
}

/** Procura e aplica os acertos do tick. */
export function resolveHits(fighters: readonly Fighter[]): Hit[] {
  const hits = findHits(fighters);
  for (const h of hits) {
    const attacker = fighters.find((f) => f.id === h.attacker);
    const victim = fighters.find((f) => f.id === h.victim);
    if (!attacker || !victim) continue;
    if (h.kind === 'counter') applyCounter(attacker, victim);
    else applyHit(attacker, victim, h.move);
  }
  return hits;
}

/**
 * Projéteis que encostam num lutador (que não seja o dono) acertam e somem.
 * Só o alvo congela no impacto: quem soltou está longe. Quem está no
 * contra-ataque devolve o projétil (vira o dono dele).
 */
export function resolveProjectileHits(
  fighters: readonly Fighter[],
  projectiles: Projectile[],
): void {
  let alive = 0;
  for (const p of projectiles) {
    const victim = fighters.find((v) => v.id !== p.owner && canBeHit(v) && overlaps(p, hurtbox(v)));
    if (!victim) {
      projectiles[alive++] = p;
      continue;
    }
    if (isCountering(victim)) {
      p.owner = victim.id;
      p.vx = 0 - p.vx;
      p.facing = p.facing === 1 ? -1 : 1;
      endCounterWindow(victim);
      projectiles[alive++] = p;
      continue;
    }
    const stop = launch(victim, p.hit, projectileSide(p), p.hit.damage);
    victim.hitstop = Math.max(victim.hitstop, stop);
  }
  projectiles.length = alive;
}
