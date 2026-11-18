import { px } from '../constants';
import type { Fighter } from '../fighter';
import { idiv } from '../math';
import type { Box, Solid } from '../physics';
import type { Stage } from '../stage';

/**
 * O que o bot sabe do mapa: onde ficam as bordas de verdade (as que dão para o
 * vazio) e se há chão embaixo de um ponto. Tudo em subpx, como no `sim`.
 */

/** Quina de cima de um bloco sólido que dá para o vazio (cair dali é KO). */
export interface Edge {
  /** Quina, em subpx. */
  x: number;
  y: number;
  /** Lado de fora: -1 = a borda da esquerda (o vazio fica à esquerda), 1 = a da direita. */
  side: -1 | 1;
}

export interface Terrain {
  stage: Stage;
  solids: readonly Solid[];
  /** Bordas que dão para o vazio. */
  edges: readonly Edge[];
  /** Ponta esquerda e direita do palco (entre as bordas). */
  left: number;
  right: number;
  /** Meio do palco (x). */
  centerX: number;
}

const cache = new Map<string, Terrain>();

/** Dados do mapa para o bot (calculados uma vez por mapa). */
export function terrainOf(stage: Stage): Terrain {
  const cached = cache.get(stage.id);
  if (cached?.stage === stage) return cached;
  const edges: Edge[] = [];
  for (const s of stage.solids) {
    if (s.kind !== 'solid') continue;
    for (const side of [-1, 1] as const) {
      const x = side < 0 ? s.x : s.x + s.w;
      // logo do lado de fora da quina: dentro de outro bloco, ou com chão embaixo, não é borda
      const outX = x + side * px(1);
      const inside = stage.solids.some(
        (o) => o.kind === 'solid' && outX >= o.x && outX < o.x + o.w && s.y + px(1) >= o.y,
      );
      if (inside || floorTop(stage.solids, outX, s.y) !== null) continue;
      edges.push({ x, y: s.y, side });
    }
  }
  const lefts = edges.filter((e) => e.side < 0).map((e) => e.x);
  const rights = edges.filter((e) => e.side > 0).map((e) => e.x);
  const left = lefts.length > 0 ? Math.min(...lefts) : stage.blastZone.x;
  const right = rights.length > 0 ? Math.max(...rights) : stage.blastZone.x + stage.blastZone.w;
  const terrain: Terrain = {
    stage,
    solids: stage.solids,
    edges,
    left,
    right,
    centerX: idiv(left + right, 2),
  };
  cache.set(stage.id, terrain);
  return terrain;
}

/**
 * Topo do chão mais alto embaixo do ponto (x, y): bloco ou plataforma que cobre x
 * com o topo em y ou mais embaixo. null = vazio embaixo.
 */
export function floorTop(solids: readonly Solid[], x: number, y: number): number | null {
  let best: number | null = null;
  for (const s of solids) {
    if (x < s.x || x >= s.x + s.w || s.y < y) continue;
    if (best === null || s.y < best) best = s.y;
  }
  return best;
}

export function centerX(f: Box): number {
  return f.x + idiv(f.w, 2);
}

export function centerY(f: Box): number {
  return f.y + idiv(f.h, 2);
}

export function feetY(f: Box): number {
  return f.y + f.h;
}

/**
 * Fora do palco: no ar, sem chão embaixo do meio do corpo (cair dali é KO,
 * inclusive embaixo do palco). Pendurado na borda não conta.
 */
export function isOffstage(t: Terrain, f: Fighter): boolean {
  if (f.grounded || f.state === 'ledge') return false;
  return floorTop(t.solids, centerX(f), feetY(f) - px(2)) === null;
}

/** Borda mais perto do ponto x (null se o mapa não tem borda). */
export function nearestEdge(t: Terrain, x: number): Edge | null {
  let best: Edge | null = null;
  for (const e of t.edges) {
    if (!best || Math.abs(e.x - x) < Math.abs(best.x - x)) best = e;
  }
  return best;
}

/**
 * No chão, andando para `dir`: distância do lado do corpo até a borda do vazio
 * nessa direção, no chão em que está (null = não há borda para aquele lado, por
 * exemplo uma parede ou outro chão logo depois).
 */
export function edgeAhead(t: Terrain, f: Fighter, dir: -1 | 1): number | null {
  const feet = feetY(f);
  let best: number | null = null;
  for (const e of t.edges) {
    if (e.side !== dir || Math.abs(e.y - feet) > px(4)) continue;
    const side = dir > 0 ? f.x + f.w : f.x;
    const gap = (e.x - side) * dir;
    if (gap < -f.w) continue; // ficou para trás
    if (best === null || gap < best) best = gap;
  }
  return best;
}
