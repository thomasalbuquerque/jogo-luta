import { px } from './constants';
import { axisX, axisY, type InputMask } from './input';

/**
 * Moveset base, igual para todos (GDD). Na Etapa 3 cada ficha de personagem
 * só ajusta estes números.
 *
 * Frames contam a partir de 1 (o tick em que o golpe começa):
 * 1..startup → startup+1..startup+active (hitbox ligada) → recovery.
 */
export type MoveId =
  | 'neutralLight'
  | 'sideLight'
  | 'downLight'
  | 'neutralAir'
  | 'sideAir'
  | 'downAir'
  | 'recovery'
  | 'groundPound'
  | 'groundPoundLand';

/** Caixa de ataque relativa ao centro do corpo: x positivo = para a frente, y positivo = para baixo. */
export interface HitboxDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Caixas ligadas do frame `from` ao frame `to` (inclusive). */
export interface HitboxFrames {
  from: number;
  to: number;
  boxes: readonly HitboxDef[];
}

export interface MoveDef {
  startup: number;
  active: number;
  recovery: number;
  hitboxes: readonly HitboxFrames[];
  /** Dano somado ao alvo, em %. */
  damage: number;
  /** Direção do knockback em graus: 0 = para a frente, 90 = para cima, 270 = para baixo. */
  angle: number;
  /** Knockback base, em subpx/tick. */
  baseKnockback: number;
  /** Quanto o knockback cresce por % de dano do alvo, em subpx/tick. */
  knockbackScale: number;
  /** `facing`: lado em que o atacante olha. `away`: para longe do centro do atacante. */
  knockbackDir: 'facing' | 'away';
  /** Golpe aéreo: pousar no meio dele corta o golpe (vira landing lag ou `landMove`). */
  aerial: boolean;
  /** Ticks parado ao pousar no meio do golpe aéreo. */
  landingLag: number;
  /** Vira para o lado do ←/→ apertado ao começar. */
  turns: boolean;
  /** No chão, deixa andar com ←/→ durante o golpe. Sem isso, o lutador para. No ar sempre dá para mirar. */
  canWalk: boolean;
  /** Impulso num frame: x para a frente, y negativo para cima (subpx/tick). */
  impulse?: { frame: number; x?: number; y?: number };
  /** Parado no ar (sem gravidade) durante o startup. */
  hoverStartup?: boolean;
  /** Durante o active, cai reto a esta velocidade (subpx/tick). */
  fallSpeed?: number;
  /** Golpe que começa ao pousar no meio deste. */
  landMove?: MoveId;
}

function box(x: number, y: number, w: number, h: number): HitboxDef {
  return { x: px(x), y: px(y), w: px(w), h: px(h) };
}

const GROUND = {
  aerial: false,
  landingLag: 0,
  turns: false,
  canWalk: false,
  knockbackDir: 'facing',
} as const;
const AIR = { aerial: true, turns: false, canWalk: false, knockbackDir: 'facing' } as const;

export const MOVES: Readonly<Record<MoveId, MoveDef>> = {
  // Rápido, curto alcance: abre combo.
  neutralLight: {
    ...GROUND,
    startup: 4,
    active: 3,
    recovery: 7,
    hitboxes: [{ from: 5, to: 7, boxes: [box(40, -10, 44, 30)] }],
    damage: 5,
    angle: 30,
    baseKnockback: px(7),
    knockbackScale: px(0.08),
  },
  // Avança e arremessa na horizontal.
  sideLight: {
    ...GROUND,
    turns: true,
    startup: 7,
    active: 4,
    recovery: 12,
    impulse: { frame: 5, x: px(10) },
    hitboxes: [{ from: 8, to: 11, boxes: [box(44, -6, 52, 34)] }],
    damage: 8,
    angle: 25,
    baseKnockback: px(9),
    knockbackScale: px(0.17),
  },
  // Rasteira: arremessa para cima.
  downLight: {
    ...GROUND,
    startup: 6,
    active: 4,
    recovery: 14,
    hitboxes: [{ from: 7, to: 10, boxes: [box(38, 34, 64, 24)] }],
    damage: 7,
    angle: 80,
    baseKnockback: px(10),
    knockbackScale: px(0.16),
  },
  // Golpe em volta do corpo.
  neutralAir: {
    ...AIR,
    knockbackDir: 'away',
    landingLag: 4,
    startup: 5,
    active: 6,
    recovery: 12,
    hitboxes: [{ from: 6, to: 11, boxes: [box(0, -4, 100, 116)] }],
    damage: 7,
    angle: 45,
    baseKnockback: px(8),
    knockbackScale: px(0.12),
  },
  // Principal golpe de KO lateral: o arco desce de cima para a frente.
  sideAir: {
    ...AIR,
    turns: true,
    landingLag: 7,
    startup: 9,
    active: 4,
    recovery: 18,
    hitboxes: [
      { from: 10, to: 11, boxes: [box(34, -34, 52, 44)] },
      { from: 12, to: 13, boxes: [box(46, 0, 58, 44)] },
    ],
    damage: 11,
    angle: 35,
    baseKnockback: px(10),
    knockbackScale: px(0.21),
  },
  // Para baixo: spike fraco.
  downAir: {
    ...AIR,
    landingLag: 7,
    startup: 8,
    active: 5,
    recovery: 14,
    hitboxes: [{ from: 9, to: 13, boxes: [box(6, 58, 52, 36)] }],
    damage: 9,
    angle: 285,
    baseKnockback: px(7),
    knockbackScale: px(0.08),
  },
  // Sobe e acerta; 1 vez por ar.
  recovery: {
    ...AIR,
    landingLag: 8,
    startup: 3,
    active: 12,
    recovery: 12,
    impulse: { frame: 3, y: px(-15) },
    hitboxes: [
      // Começo: cobre o corpo e a frente (pega quem está do lado); depois só em cima.
      { from: 4, to: 8, boxes: [box(14, -16, 72, 112)] },
      { from: 9, to: 15, boxes: [box(0, -40, 72, 64)] },
    ],
    damage: 8,
    angle: 80,
    baseKnockback: px(9),
    knockbackScale: px(0.17),
  },
  // Para no ar, cai reto e, ao pousar, solta uma onda dos dois lados.
  groundPound: {
    ...AIR,
    landingLag: 0,
    startup: 8,
    active: 40,
    recovery: 10,
    hoverStartup: true,
    fallSpeed: px(20),
    landMove: 'groundPoundLand',
    hitboxes: [{ from: 9, to: 48, boxes: [box(0, 44, 52, 30)] }],
    damage: 6,
    angle: 285,
    baseKnockback: px(6),
    knockbackScale: px(0.06),
  },
  groundPoundLand: {
    ...GROUND,
    knockbackDir: 'away',
    startup: 0,
    active: 4,
    recovery: 16,
    hitboxes: [{ from: 1, to: 4, boxes: [box(0, 28, 170, 40)] }],
    damage: 10,
    angle: 50,
    baseKnockback: px(11),
    knockbackScale: px(0.16),
  },
};

export function totalFrames(move: MoveDef): number {
  return move.startup + move.active + move.recovery;
}

/** Frame dentro da janela ativa (startup+1..startup+active). */
export function isActiveFrame(move: MoveDef, frame: number): boolean {
  return frame > move.startup && frame <= move.startup + move.active;
}

/** Caixas de ataque ligadas num frame (relativas ao corpo). */
export function hitboxesAt(move: MoveDef, frame: number): HitboxDef[] {
  if (!isActiveFrame(move, frame)) return [];
  const out: HitboxDef[] = [];
  for (const w of move.hitboxes) if (frame >= w.from && frame <= w.to) out.push(...w.boxes);
  return out;
}

/**
 * Golpe do botão Ataque conforme o input: ↓ > ↑ > ←/→ > parado.
 * No ar, ↑ sem recuperação disponível vira o aéreo neutro.
 */
export function selectAttack(
  grounded: boolean,
  input: InputMask,
  recoveryAvailable: boolean,
): MoveId {
  const x = axisX(input);
  const y = axisY(input);
  if (grounded) {
    if (y > 0) return 'downLight';
    if (y < 0) return 'recovery';
    return x !== 0 ? 'sideLight' : 'neutralLight';
  }
  if (y > 0) return 'downAir';
  if (y < 0 && recoveryAvailable) return 'recovery';
  return x !== 0 ? 'sideAir' : 'neutralAir';
}

/**
 * Golpe do botão Especial. Por enquanto só o ground pound (Especial + ↓ no ar);
 * o especial de cada personagem entra na Etapa 3.
 */
export function selectSpecial(grounded: boolean, input: InputMask): MoveId | null {
  if (!grounded && axisY(input) > 0) return 'groundPound';
  return null;
}
