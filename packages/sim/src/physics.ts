/**
 * Física própria com AABB. Tudo em subpx inteiro, eixo y para baixo.
 */

/** Caixa alinhada aos eixos; (x, y) é o canto superior esquerdo. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * `solid`: bloqueia de todos os lados (chão, paredes, teto).
 * `platform`: atravessável; só segura quem cai por cima.
 */
export type SolidKind = 'solid' | 'platform';

export interface Solid extends Box {
  kind: SolidKind;
}

export interface Body extends Box {
  vx: number;
  vy: number;
}

export interface MoveResult {
  /** Encostou no chão (vindo de cima). */
  landed: boolean;
  /** Tipo do chão em que encostou, se encostou. */
  floorKind: SolidKind | null;
  hitCeiling: boolean;
  /** Bateu numa parede: -1 à esquerda, 1 à direita, 0 nenhuma. */
  hitWall: -1 | 0 | 1;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Move o corpo pela velocidade, um eixo de cada vez (x depois y), sem atravessar
 * sólidos mesmo em alta velocidade (varredura). Zera a velocidade no eixo que bater.
 */
export function moveAndCollide(
  body: Body,
  solids: readonly Solid[],
  dropThrough: boolean,
): MoveResult {
  const result: MoveResult = { landed: false, floorKind: null, hitCeiling: false, hitWall: 0 };

  // Eixo X: só sólidos bloqueiam.
  if (body.vx !== 0) {
    let newX = body.x + body.vx;
    for (const s of solids) {
      if (s.kind !== 'solid') continue;
      if (body.y >= s.y + s.h || body.y + body.h <= s.y) continue;
      if (body.vx > 0 && body.x + body.w <= s.x && newX + body.w > s.x) {
        newX = s.x - body.w;
        result.hitWall = 1;
      } else if (body.vx < 0 && body.x >= s.x + s.w && newX < s.x + s.w) {
        newX = s.x + s.w;
        result.hitWall = -1;
      }
    }
    body.x = newX;
    if (result.hitWall !== 0) body.vx = 0;
  }

  // Eixo Y: sólidos de cima e de baixo; plataformas só de cima, caindo.
  if (body.vy !== 0) {
    let newY = body.y + body.vy;
    for (const s of solids) {
      if (body.x >= s.x + s.w || body.x + body.w <= s.x) continue;
      if (body.vy > 0 && body.y + body.h <= s.y && newY + body.h > s.y) {
        if (s.kind === 'platform' && dropThrough) continue;
        if (s.y - body.h > newY) continue;
        if (s.y - body.h < newY || result.floorKind !== 'solid') {
          result.floorKind = s.kind;
        }
        newY = s.y - body.h;
        result.landed = true;
      } else if (body.vy < 0 && s.kind === 'solid' && body.y >= s.y + s.h && newY < s.y + s.h) {
        newY = Math.max(newY, s.y + s.h);
        result.hitCeiling = true;
      }
    }
    body.y = newY;
    if (result.landed || result.hitCeiling) body.vy = 0;
  }

  return result;
}

/** Lado em que o corpo está encostado num sólido (sondando 1 subpx): -1, 1 ou 0. */
export function touchingWall(body: Box, solids: readonly Solid[]): -1 | 0 | 1 {
  for (const s of solids) {
    if (s.kind !== 'solid') continue;
    if (body.y >= s.y + s.h || body.y + body.h <= s.y) continue;
    if (body.x === s.x + s.w) return -1;
    if (body.x + body.w === s.x) return 1;
  }
  return 0;
}
