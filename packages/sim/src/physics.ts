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
 * `ramp`: chão inclinado atravessável como a plataforma (de baixo, dos lados e
 * com ↓), na diagonal da caixa: sobe da quina de baixo de um lado até a quina de
 * cima do outro (`up`). Quem está nela sobe e desce andando, sem pular.
 */
export type SolidKind = 'solid' | 'platform' | 'ramp';

export interface Solid extends Box {
  kind: SolidKind;
  /** Só na rampa: lado alto (1 = sobe para a direita, -1 = para a esquerda). */
  up?: -1 | 1;
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
 * Altura do chão de um bloco no ponto x (fora da largura dele, a da ponta mais
 * perto). Na rampa, a linha da diagonal; nos outros, o topo da caixa.
 */
export function surfaceAt(s: Solid, x: number): number {
  if (s.kind !== 'ramp') return s.y;
  const cx = Math.min(Math.max(x, s.x), s.x + s.w);
  const run = s.up === -1 ? s.x + s.w - cx : cx - s.x;
  return s.y + s.h - Math.trunc((run * s.h) / s.w);
}

/**
 * Chão de um bloco embaixo de uma caixa: o ponto mais alto dele na largura da
 * caixa (na rampa, o do lado alto; assim quem sobe chega no topo dela já na
 * altura do chão que vem depois, sem bater na quina).
 */
export function surfaceUnder(s: Solid, b: Box): number {
  if (s.kind !== 'ramp') return s.y;
  return surfaceAt(s, s.up === -1 ? b.x : b.x + b.w);
}

/** Lados se cruzam (encostar não conta). */
function overlapsX(b: Box, s: Box): boolean {
  return b.x < s.x + s.w && b.x + b.w > s.x;
}

/**
 * Move o corpo pela velocidade, um eixo de cada vez (x depois y), sem atravessar
 * sólidos mesmo em alta velocidade (varredura). Zera a velocidade no eixo que bater.
 * `grounded`: o corpo estava no chão no tick anterior; numa rampa ele acompanha a
 * inclinação (sobe junto com o passo e desce colado nela, sem decolar).
 */
export function moveAndCollide(
  body: Body,
  solids: readonly Solid[],
  dropThrough: boolean,
  grounded = false,
): MoveResult {
  const result: MoveResult = { landed: false, floorKind: null, hitCeiling: false, hitWall: 0 };
  const startX = body.x;

  // Eixo X: só sólidos bloqueiam.
  if (body.vx !== 0) {
    let newX = body.x + body.vx;
    // Subindo a rampa a pé: o corpo sobe antes de andar, para a quina do chão
    // seguinte (no fim da rampa) não virar parede. Vale também para quem entra
    // nela pela ponta, vindo de um chão na mesma altura (fora da largura dela, a
    // altura é a da ponta mais perto).
    if (grounded && body.vy >= 0 && !dropThrough) {
      const feet = body.y + body.h;
      for (const s of solids) {
        if (s.kind !== 'ramp' || surfaceUnder(s, body) !== feet) continue;
        const ahead = surfaceUnder(s, { ...body, x: newX });
        if (ahead < body.y + body.h) body.y = ahead - body.h;
      }
    }
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

  // Descendo a rampa a pé, o chão pode cair mais que a gravidade num tick: até
  // 45° (o quanto andou), o corpo desce junto em vez de decolar. Vale também ao
  // sair da ponta de baixo dela para o chão de baixo.
  const snap = grounded ? Math.abs(body.x - startX) + 1 : 0;

  // Eixo Y: sólidos de cima e de baixo; plataformas e rampas só de cima, caindo.
  if (body.vy > 0 || (snap > 0 && body.vy >= 0)) {
    const feet = body.y + body.h;
    let floor: number | null = null;
    for (const s of solids) {
      if (!overlapsX(body, s)) continue;
      if (s.kind !== 'solid' && dropThrough) continue;
      const top = surfaceUnder(s, body);
      const reach = feet + Math.max(body.vy, snap);
      if (feet > top || reach <= top) continue;
      if (floor === null || top < floor) {
        floor = top;
        result.floorKind = s.kind;
      } else if (top === floor && s.kind === 'solid') {
        result.floorKind = 'solid';
      }
    }
    if (floor !== null) {
      body.y = floor - body.h;
      body.vy = 0;
      result.landed = true;
    } else {
      body.y += body.vy;
    }
  } else if (body.vy < 0) {
    let newY = body.y + body.vy;
    for (const s of solids) {
      if (s.kind !== 'solid' || !overlapsX(body, s)) continue;
      if (body.y >= s.y + s.h && newY < s.y + s.h) {
        newY = Math.max(newY, s.y + s.h);
        result.hitCeiling = true;
      }
    }
    body.y = newY;
    if (result.hitCeiling) body.vy = 0;
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
