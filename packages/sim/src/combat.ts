import { moveFrame, type Fighter } from './fighter';
import { idiv } from './math';
import { hitboxesAt, MOVES, type MoveId } from './moves';
import { overlaps, type Box } from './physics';

/** Dano máximo mostrado/guardado, em %. */
export const MAX_DAMAGE = 999;

/** Caixa que recebe golpes. Por enquanto é o próprio corpo; na Etapa 3 vem da ficha. */
export function hurtbox(f: Fighter): Box {
  return { x: f.x, y: f.y, w: f.w, h: f.h };
}

/** Pode ser acertado agora (fora de KO e sem invencibilidade). */
export function canBeHit(f: Fighter): boolean {
  return f.invulnTicks === 0;
}

/** Hitboxes ligadas neste tick, em coordenadas do mundo (subpx). */
export function activeHitboxes(f: Fighter): Box[] {
  if (f.state !== 'attack' || !f.move) return [];
  const cx = f.x + idiv(f.w, 2);
  const cy = f.y + idiv(f.h, 2);
  return hitboxesAt(MOVES[f.move], moveFrame(f)).map((b) => ({
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
      if (boxes.some((b) => overlaps(b, hurt))) {
        hits.push({ attacker: a.id, victim: v.id, move: a.move });
      }
    }
  }
  return hits;
}

/** Aplica um acerto: soma o dano e marca o alvo como já acertado por este golpe. */
export function applyHit(attacker: Fighter, victim: Fighter, moveId: MoveId): void {
  const move = MOVES[moveId];
  attacker.moveHits |= 1 << victim.id;
  victim.damage = Math.min(victim.damage + move.damage, MAX_DAMAGE);
}

/** Procura e aplica os acertos do tick. */
export function resolveHits(fighters: readonly Fighter[]): Hit[] {
  const hits = findHits(fighters);
  for (const h of hits) {
    const attacker = fighters.find((f) => f.id === h.attacker);
    const victim = fighters.find((f) => f.id === h.victim);
    if (attacker && victim) applyHit(attacker, victim, h.move);
  }
  return hits;
}
